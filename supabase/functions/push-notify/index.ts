import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

// ─── VAPID Helpers (native Deno Web Crypto — no npm:web-push needed) ─────────

function base64UrlDecode(str: string): Uint8Array {
  const padding = "=".repeat((4 - (str.length % 4)) % 4)
  const base64 = (str + padding).replace(/-/g, "+").replace(/_/g, "/")
  const binary = atob(base64)
  return Uint8Array.from(binary, (c) => c.charCodeAt(0))
}

function base64UrlEncode(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
}

async function buildVapidAuthHeader(
  audience: string,
  subject: string,
  publicKey: string,
  privateKeyB64: string
): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const exp = now + 12 * 3600 // 12 hours

  const header = base64UrlEncode(
    new TextEncoder().encode(JSON.stringify({ typ: "JWT", alg: "ES256" })).buffer
  )
  const payload = base64UrlEncode(
    new TextEncoder().encode(
      JSON.stringify({ aud: audience, exp, sub: subject })
    ).buffer
  )

  const signingInput = `${header}.${payload}`

  const privateKeyBytes = base64UrlDecode(privateKeyB64)
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    privateKeyBytes,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  )

  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    cryptoKey,
    new TextEncoder().encode(signingInput)
  )

  const jwt = `${signingInput}.${base64UrlEncode(signature)}`
  return `vapid t=${jwt},k=${publicKey}`
}

async function sendWebPush(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidSubject: string
): Promise<void> {
  const url = new URL(subscription.endpoint)
  const audience = `${url.protocol}//${url.host}`

  const authHeader = await buildVapidAuthHeader(
    audience,
    vapidSubject,
    vapidPublicKey,
    vapidPrivateKey
  )

  // Encrypt payload using Web Push encryption (RFC 8291)
  const encoder = new TextEncoder()
  const salt = crypto.getRandomValues(new Uint8Array(16))

  const localKeyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"]
  )

  const localPublicKeyRaw = await crypto.subtle.exportKey("raw", localKeyPair.publicKey)

  const clientPublicKey = await crypto.subtle.importKey(
    "raw",
    base64UrlDecode(subscription.keys.p256dh),
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  )

  const sharedSecret = await crypto.subtle.deriveBits(
    { name: "ECDH", public: clientPublicKey },
    localKeyPair.privateKey,
    256
  )

  const authSecret = base64UrlDecode(subscription.keys.auth)

  // HKDF for content encryption key and nonce
  const ikm = await crypto.subtle.importKey("raw", sharedSecret, "HKDF", false, ["deriveBits"])
  const prk = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt: authSecret, info: encoder.encode("Content-Encoding: auth\0") },
    ikm,
    256
  )

  const prkKey = await crypto.subtle.importKey("raw", prk, "HKDF", false, ["deriveBits"])

  const keyInfo = new Uint8Array([
    ...encoder.encode("Content-Encoding: aesgcm\0"),
    0x41, // "A" for user agent
    ...new Uint8Array(base64UrlDecode(subscription.keys.p256dh)),
    0x41, // "A" for application server
    ...new Uint8Array(localPublicKeyRaw),
  ])

  const nonceInfo = new Uint8Array([
    ...encoder.encode("Content-Encoding: nonce\0"),
    0x41,
    ...new Uint8Array(base64UrlDecode(subscription.keys.p256dh)),
    0x41,
    ...new Uint8Array(localPublicKeyRaw),
  ])

  const contentKey = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt, info: keyInfo },
    prkKey,
    128
  )

  const nonce = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt, info: nonceInfo },
    prkKey,
    96
  )

  const aesKey = await crypto.subtle.importKey("raw", contentKey, "AES-GCM", false, ["encrypt"])

  const payloadBytes = encoder.encode(payload)
  const padding = new Uint8Array(2)
  const plaintext = new Uint8Array([...padding, ...payloadBytes])

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: nonce },
    aesKey,
    plaintext
  )

  const body = new Uint8Array([...salt, ...new Uint8Array(4), 0x41, ...new Uint8Array(localPublicKeyRaw), ...new Uint8Array(ciphertext)])

  const res = await fetch(subscription.endpoint, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/octet-stream",
      "Content-Encoding": "aesgcm",
      Encryption: `salt=${base64UrlEncode(salt.buffer)}`,
      "Crypto-Key": `dh=${base64UrlEncode(localPublicKeyRaw)}`,
      TTL: "86400",
    },
    body,
  })

  if (!res.ok && res.status !== 201) {
    const text = await res.text()
    throw new Error(`Push delivery failed [${res.status}]: ${text}`)
  }
}

// ─── Main Handler ─────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { title, body, emails, url } = await req.json()

    if (!title || !body || !emails?.length) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: title, body, emails" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      )
    }

    // Read VAPID keys from Supabase secrets (set via Supabase Dashboard → Edge Functions → Secrets)
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY") ??
      "BDXY9_MQUy__K1ix9qp260PaUg9tnkqpCcC2P31FSVGl1vZwpwSttR8ru9n6YLnfdGdFnjBYw95VMG3f4Jtv_I8"
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY") ?? ""
    const vapidSubject = Deno.env.get("VAPID_SUBJECT") ?? "mailto:info@biovaco.in"

    if (!vapidPrivateKey) {
      return new Response(
        JSON.stringify({ error: "VAPID_PRIVATE_KEY secret not set in Edge Function environment" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      )
    }

    // Supabase admin client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    )

    // Fetch matching subscriptions
    const { data: subscriptions, error: dbError } = await supabaseClient
      .from("push_subscriptions")
      .select("subscription")
      .in("email", emails)

    if (dbError) throw dbError

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: "No active subscriptions for target emails" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      )
    }

    const payloadStr = JSON.stringify({ title, body, url })

    // Send in parallel, collect results
    const results = await Promise.allSettled(
      subscriptions.map((row: any) =>
        sendWebPush(row.subscription, payloadStr, vapidPublicKey, vapidPrivateKey, vapidSubject)
      )
    )

    const sent = results.filter((r) => r.status === "fulfilled").length
    const failed = results.filter((r) => r.status === "rejected").length

    console.log(`Push notifications: ${sent} sent, ${failed} failed`)

    return new Response(
      JSON.stringify({ success: true, sent, failed }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    )
  } catch (error: any) {
    console.error("push-notify error:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    )
  }
})

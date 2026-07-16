import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import webpush from "npm:web-push"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { title, body, emails, url } = await req.json()

    // 1. Initialize Supabase Admin Client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    )

    // 2. Fetch subscriptions matching the target emails
    const { data: subscriptions, error } = await supabaseClient
      .from("push_subscriptions")
      .select("subscription")
      .in("email", emails)

    if (error) throw error

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ success: true, sent: 0, message: "No active push subscriptions found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      })
    }

    // 3. Setup VAPID keys
    const publicVapidKey = "BDXY9_MQUy__K1ix9qp260PaUg9tnkqpCcC2P31FSVGl1vZwpwSttR8ru9n6YLnfdGdFnjBYw95VMG3f4Jtv_I8"
    const privateVapidKey = "C9V1Bk4TaaleJ00uGG6TxeBrvkA7SzrVYZh52AEaR98"

    webpush.setVapidDetails(
      "mailto:info@biovaco.in",
      publicVapidKey,
      privateVapidKey
    )

    // 4. Dispatch pushes in parallel
    const pushPromises = subscriptions.map((sub: any) => {
      return webpush.sendNotification(
        sub.subscription,
        JSON.stringify({ title, body, url })
      ).catch((err: any) => {
        console.error("Single push notification delivery failed:", err)
      })
    })

    await Promise.all(pushPromises)

    return new Response(JSON.stringify({ success: true, sent: pushPromises.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    })
  }
})

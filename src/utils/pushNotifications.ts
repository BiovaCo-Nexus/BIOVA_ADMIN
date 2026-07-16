import { supabase } from "@/integrations/supabase/client"

const PUBLIC_VAPID_KEY = "BDXY9_MQUy__K1ix9qp260PaUg9tnkqpCcC2P31FSVGl1vZwpwSttR8ru9n6YLnfdGdFnjBYw95VMG3f4Jtv_I8"

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/")
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export async function registerServiceWorkerAndSubscribe(email: string): Promise<boolean> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.warn("Push notifications are not supported in this browser.")
    return false
  }

  try {
    // 1. Register service worker
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
      type: import.meta.env.DEV ? "module" : "classic"
    })
    console.log("Service Worker registered successfully:", registration)

    // 2. Request permission
    const permission = await Notification.requestPermission()
    if (permission !== "granted") {
      console.warn("Push notification permission denied by user.")
      return false
    }

    // 3. Subscribe user
    const subscribeOptions = {
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
    }

    const subscription = await registration.pushManager.subscribe(subscribeOptions)
    console.log("User subscribed to push service:", subscription)

    // 4. Save to Supabase
    try {
      const { error } = await supabase
        .from("push_subscriptions")
        .upsert(
          { email, subscription: subscription.toJSON() },
          { onConflict: "email" }
        )

      if (error) {
        console.warn("Failed to store push subscription in database, falling back to LocalStorage:", error)
        localStorage.setItem(`push_sub_${email}`, JSON.stringify(subscription.toJSON()))
      }
    } catch (dbErr) {
      console.warn("Database connection issue. Storing subscription locally:", dbErr)
      localStorage.setItem(`push_sub_${email}`, JSON.stringify(subscription.toJSON()))
    }

    return true
  } catch (err) {
    console.error("Error subscribing to push notifications:", err)
    return false
  }
}

export async function isPushSubscribed(): Promise<boolean> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false
  const registration = await navigator.serviceWorker.getRegistration()
  if (!registration) return false
  const subscription = await registration.pushManager.getSubscription()
  return !!subscription
}

export async function triggerPushNotification(
  title: string,
  body: string,
  emails: string[],
  url: string = "/admin"
) {
  try {
    const { data, error } = await supabase.functions.invoke("push-notify", {
      body: { title, body, emails, url }
    })
    if (error) throw error
    console.log("Push notifications dispatched successfully:", data)
    return data
  } catch (err) {
    console.warn("Could not dispatch via Edge Function, falling back to local client notification:", err)
    
    // Fallback: Show a direct local browser notification if permission is granted
    if ("Notification" in window && Notification.permission === "granted") {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration) {
        registration.showNotification(title, {
          body,
          icon: "/pwa-192x192.png",
          badge: "/pwa-192x192.png",
          data: { url }
        })
      } else {
        new Notification(title, { body })
      }
    }
  }
}

// BiovaCo Nexus Portal Service Worker for Background Push Notifications

self.addEventListener("push", function (event) {
  let data = { title: "BiovaCo Nexus Update", body: "A portal update occurred." };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: "BiovaCo Nexus Update", body: event.data.text() };
    }
  }

  const options = {
    body: data.body,
    icon: "/pwa-192x192.png",
    badge: "/pwa-192x192.png",
    vibrate: [100, 50, 100],
    data: {
      url: data.url || "/admin"
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
      const targetUrl = event.notification.data.url;
      
      // If a window is already open, navigate to target url and focus
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === targetUrl && "focus" in client) {
          return client.focus();
        }
      }
      
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

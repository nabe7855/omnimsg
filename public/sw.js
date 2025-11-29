self.addEventListener("push", (event) => {
  const data = event.data.json();
  
  const options = {
    body: data.body,
    icon: "/icon-192x192.png", // アイコン画像があれば指定
    badge: "/badge-72x72.png", // バッジ画像があれば指定
    data: {
      url: data.url || "/", // クリック時の遷移先
    },
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("opening-v1").then((cache) => cache.addAll([
      "/",
      "/index.html",
      "/styles.css",
      "/script.js",
      "/manifest.json",
      "/icon.svg",
    ]))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Opening", body: "A new internship opening is live." };
  }

  const title = data.title || "Opening";
  const options = {
    body: data.body || "A new internship opening is live.",
    badge: "/icon.svg",
    icon: "/icon.svg",
    data: { url: data.url || "/" },
    tag: "opening-alert",
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data?.url || "/"));
});

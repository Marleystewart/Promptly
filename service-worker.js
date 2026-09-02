const cacheName = "opening-20260902x";
// pdf.js (assets/vendor/*) is deliberately NOT precached — it's ~1.7MB and only
// needed if someone uploads a PDF. The fetch handler below caches it lazily on
// first real use.
const appShell = [
  "/",
  "/index.html",
  "/styles.css",
  "/script.js",
  "/geo.js",
  "/listing-state.js",
  "/assistant.js",
  "/privacy.html",
  "/terms.html",
  "/how-it-works.html",
  "/manifest.json",
  "/assets/app-icon.png",
  "/assets/icon-192.png",
  "/assets/favicon-32.png",
  "/assets/wordmark.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(cacheName).then((cache) => cache.addAll(appShell))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== cacheName).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  // Never intercept third-party requests. This is a same-origin app-shell cache,
  // and proxying a cross-origin request through the worker re-issues it as a
  // fetch() — which the CSP governs under connect-src rather than script-src.
  // The Supabase SDK loads from cdn.jsdelivr.net, which script-src allows and
  // connect-src does not, so intercepting it blocked the request outright and
  // silently dropped the app back to "secure accounts are not connected yet".
  // Letting the browser handle these natively also avoids trying to cache
  // opaque responses, which never worked anyway.
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  // API responses can contain account or founder-dashboard data. Cache-Control
  // is advisory to normal HTTP caches, but an explicit Cache API put can still
  // persist a no-store response. Never intercept /api at all.
  if (requestUrl.pathname === "/api" || requestUrl.pathname.startsWith("/api/")) return;

  const mayStore = (response) => {
    const control = response.headers?.get?.("Cache-Control") || "";
    return response.ok !== false && !/\bno-store\b/i.test(control);
  };

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          if (mayStore(response)) caches.open(cacheName).then((cache) => cache.put("/index.html", copy));
          return response;
        })
        .catch(() => caches.match("/index.html"))
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        if (mayStore(response)) caches.open(cacheName).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Promptly", body: "A new internship opening is live." };
  }

  const title = data.title || "Promptly";
  const options = {
    body: data.body || "A new internship opening is live.",
    badge: "/assets/app-icon.png",
    icon: "/assets/app-icon.png",
    data: { url: data.url || "/" },
    tag: "opening-alert",
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data?.url || "/"));
});

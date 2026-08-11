/// <reference lib="webworker" />

// v2 — network-first. The old v1 was cache-first for the HTML document, which
// pinned users to a stale page (and stale CSS/JS) forever, even across deploys
// and hard refreshes. This version always fetches fresh from the network and
// only falls back to cache when offline, and it purges every old cache on
// activate so already-stuck clients self-heal on their next visit.
const CACHE_NAME = "mountain-out-v2";

self.addEventListener("install", (event) => {
  // Activate the new worker immediately instead of waiting for old tabs to close.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Delete ALL old caches (v1 and anything else) so no stale HTML/CSS survives.
      const names = await caches.keys();
      await Promise.all(names.map((name) => caches.delete(name)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Never intercept Next.js internals or dev assets.
  if (url.pathname.startsWith("/_next/")) return;

  // Network-first for everything. Fall back to cache only when the network
  // fails (offline). This guarantees users always get the latest deploy.
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok && url.origin === self.location.origin) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// Push notification handler
self.addEventListener("push", (event) => {
  const data = event.data?.json() || {};
  const title = data.title || "Is The Mountain Out?";
  const options = {
    body: data.body || "The mountain status has changed!",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: "mountain-status",
    renotify: true,
    data: { url: data.url || "/" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click: open the app
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(url) && "focus" in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});

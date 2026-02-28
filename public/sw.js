const CACHE = "go-tutorials-v1";
const SHELL = ["/", "/manifest.json"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const { request } = e;
  // Only cache GET requests for same-origin navigation and static assets
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Skip API routes — always go to network
  if (url.pathname.startsWith("/api/")) return;

  e.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request).then((res) => {
        // Cache successful navigation responses
        if (res.ok && (request.mode === "navigate" || url.pathname.startsWith("/_next/static/"))) {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(request, clone));
        }
        return res;
      });
      // Return cache first for static assets, network first for pages
      return url.pathname.startsWith("/_next/static/") && cached ? cached : network.catch(() => cached);
    })
  );
});

const CACHE_NAME = "poka-pocket-cache-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/dashboard",
  "/manifest.json",
  "/poka_pocket_logo.png",
  "/icon-192x192.png",
  "/icon-512x512.png"
];

// Install Service Worker and cache resources
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Caching static shell");
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Service Worker
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[Service Worker] Removing old cache", key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch events: Network first with Cache fallback for stability
self.addEventListener("fetch", (event) => {
  // Ignore non-GET requests or Next.js server actions/HMR
  if (
    event.request.method !== "GET" || 
    event.request.url.includes("/_next/") || 
    event.request.url.includes("/api/auth") ||
    event.request.url.includes("webpack")
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful requests for static assets
        if (
          response.status === 200 && 
          (event.request.url.includes(".png") || 
           event.request.url.includes(".json") || 
           event.request.url.includes(".css"))
        ) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache if network fails
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If offline and request is page navigation, return cached dashboard/root
          if (event.request.mode === "navigate") {
            return caches.match("/dashboard") || caches.match("/");
          }
        });
      })
  );
});

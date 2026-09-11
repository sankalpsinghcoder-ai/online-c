// service-worker.js

const CACHE_NAME = "turboc-cache-v4";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./turboc.jsdos",
  "./TURBOC3.zip",
  "/online-c/icon-1-48.png",
  "/online-c/icon-1-96.png",
  "/online-c/icon-1-144.png",
  "/online-c/icon-1-192.png",
  "https://cdn.jsdelivr.net/npm/js-dos@8.4.1/dist/js-dos.js",
  "https://cdn.jsdelivr.net/npm/emulators@8.4.1/dist/emulators.js",
  "https://cdn.jsdelivr.net/npm/js-dos@8.4.1/dist/js-dos.css"
];

// =========================
// Install (Fault-Tolerant)
// =========================
self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Fetch each file individually so one 404 does NOT break the service worker
      return Promise.allSettled(
        FILES_TO_CACHE.map(url => 
          fetch(url).then(response => {
            if (response.ok) {
              return cache.put(url, response);
            }
          }).catch(err => console.warn("SW failed to cache:", url, err))
        )
      );
    })
  );
});

// =========================
// Activate
// =========================
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// =========================
// Fetch
// =========================
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  // HTML Navigation
  if (event.request.mode === "navigate" || event.request.destination === "document") {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request).then(res => res || caches.match("./")))
    );
    return;
  }

  // Assets / CDN / Scripts
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) {
        fetch(event.request).then(response => {
          if (response.ok) {
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, response.clone()));
          }
        }).catch(err => console.warn("SW background fetch failed:", event.request.url, err));
        return cached;
      }

      return fetch(event.request).then(response => {
        if (response.ok) {
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, response.clone()));
        }
        return response;
      });
    })
  );
});

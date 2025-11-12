// service-worker.js
const CACHE_NAME = "turboc-cache-v1";
const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./turboc.jsdos",
  "./TURBOC3.zip",
  "./manifest.json",
  "https://v8.js-dos.com/latest/js-dos.js",
  "https://v8.js-dos.com/latest/emulators/emulators.js",
  "https://v8.js-dos.com/latest/js-dos.css"
];

// Install event - cache all files
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate event - cleanup old caches
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve cached files if offline
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).catch(() => {
        // fallback for failed requests
        return caches.match("./index.html");
      });
    })
  );
});

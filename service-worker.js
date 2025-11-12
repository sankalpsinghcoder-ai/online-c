self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("turboc-cache-v1").then((cache) => {
      return cache.addAll([
        "./",
        "./index.html",
        "./manifest.json",
        "./js-dos.js",
        "./emulators.js",
        "./turboc.jsdos",
        "./TURBOC3.zip"
      ]);
    })
  );
  self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});

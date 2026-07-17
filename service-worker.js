// service-worker.js

const CACHE_NAME = "turboc-cache-v2";

const FILES_TO_CACHE = [
  "./",
  "./turboc.jsdos",
  "./TURBOC3.zip",
  "./manifest.json",
  "/online-c/icon-1.png",
  "/online-c/icon-2.ico",

  "https://v8.js-dos.com/latest/js-dos.js",
  "https://v8.js-dos.com/latest/emulators/emulators.js",
  "https://v8.js-dos.com/latest/js-dos.css"
];



// =========================
// Install
// =========================

self.addEventListener("install", event => {

  self.skipWaiting();

  event.waitUntil(

    caches.open(CACHE_NAME).then(cache => {

      return cache.addAll(FILES_TO_CACHE);

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

  // Ignore non-GET requests
  if (event.request.method !== "GET") return;

  // -----------------------
  // HTML (Network First)
  // -----------------------

  if (
    event.request.mode === "navigate" ||
    event.request.destination === "document"
  ) {

    event.respondWith(

      fetch(event.request)

        .then(response => {

          const copy = response.clone();

          caches.open(CACHE_NAME).then(cache => {

            cache.put(event.request, copy);

          });

          return response;

        })

        .catch(() => {

          return caches.match(event.request)
            .then(response => {

              return response || caches.match("./");

            });

        })

    );

    return;

  }



  // -----------------------
  // CSS / JS / Images / ZIP
  // -----------------------

  event.respondWith(

    caches.match(event.request)

      .then(cached => {

        if (cached) {

          // Update cache in background

          fetch(event.request)

            .then(response => {

              if (response.ok) {

                caches.open(CACHE_NAME).then(cache => {

                  cache.put(event.request, response.clone());

                });

              }

            })

            .catch(() => {});

          return cached;

        }



        return fetch(event.request)

          .then(response => {

            if (response.ok) {

              caches.open(CACHE_NAME).then(cache => {

                cache.put(event.request, response.clone());

              });

            }

            return response;

          });

      })

  );

});

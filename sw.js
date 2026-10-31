const cacheName = "home-checklist-v1";

const appFiles = [
  "index.html",
  "list.html",
  "checklist.html",
  "manifest.webmanifest",
  "css/base.css",
  "css/home.css",
  "css/list.css",
  "css/checklist.css",
  "data/checklists.json",
  "data/home.json",
  "icons/icon-180.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "js/app.js",
  "js/checklist-page.js",
  "js/checklist-session.js",
  "js/data.js",
  "js/home.js",
  "js/list-page.js",
  "js/register-sw.js",
  "js/storage.js",
  "js/swipe-card.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(cacheName).then((cache) => cache.addAll(appFiles)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== cacheName).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

// 連線時一律取最新版本，只有離線才使用快取
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(cacheName).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(event.request, { ignoreSearch: true }))
  );
});

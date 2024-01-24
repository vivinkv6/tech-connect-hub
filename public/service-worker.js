// public/service-worker.js
const cacheName = 'your-app-cache';
const filesToCache = [
  '/',
  '/stylesheets/style.css',
  '/images/icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(cacheName)
      .then(cache => cache.addAll(filesToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});

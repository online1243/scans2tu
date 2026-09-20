const CACHE_NAME = 'scansetu-pwa-v3';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  'https://scansetu.co/assets/logo-icon-CcFvR6-7.png'
];

// Install: Fail-safe caching (agar koi asset fail bhi ho toh SW crash nahi hoga)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        STATIC_ASSETS.map((asset) => 
          cache.add(asset).catch((err) => console.warn('Cache bypass for:', asset, err))
        )
      );
    })
  );
  self.skipWaiting();
});

// Activate: Purane cache clean up
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Network-first with offline cache fallback
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          // Agar page navigation offline ho toh cached index.html dikhaye
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html') || caches.match('./');
          }
        });
      })
  );
});

const CACHE_NAME = 'scansetu-pwa-v4';
const SHELL_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  'https://scansetu.co/assets/logo-icon-CcFvR6-7.png'
];

// Install: Cache Shell instantly
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        SHELL_ASSETS.map((url) => cache.add(url).catch((e) => console.warn('Cache bypass:', url)))
      );
    })
  );
  self.skipWaiting();
});

// Activate: Old cache cleanup
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((k) => {
          if (k !== CACHE_NAME) return caches.delete(k);
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: CACHE-FIRST for local shell (survives domain death/shutdown)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // If request is for local landing page shell
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        }).catch(() => caches.match('./index.html') || caches.match('./'));
      })
    );
    return;
  }

  // External requests (iframe, assets) -> Network with fallback
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

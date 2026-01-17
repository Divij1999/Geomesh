
const CACHE_NAME = 'geomesh-v3'; 
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // During development/initializing phase, bypass cache for module scripts (.tsx / .ts)
  // to prevent the browser from caching un-transpiled JSX
  const url = new URL(event.request.url);
  if (url.pathname.endsWith('.tsx') || url.pathname.endsWith('.ts')) {
    return event.respondWith(fetch(event.request));
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((fetchRes) => {
        return caches.open(CACHE_NAME).then((cache) => {
          // Only cache successful GET requests from our origin or specific CDNs
          if (event.request.method === 'GET' && (url.origin === self.origin || url.origin.includes('esm.sh'))) {
            cache.put(event.request, fetchRes.clone());
          }
          return fetchRes;
        });
      });
    })
  );
});

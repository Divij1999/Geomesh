
const CACHE_NAME = 'geomesh-v7'; // Bumped version to clear bad octet-stream caches
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './styles.css'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(ASSETS.map(url => cache.add(url)));
    })
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
  const url = new URL(event.request.url);
  
  // BYPASS: Never handle .tsx, .ts, or .jsx files. 
  // Let the browser fetch them directly so the server can provide the correct JavaScript MIME type.
  if (url.pathname.endsWith('.tsx') || url.pathname.endsWith('.ts') || url.pathname.endsWith('.jsx')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then((response) => {
        // Don't cache if not a successful internal GET request
        if (!response || response.status !== 200 || response.type !== 'basic' || event.request.method !== 'GET') {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch(() => null);
    })
  );
});

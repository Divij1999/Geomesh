
const CACHE_NAME = 'geomesh-v8-nuclear';
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
      // Only cache static assets, never code files during install
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
  
  // CRITICAL FIX:
  // Strictly bypass the cache for any file that looks like source code (.tsx, .ts, .jsx).
  // These MUST go to the server to be transpiled into valid JavaScript.
  // If we serve them from cache, the browser gets raw text/octet-stream and crashes.
  if (url.pathname.match(/\.(tsx|ts|jsx)$/)) {
    return; // Fallback to network only
  }

  // Also bypass cache for the hot module replacement (HMR) if present
  if (url.pathname.includes('hmr') || url.pathname.includes('hot-update')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then((response) => {
        // Only cache valid 200 responses that are basic GET requests
        if (!response || response.status !== 200 || response.type !== 'basic' || event.request.method !== 'GET') {
          return response;
        }

        // Double check: Never cache source files even if we fetched them
        if (url.pathname.match(/\.(tsx|ts|jsx)$/)) {
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


importScripts('https://unpkg.com/@babel/standalone/babel.min.js');

const CACHE_NAME = 'geomesh-compiler-v9';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './styles.css'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Transpile TS/TSX files on the fly
  if (url.pathname.endsWith('.tsx') || url.pathname.endsWith('.ts')) {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(event.request);
          const text = await response.text();
          
          // Use Babel to transform TSX -> JS
          const output = Babel.transform(text, {
            filename: url.pathname,
            presets: ['react', 'typescript'],
            plugins: [],
            retainLines: true
          }).code;

          return new Response(output, {
            headers: { 
              'Content-Type': 'application/javascript',
              'Cache-Control': 'no-cache'
            }
          });
        } catch (err) {
          console.error('Compilation failed for:', url.pathname, err);
          return new Response(`console.error("Compile Error: ${err.message}");`, {
            headers: { 'Content-Type': 'application/javascript' }
          });
        }
      })()
    );
    return;
  }

  // Default cache strategy for other assets
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request);
    })
  );
});

const CACHE_NAME = 'nexify-connect-v1';
const urlsToCache = [
  'index.html',
  'manifest.json'
];

self.addEventListener('install', event => {
  self.skipWaiting(); // Force the waiting service worker to become the active service worker.
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  // Bypass service worker for Vite dev server requests
  if (
    event.request.url.includes('@vite/client') ||
    event.request.url.includes('@react-refresh') ||
    event.request.url.includes('node_modules') ||
    event.request.mode === 'navigate' && event.request.url.includes('localhost')
  ) {
    return; // Let the browser handle these requests natively
  }

  // Only handle HTTP/HTTPS protocols (ignores chrome-extension:// etc.)
  if (!event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request).catch((err) => {
          console.error('Service Worker Fetch Error:', err);
          // Return a generic fallback Response to avoid 'TypeError: Failed to convert value to Response'
          return new Response(
            'Network error or offline mode. Resource unavailable.',
            { status: 503, statusText: 'Service Unavailable' }
          );
        });
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim()); // Take control of all open pages immediately
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

const CACHE = 'focus-library-v10';

// Pre-cache index.html using a relative URL so it resolves correctly on any
// base path (localhost OR GitHub Pages /focus-library-app/).
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.add('./index.html')));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  // Navigation requests (opening the PWA, page load):
  // network-first so content stays fresh; fall back to cached index.html offline.
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          if (res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone()));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // All other assets (JS, CSS, images, fonts): cache-first.
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res.ok && e.request.url.startsWith(self.location.origin))
          caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        return res;
      });
    })
  );
});

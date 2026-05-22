const CACHE_NAME = 'sewahtku-v7';
const LOCAL_ASSETS = [
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './sewahtku_logo.png',
  // Local font files (no CDN dependency)
  './fonts/tabler-icons.min.css',
  './fonts/tabler-icons.woff2',
  './fonts/tabler-icons.woff',
  './fonts/tabler-icons.ttf',
];

// CDN assets cached best-effort (chart.js, google fonts)
const CDN_ASSETS = [
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Cache local assets first (required)
      return cache.addAll(LOCAL_ASSETS).then(() => {
        // Cache CDN assets best-effort (don't fail install if CDN unavailable)
        return Promise.allSettled(CDN_ASSETS.map(url => cache.add(url)));
      });
    })
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) return caches.delete(key);
      }));
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  // Do not cache API requests
  if (e.request.url.includes('/api/')) {
    e.respondWith(fetch(e.request));
    return;
  }

  // For navigation requests (HTML), always try network first for auto-update
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, resClone));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // For all other assets: Cache First, then network
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((res) => {
        // Only cache GET requests
        if (e.request.method === 'GET' && res && res.status === 200) {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, resClone));
        }
        return res;
      }).catch(() => new Response('', { status: 408 }));
    })
  );
});

const CACHE_NAME = 'sewahtku-v6';
const LOCAL_ASSETS = [
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './sewahtku_logo.png'
];

// Cache external CDN assets separately so icons/fonts work offline
const CDN_ASSETS = [
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap',
  'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Cache local assets first (required)
      return cache.addAll(LOCAL_ASSETS).then(() => {
        // Cache CDN assets individually (best effort, don't fail install if CDN unavailable)
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
  // For navigation requests (HTML), always try network first
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

  // For CSS/JS/fonts: Cache First (fast load), fallback to network
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((res) => {
        if (res && res.status === 200) {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, resClone));
        }
        return res;
      }).catch(() => new Response('', { status: 408 }));
    })
  );
});

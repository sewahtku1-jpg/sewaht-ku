const CACHE_NAME = 'sewahtku-v9';
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

  // Always try Network First for everything to ensure auto-updates
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        // Cache successful GET requests for offline use
        if (e.request.method === 'GET' && res && res.status === 200) {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, resClone));
        }
        return res;
      })
      .catch(() => {
        // If offline or network fails, fallback to Cache (ignoreSearch helps with ?v=7 tags)
        return caches.match(e.request, { ignoreSearch: true }).then((cached) => {
          if (cached) return cached;
          
          // If it's a page navigation and not in cache, fallback to index.html
          if (e.request.mode === 'navigate') {
            return caches.match('./index.html', { ignoreSearch: true });
          }
          
          return new Response('', { status: 408 });
        });
      })
  );
});

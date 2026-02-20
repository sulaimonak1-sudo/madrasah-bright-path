const CACHE_NAME = 'madrasah-results-v1';
const STATIC_CACHE = 'madrasah-static-v1';
const urlsToCache = [
  '/',
  '/index.html',
];

// Install service worker
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Caching app shell');
      return Promise.allSettled(
        urlsToCache.map(url => cache.add(url))
      );
    }).then(() => {
      console.log('[ServiceWorker] Install complete');
    }).catch(err => {
      console.error('[ServiceWorker] Install failed:', err);
    })
  );
  self.skipWaiting();
});

// Activate service worker
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE) {
            console.log('[ServiceWorker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[ServiceWorker] Activation complete');
    })
  );
  self.clients.claim();
});

// Fetch event - cache first strategy for assets, network first for API calls
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);
  
  // Skip PWA-critical files - let browser handle these directly
  if (url.pathname === '/manifest.json' || url.pathname === '/sw.js') {
    console.log('[ServiceWorker] Skipping PWA critical file:', url.pathname);
    return;
  }
  
  // Network first for API calls
  if (url.pathname.includes('/rest/') || event.request.url.includes('supabase')) {
    return event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch((error) => {
          console.log('[ServiceWorker] Fetch failed for', event.request.url, error);
          return caches.match(event.request);
        })
    );
  }

  // Cache first for other assets
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }
        
        const responseToCache = response.clone();
        caches.open(STATIC_CACHE).then((cache) => {
          cache.put(event.request, responseToCache).catch(() => {
            console.log('[ServiceWorker] Failed to cache:', event.request.url);
          });
        });
        return response;
      }).catch((error) => {
        console.log('[ServiceWorker] Fetch failed, returning fallback:', event.request.url, error);
        // Return cached version or a basic offline response
        return caches.match(event.request).then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Return a basic offline page/response if nothing is cached
          return new Response('Offline - resource not available', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
              'Content-Type': 'text/plain'
            })
          });
        }).catch(() => {
          // Final fallback
          return new Response('Offline', { status: 503 });
        });
      });
    })
  );
});

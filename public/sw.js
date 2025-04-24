
// Service Worker
const CACHE_NAME = 'spese-cache-v8';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/placeholder.svg'
];

// Install event: opens the cache and adds resources
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installation in progress...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Cache opened');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: All resources have been cached');
        return self.skipWaiting(); // Forces immediate activation
      })
      .catch(error => {
        console.error('Service Worker: Error during caching:', error);
        // Continue with activation even if caching fails
        return self.skipWaiting();
      })
  );
});

// Activate event: cleans old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activation in progress...');
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
          return Promise.resolve();
        })
      );
    })
    .then(() => {
      console.log('Service Worker: Now active and controlling the page');
      return self.clients.claim(); // Takes control of all clients
    })
  );
});

// Fetch event: responds with cache or network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip unsupported schemes like chrome-extension://
  const url = new URL(event.request.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return;
  }

  // Handle navigation requests (for SPA)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/');
      })
    );
    return;
  }

  // For all other requests, try network first, then cache, then fallback
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache successful responses
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          
          // Safe caching with error handling
          caches.open(CACHE_NAME)
            .then(cache => {
              try {
                // Solo URL http/https
                if (url.protocol === 'http:' || url.protocol === 'https:') {
                  cache.put(event.request, responseToCache)
                    .catch(err => console.warn('Errore nel caching:', err));
                }
              } catch (err) {
                console.warn('Errore generale durante il caching:', err);
              }
            })
            .catch(err => console.warn('Errore nell\'aprire la cache:', err));
        }
        return response;
      })
      .catch(() => {
        // If network fails, try from cache
        return caches.match(event.request).then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          // For JS/CSS files that might have versioned names
          if (event.request.url.match(/\.(js|css)$/)) {
            return caches.match('/');
          }
          
          // For image resources that fail to load
          if (event.request.url.match(/\.(png|jpg|jpeg|gif|webp|svg)$/)) {
            console.log('Service Worker: Image resource not available:', event.request.url);
            // Return a placeholder image
            return caches.match('/placeholder.svg').then(placeholderResponse => {
              return placeholderResponse || new Response('Image not available', {
                status: 404,
                headers: {'Content-Type': 'text/plain'}
              });
            });
          }
          
          return new Response('Risorsa non disponibile offline', {
            status: 404,
            headers: {'Content-Type': 'text/plain'}
          });
        });
      })
  );
});

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
    console.log('Service Worker: Skip waiting and activating immediately');
  }
});

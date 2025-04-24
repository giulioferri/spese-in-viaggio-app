
// Service Worker
const CACHE_NAME = 'spese-cache-v5';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  // Use directly the uploaded images
  '/lovable-uploads/0.png',
  '/lovable-uploads/1.png',
  '/lovable-uploads/2.png',
  '/lovable-uploads/3.png',
  '/lovable-uploads/4.png',
  '/lovable-uploads/5.png',
  '/lovable-uploads/6.png'
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

  // Skip cross-origin requests
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) {
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
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
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
          
          return new Response('Resource not available offline');
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

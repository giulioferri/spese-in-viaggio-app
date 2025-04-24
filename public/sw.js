
// Service Worker
const CACHE_NAME = 'spese-cache-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/lovable-uploads/0.png', // Prima immagine caricata
  '/lovable-uploads/1.png', // Seconda immagine caricata
  '/lovable-uploads/2.png', // Terza immagine caricata
  '/lovable-uploads/3.png', // Quarta immagine caricata
  '/lovable-uploads/4.png', // Quinta immagine caricata
  '/lovable-uploads/5.png', // Sesta immagine caricata
  '/lovable-uploads/6.png'  // Settima immagine caricata
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache opened');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

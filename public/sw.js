
// Service Worker
const CACHE_NAME = 'spese-cache-v4';
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

// Install event: apre la cache e aggiunge le risorse
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installazione in corso...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Cache aperta');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: Tutte le risorse sono state memorizzate nella cache');
        return self.skipWaiting(); // Forza l'attivazione immediata
      })
      .catch(error => {
        console.error('Service Worker: Errore durante il caching:', error);
      })
  );
});

// Activate event: pulisce le vecchie cache
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Attivazione in corso...');
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Service Worker: Eliminazione della vecchia cache', cacheName);
            return caches.delete(cacheName);
          }
          return Promise.resolve();
        })
      );
    })
    .then(() => {
      console.log('Service Worker: Ora è attivo e controlla la pagina');
      return self.clients.claim(); // Prende il controllo di tutti i client
    })
  );
});

// Fetch event: risponde con cache o rete
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - restituisce la risposta dalla cache
        if (response) {
          console.log('Service Worker: Risorsa servita dalla cache:', event.request.url);
          return response;
        }
        
        // Altrimenti, recupera dalla rete
        console.log('Service Worker: Risorsa non in cache, recupero da rete:', event.request.url);
        return fetch(event.request)
          .then(function(networkResponse) {
            // Controlla se abbiamo ricevuto una risposta valida
            if(!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            // Clona la risposta perché è un flusso che può essere usato solo una volta
            var responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
                console.log('Service Worker: Risorsa aggiunta alla cache:', event.request.url);
              });

            return networkResponse;
          })
          .catch(error => {
            console.error('Service Worker: Errore di rete:', error);
            // Fallback per le risorse che non si possono recuperare
            return new Response('Risorsa non disponibile offline');
          });
      })
  );
});

// Gestione dei messaggi da client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

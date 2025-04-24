
// Service Worker
const CACHE_NAME = 'spese-cache-v3';
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
        return fetch(event.request).then(
          function(response) {
            // Controlla se abbiamo ricevuto una risposta valida
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clona la risposta perché è un flusso che può essere usato solo una volta
            var responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
                console.log('Service Worker: Risorsa aggiunta alla cache:', event.request.url);
              });

            return response;
          }
        );
      })
      .catch(function(error) {
        console.log('Service Worker: Errore di fetch:', error);
        // Puoi restituire una pagina di fallback qui se vuoi
      })
  );
});

// Gestione dei messaggi da client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

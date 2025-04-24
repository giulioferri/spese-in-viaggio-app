
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('SW registrato con successo:', registration.scope);
          
          // Gestione degli aggiornamenti
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker == null) {
              return;
            }
            
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // A questo punto, è disponibile un nuovo aggiornamento del service worker
                  console.log('Nuovo contenuto disponibile; aggiorna la pagina.');
                  
                  // Se vuoi applicare l'aggiornamento automaticamente, puoi farlo qui
                  // registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                } else {
                  // A questo punto, tutto è stato precachato.
                  console.log('Contenuto nella cache per uso offline.');
                }
              }
            };
          };
        })
        .catch(error => {
          console.error('Errore durante la registrazione del SW:', error);
        });
    });
  }
}

// Funzione helper per aggiornare manualmente il service worker quando disponibile
export function checkForUpdates() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
      registration.update();
    });
  }
}

// Funzione per forzare l'aggiornamento quando è disponibile un nuovo service worker
export function applyUpdate() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
    });
  }
}

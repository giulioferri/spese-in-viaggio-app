
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        console.log('Tentativo di registrazione del service worker...');
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registrato con successo:', registration.scope);
        
        // Gestione aggiornamenti
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (installingWorker == null) {
            return;
          }
          
          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                console.log('Nuovo contenuto disponibile; aggiorna la pagina per utilizzarlo.');
                
                // Mostra un messaggio all'utente che può aggiornare la pagina
                if (window.confirm('Nuova versione disponibile! Vuoi aggiornare la pagina per utilizzare la nuova versione?')) {
                  window.location.reload();
                }
              } else {
                console.log('Contenuto memorizzato nella cache per l\'uso offline.');
              }
            }
          };
        };
      } catch (error) {
        console.error('Registrazione del Service Worker fallita:', error);
        // Continua con l'applicazione anche se la registrazione del service worker fallisce
      }
    });
  }
}

// Funzione di supporto per aggiornare manualmente il service worker quando disponibile
export function checkForUpdates() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
      console.log('Verifica aggiornamenti Service Worker...');
      registration.update()
        .then(() => console.log('Verifica aggiornamento Service Worker completata'))
        .catch(error => console.error('Errore durante la verifica aggiornamento SW:', error));
    }).catch(error => {
      console.error('Errore durante il controllo degli aggiornamenti:', error);
    });
  }
}

// Funzione per forzare l'aggiornamento quando è disponibile un nuovo service worker
export function applyUpdate() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
      if (registration.waiting) {
        console.log('Applicazione aggiornamento Service Worker in sospeso...');
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      }
    }).catch(error => {
      console.error('Errore nell\'applicare l\'aggiornamento:', error);
    });
  }
}

// Verifica se l'app è installata come PWA
export function isPWA() {
  return window.matchMedia('(display-mode: standalone)').matches || 
         (window.navigator as any).standalone === true;
}

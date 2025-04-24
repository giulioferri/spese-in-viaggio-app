
// Esponiamo un ascoltatore di eventi per il prompt di installazione
let deferredPrompt: any = null;

window.addEventListener('beforeinstallprompt', (e) => {
  // Previene la visualizzazione automatica del prompt
  e.preventDefault();
  // Salva l'evento per poterlo usare più tardi
  deferredPrompt = e;
  // Aggiorna UI per mostrare un pulsante di installazione
  console.log('PWA è installabile, evento salvato');
  
  // Invia un evento customizzato che altri componenti possono intercettare
  window.dispatchEvent(new CustomEvent('pwaInstallable'));
});

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

// Nuova funzione per installare la PWA
export function installPWA() {
  if (deferredPrompt) {
    // Mostra il prompt di installazione
    deferredPrompt.prompt();
    
    // Attendi che l'utente risponda al prompt
    deferredPrompt.userChoice.then((choiceResult: {outcome: string}) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('Utente ha accettato di installare la PWA');
      } else {
        console.log('Utente ha rifiutato di installare la PWA');
      }
      // Pulisci la variabile, può essere usata solo una volta
      deferredPrompt = null;
    });
  } else {
    console.log('La PWA è già installata o non può essere installata su questo dispositivo/browser');
    alert('L\'app è già installata o questo browser non supporta l\'installazione di PWA.');
  }
}

// Controlla se la PWA può essere installata
export function canInstallPWA() {
  return !!deferredPrompt;
}

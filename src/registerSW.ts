
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('SW registrato con successo:', registration.scope);
        })
        .catch(error => {
          console.error('Errore durante la registrazione del SW:', error);
        });
    });
  }
}

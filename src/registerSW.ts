
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        console.log('Attempting to register service worker...');
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered successfully:', registration.scope);
        
        // Update handling
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (installingWorker == null) {
            return;
          }
          
          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                console.log('New content available; refresh the page to use it.');
                
                // Show a message to the user that they can update the page
                if (window.confirm('New version available! Would you like to refresh the page to use the new version?')) {
                  window.location.reload();
                }
              } else {
                console.log('Content cached for offline use.');
              }
            }
          };
        };
      } catch (error) {
        console.error('Service Worker registration failed:', error);
        // Continue with the application even if service worker registration fails
      }
    });
  }
}

// Helper function to manually update the service worker when available
export function checkForUpdates() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
      console.log('Checking for Service Worker updates...');
      registration.update()
        .then(() => console.log('Service Worker update check completed'))
        .catch(error => console.error('Error during SW update check:', error));
    });
  }
}

// Function to force update when a new service worker is available
export function applyUpdate() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
      if (registration.waiting) {
        console.log('Applying pending Service Worker update...');
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      }
    }).catch(error => {
      console.error('Error applying update:', error);
    });
  }
}

// Check if the app is installed as PWA
export function isPWA() {
  return window.matchMedia('(display-mode: standalone)').matches || 
         (window.navigator as any).standalone === true;
}

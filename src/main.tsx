
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerServiceWorker, checkForUpdates } from './registerSW';

// Registrazione del service worker per abilitare le funzionalità PWA
console.log('Inizializzazione dell\'applicazione e registrazione del service worker...');
registerServiceWorker();

// Creazione dell'elemento root e rendering dell'applicazione
const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<App />);
} else {
  console.error("Elemento root non trovato nel DOM");
}

// Controlla periodicamente gli aggiornamenti del service worker
setInterval(checkForUpdates, 60 * 60 * 1000); // Controlla ogni ora

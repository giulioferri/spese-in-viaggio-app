
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerServiceWorker } from './registerSW';

// Registra il service worker per abilitare la funzionalità PWA
registerServiceWorker();

createRoot(document.getElementById("root")!).render(
  <App />
);

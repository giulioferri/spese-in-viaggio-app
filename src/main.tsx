
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerServiceWorker } from './registerSW';

// Register the service worker to enable PWA functionality
console.log('Initializing application and registering service worker...');
registerServiceWorker();

createRoot(document.getElementById("root")!).render(
  <App />
);

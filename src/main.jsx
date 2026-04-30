import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { initThemeFromStorage } from './theme-init.js';
import { TezpremiumProvider } from './context/TezpremiumContext';
import App from './App.jsx';

initThemeFromStorage();

/** React dan oldin — `initData` va viewport uchun Telegram Mini App SDK */
if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
  try {
    window.Telegram.WebApp.ready();
    window.Telegram.WebApp.expand();
  } catch {
    /* ignore */
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <TezpremiumProvider>
      <App />
    </TezpremiumProvider>
  </StrictMode>,
);

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

document.title = `${import.meta.env.VITE_COMPANY_NAME || 'Retail'} - Retail POS`;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

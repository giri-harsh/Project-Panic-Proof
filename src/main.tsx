import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

window.onerror = function() {
  return true; // Suppress all script errors
};

window.addEventListener('unhandledrejection', function(e) {
  e.preventDefault(); // Suppress unhandled promise rejections
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '@/index.css'; // Assuming Tailwind is configured here

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

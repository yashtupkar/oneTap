import React from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import Popup from './Popup.jsx';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
);

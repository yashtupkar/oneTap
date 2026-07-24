import React from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import Options from './Options.jsx';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Options />
  </React.StrictMode>
);

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';

const root = document.querySelector<HTMLElement>('#uriel-root');

if (root === null) {
  throw new Error('Uriel root was not found.');
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

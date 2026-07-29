import { App } from './app/App';
import './styles/main.css';

const root = document.querySelector<HTMLElement>('#app');

if (root === null) {
  throw new Error('Application root was not found.');
}

const app = new App(root);
void app.start();

window.addEventListener('pagehide', () => app.dispose(), { once: true });

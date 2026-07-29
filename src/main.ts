import { App } from './app/App';
import { JsonProjectRepository } from './data/JsonProjectRepository';
import './styles/main.css';
import { renderWebGlFallback } from './ui/UiController';

const root = document.querySelector<HTMLElement>('#app');

if (root === null) {
  throw new Error('Application root was not found.');
}

const appRoot = root;

async function bootstrap(): Promise<void> {
  if (!supportsWebGl2()) {
    const collection = await loadFallbackProjects();
    renderWebGlFallback(appRoot, collection.galaxies, collection.projects);
    return;
  }

  try {
    const app = new App(appRoot);
    await app.start();
    window.addEventListener('pagehide', () => app.dispose(), { once: true });
  } catch (error) {
    console.error('WebGL renderer initialization failed.', error);
    const collection = await loadFallbackProjects();
    renderWebGlFallback(appRoot, collection.galaxies, collection.projects);
  }
}

function supportsWebGl2(): boolean {
  try {
    return document.createElement('canvas').getContext('webgl2') !== null;
  } catch {
    return false;
  }
}

async function loadFallbackProjects() {
  try {
    return await new JsonProjectRepository().getCollection();
  } catch (error) {
    console.error('Fallback project data failed to load.', error);
    return { version: 2 as const, galaxies: [], projects: [] };
  }
}

void bootstrap();

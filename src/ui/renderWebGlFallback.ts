import type { Galaxy, Project } from '../data/Project';
import { getProjectDetailActions } from './projectActionPolicy';

export function getFallbackDestination(project: Project): {
  href: string | null;
  external: boolean;
} {
  const actions = getProjectDetailActions(project);
  return {
    href: actions.page ?? actions.github,
    external: actions.page === null && actions.github !== null,
  };
}

export function renderWebGlFallback(
  root: HTMLElement,
  galaxies: Galaxy[],
  projects: Project[],
): void {
  root.innerHTML = `
    <main class="fallback-view">
      <section class="fallback-card">
        <p class="eyebrow">Cosmic project garden</p>
        <h1>Jelly Plants</h1>
        <p class="fallback-message">
          이 브라우저에서는 3D 행성계를 표시할 수 없어요. 프로젝트 목록은 아래에서
          계속 둘러볼 수 있어요.
        </p>
        <div class="fallback-galaxies"></div>
      </section>
    </main>
  `;

  const container = root.querySelector<HTMLElement>('.fallback-galaxies');

  if (container === null) {
    return;
  }

  const sections = galaxies.map((galaxy) => {
    const section = document.createElement('section');
    const heading = document.createElement('h2');
    const description = document.createElement('p');
    const list = document.createElement('ul');
    heading.textContent = galaxy.name;
    description.textContent = galaxy.description;
    list.className = 'fallback-projects';

    const items = projects
      .filter((project) => project.galaxyId === galaxy.id)
      .map((project) => {
        const item = document.createElement('li');
        const destination = getFallbackDestination(project);
        const name =
          destination.href === null
            ? document.createElement('strong')
            : document.createElement('a');
        const summary = document.createElement('span');

        name.textContent = project.name;
        if (name instanceof HTMLAnchorElement && destination.href !== null) {
          name.href = destination.href;

          if (destination.external) {
            name.target = '_blank';
            name.rel = 'noreferrer';
          }
        }
        summary.textContent = project.summary;
        item.append(name, summary);
        return item;
      });

    list.replaceChildren(...items);
    section.append(heading, description, list);
    return section;
  });

  container.replaceChildren(...sections);
}

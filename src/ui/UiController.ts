import type { Galaxy, Project, ProjectStatus } from '../data/Project';

const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  active: '진행 중',
  legacy: '이전 작업',
  archived: '보관됨',
};

interface UiCallbacks {
  onCloseSelection: () => void;
  onSelectGalaxy: (galaxyId: string) => void;
  onSelectProject: (projectId: string) => void;
  onHoverProject: (projectId: string | null) => void;
}

export class UiController {
  readonly viewport: HTMLElement;
  readonly canvas: HTMLCanvasElement;

  private readonly loading: HTMLElement;
  private readonly message: HTMLElement;
  private readonly labelLayer: HTMLElement;
  private readonly galaxySwitcher: HTMLElement;
  private readonly galaxyDescription: HTMLElement;
  private readonly selectionPanel: HTMLElement;
  private readonly projectStatus: HTMLElement;
  private readonly projectCategory: HTMLElement;
  private readonly projectName: HTMLElement;
  private readonly projectSummary: HTMLElement;
  private readonly projectDescription: HTMLElement;
  private readonly projectTechStack: HTMLElement;
  private readonly projectGithubLink: HTMLAnchorElement;
  private readonly projectActions: HTMLElement;
  private readonly closeButton: HTMLButtonElement;
  private readonly galaxyButtons = new Map<string, HTMLButtonElement>();
  private readonly planetLabels = new Map<string, HTMLButtonElement>();
  private readyTimer: number | undefined;
  private travelTimer: number | undefined;
  private galaxyTravelTimer: number | undefined;

  constructor(
    root: HTMLElement,
    private readonly callbacks: UiCallbacks,
  ) {
    root.innerHTML = `
      <main class="app-shell">
        <section class="scene-viewport" aria-label="Jelly Plants 프로젝트 은하계">
          <canvas class="scene-canvas"></canvas>
          <div class="travel-streaks" aria-hidden="true">
            <span></span><span></span><span></span>
            <span></span><span></span><span></span>
          </div>
          <div class="planet-label-layer" aria-label="프로젝트 행성 목록"></div>
          <header class="site-header">
            <p class="eyebrow">Cosmic project garden</p>
            <h1>Jelly Plants</h1>
            <p class="galaxy-description"></p>
          </header>
          <nav class="galaxy-switcher" aria-label="프로젝트 은하계"></nav>
          <div class="galaxy-transit" aria-hidden="true">
            <span></span><span></span><span></span>
          </div>
          <p class="controls-hint">
            <span class="desktop-hint">드래그로 회전 · 휠로 확대 · 행성을 눌러 선택</span>
            <span class="mobile-hint">드래그로 회전 · 핀치로 확대 · 행성을 눌러 선택</span>
          </p>
          <div class="loading-screen" role="status" aria-live="polite">
            <span class="loading-orbit" aria-hidden="true">
              <span></span>
            </span>
            <p class="loading-title">Jelly Plants</p>
            <p class="status-message">프로젝트 행성계를 구성하는 중…</p>
          </div>
          <aside
            class="project-panel"
            aria-live="polite"
            aria-labelledby="selected-project-name"
            tabindex="-1"
            hidden
          >
            <button
              class="panel-close"
              type="button"
              aria-label="프로젝트 상세 닫기"
            >
              <span aria-hidden="true">×</span>
            </button>
            <span class="observation-signal" aria-hidden="true"></span>
            <div class="project-meta">
              <span class="project-status"></span>
              <span class="project-category"></span>
            </div>
            <h2 id="selected-project-name"></h2>
            <p class="project-summary"></p>
            <p class="project-description"></p>
            <section class="project-stack" aria-labelledby="project-stack-title">
              <p id="project-stack-title" class="panel-label">Tech stack</p>
              <ul class="project-tech-stack"></ul>
            </section>
            <div class="project-actions">
              <a
                class="project-link project-github-link"
                target="_blank"
                rel="noreferrer"
              >
                GitHub에서 보기
              </a>
            </div>
          </aside>
        </section>
      </main>
    `;

    this.viewport = this.requireElement(root, '.scene-viewport');
    this.canvas = this.requireElement(root, '.scene-canvas', HTMLCanvasElement);
    this.loading = this.requireElement(root, '.loading-screen');
    this.message = this.requireElement(root, '.status-message');
    this.labelLayer = this.requireElement(root, '.planet-label-layer');
    this.galaxySwitcher = this.requireElement(root, '.galaxy-switcher');
    this.galaxyDescription = this.requireElement(root, '.galaxy-description');
    this.selectionPanel = this.requireElement(root, '.project-panel');
    this.projectStatus = this.requireElement(root, '.project-status');
    this.projectCategory = this.requireElement(root, '.project-category');
    this.projectName = this.requireElement(root, '.project-panel h2');
    this.projectSummary = this.requireElement(root, '.project-summary');
    this.projectDescription = this.requireElement(root, '.project-description');
    this.projectTechStack = this.requireElement(root, '.project-tech-stack');
    this.projectGithubLink = this.requireElement(
      root,
      '.project-github-link',
      HTMLAnchorElement,
    );
    this.projectActions = this.requireElement(root, '.project-actions');
    this.closeButton = this.requireElement(root, '.panel-close', HTMLButtonElement);
    this.closeButton.addEventListener('click', this.handleClose);
    this.galaxySwitcher.addEventListener('click', this.handleGalaxyClick);
    this.labelLayer.addEventListener('click', this.handleLabelClick);
    this.labelLayer.addEventListener('pointerover', this.handleLabelPointerOver);
    this.labelLayer.addEventListener('pointerout', this.handleLabelPointerOut);
    document.addEventListener('keydown', this.handleKeyDown);
  }

  showReady(): void {
    this.loading.classList.add('is-ready');
    this.readyTimer = window.setTimeout(() => {
      this.loading.hidden = true;
    }, 480);
  }

  showError(error: unknown): void {
    this.loading.hidden = false;
    this.loading.classList.remove('is-ready');
    this.loading.classList.add('is-error');
    this.message.textContent =
      '프로젝트 데이터를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.';
    console.error('Jelly Plants initialization failed.', error);
  }

  showSelection(project: Project | null): void {
    this.selectionPanel.hidden = project === null;
    this.planetLabels.forEach((label, projectId) => {
      const selected = projectId === project?.id;
      label.classList.toggle('is-selected', selected);
      label.setAttribute('aria-pressed', String(selected));
    });

    if (project === null) {
      return;
    }

    this.projectName.textContent = project.name;
    this.projectStatus.textContent = PROJECT_STATUS_LABELS[project.status];
    this.projectStatus.dataset.status = project.status;
    this.projectCategory.textContent = project.details.category;
    this.projectSummary.textContent =
      project.summary || '이 프로젝트에는 아직 소개가 등록되지 않았어요.';
    this.projectDescription.textContent = project.details.description;
    this.showLink(this.projectGithubLink, project.links.github);
    this.projectActions.hidden = project.links.github === null;
    this.playTravelEffect();
    this.projectTechStack.replaceChildren(
      ...project.details.techStack.map((technology) => {
        const item = document.createElement('li');
        item.textContent = technology;
        return item;
      }),
    );
  }

  showProjects(projects: Project[]): void {
    this.planetLabels.clear();
    const labels = projects.map((project) => {
      const label = document.createElement('button');
      label.className = 'planet-label';
      label.type = 'button';
      label.dataset.projectId = project.id;
      label.textContent = project.name;
      label.setAttribute('aria-label', `${project.name} 프로젝트 보기`);
      label.setAttribute('aria-pressed', 'false');
      this.planetLabels.set(project.id, label);
      return label;
    });

    this.labelLayer.replaceChildren(...labels);
  }

  showGalaxies(galaxies: Galaxy[]): void {
    this.galaxyButtons.clear();
    const buttons = galaxies.map((galaxy) => {
      const button = document.createElement('button');
      button.className = 'galaxy-option';
      button.type = 'button';
      button.dataset.galaxyId = galaxy.id;
      button.style.setProperty('--option-color', galaxy.color);
      const orbit = document.createElement('span');
      const name = document.createElement('span');
      orbit.className = 'galaxy-orbit';
      orbit.setAttribute('aria-hidden', 'true');
      name.textContent = galaxy.name;
      button.append(orbit, name);
      button.setAttribute('aria-pressed', 'false');
      button.setAttribute('aria-label', `${galaxy.name} 은하계 보기`);
      this.galaxyButtons.set(galaxy.id, button);
      return button;
    });

    this.galaxySwitcher.replaceChildren(...buttons);
  }

  showGalaxy(galaxy: Galaxy, animate = true): void {
    this.viewport.dataset.galaxyId = galaxy.id;
    this.viewport.style.setProperty('--galaxy-color', galaxy.color);
    this.galaxyDescription.textContent = galaxy.description;
    this.galaxyButtons.forEach((button, galaxyId) => {
      const active = galaxyId === galaxy.id;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });

    if (animate) {
      this.playGalaxyTravelEffect();
    }
  }

  updatePlanetLabel(projectId: string, x: number, y: number, visible: boolean): void {
    const label = this.planetLabels.get(projectId);

    if (label === undefined) {
      return;
    }

    label.hidden = !visible;

    if (visible) {
      label.style.left = `${x}px`;
      label.style.top = `${y}px`;
    }
  }

  setHoveredProject(projectId: string | null): void {
    this.canvas.classList.toggle('is-hovering-planet', projectId !== null);
    this.planetLabels.forEach((label, labelProjectId) => {
      label.classList.toggle('is-hovered', labelProjectId === projectId);
    });
  }

  dispose(): void {
    if (this.readyTimer !== undefined) {
      window.clearTimeout(this.readyTimer);
    }
    if (this.travelTimer !== undefined) {
      window.clearTimeout(this.travelTimer);
    }
    if (this.galaxyTravelTimer !== undefined) {
      window.clearTimeout(this.galaxyTravelTimer);
    }
    this.closeButton.removeEventListener('click', this.handleClose);
    this.galaxySwitcher.removeEventListener('click', this.handleGalaxyClick);
    this.labelLayer.removeEventListener('click', this.handleLabelClick);
    this.labelLayer.removeEventListener('pointerover', this.handleLabelPointerOver);
    this.labelLayer.removeEventListener('pointerout', this.handleLabelPointerOut);
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  private readonly handleClose = (): void => {
    this.callbacks.onCloseSelection();
  };

  private readonly handleGalaxyClick = (event: Event): void => {
    const button =
      event.target instanceof Element
        ? event.target.closest<HTMLButtonElement>('.galaxy-option')
        : null;
    const galaxyId = button?.dataset.galaxyId;

    if (galaxyId !== undefined) {
      this.callbacks.onSelectGalaxy(galaxyId);
    }
  };

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && !this.selectionPanel.hidden) {
      this.callbacks.onCloseSelection();
    }
  };

  private readonly handleLabelClick = (event: Event): void => {
    const label = this.findLabel(event.target);
    const projectId = label?.dataset.projectId;

    if (projectId !== undefined) {
      this.callbacks.onSelectProject(projectId);
    }
  };

  private readonly handleLabelPointerOver = (event: PointerEvent): void => {
    const label = this.findLabel(event.target);

    if (label !== null && !label.contains(event.relatedTarget as Node | null)) {
      this.callbacks.onHoverProject(label.dataset.projectId ?? null);
    }
  };

  private readonly handleLabelPointerOut = (event: PointerEvent): void => {
    const label = this.findLabel(event.target);

    if (label !== null && !label.contains(event.relatedTarget as Node | null)) {
      this.callbacks.onHoverProject(null);
    }
  };

  private showLink(link: HTMLAnchorElement, href: string | null): void {
    link.hidden = href === null;

    if (href === null) {
      link.removeAttribute('href');
      return;
    }

    link.href = href;
  }

  private playTravelEffect(): void {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    if (this.travelTimer !== undefined) {
      window.clearTimeout(this.travelTimer);
    }

    this.viewport.classList.remove('is-traveling');
    void this.viewport.offsetWidth;
    this.viewport.classList.add('is-traveling');
    this.travelTimer = window.setTimeout(() => {
      this.viewport.classList.remove('is-traveling');
    }, 760);
  }

  private playGalaxyTravelEffect(): void {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    if (this.galaxyTravelTimer !== undefined) {
      window.clearTimeout(this.galaxyTravelTimer);
    }

    this.viewport.classList.remove('is-switching-galaxy');
    void this.viewport.offsetWidth;
    this.viewport.classList.add('is-switching-galaxy');
    this.galaxyTravelTimer = window.setTimeout(() => {
      this.viewport.classList.remove('is-switching-galaxy');
    }, 860);
  }

  private findLabel(target: EventTarget | null): HTMLButtonElement | null {
    return target instanceof Element
      ? target.closest<HTMLButtonElement>('.planet-label')
      : null;
  }

  private requireElement<T extends Element>(
    root: ParentNode,
    selector: string,
    constructor?: { new (): T },
  ): T {
    const element = root.querySelector(selector);

    if (
      element === null ||
      (constructor !== undefined && !(element instanceof constructor))
    ) {
      throw new Error(`Required UI element is missing: ${selector}`);
    }

    return element as T;
  }
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
        const name =
          project.links.github === null
            ? document.createElement('strong')
            : document.createElement('a');
        const summary = document.createElement('span');

        name.textContent = project.name;
        if (name instanceof HTMLAnchorElement && project.links.github !== null) {
          name.href = project.links.github;
          name.target = '_blank';
          name.rel = 'noreferrer';
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

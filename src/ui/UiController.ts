import type { Galaxy, Project } from '../data/Project';
import { PlanetLabels } from './PlanetLabels';
import { ProjectPanel } from './ProjectPanel';

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
  private readonly planetLabels: PlanetLabels;
  private readonly galaxySwitcher: HTMLElement;
  private readonly galaxyDescription: HTMLElement;
  private readonly projectPanel: ProjectPanel;
  private readonly galaxyButtons = new Map<string, HTMLButtonElement>();
  private readyTimer: number | undefined;
  private travelTimer: number | undefined;
  private galaxyTravelTimer: number | undefined;
  private travelFrame: number | undefined;
  private galaxyTravelFrame: number | undefined;

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
              <a class="project-link project-page-link"></a>
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
    this.planetLabels = new PlanetLabels(
      this.requireElement(root, '.planet-label-layer'),
      callbacks.onSelectProject,
      callbacks.onHoverProject,
    );
    this.galaxySwitcher = this.requireElement(root, '.galaxy-switcher');
    this.galaxyDescription = this.requireElement(root, '.galaxy-description');
    this.projectPanel = new ProjectPanel(
      root,
      this.viewport,
      callbacks.onCloseSelection,
      () => this.playTravelEffect(),
    );
    this.galaxySwitcher.addEventListener('click', this.handleGalaxyClick);
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
    this.planetLabels.setSelected(project?.id ?? null);
    this.projectPanel.show(project);
  }

  showProjects(projects: Project[]): void {
    this.planetLabels.show(projects);
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
    this.planetLabels.update(projectId, x, y, visible);
  }

  setHoveredProject(projectId: string | null): void {
    this.canvas.classList.toggle('is-hovering-planet', projectId !== null);
    this.planetLabels.setHovered(projectId);
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
    if (this.travelFrame !== undefined) {
      window.cancelAnimationFrame(this.travelFrame);
    }
    if (this.galaxyTravelFrame !== undefined) {
      window.cancelAnimationFrame(this.galaxyTravelFrame);
    }
    this.projectPanel.dispose();
    this.galaxySwitcher.removeEventListener('click', this.handleGalaxyClick);
    this.planetLabels.dispose();
    document.removeEventListener('keydown', this.handleKeyDown);
  }

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
    if (event.key === 'Escape' && !this.projectPanel.hidden) {
      this.callbacks.onCloseSelection();
    }
  };

  private playTravelEffect(): void {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    if (this.travelTimer !== undefined) {
      window.clearTimeout(this.travelTimer);
    }
    if (this.travelFrame !== undefined) {
      window.cancelAnimationFrame(this.travelFrame);
    }

    this.viewport.classList.remove('is-traveling');
    this.travelFrame = window.requestAnimationFrame(() => {
      this.travelFrame = undefined;
      this.viewport.classList.add('is-traveling');
      this.travelTimer = window.setTimeout(() => {
        this.viewport.classList.remove('is-traveling');
      }, 760);
    });
  }

  private playGalaxyTravelEffect(): void {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    if (this.galaxyTravelTimer !== undefined) {
      window.clearTimeout(this.galaxyTravelTimer);
    }
    if (this.galaxyTravelFrame !== undefined) {
      window.cancelAnimationFrame(this.galaxyTravelFrame);
    }

    this.viewport.classList.remove('is-switching-galaxy');
    this.galaxyTravelFrame = window.requestAnimationFrame(() => {
      this.galaxyTravelFrame = undefined;
      this.viewport.classList.add('is-switching-galaxy');
      this.galaxyTravelTimer = window.setTimeout(() => {
        this.viewport.classList.remove('is-switching-galaxy');
      }, 860);
    });
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

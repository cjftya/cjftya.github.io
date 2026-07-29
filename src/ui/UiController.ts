import type { Project } from '../data/Project';

export class UiController {
  readonly viewport: HTMLElement;
  readonly canvas: HTMLCanvasElement;

  private readonly loading: HTMLElement;
  private readonly message: HTMLElement;
  private readonly selectionPanel: HTMLElement;
  private readonly projectName: HTMLElement;
  private readonly projectSummary: HTMLElement;
  private readonly projectLink: HTMLAnchorElement;

  constructor(root: HTMLElement) {
    root.innerHTML = `
      <main class="app-shell">
        <section class="scene-viewport" aria-label="Jelly Plants 태양계">
          <canvas class="scene-canvas"></canvas>
          <header class="site-header">
            <p class="eyebrow">Project constellation</p>
            <h1>Jelly Plants</h1>
          </header>
          <p class="controls-hint">
            드래그로 회전 · 휠 또는 핀치로 확대 · 행성을 눌러 선택
          </p>
          <div class="status-message" role="status" aria-live="polite">
            프로젝트 데이터를 불러오는 중…
          </div>
          <aside class="project-panel" aria-live="polite" hidden>
            <p class="panel-label">Selected project</p>
            <h2></h2>
            <p class="project-summary"></p>
            <a class="project-link">프로젝트 열기</a>
          </aside>
        </section>
      </main>
    `;

    this.viewport = this.requireElement(root, '.scene-viewport');
    this.canvas = this.requireElement(root, '.scene-canvas', HTMLCanvasElement);
    this.loading = this.requireElement(root, '.status-message');
    this.message = this.loading;
    this.selectionPanel = this.requireElement(root, '.project-panel');
    this.projectName = this.requireElement(root, '.project-panel h2');
    this.projectSummary = this.requireElement(root, '.project-summary');
    this.projectLink = this.requireElement(root, '.project-link', HTMLAnchorElement);
  }

  showReady(): void {
    this.loading.hidden = true;
  }

  showError(error: unknown): void {
    this.message.hidden = false;
    this.message.classList.add('is-error');
    this.message.textContent =
      '프로젝트 데이터를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.';
    console.error('Jelly Plants initialization failed.', error);
  }

  showSelection(project: Project | null): void {
    this.selectionPanel.hidden = project === null;

    if (project === null) {
      return;
    }

    this.projectName.textContent = project.name;
    this.projectSummary.textContent =
      project.summary || '이 프로젝트에는 아직 소개가 등록되지 않았어요.';
    this.projectLink.hidden = project.links.page === null;

    if (project.links.page !== null) {
      this.projectLink.href = project.links.page;
    } else {
      this.projectLink.removeAttribute('href');
    }
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

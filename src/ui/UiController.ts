import type { Project, ProjectStatus } from '../data/Project';

const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  active: '진행 중',
  legacy: '이전 작업',
  archived: '보관됨',
};

export class UiController {
  readonly viewport: HTMLElement;
  readonly canvas: HTMLCanvasElement;

  private readonly loading: HTMLElement;
  private readonly message: HTMLElement;
  private readonly selectionPanel: HTMLElement;
  private readonly projectCover: HTMLImageElement;
  private readonly projectStatus: HTMLElement;
  private readonly projectCategory: HTMLElement;
  private readonly projectName: HTMLElement;
  private readonly projectSummary: HTMLElement;
  private readonly projectDescription: HTMLElement;
  private readonly projectTechStack: HTMLElement;
  private readonly projectPageLink: HTMLAnchorElement;
  private readonly projectGithubLink: HTMLAnchorElement;
  private readonly closeButton: HTMLButtonElement;

  constructor(
    root: HTMLElement,
    private readonly onCloseSelection: () => void,
  ) {
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
          <aside
            class="project-panel"
            aria-live="polite"
            aria-labelledby="selected-project-name"
            hidden
          >
            <button
              class="panel-close"
              type="button"
              aria-label="프로젝트 상세 닫기"
            >
              <span aria-hidden="true">×</span>
            </button>
            <img class="project-cover" alt="" loading="lazy" hidden />
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
              <a class="project-link project-page-link">프로젝트 열기</a>
              <a
                class="project-link project-github-link"
                target="_blank"
                rel="noreferrer"
              >
                GitHub 저장소
              </a>
            </div>
          </aside>
        </section>
      </main>
    `;

    this.viewport = this.requireElement(root, '.scene-viewport');
    this.canvas = this.requireElement(root, '.scene-canvas', HTMLCanvasElement);
    this.loading = this.requireElement(root, '.status-message');
    this.message = this.loading;
    this.selectionPanel = this.requireElement(root, '.project-panel');
    this.projectCover = this.requireElement(root, '.project-cover', HTMLImageElement);
    this.projectStatus = this.requireElement(root, '.project-status');
    this.projectCategory = this.requireElement(root, '.project-category');
    this.projectName = this.requireElement(root, '.project-panel h2');
    this.projectSummary = this.requireElement(root, '.project-summary');
    this.projectDescription = this.requireElement(root, '.project-description');
    this.projectTechStack = this.requireElement(root, '.project-tech-stack');
    this.projectPageLink = this.requireElement(
      root,
      '.project-page-link',
      HTMLAnchorElement,
    );
    this.projectGithubLink = this.requireElement(
      root,
      '.project-github-link',
      HTMLAnchorElement,
    );
    this.closeButton = this.requireElement(root, '.panel-close', HTMLButtonElement);
    this.closeButton.addEventListener('click', this.handleClose);
    document.addEventListener('keydown', this.handleKeyDown);
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
    this.projectStatus.textContent = PROJECT_STATUS_LABELS[project.status];
    this.projectStatus.dataset.status = project.status;
    this.projectCategory.textContent = project.details.category;
    this.projectSummary.textContent =
      project.summary || '이 프로젝트에는 아직 소개가 등록되지 않았어요.';
    this.projectDescription.textContent = project.details.description;
    this.showCover(project);
    this.showLink(this.projectPageLink, project.links.page);
    this.showLink(this.projectGithubLink, project.links.github);
    this.projectTechStack.replaceChildren(
      ...project.details.techStack.map((technology) => {
        const item = document.createElement('li');
        item.textContent = technology;
        return item;
      }),
    );
  }

  dispose(): void {
    this.closeButton.removeEventListener('click', this.handleClose);
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  private readonly handleClose = (): void => {
    this.onCloseSelection();
  };

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && !this.selectionPanel.hidden) {
      this.onCloseSelection();
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

  private showCover(project: Project): void {
    const source = project.details.coverImage;
    this.projectCover.hidden = source === null;

    if (source === null) {
      this.projectCover.removeAttribute('src');
      this.projectCover.alt = '';
      return;
    }

    this.projectCover.src = source;
    this.projectCover.alt = `${project.name} 대표 이미지`;
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

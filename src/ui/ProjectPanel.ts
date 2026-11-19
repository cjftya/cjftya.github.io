import type { Project, ProjectStatus } from '../data/Project';
import { getProjectDetailActions } from './projectActionPolicy';

const STATUS_LABELS: Record<ProjectStatus, string> = {
  active: '진행 중',
  legacy: '이전 작업',
  archived: '보관됨',
};

export class ProjectPanel {
  private readonly touchLayout = window.matchMedia('(pointer: coarse)');
  private readonly resizeObserver: ResizeObserver;
  private readonly family = document.createElement('nav');
  private projects: Project[] = [];
  private readonly panel: HTMLElement;
  private readonly status: HTMLElement;
  private readonly category: HTMLElement;
  private readonly name: HTMLElement;
  private readonly summary: HTMLElement;
  private readonly description: HTMLElement;
  private readonly techStack: HTMLElement;
  private readonly pageLink: HTMLAnchorElement;
  private readonly githubLink: HTMLAnchorElement;
  private readonly actions: HTMLElement;
  private readonly closeButton: HTMLButtonElement;
  private readonly toggleButton: HTMLButtonElement;
  private readonly details: HTMLElement;

  constructor(
    root: HTMLElement,
    private readonly viewport: HTMLElement,
    private readonly onClose: () => void,
    private readonly onShow: () => void,
    private readonly onSelectProject: (projectId: string) => void,
    private readonly onFramingChange: (verticalOffset: number) => void,
  ) {
    this.panel = this.requireElement(root, '.project-panel');
    this.status = this.requireElement(root, '.project-status');
    this.category = this.requireElement(root, '.project-category');
    this.name = this.requireElement(root, '.project-panel h2');
    this.summary = this.requireElement(root, '.project-summary');
    this.description = this.requireElement(root, '.project-description');
    this.family.className = 'project-family';
    this.family.setAttribute('aria-label', '프로젝트 플랫폼 선택');
    this.summary.before(this.family);
    this.techStack = this.requireElement(root, '.project-tech-stack');
    this.pageLink = this.requireElement(root, '.project-page-link', HTMLAnchorElement);
    this.githubLink = this.requireElement(
      root,
      '.project-github-link',
      HTMLAnchorElement,
    );
    this.actions = this.requireElement(root, '.project-actions');
    this.closeButton = this.requireElement(root, '.panel-close', HTMLButtonElement);
    this.closeButton.addEventListener('click', this.handleClose);
    this.toggleButton = this.requireElement(root, '.panel-toggle', HTMLButtonElement);
    this.details = this.requireElement(root, '.project-details');
    this.toggleButton.addEventListener('click', this.handleToggle);
    this.touchLayout.addEventListener('change', this.updateFraming);
    this.resizeObserver = new ResizeObserver(this.updateFraming);
    this.resizeObserver.observe(this.panel);
    this.resizeObserver.observe(this.viewport);
  }

  get hidden(): boolean {
    return this.panel.hidden === true;
  }

  setProjects(projects: Project[]): void {
    this.projects = projects;
  }

  show(project: Project | null): void {
    this.panel.hidden = project === null;
    this.setExpanded(false);
    if (project === null) {
      this.viewport.style.removeProperty('--project-color');
      this.updateFraming();
      return;
    }

    this.viewport.style.setProperty(
      '--project-color',
      project.planet.surface.baseColor,
    );
    const rootId = project.parentProjectId ?? project.id;
    const family = this.projects.filter(
      (candidate) => candidate.id === rootId || candidate.parentProjectId === rootId,
    );
    this.family.hidden = family.length < 2;
    this.family.replaceChildren(
      ...family.map((member) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'project-link';
        const rootName =
          this.projects.find((candidate) => candidate.id === rootId)?.name ?? '';
        const satelliteName = member.name.replace(rootName, '').trim() || member.name;
        button.textContent =
          member.parentProjectId === undefined
            ? 'PC · 본행성'
            : `${satelliteName} · 위성`;
        button.setAttribute('aria-pressed', String(member.id === project.id));
        button.onclick = () => this.onSelectProject(member.id);
        return button;
      }),
    );
    this.name.textContent = project.name;
    this.status.textContent = STATUS_LABELS[project.status];
    this.status.dataset.status = project.status;
    this.category.textContent = project.details.category;
    this.summary.textContent =
      project.summary || '이 프로젝트에는 아직 소개가 등록되지 않았어요.';
    this.description.textContent = project.details.description;
    const detailActions = getProjectDetailActions(project);
    this.pageLink.textContent = `${project.name} 보기`;
    this.showLink(this.pageLink, detailActions.page);
    this.showLink(this.githubLink, detailActions.github);
    this.actions.hidden = detailActions.page === null && detailActions.github === null;
    this.techStack.replaceChildren(
      ...project.details.techStack.map((technology) => {
        const item = document.createElement('li');
        item.textContent = technology;
        return item;
      }),
    );
    this.updateFraming();
    this.onShow();
  }

  dispose(): void {
    this.closeButton.removeEventListener('click', this.handleClose);
    this.toggleButton.removeEventListener('click', this.handleToggle);
    this.touchLayout.removeEventListener('change', this.updateFraming);
    this.resizeObserver.disconnect();
  }

  private readonly handleClose = (): void => {
    this.onClose();
  };

  private readonly handleToggle = (): void => {
    this.setExpanded(this.panel.dataset.expanded !== 'true');
    this.updateFraming();
  };

  private setExpanded(expanded: boolean): void {
    this.panel.dataset.expanded = String(expanded);
    this.toggleButton.setAttribute('aria-expanded', String(expanded));
    this.toggleButton.textContent = expanded ? '접기' : '자세히';
    this.details.scrollTop = 0;
  }

  private readonly updateFraming = (): void => {
    const height = this.viewport.clientHeight;
    const offset =
      this.touchLayout.matches && !this.hidden && height > 0
        ? (height - this.panel.offsetTop) / (2 * height)
        : 0;
    this.onFramingChange(offset);
  };

  private showLink(link: HTMLAnchorElement, href: string | null): void {
    link.hidden = href === null;
    if (href === null) {
      link.removeAttribute('href');
      return;
    }
    link.href = href;
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

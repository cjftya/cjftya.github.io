import type { Project, ProjectStatus } from '../data/Project';
import { getProjectDetailActions } from './projectActionPolicy';

const STATUS_LABELS: Record<ProjectStatus, string> = {
  active: '진행 중',
  legacy: '이전 작업',
  archived: '보관됨',
};

export class ProjectPanel {
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

  constructor(
    root: HTMLElement,
    private readonly viewport: HTMLElement,
    private readonly onClose: () => void,
    private readonly onShow: () => void,
  ) {
    this.panel = this.requireElement(root, '.project-panel');
    this.status = this.requireElement(root, '.project-status');
    this.category = this.requireElement(root, '.project-category');
    this.name = this.requireElement(root, '.project-panel h2');
    this.summary = this.requireElement(root, '.project-summary');
    this.description = this.requireElement(root, '.project-description');
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
  }

  get hidden(): boolean {
    return this.panel.hidden === true;
  }

  show(project: Project | null): void {
    this.panel.hidden = project === null;
    if (project === null) {
      this.viewport.style.removeProperty('--project-color');
      return;
    }

    this.viewport.style.setProperty(
      '--project-color',
      project.planet.surface.baseColor,
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
    this.onShow();
  }

  dispose(): void {
    this.closeButton.removeEventListener('click', this.handleClose);
  }

  private readonly handleClose = (): void => {
    this.onClose();
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

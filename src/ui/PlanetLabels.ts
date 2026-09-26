import type { Project } from '../data/Project';

interface PlanetLabelRenderState {
  visible: boolean;
  x: number;
  y: number;
}

export class PlanetLabels {
  private readonly labels = new Map<string, HTMLButtonElement>();
  private readonly renderStates = new Map<string, PlanetLabelRenderState>();

  constructor(
    private readonly layer: HTMLElement,
    private readonly onSelect: (projectId: string) => void,
    private readonly onHover: (projectId: string | null) => void,
  ) {
    layer.addEventListener('click', this.handleClick);
    layer.addEventListener('pointerover', this.handlePointerOver);
    layer.addEventListener('pointerout', this.handlePointerOut);
  }

  show(projects: Project[]): void {
    this.labels.clear();
    this.renderStates.clear();
    const labels = projects.map((project) => {
      const label = document.createElement('button');
      label.className = 'planet-label';
      label.type = 'button';
      label.hidden = true;
      label.dataset.projectId = project.id;
      label.style.setProperty('--planet-color', project.planet.surface.baseColor);
      label.textContent = project.name;
      label.setAttribute('aria-label', `${project.name} 프로젝트 보기`);
      label.setAttribute('aria-pressed', 'false');
      this.labels.set(project.id, label);
      this.renderStates.set(project.id, {
        visible: false,
        x: Number.NaN,
        y: Number.NaN,
      });
      return label;
    });

    this.layer.replaceChildren(...labels);
  }

  setSelected(projectId: string | null): void {
    this.labels.forEach((label, labelProjectId) => {
      const selected = labelProjectId === projectId;
      label.classList.toggle('is-selected', selected);
      label.setAttribute('aria-pressed', String(selected));
    });
  }

  setHovered(projectId: string | null): void {
    this.labels.forEach((label, labelProjectId) => {
      label.classList.toggle('is-hovered', labelProjectId === projectId);
    });
  }

  update(projectId: string, x: number, y: number, visible: boolean): void {
    const label = this.labels.get(projectId);
    const renderState = this.renderStates.get(projectId);

    if (label === undefined || renderState === undefined) {
      return;
    }

    if (renderState.visible !== visible) {
      label.hidden = !visible;
      renderState.visible = visible;
    }

    if (visible) {
      const roundedX = Math.round(x * 4) / 4;
      const roundedY = Math.round(y * 4) / 4;

      if (renderState.x !== roundedX || renderState.y !== roundedY) {
        label.style.transform = `translate3d(${roundedX}px, ${roundedY}px, 0) translate(-50%, calc(-100% - 0.35rem))`;
        renderState.x = roundedX;
        renderState.y = roundedY;
      }
    }
  }

  dispose(): void {
    this.layer.removeEventListener('click', this.handleClick);
    this.layer.removeEventListener('pointerover', this.handlePointerOver);
    this.layer.removeEventListener('pointerout', this.handlePointerOut);
    this.labels.clear();
    this.renderStates.clear();
  }

  private readonly handleClick = (event: Event): void => {
    const projectId = this.findLabel(event.target)?.dataset.projectId;
    if (projectId !== undefined) {
      this.onSelect(projectId);
    }
  };

  private readonly handlePointerOver = (event: PointerEvent): void => {
    const label = this.findLabel(event.target);
    if (label !== null && !label.contains(event.relatedTarget as Node | null)) {
      this.onHover(label.dataset.projectId ?? null);
    }
  };

  private readonly handlePointerOut = (event: PointerEvent): void => {
    const label = this.findLabel(event.target);
    if (label !== null && !label.contains(event.relatedTarget as Node | null)) {
      this.onHover(null);
    }
  };

  private findLabel(target: EventTarget | null): HTMLButtonElement | null {
    return target instanceof Element
      ? target.closest<HTMLButtonElement>('.planet-label')
      : null;
  }
}

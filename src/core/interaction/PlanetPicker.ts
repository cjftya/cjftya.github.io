import { Mesh, Raycaster, Vector2, type PerspectiveCamera } from 'three';
import type { Project } from '../../data/Project';
import type { SolarSystem } from '../../solar-system/SolarSystem';

type SelectionHandler = (project: Project | null) => void;
type HoverHandler = (project: Project | null) => void;

export class PlanetPicker {
  private readonly raycaster = new Raycaster();
  private readonly pointer = new Vector2();
  private readonly pointerStart = new Vector2();
  private pointerId: number | undefined;
  private hoveredProjectId: string | null = null;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly camera: PerspectiveCamera,
    private readonly solarSystem: SolarSystem,
    private readonly onSelection: SelectionHandler,
    private readonly onHover: HoverHandler,
  ) {
    this.canvas.addEventListener('pointerdown', this.handlePointerDown);
    this.canvas.addEventListener('pointerup', this.handlePointerUp);
    this.canvas.addEventListener('pointercancel', this.handlePointerCancel);
    this.canvas.addEventListener('pointermove', this.handlePointerMove);
    this.canvas.addEventListener('pointerleave', this.handlePointerLeave);
  }

  dispose(): void {
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    this.canvas.removeEventListener('pointerup', this.handlePointerUp);
    this.canvas.removeEventListener('pointercancel', this.handlePointerCancel);
    this.canvas.removeEventListener('pointermove', this.handlePointerMove);
    this.canvas.removeEventListener('pointerleave', this.handlePointerLeave);
  }

  private readonly handlePointerDown = (event: PointerEvent): void => {
    this.pointerId = event.pointerId;
    this.pointerStart.set(event.clientX, event.clientY);
  };

  private readonly handlePointerUp = (event: PointerEvent): void => {
    if (this.pointerId !== event.pointerId) {
      return;
    }

    this.pointerId = undefined;
    const movedDistance = this.pointerStart.distanceTo(
      this.pointer.set(event.clientX, event.clientY),
    );

    if (movedDistance > 8) {
      return;
    }

    this.onSelection(this.pickProject(event.clientX, event.clientY));
  };

  private readonly handlePointerCancel = (): void => {
    this.pointerId = undefined;
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (event.pointerType === 'touch') {
      return;
    }

    const project = this.pickProject(event.clientX, event.clientY);
    const projectId = project?.id ?? null;

    if (projectId === this.hoveredProjectId) {
      return;
    }

    this.hoveredProjectId = projectId;
    this.onHover(project);
  };

  private readonly handlePointerLeave = (): void => {
    this.hoveredProjectId = null;
    this.onHover(null);
  };

  private pickProject(clientX: number, clientY: number): Project | null {
    const bounds = this.canvas.getBoundingClientRect();
    this.pointer.set(
      ((clientX - bounds.left) / bounds.width) * 2 - 1,
      -((clientY - bounds.top) / bounds.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(this.pointer, this.camera);

    const [intersection] = this.raycaster.intersectObjects(
      this.solarSystem.getSelectableMeshes(),
      false,
    );
    const mesh = intersection?.object;

    return mesh instanceof Mesh
      ? (this.solarSystem.getProjectForMesh(mesh) ?? null)
      : null;
  }
}

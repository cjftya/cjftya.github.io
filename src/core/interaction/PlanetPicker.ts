import { Mesh, Raycaster, Vector2, type PerspectiveCamera } from 'three';
import type { Project } from '../../data/Project';
import type { SolarSystem } from '../../solar-system/SolarSystem';

type SelectionHandler = (project: Project | null) => void;

export class PlanetPicker {
  private readonly raycaster = new Raycaster();
  private readonly pointer = new Vector2();
  private readonly pointerStart = new Vector2();
  private pointerId: number | undefined;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly camera: PerspectiveCamera,
    private readonly solarSystem: SolarSystem,
    private readonly onSelection: SelectionHandler,
  ) {
    this.canvas.addEventListener('pointerdown', this.handlePointerDown);
    this.canvas.addEventListener('pointerup', this.handlePointerUp);
    this.canvas.addEventListener('pointercancel', this.handlePointerCancel);
  }

  dispose(): void {
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    this.canvas.removeEventListener('pointerup', this.handlePointerUp);
    this.canvas.removeEventListener('pointercancel', this.handlePointerCancel);
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

    const bounds = this.canvas.getBoundingClientRect();
    this.pointer.set(
      ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
      -((event.clientY - bounds.top) / bounds.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(this.pointer, this.camera);

    const [intersection] = this.raycaster.intersectObjects(
      this.solarSystem.getSelectableMeshes(),
      false,
    );
    const mesh = intersection?.object;
    const project =
      mesh instanceof Mesh ? this.solarSystem.getProjectForMesh(mesh) : undefined;

    this.onSelection(project ?? null);
  };

  private readonly handlePointerCancel = (): void => {
    this.pointerId = undefined;
  };
}

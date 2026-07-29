import { PerspectiveCamera, Vector3 } from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class CameraController {
  readonly camera: PerspectiveCamera;
  readonly controls: OrbitControls;

  constructor(canvas: HTMLCanvasElement, aspect: number) {
    this.camera = new PerspectiveCamera(48, aspect, 0.1, 100);
    this.camera.position.set(0, 7, 13);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.target.copy(new Vector3(0, 0, 0));
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.065;
    this.controls.enablePan = false;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 24;
    this.controls.update();
  }

  resize(aspect: number): void {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  update(): void {
    this.controls.update();
  }

  dispose(): void {
    this.controls.dispose();
  }
}

import { PerspectiveCamera, Vector3 } from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

interface CameraTransition {
  startPosition: Vector3;
  startTarget: Vector3;
  endPosition: Vector3;
  endTarget: Vector3;
  elapsedSeconds: number;
  durationSeconds: number;
  focusedPlanetRadius: number | null;
}

const TRANSITION_DURATION_SECONDS = 0.75;
const HOME_MIN_DISTANCE = 5;
const HOME_MAX_DISTANCE = 24;

export class CameraController {
  readonly camera: PerspectiveCamera;
  readonly controls: OrbitControls;

  private readonly homePosition = new Vector3(0, 7, 13);
  private readonly homeTarget = new Vector3();
  private readonly focusDirection = new Vector3(0.85, 0.55, 1).normalize();
  private readonly prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches;
  private transition: CameraTransition | undefined;

  constructor(canvas: HTMLCanvasElement, aspect: number) {
    this.camera = new PerspectiveCamera(48, aspect, 0.1, 100);
    this.camera.position.copy(this.homePosition);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.target.copy(this.homeTarget);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.065;
    this.controls.enablePan = false;
    this.controls.minDistance = HOME_MIN_DISTANCE;
    this.controls.maxDistance = HOME_MAX_DISTANCE;
    this.controls.update();
  }

  resize(aspect: number): void {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  focusOn(target: Vector3, planetRadius: number): void {
    const distance = Math.max(planetRadius * 4.5, 3.2);
    const endPosition = target
      .clone()
      .add(this.focusDirection.clone().multiplyScalar(distance));

    this.startTransition(endPosition, target, planetRadius);
  }

  resetFocus(): void {
    this.startTransition(this.homePosition, this.homeTarget, null);
  }

  update(deltaSeconds: number): void {
    if (this.transition !== undefined) {
      this.updateTransition(deltaSeconds);
      return;
    }

    this.controls.update();
  }

  dispose(): void {
    this.controls.dispose();
  }

  private startTransition(
    endPosition: Vector3,
    endTarget: Vector3,
    focusedPlanetRadius: number | null,
  ): void {
    const transition: CameraTransition = {
      startPosition: this.camera.position.clone(),
      startTarget: this.controls.target.clone(),
      endPosition: endPosition.clone(),
      endTarget: endTarget.clone(),
      elapsedSeconds: 0,
      durationSeconds: this.prefersReducedMotion ? 0 : TRANSITION_DURATION_SECONDS,
      focusedPlanetRadius,
    };

    this.controls.enabled = false;
    this.transition = transition;

    if (transition.durationSeconds === 0) {
      this.finishTransition(transition);
    }
  }

  private updateTransition(deltaSeconds: number): void {
    const transition = this.transition;

    if (transition === undefined) {
      return;
    }

    transition.elapsedSeconds += deltaSeconds;
    const progress = Math.min(
      transition.elapsedSeconds / transition.durationSeconds,
      1,
    );
    const easedProgress = 1 - Math.pow(1 - progress, 3);

    this.camera.position.lerpVectors(
      transition.startPosition,
      transition.endPosition,
      easedProgress,
    );
    this.controls.target.lerpVectors(
      transition.startTarget,
      transition.endTarget,
      easedProgress,
    );
    this.camera.lookAt(this.controls.target);

    if (progress === 1) {
      this.finishTransition(transition);
    }
  }

  private finishTransition(transition: CameraTransition): void {
    this.camera.position.copy(transition.endPosition);
    this.controls.target.copy(transition.endTarget);

    if (transition.focusedPlanetRadius === null) {
      this.controls.minDistance = HOME_MIN_DISTANCE;
      this.controls.maxDistance = HOME_MAX_DISTANCE;
    } else {
      this.controls.minDistance = Math.max(transition.focusedPlanetRadius * 1.8, 1.2);
      this.controls.maxDistance = Math.max(transition.focusedPlanetRadius * 9, 8);
    }

    this.transition = undefined;
    this.controls.enabled = true;
    this.controls.update();
  }
}

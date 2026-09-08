import * as THREE from 'three';
import type { OrbitControls } from 'three/addons/controls/OrbitControls.js';

interface CameraTransition {
  readonly startedAt: number;
  readonly duration: number;
  readonly fromPosition: THREE.Vector3;
  readonly fromTarget: THREE.Vector3;
  readonly toPosition: THREE.Vector3;
  readonly toTarget: THREE.Vector3;
  readonly token: string;
}

export interface CameraWaypoint {
  readonly position: THREE.Vector3;
  readonly target: THREE.Vector3;
  readonly duration: number;
}

export class CameraRig {
  private transition: CameraTransition | null = null;
  private waypointQueue: CameraWaypoint[] = [];
  private queueToken = '';

  constructor(
    private readonly camera: THREE.PerspectiveCamera,
    private readonly controls: OrbitControls,
    private readonly onTransitionComplete?: (token: string) => void,
  ) {
    this.controls.addEventListener('start', this.cancelTransition);
  }

  frameObject(
    object: THREE.Object3D,
    immediate = false,
    duration = 900,
    token = 'observe',
  ): void {
    object.updateWorldMatrix(true, true);
    const box = visibleBounds(object);
    if (box.isEmpty()) return;
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const verticalSize = Math.max(size.y, size.x / Math.max(this.camera.aspect, 0.45));
    const fill = this.camera.aspect < 0.72 ? 0.58 : 0.7;
    const distance = Math.max(
      2.4,
      verticalSize /
        (2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov * 0.5)) * fill),
    );
    const direction = this.camera.position.clone().sub(this.controls.target);
    if (direction.lengthSq() < 1e-6) direction.set(0.8, 0.42, 1);
    direction.normalize();
    this.moveTo(
      center,
      center.clone().addScaledVector(direction, distance),
      immediate,
      duration,
      token,
    );
  }

  focusObject(object: THREE.Object3D): void {
    object.updateWorldMatrix(true, true);
    const box = visibleBounds(object);
    if (box.isEmpty()) return;
    const center = box.getCenter(new THREE.Vector3());
    const radius = Math.max(box.getBoundingSphere(new THREE.Sphere()).radius, 0.34);
    const direction = this.camera.position
      .clone()
      .sub(this.controls.target)
      .normalize();
    this.moveTo(
      center,
      center.clone().addScaledVector(direction, Math.max(2.1, radius * 3.15)),
      false,
      760,
      'focus',
    );
  }

  focusPoint(point: THREE.Vector3, radius = 0.7): void {
    const direction = this.camera.position
      .clone()
      .sub(this.controls.target)
      .normalize();
    this.moveTo(
      point,
      point.clone().addScaledVector(direction, Math.max(2.1, radius * 3.15)),
      false,
      760,
      'focus',
    );
  }

  transitionTo(
    target: THREE.Vector3,
    position: THREE.Vector3,
    duration: number,
    token: string,
    immediate = false,
  ): void {
    this.waypointQueue = [];
    this.queueToken = '';
    this.moveTo(target, position, immediate, duration, token);
  }

  playPath(waypoints: readonly CameraWaypoint[], token: string): void {
    if (waypoints.length === 0) return;
    this.cancelAutomation();
    this.queueToken = token;
    this.waypointQueue = waypoints.map((waypoint) => ({
      ...waypoint,
      position: waypoint.position.clone(),
      target: waypoint.target.clone(),
    }));
    this.startNextWaypoint();
  }

  follow(delta: THREE.Vector3): void {
    if (delta.lengthSq() === 0) return;
    this.camera.position.add(delta);
    this.controls.target.add(delta);
    if (this.transition) {
      this.transition.fromPosition.add(delta);
      this.transition.toPosition.add(delta);
      this.transition.fromTarget.add(delta);
      this.transition.toTarget.add(delta);
    }
  }

  update(time = performance.now()): void {
    if (!this.transition) return;
    const progress = THREE.MathUtils.clamp(
      (time - this.transition.startedAt) / this.transition.duration,
      0,
      1,
    );
    const eased = progress * progress * (3 - 2 * progress);
    this.camera.position.lerpVectors(
      this.transition.fromPosition,
      this.transition.toPosition,
      eased,
    );
    this.controls.target.lerpVectors(
      this.transition.fromTarget,
      this.transition.toTarget,
      eased,
    );
    if (progress >= 1) {
      const token = this.transition.token;
      this.transition = null;
      if (this.waypointQueue.length > 0) this.startNextWaypoint(time);
      else {
        const completeToken = this.queueToken || token;
        this.queueToken = '';
        this.onTransitionComplete?.(completeToken);
      }
    }
  }

  cancelAutomation(): void {
    this.transition = null;
    this.waypointQueue = [];
    this.queueToken = '';
  }

  setMinimumDistance(distance: number): void {
    this.controls.minDistance = Math.max(0.04, distance);
  }

  dispose(): void {
    this.controls.removeEventListener('start', this.cancelTransition);
    this.cancelAutomation();
  }

  private moveTo(
    target: THREE.Vector3,
    position: THREE.Vector3,
    immediate = false,
    duration = 760,
    token = 'camera',
  ): void {
    if (immediate) {
      this.cancelAutomation();
      this.controls.target.copy(target);
      this.camera.position.copy(position);
      this.controls.update();
      this.onTransitionComplete?.(token);
      return;
    }
    this.transition = {
      startedAt: performance.now(),
      duration: Math.max(120, duration),
      fromPosition: this.camera.position.clone(),
      fromTarget: this.controls.target.clone(),
      toPosition: position,
      toTarget: target,
      token,
    };
  }

  private startNextWaypoint(time = performance.now()): void {
    const waypoint = this.waypointQueue.shift();
    if (!waypoint) return;
    this.transition = {
      startedAt: time,
      duration: Math.max(120, waypoint.duration),
      fromPosition: this.camera.position.clone(),
      fromTarget: this.controls.target.clone(),
      toPosition: waypoint.position,
      toTarget: waypoint.target,
      token: this.queueToken,
    };
  }

  private readonly cancelTransition = (): void => {
    this.cancelAutomation();
  };
}

function visibleBounds(root: THREE.Object3D): THREE.Box3 {
  const result = new THREE.Box3();
  const geometryBox = new THREE.Box3();
  root.updateWorldMatrix(true, true);

  const visit = (object: THREE.Object3D, parentVisible: boolean): void => {
    const visible = parentVisible && object.visible;
    if (!visible || object.userData.ignoreCameraBounds === true) return;
    if (
      object instanceof THREE.Mesh ||
      object instanceof THREE.Line ||
      object instanceof THREE.LineSegments ||
      object instanceof THREE.Points
    ) {
      const geometry = object.geometry;
      if (object instanceof THREE.InstancedMesh) {
        if (object.boundingBox === null) object.computeBoundingBox();
        if (object.boundingBox) {
          geometryBox.copy(object.boundingBox).applyMatrix4(object.matrixWorld);
          result.union(geometryBox);
        }
      } else {
        if (geometry.boundingBox === null) geometry.computeBoundingBox();
        if (geometry.boundingBox) {
          geometryBox.copy(geometry.boundingBox).applyMatrix4(object.matrixWorld);
          result.union(geometryBox);
        }
      }
    }
    for (const child of object.children) visit(child, visible);
  };

  visit(root, true);
  return result;
}

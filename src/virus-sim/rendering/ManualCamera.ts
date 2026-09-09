import * as THREE from 'three';

export interface ManualCameraPose {
  readonly target: THREE.Vector3;
  readonly azimuth: number;
  readonly polar: number;
  readonly distance: number;
}

export class ManualCamera {
  readonly perspective = new THREE.PerspectiveCamera(42, 1, 0.04, 200);
  private target = new THREE.Vector3();
  private azimuth = 0.7;
  private polar = 1.08;
  private distance = 10;
  private width = 1;
  private height = 1;

  constructor() {
    this.syncCameras();
  }

  setViewport(width: number, height: number): void {
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);
    this.perspective.aspect = this.width / this.height;
    this.perspective.updateProjectionMatrix();
  }

  getPose(): ManualCameraPose {
    return {
      target: this.target.clone(),
      azimuth: this.azimuth,
      polar: this.polar,
      distance: this.distance,
    };
  }

  setPose(pose: ManualCameraPose): void {
    this.target.copy(pose.target);
    this.azimuth = pose.azimuth;
    this.polar = clamp(pose.polar, 0.08, Math.PI - 0.08);
    this.distance = clamp(pose.distance, 0.08, 120);
    this.syncCameras();
  }

  orbit(deltaX: number, deltaY: number): void {
    this.azimuth -= deltaX * 0.006;
    this.polar = clamp(this.polar - deltaY * 0.006, 0.08, Math.PI - 0.08);
    this.syncCameras();
  }

  pan(deltaX: number, deltaY: number): void {
    const camera = this.perspective;
    const worldPerPixel =
      (2 * this.distance * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5))) /
      this.height;
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
    this.target.addScaledVector(right, -deltaX * worldPerPixel);
    this.target.addScaledVector(up, deltaY * worldPerPixel);
    this.syncCameras();
  }

  dolly(delta: number): void {
    this.distance = clamp(this.distance * Math.exp(delta * 0.0015), 0.08, 120);
    this.syncCameras();
  }

  frameObject(object: THREE.Object3D): void {
    const bounds = visibleBounds(object);
    if (bounds.isEmpty()) return;
    const sphere = bounds.getBoundingSphere(new THREE.Sphere());
    const verticalHalfFov = THREE.MathUtils.degToRad(this.perspective.fov * 0.5);
    const horizontalHalfFov = Math.atan(
      Math.tan(verticalHalfFov) * this.perspective.aspect,
    );
    const limitingHalfFov = Math.max(
      THREE.MathUtils.degToRad(5),
      Math.min(verticalHalfFov, horizontalHalfFov),
    );
    const fill = this.perspective.aspect < 0.72 ? 0.72 : 0.78;
    this.target.copy(sphere.center);
    this.distance = Math.max(
      1.2,
      sphere.radius / (Math.sin(limitingHalfFov) * fill),
    );
    this.syncCameras();
  }

  private syncCameras(): void {
    const sinPolar = Math.sin(this.polar);
    const direction = new THREE.Vector3(
      sinPolar * Math.sin(this.azimuth),
      Math.cos(this.polar),
      sinPolar * Math.cos(this.azimuth),
    );
    const camera = this.perspective;
    camera.position.copy(this.target).addScaledVector(direction, this.distance);
    camera.up.set(0, 1, 0);
    camera.lookAt(this.target);
    camera.updateMatrixWorld(true);
  }
}

function visibleBounds(root: THREE.Object3D): THREE.Box3 {
  const bounds = new THREE.Box3();
  const objectBounds = new THREE.Box3();
  root.updateWorldMatrix(true, true);
  root.traverseVisible((object) => {
    if (object.userData.ignoreCameraBounds === true) return;
    if (!(
      object instanceof THREE.Mesh ||
      object instanceof THREE.Line ||
      object instanceof THREE.Points
    ))
      return;
    if (object instanceof THREE.InstancedMesh) {
      if (object.boundingBox === null) object.computeBoundingBox();
      if (object.boundingBox)
        bounds.union(
          objectBounds.copy(object.boundingBox).applyMatrix4(object.matrixWorld),
        );
      return;
    }
    if (object.geometry.boundingBox === null) object.geometry.computeBoundingBox();
    if (object.geometry.boundingBox)
      bounds.union(
        objectBounds.copy(object.geometry.boundingBox).applyMatrix4(object.matrixWorld),
      );
  });
  return bounds;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

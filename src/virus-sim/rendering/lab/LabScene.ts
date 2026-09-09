import * as THREE from 'three';
import {
  createChamberDescriptor,
  type AxisAlignedBox,
} from '../../lab/chambers/descriptors';
import type { LabSnapshot } from '../../lab/types';
import { ManualCamera } from '../ManualCamera';
import type { RenderQuality } from '../quality/quality';
import { LabFlowMarkers } from './LabFlowMarkers';
import { LabSpecimenView } from './LabSpecimenView';

export class LabScene {
  readonly scene = new THREE.Scene();
  readonly camera = new ManualCamera();
  private readonly specimenRoot = new THREE.Group();
  private readonly chamberRoot = new THREE.Group();
  private readonly trajectoryRoot = new THREE.Group();
  private readonly views = new Map<string, LabSpecimenView>();
  private readonly trajectories = new Map<string, THREE.Line>();
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();
  private readonly flowMarkers: LabFlowMarkers;
  private chamberSignature = '';
  private snapshot: LabSnapshot | null = null;
  private quality: RenderQuality;
  private initialized = false;

  constructor(quality: RenderQuality) {
    this.quality = quality;
    this.scene.background = new THREE.Color(0x04111c);
    this.scene.add(this.chamberRoot, this.trajectoryRoot, this.specimenRoot);
    addLabLights(this.scene);
    this.flowMarkers = new LabFlowMarkers(this.scene, quality);
  }

  show(snapshot: LabSnapshot): void {
    this.snapshot = snapshot;
    this.ensureChamber(snapshot);
    this.ensureSpecimens(snapshot);
    for (const body of snapshot.bodies) {
      this.views
        .get(body.instanceId)
        ?.update(body, body.instanceId === snapshot.selectedInstanceId);
    }
    this.updateTrajectories(snapshot);
    this.flowMarkers.update(snapshot);
    if (!this.initialized && snapshot.bodies.length > 0) {
      this.frameAll();
      this.initialized = true;
    }
  }

  render(renderer: THREE.WebGLRenderer, width: number, height: number): void {
    this.camera.setViewport(width, height);
    renderer.setRenderTarget(null);
    renderer.setScissorTest(false);
    renderer.setViewport(0, 0, width, height);
    renderer.setClearColor(0x04111c, 1);
    renderer.clear(true, true, true);
    renderer.render(this.scene, this.camera.perspective);
  }

  setQuality(quality: RenderQuality): void {
    if (quality === this.quality) return;
    this.quality = quality;
    this.flowMarkers.setQuality(quality);
    for (const view of this.views.values()) view.dispose();
    this.views.clear();
    if (this.snapshot) this.ensureSpecimens(this.snapshot);
  }

  orbit(deltaX: number, deltaY: number): void {
    this.camera.orbit(deltaX, deltaY);
  }

  pan(deltaX: number, deltaY: number): void {
    this.camera.pan(deltaX, deltaY);
  }

  dolly(delta: number): void {
    this.camera.dolly(delta);
  }

  frameAll(): void {
    this.camera.frameObject(this.chamberRoot);
  }

  pick(clientX: number, clientY: number, rect: DOMRect): string | null {
    if (!this.snapshot) return null;
    this.pointer.set(
      ((clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1,
      -((clientY - rect.top) / Math.max(1, rect.height)) * 2 + 1,
    );
    this.raycaster.setFromCamera(this.pointer, this.camera.perspective);
    const objects = [...this.views.values()].flatMap((view) => view.getSelectables());
    const hit = this.raycaster.intersectObjects(objects, false)[0];
    return (hit?.object.userData.labInstanceId as string | undefined) ?? null;
  }

  dispose(): void {
    for (const view of this.views.values()) view.dispose();
    this.views.clear();
    for (const line of this.trajectories.values()) {
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
    }
    this.trajectories.clear();
    this.clearChamber();
    this.flowMarkers.dispose();
  }

  private ensureSpecimens(snapshot: LabSnapshot): void {
    const activeIds = new Set(snapshot.bodies.map((body) => body.instanceId));
    for (const [id, view] of this.views) {
      if (activeIds.has(id)) continue;
      view.dispose();
      this.views.delete(id);
    }
    for (const body of snapshot.bodies) {
      const existing = this.views.get(body.instanceId);
      if (existing && existing.virusId === body.virusId) continue;
      existing?.dispose();
      const view = new LabSpecimenView(
        body.instanceId,
        body.virusId,
        body.physicsProfileId,
        body.scale,
        this.quality,
      );
      this.views.set(body.instanceId, view);
      this.specimenRoot.add(view.root);
    }
  }

  private ensureChamber(snapshot: LabSnapshot): void {
    const environment = snapshot.config.environment;
    const signature = `${environment.chamber}:${environment.gapWidth.toFixed(3)}:${environment.flowDirection}`;
    if (signature === this.chamberSignature) return;
    this.chamberSignature = signature;
    this.clearChamber();
    const descriptor = createChamberDescriptor(environment);
    const bounds = descriptor.bounds;
    const size = new THREE.Vector3(
      bounds.max[0] - bounds.min[0],
      bounds.max[1] - bounds.min[1],
      bounds.max[2] - bounds.min[2],
    );
    const chamberBox = new THREE.BoxGeometry(size.x, size.y, size.z);
    const chamberEdges = new THREE.EdgesGeometry(chamberBox);
    chamberBox.dispose();
    const outline = new THREE.LineSegments(
      chamberEdges,
      new THREE.LineBasicMaterial({
        color: 0x49748c,
        transparent: true,
        opacity: 0.58,
      }),
    );
    outline.userData.chamberResource = true;
    this.chamberRoot.add(outline);
    for (const obstacle of descriptor.obstacles) this.addObstacle(obstacle);
    if (descriptor.exitPlaneX !== null) {
      const exit = new THREE.Mesh(
        new THREE.PlaneGeometry(size.z, size.y),
        new THREE.MeshBasicMaterial({
          color: 0x63eee0,
          transparent: true,
          opacity: 0.08,
          side: THREE.DoubleSide,
          depthWrite: false,
        }),
      );
      exit.rotation.y = Math.PI / 2;
      exit.position.x = descriptor.exitPlaneX;
      exit.userData.chamberResource = true;
      this.chamberRoot.add(exit);
    }
    const floor = new THREE.GridHelper(size.x, 16, 0x315369, 0x183345);
    floor.rotation.z = Math.PI / 2;
    floor.position.y = bounds.min[1];
    floor.userData.chamberResource = true;
    this.chamberRoot.add(floor);
  }

  private addObstacle(box: AxisAlignedBox): void {
    const size = new THREE.Vector3(
      box.max[0] - box.min[0],
      box.max[1] - box.min[1],
      box.max[2] - box.min[2],
    );
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(size.x, size.y, size.z),
      new THREE.MeshPhysicalMaterial({
        color: 0x2c5c72,
        transparent: true,
        opacity: 0.42,
        roughness: 0.38,
        transmission: 0.18,
        depthWrite: false,
      }),
    );
    mesh.position.set(
      (box.min[0] + box.max[0]) / 2,
      (box.min[1] + box.max[1]) / 2,
      (box.min[2] + box.max[2]) / 2,
    );
    mesh.userData.chamberResource = true;
    this.chamberRoot.add(mesh);
  }

  private clearChamber(): void {
    for (const child of [...this.chamberRoot.children]) {
      child.removeFromParent();
      if (child instanceof THREE.LineSegments || child instanceof THREE.Mesh) {
        child.geometry.dispose();
        const materials = Array.isArray(child.material)
          ? child.material
          : [child.material];
        for (const material of materials) material.dispose();
      }
    }
  }

  private updateTrajectories(snapshot: LabSnapshot): void {
    const activeIds = new Set(
      snapshot.trajectories.map((trajectory) => trajectory.instanceId),
    );
    for (const [id, line] of this.trajectories) {
      if (activeIds.has(id)) continue;
      line.removeFromParent();
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
      this.trajectories.delete(id);
    }
    const visible = new Set(
      snapshot.trajectories
        .filter(
          (trajectory) =>
            snapshot.showAllTrajectories ||
            trajectory.instanceId === snapshot.selectedInstanceId,
        )
        .map((trajectory) => trajectory.instanceId),
    );
    for (const [id, line] of this.trajectories) line.visible = visible.has(id);
    for (const trajectory of snapshot.trajectories) {
      if (!visible.has(trajectory.instanceId)) continue;
      let line = this.trajectories.get(trajectory.instanceId);
      if (!line) {
        line = new THREE.Line(
          new THREE.BufferGeometry(),
          new THREE.LineBasicMaterial({
            color: 0xffd36e,
            transparent: true,
            opacity: 0.72,
          }),
        );
        line.userData.ignoreCameraBounds = true;
        this.trajectories.set(trajectory.instanceId, line);
        this.trajectoryRoot.add(line);
      }
      const lastPoint = trajectory.points.at(-1);
      const trajectoryKey = lastPoint
        ? `${trajectory.points.length}:${lastPoint.join(',')}`
        : '0';
      if (line.userData.trajectoryKey === trajectoryKey) continue;
      const values = new Float32Array(trajectory.points.length * 3);
      trajectory.points.forEach((point, index) => values.set(point, index * 3));
      line.geometry.setAttribute('position', new THREE.BufferAttribute(values, 3));
      line.geometry.computeBoundingSphere();
      line.userData.trajectoryKey = trajectoryKey;
    }
  }
}

function addLabLights(scene: THREE.Scene): void {
  scene.add(new THREE.HemisphereLight(0xa6d8e8, 0x02070d, 1.65));
  const key = new THREE.DirectionalLight(0xd8ffff, 3.2);
  key.position.set(4, 8, 7);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x7c6dff, 1.5);
  rim.position.set(-6, 2, -4);
  scene.add(rim);
}

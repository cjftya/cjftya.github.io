import * as THREE from 'three';
import type { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OBSERVATION_PARTS } from '../model/observationPresets';
import {
  evaluatePhageDelivery,
  evaluateStructureTour,
} from '../observation/demoTimeline';
import type {
  InspectionView,
  ObservationPartId,
  ObservationPresetId,
  ObservationSnapshot,
} from '../observation/types';
import { calculateExplodedPosition } from '../observation/transforms';
import type { CameraRig } from './CameraRig';
import { createObservationModel } from './models/createObservationModel';
import type { ObservationModel } from './models/types';

export interface ObservationPick {
  readonly partId: ObservationPartId;
  readonly title: string;
  readonly description: string;
}

export class ObservationView {
  private readonly model: ObservationModel;
  private readonly clipPlane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0);
  private readonly activeClipPlanes = [this.clipPlane];
  private readonly inactiveClipPlanes: THREE.Plane[] = [];
  private readonly marker = new THREE.Mesh(
    new THREE.SphereGeometry(0.15, 12, 8),
    new THREE.MeshBasicMaterial({
      color: 0xffc66d,
      transparent: true,
      opacity: 0.86,
      wireframe: true,
      depthTest: false,
    }),
  );
  private currentView: InspectionView = 'surface';
  private currentExplosion = -1;
  private sectionEnabled = false;
  private selectedObject: THREE.Object3D | null = null;
  private lastRootPosition = new THREE.Vector3();
  private lastTourFocus: ObservationPartId | null = null;
  private lastSnapshot: ObservationSnapshot | null = null;
  private deliveryWasActive = false;

  constructor(
    private readonly host: THREE.Group,
    private readonly controls: OrbitControls,
    private readonly cameraRig: CameraRig,
    readonly presetId: ObservationPresetId,
    quality: 'high' | 'low',
  ) {
    this.model = createObservationModel(presetId, quality);
    this.marker.visible = false;
    this.marker.renderOrder = 20;
    this.marker.userData.ignoreCameraBounds = true;
    this.model.root.add(this.marker);
    this.host.add(this.model.root);
    this.model.root.updateMatrixWorld(true);
    this.lastRootPosition.copy(this.model.root.getWorldPosition(new THREE.Vector3()));
    this.cameraRig.frameObject(this.model.root, true);
  }

  update(snapshot: ObservationSnapshot, interpolation: number): void {
    const previousSnapshot = this.lastSnapshot;
    this.lastSnapshot = snapshot;
    const demoActive = snapshot.demo.kind !== 'none';
    this.model.root.position.set(
      THREE.MathUtils.lerp(
        snapshot.motion.previousPosition.x,
        snapshot.motion.position.x,
        interpolation,
      ),
      THREE.MathUtils.lerp(
        snapshot.motion.previousPosition.y,
        snapshot.motion.position.y,
        interpolation,
      ),
      THREE.MathUtils.lerp(
        snapshot.motion.previousPosition.z,
        snapshot.motion.position.z,
        interpolation,
      ),
    );
    const previous = snapshot.motion.previousQuaternion;
    const current = snapshot.motion.quaternion;
    this.model.root.quaternion
      .set(previous.x, previous.y, previous.z, previous.w)
      .slerp(
        new THREE.Quaternion(current.x, current.y, current.z, current.w),
        interpolation,
      )
      .normalize();

    this.model.root.updateMatrixWorld(true);
    const worldPosition = this.model.root.getWorldPosition(new THREE.Vector3());
    const delta = worldPosition.clone().sub(this.lastRootPosition);
    if (snapshot.followTarget && previousSnapshot?.followTarget && !demoActive) {
      this.cameraRig.follow(delta);
    }
    this.lastRootPosition.copy(worldPosition);

    let view = snapshot.view;
    let explosion = snapshot.explosion;
    let sectionOffset = snapshot.sectionOffset;
    let genomeVisible = snapshot.genomeVisible;
    if (snapshot.demo.kind === 'structure-tour') {
      const pose = evaluateStructureTour(snapshot.demo.progress);
      view = pose.view;
      explosion = pose.explosion;
      sectionOffset = pose.sectionOffset;
      genomeVisible = pose.genomeVisible;
      if (pose.focusPartId !== this.lastTourFocus) {
        this.lastTourFocus = pose.focusPartId;
        if (pose.focusPartId) this.selectPart(pose.focusPartId);
        else this.cameraRig.frameObject(this.model.root);
      }
    } else {
      this.lastTourFocus = null;
    }
    if (snapshot.demo.kind === 'phage-delivery') {
      view = 'surface';
      explosion = 0;
      genomeVisible = true;
    }

    this.applyView(view, genomeVisible, snapshot.layerVisibility);
    this.applyExplosion(view === 'exploded' ? explosion : 0);
    this.applySection(view === 'section', sectionOffset);
    const deliveryEnded = this.applyDelivery(
      snapshot,
      genomeVisible && snapshot.layerVisibility.genome,
    );
    if (deliveryEnded) {
      this.currentExplosion = -1;
      this.applyExplosion(view === 'exploded' ? explosion : 0);
    }
    if (this.marker.visible && this.selectedObject) {
      this.selectedObject.updateWorldMatrix(true, true);
      const center = new THREE.Box3()
        .setFromObject(this.selectedObject)
        .getCenter(new THREE.Vector3());
      this.marker.position.copy(this.model.root.worldToLocal(center));
    }
    this.cameraRig.update();
    this.controls.update();
  }

  pick(raycaster: THREE.Raycaster): ObservationPick | null {
    const hits = raycaster.intersectObjects([...this.model.selectables], true);
    for (const hit of hits) {
      const target = findObservationTarget(hit.object, this.model.root);
      if (!target) continue;
      if (this.currentView === 'section') {
        const localPoint = this.model.root.worldToLocal(hit.point.clone());
        const offset = this.lastSnapshot?.sectionOffset ?? 0;
        if (localPoint.z > offset + 0.02) continue;
      }
      const partId = target.userData.observationPartId as ObservationPartId;
      this.select(target, hit.point);
      return partCopy(partId);
    }
    this.clearSelection();
    return null;
  }

  selectPart(partId: ObservationPartId, focus = true): ObservationPick | null {
    const object = this.model.parts.get(partId)?.find((candidate) => candidate.visible);
    if (!object) return null;
    object.updateWorldMatrix(true, true);
    const point = new THREE.Box3().setFromObject(object).getCenter(new THREE.Vector3());
    this.select(object, point);
    if (focus) this.cameraRig.focusObject(object);
    return partCopy(partId);
  }

  focusSelection(): void {
    if (this.selectedObject) this.cameraRig.focusObject(this.selectedObject);
  }

  frameAll(immediate = false): void {
    this.cameraRig.frameObject(this.model.root, immediate);
  }

  getRenderMetrics(renderer: THREE.WebGLRenderer): {
    calls: number;
    triangles: number;
    geometries: number;
  } {
    return {
      calls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles,
      geometries: renderer.info.memory.geometries,
    };
  }

  dispose(): void {
    this.host.remove(this.model.root);
    disposeTree(this.model.root);
    this.selectedObject = null;
  }

  private applyView(
    view: InspectionView,
    genomeVisible: boolean,
    layerVisibility: ObservationSnapshot['layerVisibility'],
  ): void {
    this.currentView = view;
    const transparent = view === 'transparent' || view === 'exploded';
    for (const entry of this.model.surfaceMaterials) {
      const material = entry.material;
      if (!('opacity' in material)) continue;
      const nextTransparent = transparent || entry.opacity < 1;
      const nextDepthWrite = transparent ? false : entry.depthWrite;
      const programChanged =
        material.transparent !== nextTransparent ||
        material.depthWrite !== nextDepthWrite;
      material.transparent = nextTransparent;
      material.opacity = transparent ? Math.min(entry.opacity, 0.24) : entry.opacity;
      material.depthWrite = nextDepthWrite;
      if (programChanged) material.needsUpdate = true;
    }
    for (const [layer, objects] of this.model.layers) {
      const layerVisible = layerVisibility[layer] === true;
      for (const object of objects) object.visible = layerVisible;
    }
    for (const genome of this.model.genomeObjects) {
      genome.visible = genomeVisible && layerVisibility.genome;
    }
  }

  private applyExplosion(amount: number): void {
    const normalized = THREE.MathUtils.clamp(amount / 100, 0, 1);
    if (Math.abs(normalized - this.currentExplosion) < 1e-5) return;
    this.currentExplosion = normalized;
    for (const item of this.model.objectExplosions) {
      const position = calculateExplodedPosition(
        item.origin,
        item.direction,
        normalized,
        item.distance,
      );
      item.object.position.set(position.x, position.y, position.z);
    }
    const matrix = new THREE.Matrix4();
    for (const item of this.model.instanceExplosions) {
      item.origins.forEach((origin, index) => {
        const direction = item.directions[index] ?? new THREE.Vector3();
        const position = calculateExplodedPosition(
          origin,
          direction,
          normalized,
          item.distance,
        );
        matrix.compose(
          new THREE.Vector3(position.x, position.y, position.z),
          item.quaternions[index] ?? new THREE.Quaternion(),
          item.scales[index] ?? new THREE.Vector3(1, 1, 1),
        );
        item.mesh.setMatrixAt(index, matrix);
      });
      item.mesh.instanceMatrix.needsUpdate = true;
      item.mesh.computeBoundingBox();
      item.mesh.computeBoundingSphere();
    }
  }

  private applySection(enabled: boolean, offset: number): void {
    this.model.sectionGuide.visible = enabled;
    this.model.sectionGuide.position.z = offset;
    this.model.root.updateMatrixWorld(true);
    const localPlane = new THREE.Plane(new THREE.Vector3(0, 0, -1), offset);
    this.clipPlane.copy(localPlane).applyMatrix4(this.model.root.matrixWorld);
    if (this.sectionEnabled !== enabled) {
      this.sectionEnabled = enabled;
      const unique = new Set(this.model.clippingMaterials);
      for (const material of unique) {
        material.clippingPlanes = enabled
          ? this.activeClipPlanes
          : this.inactiveClipPlanes;
        material.clipIntersection = false;
        material.needsUpdate = true;
      }
    }
  }

  private applyDelivery(
    snapshot: ObservationSnapshot,
    genomeVisible: boolean,
  ): boolean {
    const rig = this.model.delivery;
    if (!rig) return false;
    const active = snapshot.demo.kind === 'phage-delivery';
    const deliveryEnded = this.deliveryWasActive && !active;
    this.deliveryWasActive = active;
    rig.surfacePatch.visible = active;
    rig.deliveryPath.visible = active;
    if (!active) {
      rig.body.position.copy(rig.bodyOrigin);
      rig.sheath.position.copy(rig.sheathOrigin);
      rig.sheath.scale.set(1, 1, 1);
      rig.innerTube.position.copy(rig.innerTubeOrigin);
      rig.headGenome.visible = genomeVisible;
      rig.deliveryPath.geometry.setDrawRange(0, 2);
      return deliveryEnded;
    }
    const pose = evaluatePhageDelivery(snapshot.demo.progress);
    rig.body.position
      .copy(rig.bodyOrigin)
      .add(new THREE.Vector3(0, pose.approach * 1.05, 0));
    rig.sheath.scale.set(1, THREE.MathUtils.lerp(1, 0.48, pose.sheathContraction), 1);
    rig.sheath.position
      .copy(rig.sheathOrigin)
      .add(new THREE.Vector3(0, -0.5 * pose.sheathContraction, 0));
    rig.innerTube.position
      .copy(rig.innerTubeOrigin)
      .add(new THREE.Vector3(0, -0.7 * pose.tubeExtension, 0));
    rig.headGenome.visible = pose.genomeTransfer < 0.97;
    rig.deliveryPath.geometry.setDrawRange(
      0,
      Math.max(2, Math.round(rig.deliveryPointCount * pose.genomeTransfer)),
    );
    return false;
  }

  private select(object: THREE.Object3D, worldPoint: THREE.Vector3): void {
    this.selectedObject = object;
    this.marker.position.copy(this.model.root.worldToLocal(worldPoint.clone()));
    this.marker.visible = true;
  }

  private clearSelection(): void {
    this.selectedObject = null;
    this.marker.visible = false;
  }
}

function findObservationTarget(
  object: THREE.Object3D,
  root: THREE.Object3D,
): THREE.Object3D | null {
  let candidate: THREE.Object3D | null = object;
  while (candidate && candidate !== root) {
    if (candidate.userData.observationPartId) return candidate;
    candidate = candidate.parent;
  }
  return null;
}

function partCopy(partId: ObservationPartId): ObservationPick {
  const part = OBSERVATION_PARTS[partId];
  return { partId, title: part.name, description: part.detail };
}

function disposeTree(root: THREE.Object3D): void {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  root.traverse((object) => {
    if (
      !(object instanceof THREE.Mesh) &&
      !(object instanceof THREE.Line) &&
      !(object instanceof THREE.LineSegments) &&
      !(object instanceof THREE.Points)
    ) {
      return;
    }
    if (!geometries.has(object.geometry)) {
      object.geometry.dispose();
      geometries.add(object.geometry);
    }
    const objectMaterials = Array.isArray(object.material)
      ? object.material
      : [object.material];
    for (const material of objectMaterials) {
      if (!materials.has(material)) {
        material.dispose();
        materials.add(material);
      }
    }
  });
}

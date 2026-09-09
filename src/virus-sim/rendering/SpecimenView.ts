import * as THREE from 'three';
import { getCatalogEntry } from '../catalog/registry';
import { OBSERVATION_PARTS } from '../model/observationPresets';
import type {
  ObservationDefinition,
  ObservationPartId,
  ObservationPresetId,
  ScannerAxis,
  SpecimenObservationState,
} from '../observation/types';
import { calculateExplodedPosition } from '../observation/transforms';
import { applyScientificMaterials } from './materials/scientificMaterials';
import { createObservationModel } from './models/createObservationModel';
import type { ObservationModel } from './models/types';
import { QUALITY_SETTINGS, type RenderQuality } from './quality/quality';

export interface SpecimenPick {
  readonly partId: ObservationPartId;
  readonly title: string;
  readonly description: string;
}

interface MaterialClipState {
  readonly material: THREE.Material;
  readonly clippingPlanes: THREE.Plane[] | null;
  readonly clipIntersection: boolean;
}

export interface ScannerSliceSetup {
  readonly center: THREE.Vector3;
  readonly direction: THREE.Vector3;
  readonly up: THREE.Vector3;
  readonly width: number;
  readonly height: number;
  readonly depth: number;
  readonly restore: () => void;
}

export class SpecimenView {
  readonly definition: ObservationDefinition;
  readonly root: THREE.Group;
  private readonly model: ObservationModel;
  private readonly mainClipPlane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0);
  private readonly activeMainClipPlanes = [this.mainClipPlane];
  private readonly marker = new THREE.Mesh(
    new THREE.SphereGeometry(0.15, 12, 8),
    new THREE.MeshBasicMaterial({
      color: 0xffc66d,
      transparent: true,
      opacity: 0.9,
      wireframe: true,
      depthTest: false,
    }),
  );
  private currentExplosion = -1;
  private selectedPartId: ObservationPartId | null = null;

  constructor(
    private readonly scene: THREE.Scene,
    readonly presetId: ObservationPresetId,
    quality: RenderQuality,
  ) {
    this.definition = getCatalogEntry(presetId);
    this.model = createObservationModel(
      presetId,
      QUALITY_SETTINGS[quality].modelQuality,
    );
    applyScientificMaterials(this.model, presetId, quality);
    this.root = this.model.root;
    this.marker.visible = false;
    this.marker.renderOrder = 30;
    this.marker.userData.ignoreCameraBounds = true;
    this.root.add(this.marker);
    this.scene.add(this.root);
  }

  update(state: SpecimenObservationState): void {
    this.applyView(state);
    this.applyExplosion(
      state.view === 'exploded' || state.transition.mode === 'peel'
        ? state.explosion
        : 0,
    );
    this.applySection(state.view === 'section', state.sectionOffset);
    this.applySelection(state.selectedPartId);
  }

  setScale(scale: number): void {
    const safe = Math.max(0.0001, scale);
    if (Math.abs(this.root.scale.x - safe) < 1e-6) return;
    this.root.scale.setScalar(safe);
    this.root.updateWorldMatrix(true, true);
  }

  pick(
    raycaster: THREE.Raycaster,
    sectionOffset = 0,
    section = false,
  ): SpecimenPick | null {
    const hits = raycaster.intersectObjects([...this.model.selectables], true);
    for (const hit of hits) {
      const target = findObservationTarget(hit.object, this.root);
      if (!target) continue;
      if (section) {
        const localPoint = this.root.worldToLocal(hit.point.clone());
        if (localPoint.z > sectionOffset + 0.02) continue;
      }
      return partCopy(target.userData.observationPartId as ObservationPartId);
    }
    return null;
  }

  getBounds(): THREE.Box3 {
    const bounds = visibleBounds(this.root);
    if (!bounds.isEmpty()) return bounds;
    return bounds.setFromCenterAndSize(
      this.root.getWorldPosition(new THREE.Vector3()),
      new THREE.Vector3(1, 1, 1),
    );
  }

  getRenderRoot(): THREE.Object3D {
    return this.root;
  }

  setAuxiliariesVisible(visible: boolean): void {
    this.marker.visible = visible && this.selectedPartId !== null;
    this.model.sectionGuide.visible =
      visible && this.model.sectionGuide.userData.enabled === true;
  }

  prepareScannerClipping(
    axis: ScannerAxis,
    normalizedPosition: number,
    normalizedThickness: number,
  ): ScannerSliceSetup {
    this.root.updateWorldMatrix(true, true);
    const bounds = visibleLocalBounds(this.root);
    const minimum = bounds.min[axis];
    const maximum = bounds.max[axis];
    const span = Math.max(0.001, maximum - minimum);
    const center = minimum + span * THREE.MathUtils.clamp(normalizedPosition, 0, 1);
    const half = Math.max(span * normalizedThickness * 0.5, span * 0.003);
    const normal = axisVector(axis);
    const planes = [
      new THREE.Plane(normal.clone(), -(center - half)),
      new THREE.Plane(normal.clone().negate(), center + half),
    ].map((plane) => plane.applyMatrix4(this.root.matrixWorld));
    const localCenter = bounds.getCenter(new THREE.Vector3());
    localCenter[axis] = center;
    const worldCenter = this.root.localToWorld(localCenter);
    const worldQuaternion = this.root.getWorldQuaternion(new THREE.Quaternion());
    const worldScale = this.root.getWorldScale(new THREE.Vector3());
    worldScale.set(
      Math.abs(worldScale.x),
      Math.abs(worldScale.y),
      Math.abs(worldScale.z),
    );
    const localSize = bounds.getSize(new THREE.Vector3());
    const scaledSize = localSize.multiply(worldScale);
    const direction = normal.clone().applyQuaternion(worldQuaternion).normalize();
    const up = (axis === 'y' ? new THREE.Vector3(0, 0, -1) : new THREE.Vector3(0, 1, 0))
      .applyQuaternion(worldQuaternion)
      .normalize();
    const dimensions = projectedDimensions(scaledSize, axis);
    const states: MaterialClipState[] = [];
    for (const material of new Set(this.model.clippingMaterials)) {
      states.push({
        material,
        clippingPlanes: material.clippingPlanes,
        clipIntersection: material.clipIntersection,
      });
      material.clippingPlanes = planes;
      material.clipIntersection = false;
      material.needsUpdate = true;
    }
    const guideVisible = this.model.sectionGuide.visible;
    const markerVisible = this.marker.visible;
    this.model.sectionGuide.visible = false;
    this.marker.visible = false;
    return {
      center: worldCenter,
      direction,
      up,
      width: dimensions.width,
      height: dimensions.height,
      depth: scaledSize[axis],
      restore: () => {
        for (const state of states) {
          state.material.clippingPlanes = state.clippingPlanes;
          state.material.clipIntersection = state.clipIntersection;
          state.material.needsUpdate = true;
        }
        this.model.sectionGuide.visible = guideVisible;
        this.marker.visible = markerVisible;
      },
    };
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
    this.scene.remove(this.root);
    disposeTree(this.root);
  }

  private applyView(state: SpecimenObservationState): void {
    const transparent = state.view === 'transparent' || state.view === 'exploded';
    const peel = state.transition.mode === 'peel';
    const peelProgress = smoothStep(state.transition.progress);
    for (const entry of this.model.surfaceMaterials) {
      const material = entry.material;
      if (!('opacity' in material)) continue;
      const nextTransparent = transparent || peel || entry.opacity < 1;
      const nextDepthWrite = transparent || peel ? false : entry.depthWrite;
      const programChanged =
        material.transparent !== nextTransparent ||
        material.depthWrite !== nextDepthWrite;
      material.transparent = nextTransparent;
      const baseOpacity = transparent ? Math.min(entry.opacity, 0.24) : entry.opacity;
      material.opacity = peel
        ? THREE.MathUtils.lerp(baseOpacity, Math.min(entry.opacity, 0.1), peelProgress)
        : baseOpacity;
      material.depthWrite = nextDepthWrite;
      if (programChanged) material.needsUpdate = true;
    }
    for (const [layer, objects] of this.model.layers) {
      const visible = state.layerVisibility[layer] === true;
      for (const object of objects) object.visible = visible;
    }
    for (const genome of this.model.genomeObjects) {
      genome.visible = state.genomeVisible && state.layerVisibility.genome;
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
        const position = calculateExplodedPosition(
          origin,
          item.directions[index] ?? new THREE.Vector3(),
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
    this.model.sectionGuide.userData.enabled = enabled;
    this.model.sectionGuide.visible = enabled;
    this.model.sectionGuide.position.z = offset;
    this.root.updateMatrixWorld(true);
    this.mainClipPlane
      .copy(new THREE.Plane(new THREE.Vector3(0, 0, -1), offset))
      .applyMatrix4(this.root.matrixWorld);
    for (const material of new Set(this.model.clippingMaterials)) {
      const next = enabled ? this.activeMainClipPlanes : null;
      if (material.clippingPlanes === next) continue;
      material.clippingPlanes = next;
      material.clipIntersection = false;
      material.needsUpdate = true;
    }
  }

  private applySelection(partId: ObservationPartId | null): void {
    if (partId === this.selectedPartId) {
      if (partId) this.updateMarker(partId);
      return;
    }
    this.selectedPartId = partId;
    this.marker.visible = Boolean(partId);
    if (partId) this.updateMarker(partId);
  }

  private updateMarker(partId: ObservationPartId): void {
    const object = this.model.parts.get(partId)?.find((candidate) => candidate.visible);
    if (!object) {
      this.marker.visible = false;
      return;
    }
    object.updateWorldMatrix(true, true);
    const center = new THREE.Box3()
      .setFromObject(object)
      .getCenter(new THREE.Vector3());
    this.marker.position.copy(this.root.worldToLocal(center));
    this.marker.visible = true;
  }
}

function axisVector(axis: ScannerAxis): THREE.Vector3 {
  return axis === 'x'
    ? new THREE.Vector3(1, 0, 0)
    : axis === 'y'
      ? new THREE.Vector3(0, 1, 0)
      : new THREE.Vector3(0, 0, 1);
}

function projectedDimensions(
  size: THREE.Vector3,
  axis: ScannerAxis,
): { readonly width: number; readonly height: number } {
  if (axis === 'x') return { width: size.z, height: size.y };
  if (axis === 'y') return { width: size.x, height: size.z };
  return { width: size.x, height: size.y };
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

function partCopy(partId: ObservationPartId): SpecimenPick {
  const part = OBSERVATION_PARTS[partId];
  return { partId, title: part.name, description: part.detail };
}

function smoothStep(value: number): number {
  const safe = THREE.MathUtils.clamp(value, 0, 1);
  return safe * safe * (3 - 2 * safe);
}

function disposeTree(root: THREE.Object3D): void {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  root.traverse((object) => {
    if (!(
      object instanceof THREE.Mesh ||
      object instanceof THREE.Line ||
      object instanceof THREE.LineSegments ||
      object instanceof THREE.Points
    ))
      return;
    if (!geometries.has(object.geometry)) {
      object.geometry.dispose();
      geometries.add(object.geometry);
    }
    const objectMaterials = Array.isArray(object.material)
      ? object.material
      : [object.material];
    for (const material of objectMaterials) {
      if (materials.has(material)) continue;
      material.dispose();
      materials.add(material);
    }
  });
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
      object instanceof THREE.LineSegments ||
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

function visibleLocalBounds(root: THREE.Object3D): THREE.Box3 {
  const bounds = new THREE.Box3();
  const objectBounds = new THREE.Box3();
  const inverseRoot = root.matrixWorld.clone().invert();
  const relativeMatrix = new THREE.Matrix4();
  root.traverseVisible((object) => {
    if (object.userData.ignoreCameraBounds === true) return;
    if (!(
      object instanceof THREE.Mesh ||
      object instanceof THREE.Line ||
      object instanceof THREE.LineSegments ||
      object instanceof THREE.Points
    ))
      return;
    relativeMatrix.multiplyMatrices(inverseRoot, object.matrixWorld);
    if (object instanceof THREE.InstancedMesh) {
      if (object.boundingBox === null) object.computeBoundingBox();
      if (object.boundingBox)
        bounds.union(
          objectBounds.copy(object.boundingBox).applyMatrix4(relativeMatrix),
        );
      return;
    }
    if (object.geometry.boundingBox === null) object.geometry.computeBoundingBox();
    if (object.geometry.boundingBox)
      bounds.union(
        objectBounds.copy(object.geometry.boundingBox).applyMatrix4(relativeMatrix),
      );
  });
  if (!bounds.isEmpty()) return bounds;
  return bounds.setFromCenterAndSize(new THREE.Vector3(), new THREE.Vector3(1, 1, 1));
}

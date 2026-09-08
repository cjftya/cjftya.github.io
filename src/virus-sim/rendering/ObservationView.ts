import * as THREE from 'three';
import type { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { getExperienceProfile } from '../catalog/experienceProfiles';
import { OBSERVATION_PARTS, getObservationPreset } from '../model/observationPresets';
import { evaluateSpeciesTour } from '../observation/tours';
import type {
  InspectionView,
  ObservationDefinition,
  ObservationPartId,
  ObservationPresetId,
  ObservationSnapshot,
} from '../observation/types';
import { calculateExplodedPosition } from '../observation/transforms';
import type { CameraRig } from './CameraRig';
import { applyScientificMaterials } from './materials/scientificMaterials';
import { createObservationModel } from './models/createObservationModel';
import type { ObservationModel } from './models/types';
import { QUALITY_SETTINGS, type ExperienceQuality } from './quality/quality';
import { MotionTrace } from '../time/MotionTrace';

export interface ObservationPick {
  readonly partId: ObservationPartId;
  readonly title: string;
  readonly description: string;
}

export class ObservationView {
  private readonly model: ObservationModel;
  private readonly definition: ObservationDefinition;
  private readonly profile;
  private readonly motionTrace: MotionTrace;
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
  private lastExperienceSequence = -1;
  private lastGuidedSequence = -1;

  constructor(
    private readonly host: THREE.Group,
    private readonly controls: OrbitControls,
    private readonly cameraRig: CameraRig,
    readonly presetId: ObservationPresetId,
    quality: ExperienceQuality,
  ) {
    this.definition = getObservationPreset(presetId);
    this.profile = getExperienceProfile(presetId);
    this.model = createObservationModel(
      presetId,
      QUALITY_SETTINGS[quality].modelQuality,
    );
    applyScientificMaterials(this.model, presetId, quality);
    this.motionTrace = new MotionTrace(this.host);
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
    this.motionTrace.record(worldPosition);
    this.motionTrace.setVisible(
      snapshot.experience.motionTraceVisible,
      snapshot.experience.temporalEchoVisible,
    );

    let view = snapshot.view;
    let explosion = snapshot.explosion;
    let sectionOffset = snapshot.sectionOffset;
    let genomeVisible = snapshot.genomeVisible;
    if (snapshot.demo.kind === 'structure-tour') {
      const pose = evaluateSpeciesTour(this.definition, snapshot.demo.progress);
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
    this.applyView(view, genomeVisible, snapshot.layerVisibility);
    this.applyPeel(snapshot);
    this.applyExplosion(
      view === 'exploded' || snapshot.experience.reveal.mode === 'peel' ? explosion : 0,
    );
    this.applySection(view === 'section', sectionOffset);
    this.applyLocalMotion(snapshot, view);
    this.applyExperience(snapshot);
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
    this.motionTrace.dispose();
    disposeTree(this.model.root);
    this.selectedObject = null;
  }

  private applyPeel(snapshot: ObservationSnapshot): void {
    if (snapshot.experience.reveal.mode !== 'peel') return;
    const progress = smoothStep(snapshot.experience.reveal.progress);
    for (const entry of this.model.surfaceMaterials) {
      if (!('opacity' in entry.material)) continue;
      entry.material.transparent = true;
      entry.material.depthWrite = false;
      entry.material.opacity = THREE.MathUtils.lerp(
        entry.opacity,
        Math.min(entry.opacity, 0.12),
        progress,
      );
    }
  }

  private applyExperience(snapshot: ObservationSnapshot): void {
    const experience = snapshot.experience;
    const sequenceChanged =
      experience.transitionSequence !== this.lastExperienceSequence;
    const guidedChanged = experience.guidedSequence !== this.lastGuidedSequence;
    if (!sequenceChanged && !guidedChanged) return;
    this.lastExperienceSequence = experience.transitionSequence;
    this.lastGuidedSequence = experience.guidedSequence;
    this.model.root.updateWorldMatrix(true, true);
    const center = this.model.root.getWorldPosition(new THREE.Vector3());
    const radius = Math.max(0.8, this.definition.sectionRadius);
    const reduced = experience.reducedMotion;
    const duration = (normal: number): number => (reduced ? 160 : normal);
    const surfaceStop =
      this.profile.surfaceStops[
        experience.transitionSequence % this.profile.surfaceStops.length
      ] ?? this.profile.surfaceStops[0]!;
    const surfaceDirection = new THREE.Vector3(
      surfaceStop.direction.x,
      surfaceStop.direction.y,
      surfaceStop.direction.z,
    )
      .normalize()
      .transformDirection(this.model.root.matrixWorld);
    const surfacePoint = center
      .clone()
      .addScaledVector(surfaceDirection, radius * 0.82);

    if (guidedChanged && this.profile.interiorPath) {
      this.cameraRig.setMinimumDistance(0.04);
      this.cameraRig.playPath(
        this.profile.interiorPath.map((point) => ({
          position: center
            .clone()
            .add(
              new THREE.Vector3(point.position.x, point.position.y, point.position.z)
                .multiplyScalar(radius)
                .applyQuaternion(this.model.root.quaternion),
            ),
          target: center
            .clone()
            .add(
              new THREE.Vector3(point.target.x, point.target.y, point.target.z)
                .multiplyScalar(radius)
                .applyQuaternion(this.model.root.quaternion),
            ),
          duration: duration(4_800),
        })),
        'guided-interior',
      );
      return;
    }

    switch (experience.stage) {
      case 'observe':
        this.cameraRig.setMinimumDistance(0.35);
        this.cameraRig.frameObject(this.model.root, false, duration(1_150), 'observe');
        break;
      case 'follow': {
        this.cameraRig.setMinimumDistance(0.25);
        const direction = this.controls.object.position
          .clone()
          .sub(this.controls.target)
          .normalize();
        this.cameraRig.transitionTo(
          center,
          center
            .clone()
            .addScaledVector(direction, this.profile.preferredCameraDistance * 1.08),
          duration(1_180),
          'follow',
        );
        break;
      }
      case 'approach':
        this.cameraRig.setMinimumDistance(0.12);
        this.cameraRig.transitionTo(
          center.clone().lerp(surfacePoint, 0.42),
          surfacePoint
            .clone()
            .addScaledVector(surfaceDirection, Math.max(0.52, radius * 0.62)),
          duration(1_320),
          'approach',
        );
        break;
      case 'surface':
        this.cameraRig.setMinimumDistance(0.06);
        this.cameraRig.transitionTo(
          surfacePoint,
          surfacePoint
            .clone()
            .addScaledVector(surfaceDirection, Math.max(0.16, radius * 0.2)),
          duration(1_240),
          'surface',
        );
        break;
      case 'interior':
        this.cameraRig.setMinimumDistance(0.04);
        this.cameraRig.transitionTo(
          center.clone().addScaledVector(surfaceDirection, -radius * 0.08),
          center.clone().addScaledVector(surfaceDirection, radius * 0.18),
          duration(1_520),
          'interior',
        );
        break;
      case 'structure':
        this.cameraRig.setMinimumDistance(0.2);
        this.cameraRig.frameObject(
          this.model.root,
          false,
          duration(1_050),
          'structure',
        );
        break;
      case 'documentary': {
        this.cameraRig.setMinimumDistance(0.18);
        const preset =
          this.profile.documentaryAngles[
            experience.transitionSequence % this.profile.documentaryAngles.length
          ] ?? this.profile.documentaryAngles[0]!;
        const position = center
          .clone()
          .add(
            new THREE.Vector3(preset.position.x, preset.position.y, preset.position.z)
              .multiplyScalar(radius * 1.45)
              .applyQuaternion(this.model.root.quaternion),
          );
        const target = center
          .clone()
          .add(
            new THREE.Vector3(preset.target.x, preset.target.y, preset.target.z)
              .multiplyScalar(radius)
              .applyQuaternion(this.model.root.quaternion),
          );
        this.cameraRig.transitionTo(target, position, duration(2_800), 'documentary');
        break;
      }
      case 'return':
        this.cameraRig.setMinimumDistance(0.35);
        this.cameraRig.frameObject(this.model.root, false, duration(1_650), 'return');
        break;
    }
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

  private applyLocalMotion(snapshot: ObservationSnapshot, view: InspectionView): void {
    const enabled =
      this.definition.localMotion === 'flexible-filament' &&
      (view === 'surface' || view === 'transparent') &&
      snapshot.demo.kind === 'none' &&
      this.selectedObject === null;
    const time = snapshot.motion.translationPhase;
    this.model.flexibleSegments.forEach((segment, index) => {
      segment.object.rotation.copy(segment.baseRotation);
      if (!enabled) return;
      const centered = index - (this.model.flexibleSegments.length - 1) * 0.5;
      segment.object.rotation.z +=
        Math.sin(time * 0.9 + index * 0.62) * 0.018 * centered;
      segment.object.rotation.x +=
        Math.cos(time * 0.72 + index * 0.44) * 0.012 * centered;
    });
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

function smoothStep(value: number): number {
  const safe = THREE.MathUtils.clamp(value, 0, 1);
  return safe * safe * (3 - 2 * safe);
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

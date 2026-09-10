import type * as THREE from 'three';
import type { ObservationLayerId, ObservationPartId } from '../../observation/types';

export interface ObservationSurfaceMaterial {
  readonly material: THREE.Material;
  readonly opacity: number;
  readonly depthWrite: boolean;
}

export interface ObjectExplosion {
  readonly object: THREE.Object3D;
  readonly origin: THREE.Vector3;
  readonly direction: THREE.Vector3;
  readonly distance: number;
}

export interface InstanceExplosion {
  readonly mesh: THREE.InstancedMesh;
  readonly origins: readonly THREE.Vector3[];
  readonly directions: readonly THREE.Vector3[];
  readonly quaternions: readonly THREE.Quaternion[];
  readonly scales: readonly THREE.Vector3[];
  readonly distance: number;
}

export interface ObservationModel {
  readonly root: THREE.Group;
  readonly selectables: readonly THREE.Object3D[];
  readonly parts: ReadonlyMap<ObservationPartId, readonly THREE.Object3D[]>;
  readonly layers: ReadonlyMap<ObservationLayerId, readonly THREE.Object3D[]>;
  readonly surfaceMaterials: readonly ObservationSurfaceMaterial[];
  readonly clippingMaterials: readonly THREE.Material[];
  readonly objectExplosions: readonly ObjectExplosion[];
  readonly instanceExplosions: readonly InstanceExplosion[];
  readonly genomeObjects: readonly THREE.Object3D[];
  readonly sectionGuide: THREE.Object3D;
}

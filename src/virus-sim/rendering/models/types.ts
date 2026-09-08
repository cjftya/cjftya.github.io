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

export interface PhageDeliveryRig {
  readonly body: THREE.Group;
  readonly bodyOrigin: THREE.Vector3;
  readonly sheath: THREE.Group;
  readonly sheathOrigin: THREE.Vector3;
  readonly innerTube: THREE.Object3D;
  readonly innerTubeOrigin: THREE.Vector3;
  readonly headGenome: THREE.Object3D;
  readonly deliveryPath: THREE.Line;
  readonly deliveryPointCount: number;
  readonly surfacePatch: THREE.Group;
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
  readonly delivery?: PhageDeliveryRig;
}

import * as THREE from 'three';
import type {
  ObservationDefinition,
  ObservationLayerId,
  ObservationPartId,
} from '../../observation/types';
import type {
  InstanceExplosion,
  ObjectExplosion,
  ObservationModel,
  ObservationSurfaceMaterial,
} from './types';
import { getStructuralSignature } from '../../catalog/structuralSignatures';
import type { StructuralSignature } from '../../catalog/structuralSignatures';

export const COLORS = {
  capsid: 0x55ddd2,
  capsidDark: 0x176c78,
  capsomer: 0x8af8e9,
  genome: 0xb78cff,
  tail: 0x8abbdc,
  tailDark: 0x365f7c,
  receptor: 0xf1b968,
  envelope: 0xd477ad,
  spike: 0xf0a6ca,
  layerBlue: 0x5f8fc7,
  layerGold: 0xe8bd72,
  layerViolet: 0x947bd4,
  matrix: 0x3e7089,
} as const;

export interface ModelCollector {
  definition: ObservationDefinition;
  signature?: StructuralSignature;
  root: THREE.Group;
  selectables: THREE.Object3D[];
  parts: Map<ObservationPartId, THREE.Object3D[]>;
  layers: Map<ObservationLayerId, THREE.Object3D[]>;
  surfaceMaterials: ObservationSurfaceMaterial[];
  clippingMaterials: THREE.Material[];
  objectExplosions: ObjectExplosion[];
  instanceExplosions: InstanceExplosion[];
  genomeObjects: THREE.Object3D[];
  sectionGuide: THREE.Object3D;
}

export function createCollector(definition: ObservationDefinition): ModelCollector {
  const root = new THREE.Group();
  root.name = `observation-${definition.id}`;
  const collector: ModelCollector = {
    definition,
    signature: getStructuralSignature(definition.id),
    root,
    selectables: [],
    parts: new Map(),
    layers: new Map(),
    surfaceMaterials: [],
    clippingMaterials: [],
    objectExplosions: [],
    instanceExplosions: [],
    genomeObjects: [],
    sectionGuide: createSectionGuide(definition.sectionRadius),
  };
  if (collector.signature) {
    root.userData.structuralSignatureId = collector.signature.id;
  }
  root.add(collector.sectionGuide);
  return collector;
}

export function finishCollector(collector: ModelCollector): ObservationModel {
  collector.sectionGuide.visible = false;
  return collector;
}

export function register(
  collector: ModelCollector,
  object: THREE.Object3D,
  partId: ObservationPartId,
  layer: ObservationLayerId,
  surface = false,
): void {
  object.userData.observationPartId = partId;
  collector.selectables.push(object);
  pushMap(collector.parts, partId, object);
  pushMap(collector.layers, layer, object);
  object.traverse((child) => {
    if (!('material' in child)) return;
    const value = child as THREE.Object3D & {
      material: THREE.Material | THREE.Material[];
    };
    const materials = Array.isArray(value.material) ? value.material : [value.material];
    for (const material of materials) {
      if (surface) registerSurfaceMaterial(collector, material);
      if (!collector.clippingMaterials.includes(material)) {
        collector.clippingMaterials.push(material);
      }
    }
  });
}

export function registerPartAlias(
  collector: ModelCollector,
  object: THREE.Object3D,
  partId: ObservationPartId,
): void {
  pushMap(collector.parts, partId, object);
}

export function registerLayerAlias(
  collector: ModelCollector,
  object: THREE.Object3D,
  layerId: ObservationLayerId,
): void {
  pushMap(collector.layers, layerId, object);
}

export function registerSurfaceMaterial(
  collector: ModelCollector,
  material: THREE.Material,
): void {
  if (collector.surfaceMaterials.some((entry) => entry.material === material)) return;
  collector.surfaceMaterials.push({
    material,
    opacity: 'opacity' in material ? material.opacity : 1,
    depthWrite: material.depthWrite,
  });
}

export function addObjectExplosion(
  collector: ModelCollector,
  object: THREE.Object3D,
  direction: THREE.Vector3,
  distance: number,
): void {
  collector.objectExplosions.push({
    object,
    origin: object.position.clone(),
    direction: direction.normalize(),
    distance,
  });
}

export function addGenome(
  collector: ModelCollector,
  object: THREE.Object3D,
  direction = new THREE.Vector3(0.5, -0.2, 0.4),
  distance = 0.72,
): void {
  collector.root.add(object);
  register(collector, object, 'genome', 'genome');
  collector.genomeObjects.push(object);
  addObjectExplosion(collector, object, direction, distance);
}

export function standardMaterial(
  color: number,
  opacity = 1,
  emissive = 0x102d36,
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    emissive,
    emissiveIntensity: 0.22,
    roughness: 0.46,
    metalness: 0.03,
    transparent: opacity < 1,
    opacity,
    depthWrite: opacity >= 0.7,
    side: THREE.DoubleSide,
  });
}

export function physicalMaterial(
  color: number,
  opacity = 1,
  flatShading = false,
): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color,
    emissive: new THREE.Color(color).multiplyScalar(0.13),
    emissiveIntensity: 0.2,
    roughness: 0.5,
    metalness: 0.02,
    transparent: opacity < 1,
    opacity,
    depthWrite: opacity >= 0.7,
    flatShading,
    clearcoat: 0.08,
    side: THREE.DoubleSide,
  });
}

export function createRadialInstances(
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  origins: readonly THREE.Vector3[],
  directions: readonly THREE.Vector3[],
  scale = new THREE.Vector3(1, 1, 1),
): Omit<InstanceExplosion, 'distance'> {
  const mesh = new THREE.InstancedMesh(geometry, material, origins.length);
  const quaternions: THREE.Quaternion[] = [];
  const scales: THREE.Vector3[] = [];
  const matrix = new THREE.Matrix4();
  const up = new THREE.Vector3(0, 1, 0);
  origins.forEach((origin, index) => {
    const direction = directions[index] ?? up;
    const quaternion = new THREE.Quaternion().setFromUnitVectors(up, direction);
    const instanceScale = scale.clone();
    matrix.compose(origin, quaternion, instanceScale);
    mesh.setMatrixAt(index, matrix);
    quaternions.push(quaternion);
    scales.push(instanceScale);
  });
  mesh.instanceMatrix.needsUpdate = true;
  mesh.computeBoundingBox();
  mesh.computeBoundingSphere();
  return {
    mesh,
    origins: origins.map((origin) => origin.clone()),
    directions: directions.map((direction) => direction.clone().normalize()),
    quaternions,
    scales,
  };
}

export function fibonacciDirections(count: number): THREE.Vector3[] {
  return Array.from({ length: count }, (_, index) => {
    const y = 1 - ((index + 0.5) / count) * 2;
    const radius = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = Math.PI * (3 - Math.sqrt(5)) * index;
    return new THREE.Vector3(Math.cos(theta) * radius, y, Math.sin(theta) * radius);
  });
}

export function createGenomeCoil(
  radius: number,
  turns: number,
  tubeRadius: number,
  quality: 'high' | 'low',
  heightScale = 1.5,
): THREE.Mesh {
  const points: THREE.Vector3[] = [];
  const segments = quality === 'high' ? 150 : 82;
  for (let index = 0; index <= segments; index += 1) {
    const t = index / segments;
    const envelope = 0.34 + Math.sin(t * Math.PI) * 0.58;
    const angle = t * turns * Math.PI * 2;
    points.push(
      new THREE.Vector3(
        Math.cos(angle) * radius * envelope,
        (t - 0.5) * radius * heightScale,
        Math.sin(angle) * radius * envelope,
      ),
    );
  }
  return createTube(points, tubeRadius, quality, false);
}

export function createTube(
  points: readonly THREE.Vector3[],
  radius: number,
  quality: 'high' | 'low',
  closed = false,
  color: number = COLORS.genome,
): THREE.Mesh {
  const curve = new THREE.CatmullRomCurve3([...points], closed, 'catmullrom', 0.5);
  return new THREE.Mesh(
    new THREE.TubeGeometry(
      curve,
      quality === 'high'
        ? Math.max(80, points.length * 2)
        : Math.max(42, points.length),
      radius,
      quality === 'high' ? 8 : 5,
      closed,
    ),
    standardMaterial(color, 1, 0x3b176b),
  );
}

export function createCylinderBetween(
  start: THREE.Vector3,
  end: THREE.Vector3,
  radius: number,
  material: THREE.Material,
  radialSegments = 7,
): THREE.Mesh {
  const direction = end.clone().sub(start);
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, direction.length(), radialSegments),
    material,
  );
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  return mesh;
}

export function createSectionGuide(radius: number): THREE.Object3D {
  const guide = new THREE.Mesh(
    new THREE.RingGeometry(radius * 0.94, radius, 64),
    new THREE.MeshBasicMaterial({
      color: COLORS.receptor,
      transparent: true,
      opacity: 0.34,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  guide.renderOrder = 8;
  guide.name = 'section-guide';
  guide.userData.ignoreCameraBounds = true;
  return guide;
}

function pushMap<K>(
  map: Map<K, THREE.Object3D[]>,
  key: K,
  value: THREE.Object3D,
): void {
  const existing = map.get(key);
  if (existing) existing.push(value);
  else map.set(key, [value]);
}

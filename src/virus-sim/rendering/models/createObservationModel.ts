import * as THREE from 'three';
import type {
  ObservationLayerId,
  ObservationPartId,
  ObservationPresetId,
} from '../../observation/types';
import type {
  InstanceExplosion,
  ObjectExplosion,
  ObservationModel,
  ObservationSurfaceMaterial,
  PhageDeliveryRig,
} from './types';

const COLORS = {
  capsid: 0x55ddd2,
  capsidDark: 0x176c78,
  capsomer: 0x8af8e9,
  genome: 0xb78cff,
  tail: 0x8abbdc,
  tailDark: 0x365f7c,
  receptor: 0xf1b968,
  envelope: 0xd477ad,
  spike: 0xf0a6ca,
} as const;

interface ModelCollector {
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
  delivery?: PhageDeliveryRig;
}

export function createObservationModel(
  presetId: ObservationPresetId,
  quality: 'high' | 'low',
): ObservationModel {
  const root = new THREE.Group();
  root.name = `observation-${presetId}`;
  const collector: ModelCollector = {
    root,
    selectables: [],
    parts: new Map(),
    layers: new Map(),
    surfaceMaterials: [],
    clippingMaterials: [],
    objectExplosions: [],
    instanceExplosions: [],
    genomeObjects: [],
    sectionGuide: createSectionGuide(presetId),
  };
  root.add(collector.sectionGuide);

  if (presetId === 'tailed-phage') buildTailedPhage(collector, quality);
  else if (presetId === 'filamentous') buildFilamentous(collector, quality);
  else if (presetId === 'enveloped') buildEnveloped(collector, quality);
  else buildIcosahedral(collector, quality);

  collector.sectionGuide.visible = false;
  return collector;
}

function buildIcosahedral(collector: ModelCollector, quality: 'high' | 'low'): void {
  const shellMaterial = physicalMaterial(COLORS.capsid, 0.8, true);
  const shell = new THREE.Mesh(new THREE.IcosahedronGeometry(2, 1), shellMaterial);
  shell.scale.y = 0.96;
  collector.root.add(shell);
  register(collector, shell, 'capsid', 'capsid', true);

  const count = quality === 'high' ? 62 : 32;
  const directions = fibonacciDirections(count);
  const capsomerMaterial = standardMaterial(COLORS.capsomer, 1);
  const units = createRadialInstances(
    new THREE.CylinderGeometry(0.19, 0.25, 0.16, 6),
    capsomerMaterial,
    directions.map(
      (direction) =>
        new THREE.Vector3(direction.x * 2.02, direction.y * 1.94, direction.z * 2.02),
    ),
    directions,
    new THREE.Vector3(1, 1, 1),
  );
  collector.root.add(units.mesh);
  register(collector, units.mesh, 'capsomer', 'capsid', true);
  collector.instanceExplosions.push({ ...units, distance: 1.12 });

  const edgeMaterial = new THREE.LineBasicMaterial({
    color: 0xb3fff6,
    transparent: true,
    opacity: 0.38,
  });
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(2.03, 1), 18),
    edgeMaterial,
  );
  edges.scale.y = 0.96;
  collector.root.add(edges);
  registerSurfaceMaterial(collector, edgeMaterial);
  collector.clippingMaterials.push(edgeMaterial);

  const genome = createGenomeCoil(1.18, 14, 0.055, quality);
  collector.root.add(genome);
  register(collector, genome, 'genome', 'genome');
  collector.genomeObjects.push(genome);
  addObjectExplosion(collector, genome, new THREE.Vector3(0.4, -0.2, 0.5), 0.72);
}

function buildTailedPhage(collector: ModelCollector, quality: 'high' | 'low'): void {
  const body = new THREE.Group();
  collector.root.add(body);

  const shellMaterial = physicalMaterial(COLORS.capsid, 0.83, true);
  const head = new THREE.Mesh(new THREE.IcosahedronGeometry(1.48, 1), shellMaterial);
  head.position.y = 1.6;
  head.scale.y = 1.16;
  body.add(head);
  register(collector, head, 'capsid', 'capsid', true);
  addObjectExplosion(collector, head, new THREE.Vector3(0.2, 1, 0.15), 0.58);

  const count = quality === 'high' ? 52 : 28;
  const directions = fibonacciDirections(count);
  const headUnits = createRadialInstances(
    new THREE.CylinderGeometry(0.14, 0.2, 0.14, 6),
    standardMaterial(COLORS.capsomer, 1),
    directions.map(
      (direction) =>
        new THREE.Vector3(
          direction.x * 1.5,
          1.6 + direction.y * 1.73,
          direction.z * 1.5,
        ),
    ),
    directions,
    new THREE.Vector3(1, 1, 1),
  );
  body.add(headUnits.mesh);
  register(collector, headUnits.mesh, 'capsomer', 'capsid', true);
  collector.instanceExplosions.push({ ...headUnits, distance: 0.88 });

  const genome = createGenomeCoil(0.9, 18, 0.045, quality);
  genome.position.y = 1.6;
  genome.scale.y = 1.18;
  body.add(genome);
  register(collector, genome, 'genome', 'genome');
  collector.genomeObjects.push(genome);
  addObjectExplosion(collector, genome, new THREE.Vector3(-0.35, 0.7, 0.3), 0.72);

  const neck = new THREE.Group();
  for (let index = 0; index < 3; index += 1) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.42 - index * 0.03, 0.075, 8, 20),
      standardMaterial(index === 1 ? COLORS.tail : 0xc4e4ef, 1),
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.08 - index * 0.16;
    neck.add(ring);
  }
  body.add(neck);
  register(collector, neck, 'neck', 'capsid', true);
  addObjectExplosion(collector, neck, new THREE.Vector3(0.65, 0.1, 0.35), 0.72);

  const sheath = new THREE.Group();
  const sheathMaterial = standardMaterial(COLORS.tail, 1);
  for (let index = 0; index < 12; index += 1) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.31, 0.095, 8, quality === 'high' ? 24 : 14),
      sheathMaterial,
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -0.36 - index * 0.18;
    ring.rotation.y = index * 0.22;
    sheath.add(ring);
  }
  body.add(sheath);
  register(collector, sheath, 'sheath', 'capsid', true);
  addObjectExplosion(collector, sheath, new THREE.Vector3(-0.6, -0.2, 0.35), 0.86);

  const tube = new THREE.Mesh(
    new THREE.CylinderGeometry(0.085, 0.085, 2.65, 12),
    standardMaterial(0xe4f8ff, 1),
  );
  tube.position.y = -1.34;
  body.add(tube);
  register(collector, tube, 'inner-tube', 'capsid', true);
  addObjectExplosion(collector, tube, new THREE.Vector3(0.62, -0.1, -0.45), 0.7);

  const baseplate = new THREE.Group();
  const plate = new THREE.Mesh(
    new THREE.CylinderGeometry(0.62, 0.48, 0.2, 6),
    standardMaterial(COLORS.receptor, 1),
  );
  plate.position.y = -2.55;
  baseplate.add(plate);
  for (let index = 0; index < 6; index += 1) {
    const angle = (index / 6) * Math.PI * 2;
    const pin = createCylinderBetween(
      new THREE.Vector3(Math.cos(angle) * 0.32, -2.57, Math.sin(angle) * 0.32),
      new THREE.Vector3(Math.cos(angle) * 0.48, -2.83, Math.sin(angle) * 0.48),
      0.045,
      standardMaterial(COLORS.receptor, 1),
    );
    baseplate.add(pin);
  }
  body.add(baseplate);
  register(collector, baseplate, 'baseplate', 'capsid', true);
  addObjectExplosion(collector, baseplate, new THREE.Vector3(0.2, -1, 0.2), 0.68);

  const fibers = new THREE.Group();
  const fiberMaterial = standardMaterial(COLORS.receptor, 1);
  for (let index = 0; index < 6; index += 1) {
    const angle = (index / 6) * Math.PI * 2;
    const radial = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
    const start = radial.clone().multiplyScalar(0.45).setY(-2.58);
    const elbow = radial.clone().multiplyScalar(0.95).setY(-2.92);
    const tip = radial.clone().multiplyScalar(1.48).setY(-3.18);
    fibers.add(
      createCylinderBetween(start, elbow, 0.035, fiberMaterial),
      createCylinderBetween(elbow, tip, 0.027, fiberMaterial),
    );
    const joint = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 6), fiberMaterial);
    joint.position.copy(elbow);
    fibers.add(joint);
  }
  body.add(fibers);
  register(collector, fibers, 'tail-fiber', 'capsid', true);
  addObjectExplosion(collector, fibers, new THREE.Vector3(-0.15, -0.75, -0.45), 0.86);

  const deliveryPath = createDeliveryPath();
  deliveryPath.visible = false;
  body.add(deliveryPath);
  register(collector, deliveryPath, 'genome', 'genome');

  const surfacePatch = createSurfacePatch(quality);
  surfacePatch.visible = false;
  collector.root.add(surfacePatch);

  collector.delivery = {
    body,
    bodyOrigin: body.position.clone(),
    sheath,
    sheathOrigin: sheath.position.clone(),
    innerTube: tube,
    innerTubeOrigin: tube.position.clone(),
    headGenome: genome,
    deliveryPath,
    deliveryPointCount: deliveryPath.geometry.getAttribute('position').count,
    surfacePatch,
  };
}

function buildFilamentous(collector: ModelCollector, quality: 'high' | 'low'): void {
  const strandCount = quality === 'high' ? 4 : 3;
  const unitsPerStrand = quality === 'high' ? 56 : 34;
  const origins: THREE.Vector3[] = [];
  const directions: THREE.Vector3[] = [];
  const quaternions: THREE.Quaternion[] = [];
  const scales: THREE.Vector3[] = [];
  const total = strandCount * unitsPerStrand;
  const geometry = new THREE.CapsuleGeometry(0.11, 0.18, 3, 6);
  const material = standardMaterial(COLORS.capsomer, 1);
  const mesh = new THREE.InstancedMesh(geometry, material, total);
  const outward = new THREE.Vector3();
  const matrix = new THREE.Matrix4();
  let cursor = 0;
  for (let strand = 0; strand < strandCount; strand += 1) {
    for (let index = 0; index < unitsPerStrand; index += 1) {
      const t = index / (unitsPerStrand - 1);
      const angle = t * Math.PI * 14 + (strand / strandCount) * Math.PI * 2;
      outward.set(Math.cos(angle), 0, Math.sin(angle));
      const origin = new THREE.Vector3(
        outward.x * 0.58,
        (t - 0.5) * 6.6,
        outward.z * 0.58,
      );
      const quaternion = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(0, -angle, Math.PI / 2.8),
      );
      const scale = new THREE.Vector3(1, 1, 1);
      matrix.compose(origin, quaternion, scale);
      mesh.setMatrixAt(cursor, matrix);
      origins.push(origin);
      directions.push(outward.clone());
      quaternions.push(quaternion);
      scales.push(scale);
      cursor += 1;
    }
  }
  mesh.instanceMatrix.needsUpdate = true;
  collector.root.add(mesh);
  register(collector, mesh, 'capsomer', 'capsid', true);
  registerPartAlias(collector, mesh, 'capsid');
  collector.instanceExplosions.push({
    mesh,
    origins,
    directions,
    quaternions,
    scales,
    distance: 0.92,
  });

  const coreMaterial = physicalMaterial(COLORS.capsidDark, 0.42, true);
  const core = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.52, 5.6, 8, 16),
    coreMaterial,
  );
  collector.root.add(core);
  register(collector, core, 'capsid', 'capsid', true);

  const points: THREE.Vector3[] = [];
  const pointCount = quality === 'high' ? 150 : 88;
  for (let index = 0; index <= pointCount; index += 1) {
    const t = index / pointCount;
    const angle = t * Math.PI * 10;
    points.push(
      new THREE.Vector3(
        Math.cos(angle) * 0.22,
        (t - 0.5) * 5.95,
        Math.sin(angle) * 0.22,
      ),
    );
  }
  const genome = new THREE.Mesh(
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(points),
      pointCount,
      0.045,
      quality === 'high' ? 8 : 5,
      false,
    ),
    standardMaterial(COLORS.genome, 1, 0x3a1b68),
  );
  collector.root.add(genome);
  register(collector, genome, 'genome', 'genome');
  collector.genomeObjects.push(genome);
  addObjectExplosion(collector, genome, new THREE.Vector3(0.6, 0, 0.4), 0.82);
}

function buildEnveloped(collector: ModelCollector, quality: 'high' | 'low'): void {
  const envelopeMaterial = physicalMaterial(COLORS.envelope, 0.92, false);
  const envelope = new THREE.Mesh(
    new THREE.SphereGeometry(
      2.22,
      quality === 'high' ? 48 : 24,
      quality === 'high' ? 32 : 16,
    ),
    envelopeMaterial,
  );
  collector.root.add(envelope);
  register(collector, envelope, 'envelope', 'envelope', true);

  const spikeCount = quality === 'high' ? 54 : 28;
  const spikeDirections = fibonacciDirections(spikeCount);
  const spikes = createRadialInstances(
    new THREE.ConeGeometry(0.13, 0.5, 7),
    standardMaterial(COLORS.spike, 1),
    spikeDirections.map((direction) => direction.clone().multiplyScalar(2.43)),
    spikeDirections,
    new THREE.Vector3(1, 1, 1),
  );
  collector.root.add(spikes.mesh);
  register(collector, spikes.mesh, 'spike', 'envelope', true);
  collector.instanceExplosions.push({ ...spikes, distance: 0.82 });

  const capsidMaterial = physicalMaterial(COLORS.capsid, 0.88, true);
  const capsid = new THREE.Mesh(new THREE.IcosahedronGeometry(1.34, 1), capsidMaterial);
  collector.root.add(capsid);
  register(collector, capsid, 'capsid', 'capsid', true);
  addObjectExplosion(collector, capsid, new THREE.Vector3(-0.55, 0.15, 0.45), 0.92);

  const unitDirections = fibonacciDirections(quality === 'high' ? 32 : 18);
  const units = createRadialInstances(
    new THREE.CylinderGeometry(0.12, 0.17, 0.12, 6),
    standardMaterial(COLORS.capsomer, 1),
    unitDirections.map((direction) => direction.clone().multiplyScalar(1.38)),
    unitDirections,
    new THREE.Vector3(1, 1, 1),
  );
  collector.root.add(units.mesh);
  register(collector, units.mesh, 'capsomer', 'capsid', true);
  collector.instanceExplosions.push({ ...units, distance: 0.7 });

  const genome = createGenomeCoil(0.72, 13, 0.042, quality);
  collector.root.add(genome);
  register(collector, genome, 'genome', 'genome');
  collector.genomeObjects.push(genome);
  addObjectExplosion(collector, genome, new THREE.Vector3(0.55, -0.2, -0.4), 0.72);
}

function createRadialInstances(
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  origins: readonly THREE.Vector3[],
  directions: readonly THREE.Vector3[],
  scale: THREE.Vector3,
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

function register(
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
    const materials = Array.isArray(child.material)
      ? child.material
      : [child.material as THREE.Material];
    for (const material of materials) {
      if (surface) registerSurfaceMaterial(collector, material);
      collector.clippingMaterials.push(material);
    }
  });
}

function registerPartAlias(
  collector: ModelCollector,
  object: THREE.Object3D,
  partId: ObservationPartId,
): void {
  pushMap(collector.parts, partId, object);
}

function registerSurfaceMaterial(
  collector: ModelCollector,
  material: THREE.Material,
): void {
  if (collector.surfaceMaterials.some((entry) => entry.material === material)) return;
  const opacity = 'opacity' in material ? material.opacity : 1;
  collector.surfaceMaterials.push({
    material,
    opacity,
    depthWrite: material.depthWrite,
  });
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

function addObjectExplosion(
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

function standardMaterial(
  color: number,
  opacity: number,
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

function physicalMaterial(
  color: number,
  opacity: number,
  flatShading: boolean,
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

function createGenomeCoil(
  radius: number,
  turns: number,
  tubeRadius: number,
  quality: 'high' | 'low',
): THREE.Mesh {
  const points: THREE.Vector3[] = [];
  const segments = quality === 'high' ? 150 : 88;
  for (let index = 0; index <= segments; index += 1) {
    const t = index / segments;
    const envelope = 0.34 + Math.sin(t * Math.PI) * 0.58;
    const angle = t * turns * Math.PI * 2;
    points.push(
      new THREE.Vector3(
        Math.cos(angle) * radius * envelope,
        (t - 0.5) * radius * 1.5,
        Math.sin(angle) * radius * envelope,
      ),
    );
  }
  return new THREE.Mesh(
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(points),
      segments,
      tubeRadius,
      quality === 'high' ? 8 : 5,
      false,
    ),
    standardMaterial(COLORS.genome, 1, 0x3b176b),
  );
}

function createDeliveryPath(): THREE.Line {
  const points: THREE.Vector3[] = [];
  const count = 84;
  for (let index = 0; index < count; index += 1) {
    const t = index / (count - 1);
    const headPhase = Math.min(1, t / 0.35);
    const radius = t < 0.35 ? (1 - headPhase) * 0.58 : 0.025;
    points.push(
      new THREE.Vector3(
        Math.cos(t * Math.PI * 9) * radius,
        2.25 - t * 5.55,
        Math.sin(t * Math.PI * 9) * radius,
      ),
    );
  }
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  geometry.setDrawRange(0, 2);
  return new THREE.Line(
    geometry,
    new THREE.LineBasicMaterial({
      color: COLORS.genome,
      transparent: true,
      opacity: 0.96,
    }),
  );
}

function createSurfacePatch(quality: 'high' | 'low'): THREE.Group {
  const group = new THREE.Group();
  group.position.y = -3.46;
  group.userData.ignoreCameraBounds = true;
  const membrane = new THREE.Mesh(
    new THREE.CylinderGeometry(2.8, 2.8, 0.18, quality === 'high' ? 48 : 24),
    new THREE.MeshPhysicalMaterial({
      color: 0x6cb5d2,
      emissive: 0x102f46,
      transparent: true,
      opacity: 0.46,
      roughness: 0.52,
      transmission: 0.04,
      depthWrite: false,
    }),
  );
  group.add(membrane);
  const receptorMaterial = standardMaterial(0x8ed9e9, 0.8);
  for (let index = 0; index < (quality === 'high' ? 22 : 12); index += 1) {
    const angle = index * 2.39996;
    const radius = 0.5 + (index % 5) * 0.38;
    const receptor = new THREE.Mesh(
      new THREE.SphereGeometry(0.075, 7, 5),
      receptorMaterial,
    );
    receptor.position.set(Math.cos(angle) * radius, 0.16, Math.sin(angle) * radius);
    group.add(receptor);
  }
  return group;
}

function createSectionGuide(presetId: ObservationPresetId): THREE.Object3D {
  const radius =
    presetId === 'filamentous' ? 0.85 : presetId === 'tailed-phage' ? 1.65 : 2.3;
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

function fibonacciDirections(count: number): THREE.Vector3[] {
  return Array.from({ length: count }, (_, index) => {
    const y = 1 - ((index + 0.5) / count) * 2;
    const radius = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = Math.PI * (3 - Math.sqrt(5)) * index;
    return new THREE.Vector3(Math.cos(theta) * radius, y, Math.sin(theta) * radius);
  });
}

function createCylinderBetween(
  start: THREE.Vector3,
  end: THREE.Vector3,
  radius: number,
  material: THREE.Material,
): THREE.Mesh {
  const direction = end.clone().sub(start);
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, direction.length(), 7),
    material,
  );
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  return mesh;
}

import * as THREE from 'three';
import type { ModelCollector } from './shared';
import {
  COLORS,
  addGenome,
  addObjectExplosion,
  createGenomeCoil,
  createRadialInstances,
  createTube,
  fibonacciDirections,
  physicalMaterial,
  register,
  registerLayerAlias,
  registerPartAlias,
  standardMaterial,
} from './shared';

export function buildHSV(collector: ModelCollector, quality: 'high' | 'low'): void {
  addSphericalEnvelope(collector, quality, 2.48, 0xd477ad, 0.78);
  addSphericalSpikes(collector, quality, 2.72, 58, 30, 0xf0a6ca);

  const tegumentDirections = fibonacciDirections(quality === 'high' ? 48 : 25);
  const tegument = createRadialInstances(
    new THREE.DodecahedronGeometry(0.12, 0),
    standardMaterial(COLORS.layerGold, 0.82),
    tegumentDirections.map((direction, index) =>
      direction.clone().multiplyScalar(1.72 + (index % 4) * 0.08),
    ),
    tegumentDirections,
    new THREE.Vector3(1, 0.75, 1),
  );
  collector.root.add(tegument.mesh);
  register(collector, tegument.mesh, 'tegument', 'tegument', true);
  collector.instanceExplosions.push({ ...tegument, distance: 0.72 });

  const capsid = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.28, 1),
    physicalMaterial(COLORS.capsid, 0.88, true),
  );
  collector.root.add(capsid);
  register(collector, capsid, 'capsid', 'capsid', true);
  addObjectExplosion(collector, capsid, new THREE.Vector3(-0.55, 0.2, 0.45), 0.88);

  const unitsDirections = fibonacciDirections(quality === 'high' ? 38 : 20);
  const units = createRadialInstances(
    new THREE.CylinderGeometry(0.11, 0.16, 0.11, 6),
    standardMaterial(COLORS.capsomer),
    unitsDirections.map((direction) => direction.clone().multiplyScalar(1.32)),
    unitsDirections,
  );
  collector.root.add(units.mesh);
  register(collector, units.mesh, 'capsomer', 'capsid', true);
  collector.instanceExplosions.push({ ...units, distance: 0.64 });

  addGenome(
    collector,
    createGenomeCoil(0.7, 16, 0.04, quality),
    new THREE.Vector3(0.55, -0.25, -0.35),
    0.68,
  );
}

export function buildInfluenza(
  collector: ModelCollector,
  quality: 'high' | 'low',
): void {
  const envelope = addSphericalEnvelope(collector, quality, 2.22, 0xb75f98, 0.84);
  envelope.scale.set(1.02, 0.96, 1);

  const directions = fibonacciDirections(quality === 'high' ? 64 : 34);
  const haDirections = directions.filter((_, index) => index % 5 !== 0);
  const naDirections = directions.filter((_, index) => index % 5 === 0);
  const ha = createRadialInstances(
    new THREE.ConeGeometry(0.11, 0.48, 7),
    standardMaterial(0xf1aacb),
    haDirections.map((direction) => direction.clone().multiplyScalar(2.47)),
    haDirections,
  );
  collector.root.add(ha.mesh);
  register(collector, ha.mesh, 'spike', 'surface-protein', true);
  collector.instanceExplosions.push({ ...ha, distance: 0.74 });
  const na = createRadialInstances(
    new THREE.CapsuleGeometry(0.105, 0.28, 3, 6),
    standardMaterial(COLORS.layerGold),
    naDirections.map((direction) => direction.clone().multiplyScalar(2.46)),
    naDirections,
  );
  collector.root.add(na.mesh);
  register(collector, na.mesh, 'spike', 'surface-protein', true);
  collector.instanceExplosions.push({ ...na, distance: 0.74 });

  const matrix = new THREE.Mesh(
    new THREE.SphereGeometry(
      1.88,
      quality === 'high' ? 40 : 22,
      quality === 'high' ? 28 : 14,
    ),
    physicalMaterial(COLORS.matrix, 0.62, false),
  );
  collector.root.add(matrix);
  register(collector, matrix, 'matrix', 'matrix', true);
  addObjectExplosion(collector, matrix, new THREE.Vector3(-0.55, 0.25, 0.4), 0.72);

  const rnpGroup = new THREE.Group();
  for (let segment = 0; segment < 8; segment += 1) {
    const angle = (segment / 8) * Math.PI * 2;
    const length = 1.05 + (segment % 3) * 0.22;
    const points: THREE.Vector3[] = [];
    for (let index = 0; index <= 12; index += 1) {
      const t = index / 12;
      points.push(
        new THREE.Vector3(
          Math.cos(angle) * (0.28 + segment * 0.03) + Math.sin(t * Math.PI * 2) * 0.08,
          (t - 0.5) * length,
          Math.sin(angle) * (0.28 + segment * 0.03) + Math.cos(t * Math.PI * 2) * 0.08,
        ),
      );
    }
    rnpGroup.add(
      createTube(points, 0.055, quality, false, segment % 2 ? 0xb78cff : 0xd1a7ff),
    );
  }
  collector.root.add(rnpGroup);
  register(collector, rnpGroup, 'rnp', 'nucleocapsid');
  registerPartAlias(collector, rnpGroup, 'genome');
  collector.genomeObjects.push(rnpGroup);
  addObjectExplosion(collector, rnpGroup, new THREE.Vector3(0.6, -0.35, -0.25), 0.68);
}

export function buildVSV(collector: ModelCollector, quality: 'high' | 'low'): void {
  const profile = bulletProfile(1);
  const envelope = new THREE.Mesh(
    new THREE.LatheGeometry(profile, quality === 'high' ? 48 : 24),
    physicalMaterial(0xbd6f9d, 0.82, false),
  );
  collector.root.add(envelope);
  register(collector, envelope, 'envelope', 'envelope', true);
  addObjectExplosion(collector, envelope, new THREE.Vector3(0.55, 0.2, 0.4), 0.7);

  const spikes = createBulletSpikes(quality);
  collector.root.add(spikes);
  register(collector, spikes, 'spike', 'surface-protein', true);
  addObjectExplosion(collector, spikes, new THREE.Vector3(0.6, -0.1, -0.35), 0.72);

  const matrix = new THREE.Mesh(
    new THREE.LatheGeometry(bulletProfile(0.84), quality === 'high' ? 40 : 20),
    physicalMaterial(COLORS.matrix, 0.5, false),
  );
  collector.root.add(matrix);
  register(collector, matrix, 'matrix', 'matrix', true);
  addObjectExplosion(collector, matrix, new THREE.Vector3(-0.5, 0.35, 0.35), 0.62);

  const helixPoints: THREE.Vector3[] = [];
  const samples = quality === 'high' ? 150 : 82;
  for (let index = 0; index <= samples; index += 1) {
    const t = index / samples;
    const y = -2 + t * 3.9;
    const capScale =
      y > 1.1 ? Math.sqrt(Math.max(0.18, 1 - ((y - 1.1) / 1.15) ** 2)) : 1;
    const radius = 0.72 * capScale;
    const angle = t * Math.PI * 20;
    helixPoints.push(
      new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius),
    );
  }
  const nucleocapsid = createTube(
    helixPoints,
    0.07,
    quality,
    false,
    COLORS.layerViolet,
  );
  collector.root.add(nucleocapsid);
  register(collector, nucleocapsid, 'nucleocapsid', 'nucleocapsid');
  registerPartAlias(collector, nucleocapsid, 'genome');
  registerLayerAlias(collector, nucleocapsid, 'genome');
  collector.genomeObjects.push(nucleocapsid);
  addObjectExplosion(collector, nucleocapsid, new THREE.Vector3(0.6, -0.2, 0.3), 0.68);
}

function addSphericalEnvelope(
  collector: ModelCollector,
  quality: 'high' | 'low',
  radius: number,
  color: number,
  opacity: number,
): THREE.Mesh {
  const envelope = new THREE.Mesh(
    new THREE.SphereGeometry(
      radius,
      quality === 'high' ? 48 : 24,
      quality === 'high' ? 32 : 16,
    ),
    physicalMaterial(color, opacity, false),
  );
  collector.root.add(envelope);
  register(collector, envelope, 'envelope', 'envelope', true);
  addObjectExplosion(collector, envelope, new THREE.Vector3(0.55, 0.15, 0.42), 0.78);
  return envelope;
}

function addSphericalSpikes(
  collector: ModelCollector,
  quality: 'high' | 'low',
  radius: number,
  highCount: number,
  lowCount: number,
  color: number,
): void {
  const directions = fibonacciDirections(quality === 'high' ? highCount : lowCount);
  const spikes = createRadialInstances(
    new THREE.ConeGeometry(0.13, 0.5, 7),
    standardMaterial(color),
    directions.map((direction) => direction.clone().multiplyScalar(radius)),
    directions,
  );
  collector.root.add(spikes.mesh);
  register(collector, spikes.mesh, 'spike', 'surface-protein', true);
  collector.instanceExplosions.push({ ...spikes, distance: 0.82 });
}

function bulletProfile(scale: number): THREE.Vector2[] {
  return [
    new THREE.Vector2(0.08 * scale, -2.45),
    new THREE.Vector2(1.42 * scale, -2.42),
    new THREE.Vector2(1.5 * scale, -2.25),
    new THREE.Vector2(1.5 * scale, 1.12),
    new THREE.Vector2(1.42 * scale, 1.55),
    new THREE.Vector2(1.18 * scale, 1.94),
    new THREE.Vector2(0.76 * scale, 2.25),
    new THREE.Vector2(0.25 * scale, 2.42),
    new THREE.Vector2(0.05 * scale, 2.45),
  ];
}

function createBulletSpikes(quality: 'high' | 'low'): THREE.Group {
  const group = new THREE.Group();
  const material = standardMaterial(COLORS.spike);
  const count = quality === 'high' ? 42 : 24;
  for (let index = 0; index < count; index += 1) {
    const t = (index + 0.5) / count;
    const y = -2.15 + t * 4.25;
    const cap = y > 1.1;
    const capScale = cap ? Math.sqrt(Math.max(0.15, 1 - ((y - 1.1) / 1.38) ** 2)) : 1;
    const radius = 1.56 * capScale;
    const angle = index * 2.39996;
    const direction = new THREE.Vector3(
      Math.cos(angle),
      cap ? (y - 1.1) / 1.38 : 0,
      Math.sin(angle),
    ).normalize();
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.38, 6), material);
    spike.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
    spike.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
    group.add(spike);
  }
  return group;
}

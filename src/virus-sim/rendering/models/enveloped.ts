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
import {
  createMatrixShell,
  createSegmentedRnp,
  createSurfaceProteinInstances,
} from './components';

export function buildHSV(collector: ModelCollector, quality: 'high' | 'low'): void {
  collector.root.userData.envelopedFamily = 'herpesvirus';
  const envelope = addSphericalEnvelope(collector, quality, 2.48, 0xd477ad, 0.72);
  envelope.name = 'hsv-envelope';

  const surfaceProfiles = [
    {
      id: 'glycoprotein-long',
      shape: 'crown' as const,
      radius: 2.76,
      count: quality === 'high' ? 54 : 28,
      color: 0xf0a6ca,
    },
    {
      id: 'glycoprotein-short',
      shape: 'knob' as const,
      radius: 2.62,
      count: quality === 'high' ? 18 : 9,
      color: COLORS.layerGold,
    },
  ];
  surfaceProfiles.forEach((profile, index) => {
    const surface = createSurfaceProteinInstances(profile);
    collector.root.add(surface.mesh);
    register(collector, surface.mesh, 'spike', 'surface-protein', true);
    collector.instanceExplosions.push({ ...surface, distance: 0.78 + index * 0.05 });
  });

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
  tegument.mesh.name = 'hsv-tegument-cloud';
  collector.root.add(tegument.mesh);
  register(collector, tegument.mesh, 'tegument', 'tegument', true);
  collector.instanceExplosions.push({ ...tegument, distance: 0.72 });

  const capsid = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.28, 1),
    physicalMaterial(COLORS.capsid, 0.88, true),
  );
  capsid.name = 'hsv-icosahedral-capsid';
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
  collector.root.userData.envelopedFamily = 'orthomyxovirus';
  const envelope = addSphericalEnvelope(collector, quality, 2.22, 0xb75f98, 0.84);
  envelope.scale.set(1.02, 0.96, 1);

  const surfaceComponents = [
    {
      shape: 'cone' as const,
      count: quality === 'high' ? 52 : 27,
      radius: 2.47,
      color: 0xf1aacb,
    },
    {
      shape: 'knob' as const,
      count: quality === 'high' ? 13 : 7,
      radius: 2.43,
      color: COLORS.layerGold,
    },
    {
      shape: 'channel' as const,
      count: quality === 'high' ? 7 : 4,
      radius: 2.29,
      color: COLORS.layerBlue,
    },
  ];
  surfaceComponents.forEach((component, index) => {
    const surface = createSurfaceProteinInstances({
      id: ['ha', 'na', 'm2'][index],
      ...component,
    });
    collector.root.add(surface.mesh);
    register(collector, surface.mesh, 'spike', 'surface-protein', true);
    collector.instanceExplosions.push({ ...surface, distance: 0.7 + index * 0.04 });
  });

  const matrix = createMatrixShell(1.88, quality, 0.62);
  collector.root.add(matrix);
  register(collector, matrix, 'matrix', 'matrix', true);
  addObjectExplosion(collector, matrix, new THREE.Vector3(-0.55, 0.25, 0.4), 0.72);

  const rnpGroup = createSegmentedRnp(8, quality);
  rnpGroup.name = 'influenza-eight-rnp-segments';
  collector.root.add(rnpGroup);
  register(collector, rnpGroup, 'rnp', 'nucleocapsid');
  registerPartAlias(collector, rnpGroup, 'genome');
  collector.genomeObjects.push(rnpGroup);
  addObjectExplosion(collector, rnpGroup, new THREE.Vector3(0.6, -0.35, -0.25), 0.68);
}

export function buildVSV(collector: ModelCollector, quality: 'high' | 'low'): void {
  collector.root.userData.envelopedFamily = 'rhabdovirus';
  const profile = bulletProfile(1);
  const envelope = new THREE.Mesh(
    new THREE.LatheGeometry(profile, quality === 'high' ? 48 : 24),
    physicalMaterial(0xbd6f9d, 0.82, false),
  );
  envelope.name = 'vsv-bullet-envelope';
  collector.root.add(envelope);
  register(collector, envelope, 'envelope', 'envelope', true);
  addObjectExplosion(collector, envelope, new THREE.Vector3(0.55, 0.2, 0.4), 0.7);

  const spikes = createBulletSpikes(quality);
  collector.root.add(spikes.mesh);
  register(collector, spikes.mesh, 'spike', 'surface-protein', true);
  collector.instanceExplosions.push({ ...spikes, distance: 0.72 });

  const matrix = new THREE.Mesh(
    new THREE.LatheGeometry(bulletProfile(0.84), quality === 'high' ? 40 : 20),
    physicalMaterial(COLORS.matrix, 0.5, false),
  );
  matrix.name = 'vsv-bullet-matrix';
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
  nucleocapsid.name = 'vsv-directional-helical-rnp';
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

function createBulletSpikes(quality: 'high' | 'low') {
  const count = quality === 'high' ? 42 : 24;
  const origins: THREE.Vector3[] = [];
  const directions: THREE.Vector3[] = [];
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
    origins.push(
      new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius),
    );
    directions.push(direction);
  }
  const result = createRadialInstances(
    new THREE.ConeGeometry(0.11, 0.38, 6),
    standardMaterial(COLORS.spike),
    origins,
    directions,
  );
  result.mesh.name = 'surface-glycoprotein-g';
  return result;
}

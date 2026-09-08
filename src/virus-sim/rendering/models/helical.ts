import * as THREE from 'three';
import type { InstanceExplosion } from './types';
import type { ModelCollector } from './shared';
import {
  COLORS,
  addGenome,
  addObjectExplosion,
  createTube,
  physicalMaterial,
  register,
  registerPartAlias,
  standardMaterial,
} from './shared';

export function buildTMV(collector: ModelCollector, quality: 'high' | 'low'): void {
  const coat = createHelicalCoat({
    length: 6.5,
    radius: 0.69,
    strands: quality === 'high' ? 5 : 3,
    units: quality === 'high' ? 68 : 38,
    unitRadius: 0.115,
    color: COLORS.capsomer,
  });
  collector.root.add(coat.mesh);
  register(collector, coat.mesh, 'coat-protein', 'capsid', true);
  registerPartAlias(collector, coat.mesh, 'capsid');
  collector.instanceExplosions.push({ ...coat, distance: 0.82 });

  const support = new THREE.Mesh(
    new THREE.CylinderGeometry(0.62, 0.62, 6.55, quality === 'high' ? 36 : 20, 1, true),
    physicalMaterial(COLORS.capsidDark, 0.34, false),
  );
  collector.root.add(support);
  register(collector, support, 'capsid', 'capsid', true);

  const channel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.19, 0.19, 6.75, 20),
    new THREE.MeshBasicMaterial({
      color: 0x061322,
      transparent: true,
      opacity: 0.82,
      side: THREE.DoubleSide,
    }),
  );
  collector.root.add(channel);
  register(collector, channel, 'channel', 'capsid');
  addObjectExplosion(collector, channel, new THREE.Vector3(-0.8, 0, 0.2), 0.52);

  const rnaPoints: THREE.Vector3[] = [];
  const samples = quality === 'high' ? 130 : 72;
  for (let index = 0; index <= samples; index += 1) {
    const t = index / samples;
    const angle = t * Math.PI * 22;
    rnaPoints.push(
      new THREE.Vector3(
        Math.cos(angle) * 0.41,
        (t - 0.5) * 6.15,
        Math.sin(angle) * 0.41,
      ),
    );
  }
  addGenome(
    collector,
    createTube(rnaPoints, 0.04, quality, false),
    new THREE.Vector3(0.8, 0.05, 0.2),
    0.62,
  );
}

export function buildM13(collector: ModelCollector, quality: 'high' | 'low'): void {
  const coat = createHelicalCoat({
    length: 7.8,
    radius: 0.3,
    strands: quality === 'high' ? 5 : 3,
    units: quality === 'high' ? 82 : 46,
    unitRadius: 0.065,
    color: 0x6fd8ce,
    bend: 0.22,
  });
  collector.root.add(coat.mesh);
  register(collector, coat.mesh, 'coat-protein', 'capsid', true);
  registerPartAlias(collector, coat.mesh, 'capsid');
  collector.instanceExplosions.push({ ...coat, distance: 0.5 });

  const dnaPoints: THREE.Vector3[] = [];
  const samples = quality === 'high' ? 100 : 56;
  for (let index = 0; index <= samples; index += 1) {
    const t = index / samples;
    dnaPoints.push(
      new THREE.Vector3(
        Math.sin(t * Math.PI * 1.5) * 0.18,
        (t - 0.5) * 7.55,
        Math.sin(t * Math.PI * 2.2) * 0.07,
      ),
    );
  }
  addGenome(
    collector,
    createTube(dnaPoints, 0.028, quality, false),
    new THREE.Vector3(0.7, 0, 0.25),
    0.48,
  );

  const terminals = new THREE.Group();
  const topMaterial = standardMaterial(COLORS.layerGold);
  const bottomMaterial = standardMaterial(COLORS.layerViolet);
  for (const [y, material] of [
    [4.02, topMaterial],
    [-4.02, bottomMaterial],
  ] as const) {
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 8), material);
    cap.scale.y = 0.68;
    cap.position.y = y;
    terminals.add(cap);
  }
  collector.root.add(terminals);
  register(collector, terminals, 'terminal-protein', 'capsid', true);
  addObjectExplosion(collector, terminals, new THREE.Vector3(-0.7, 0.1, 0.3), 0.55);
}

export function buildConceptFilamentous(
  collector: ModelCollector,
  quality: 'high' | 'low',
): void {
  const coat = createHelicalCoat({
    length: 6.4,
    radius: 0.57,
    strands: quality === 'high' ? 4 : 3,
    units: quality === 'high' ? 56 : 34,
    unitRadius: 0.1,
    color: COLORS.capsomer,
  });
  collector.root.add(coat.mesh);
  register(collector, coat.mesh, 'coat-protein', 'capsid', true);
  registerPartAlias(collector, coat.mesh, 'capsid');
  collector.instanceExplosions.push({ ...coat, distance: 0.82 });

  const genomePoints: THREE.Vector3[] = [];
  for (let index = 0; index <= 84; index += 1) {
    const t = index / 84;
    const angle = t * Math.PI * 10;
    genomePoints.push(
      new THREE.Vector3(Math.cos(angle) * 0.2, (t - 0.5) * 5.9, Math.sin(angle) * 0.2),
    );
  }
  addGenome(collector, createTube(genomePoints, 0.043, quality, false));
}

function createHelicalCoat(options: {
  length: number;
  radius: number;
  strands: number;
  units: number;
  unitRadius: number;
  color: number;
  bend?: number;
}): Omit<InstanceExplosion, 'distance'> {
  const total = options.strands * options.units;
  const geometry = new THREE.CapsuleGeometry(
    options.unitRadius,
    options.unitRadius * 1.7,
    3,
    6,
  );
  const mesh = new THREE.InstancedMesh(
    geometry,
    standardMaterial(options.color),
    total,
  );
  const origins: THREE.Vector3[] = [];
  const directions: THREE.Vector3[] = [];
  const quaternions: THREE.Quaternion[] = [];
  const scales: THREE.Vector3[] = [];
  const matrix = new THREE.Matrix4();
  let cursor = 0;
  for (let strand = 0; strand < options.strands; strand += 1) {
    for (let index = 0; index < options.units; index += 1) {
      const t = index / (options.units - 1);
      const angle = t * Math.PI * 18 + (strand / options.strands) * Math.PI * 2;
      const bend = Math.sin(t * Math.PI * 1.5) * (options.bend ?? 0);
      const outward = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
      const origin = new THREE.Vector3(
        bend + outward.x * options.radius,
        (t - 0.5) * options.length,
        outward.z * options.radius,
      );
      const tangent = new THREE.Vector3(
        ((options.bend ?? 0) * Math.PI * 1.5 * Math.cos(t * Math.PI * 1.5)) /
          options.length,
        1,
        0,
      ).normalize();
      const quaternion = new THREE.Quaternion()
        .setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent)
        .multiply(new THREE.Quaternion().setFromAxisAngle(tangent, angle));
      const scale = new THREE.Vector3(1, 1, 1);
      matrix.compose(origin, quaternion, scale);
      mesh.setMatrixAt(cursor, matrix);
      origins.push(origin);
      directions.push(outward);
      quaternions.push(quaternion);
      scales.push(scale);
      cursor += 1;
    }
  }
  mesh.instanceMatrix.needsUpdate = true;
  mesh.computeBoundingBox();
  mesh.computeBoundingSphere();
  return { mesh, origins, directions, quaternions, scales };
}

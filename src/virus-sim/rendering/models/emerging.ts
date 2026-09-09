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

type Quality = 'high' | 'low';

export function buildFilovirus(collector: ModelCollector, quality: Quality): void {
  const points = filovirusCenterline(quality);
  const envelope = createTube(points, 0.58, quality, false, 0xc86d9d);
  envelope.material = physicalMaterial(0xc86d9d, 0.72);
  collector.root.add(envelope);
  register(collector, envelope, 'envelope', 'envelope', true);
  addObjectExplosion(collector, envelope, new THREE.Vector3(0.2, 0.65, 0.45), 0.68);

  const matrix = createTube(points, 0.47, quality, false, COLORS.matrix);
  matrix.material = physicalMaterial(COLORS.matrix, 0.56);
  collector.root.add(matrix);
  register(collector, matrix, 'matrix', 'matrix', true);
  addObjectExplosion(collector, matrix, new THREE.Vector3(-0.45, 0.2, 0.35), 0.58);

  const rnpPoints: THREE.Vector3[] = [];
  const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.45);
  const samples = quality === 'high' ? 180 : 96;
  for (let index = 0; index <= samples; index += 1) {
    const t = index / samples;
    const center = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t).normalize();
    const normal = new THREE.Vector3(0, 1, 0).cross(tangent);
    if (normal.lengthSq() < 0.01) normal.set(1, 0, 0);
    normal.normalize();
    const binormal = tangent.clone().cross(normal).normalize();
    const angle = t * Math.PI * 42;
    rnpPoints.push(
      center
        .clone()
        .addScaledVector(normal, Math.cos(angle) * 0.23)
        .addScaledVector(binormal, Math.sin(angle) * 0.23),
    );
  }
  const rnp = createTube(rnpPoints, 0.055, quality, false, COLORS.layerViolet);
  collector.root.add(rnp);
  register(collector, rnp, 'nucleocapsid', 'nucleocapsid');
  registerPartAlias(collector, rnp, 'genome');
  registerLayerAlias(collector, rnp, 'genome');
  collector.genomeObjects.push(rnp);
  addObjectExplosion(collector, rnp, new THREE.Vector3(0.5, -0.25, -0.3), 0.52);

  const spikeGroup = new THREE.Group();
  const spikeMaterial = standardMaterial(COLORS.spike);
  const spikeCount = quality === 'high' ? 108 : 54;
  for (let index = 0; index < spikeCount; index += 1) {
    const t = (index + 0.5) / spikeCount;
    const center = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t).normalize();
    const normal = new THREE.Vector3(0, 1, 0).cross(tangent);
    if (normal.lengthSq() < 0.01) normal.set(1, 0, 0);
    normal.normalize();
    const binormal = tangent.clone().cross(normal).normalize();
    const angle = index * 2.39996;
    const radial = normal
      .multiplyScalar(Math.cos(angle))
      .addScaledVector(binormal, Math.sin(angle))
      .normalize();
    const spike = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.045, 0.18, 2, 5),
      spikeMaterial,
    );
    spike.position.copy(center).addScaledVector(radial, 0.68);
    spike.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), radial);
    spikeGroup.add(spike);
  }
  collector.root.add(spikeGroup);
  register(collector, spikeGroup, 'spike', 'surface-protein', true);
  addObjectExplosion(collector, spikeGroup, new THREE.Vector3(0.4, 0.15, -0.55), 0.74);
}

export function buildLentivirus(collector: ModelCollector, quality: Quality): void {
  const envelope = new THREE.Mesh(
    new THREE.SphereGeometry(
      2.1,
      quality === 'high' ? 48 : 24,
      quality === 'high' ? 32 : 16,
    ),
    physicalMaterial(0xc66f9f, 0.72),
  );
  collector.root.add(envelope);
  register(collector, envelope, 'envelope', 'envelope', true);
  addObjectExplosion(collector, envelope, new THREE.Vector3(0.55, 0.15, 0.42), 0.74);

  const directions = fibonacciDirections(quality === 'high' ? 54 : 28);
  const spikes = createRadialInstances(
    new THREE.CapsuleGeometry(0.08, 0.3, 3, 6),
    standardMaterial(COLORS.spike),
    directions.map((direction) => direction.clone().multiplyScalar(2.35)),
    directions,
  );
  collector.root.add(spikes.mesh);
  register(collector, spikes.mesh, 'spike', 'surface-protein', true);
  collector.instanceExplosions.push({ ...spikes, distance: 0.78 });

  const matrix = new THREE.Mesh(
    new THREE.SphereGeometry(
      1.78,
      quality === 'high' ? 36 : 20,
      quality === 'high' ? 24 : 12,
    ),
    physicalMaterial(COLORS.matrix, 0.46),
  );
  collector.root.add(matrix);
  register(collector, matrix, 'matrix', 'matrix', true);
  addObjectExplosion(collector, matrix, new THREE.Vector3(-0.45, 0.25, 0.38), 0.62);

  const capsid = new THREE.Mesh(
    new THREE.ConeGeometry(0.82, 2.45, quality === 'high' ? 36 : 18, 1, true),
    physicalMaterial(COLORS.capsid, 0.84),
  );
  capsid.position.y = -0.08;
  collector.root.add(capsid);
  register(collector, capsid, 'capsid', 'capsid', true);
  addObjectExplosion(collector, capsid, new THREE.Vector3(0.48, -0.35, -0.3), 0.64);

  const genome = createGenomeCoil(0.5, 14, 0.045, quality, 2.1);
  genome.position.y = -0.15;
  addGenome(collector, genome, new THREE.Vector3(-0.45, -0.25, 0.45), 0.58);
}

export function buildCoronavirus(collector: ModelCollector, quality: Quality): void {
  const envelope = new THREE.Mesh(
    new THREE.SphereGeometry(
      2.08,
      quality === 'high' ? 48 : 24,
      quality === 'high' ? 32 : 16,
    ),
    physicalMaterial(0xba6b99, 0.74),
  );
  collector.root.add(envelope);
  register(collector, envelope, 'envelope', 'envelope', true);
  addObjectExplosion(collector, envelope, new THREE.Vector3(0.5, 0.2, 0.42), 0.72);

  const matrix = new THREE.Mesh(
    new THREE.SphereGeometry(
      1.78,
      quality === 'high' ? 36 : 18,
      quality === 'high' ? 24 : 12,
    ),
    physicalMaterial(COLORS.matrix, 0.46),
  );
  collector.root.add(matrix);
  register(collector, matrix, 'matrix', 'matrix', true);
  addObjectExplosion(collector, matrix, new THREE.Vector3(-0.5, 0.2, 0.36), 0.58);

  const directions = fibonacciDirections(quality === 'high' ? 68 : 34);
  const spikes = createRadialInstances(
    new THREE.CapsuleGeometry(0.105, 0.45, 3, 7),
    standardMaterial(COLORS.spike),
    directions.map((direction) => direction.clone().multiplyScalar(2.48)),
    directions,
    new THREE.Vector3(1.1, 1, 1.1),
  );
  collector.root.add(spikes.mesh);
  register(collector, spikes.mesh, 'spike', 'surface-protein', true);
  collector.instanceExplosions.push({ ...spikes, distance: 0.84 });

  const rnp = new THREE.Group();
  for (let strand = 0; strand < 3; strand += 1) {
    const points: THREE.Vector3[] = [];
    const count = quality === 'high' ? 72 : 42;
    for (let index = 0; index <= count; index += 1) {
      const t = index / count;
      const angle = t * Math.PI * 8 + strand * 2.1;
      const radius = 0.58 + 0.28 * Math.sin(t * Math.PI);
      points.push(
        new THREE.Vector3(
          Math.cos(angle) * radius,
          (t - 0.5) * 2.3 + (strand - 1) * 0.18,
          Math.sin(angle) * radius,
        ),
      );
    }
    rnp.add(
      createTube(
        points,
        0.07,
        quality,
        false,
        strand === 1 ? 0xc7a1ff : COLORS.layerViolet,
      ),
    );
  }
  collector.root.add(rnp);
  register(collector, rnp, 'nucleocapsid', 'nucleocapsid');
  registerPartAlias(collector, rnp, 'genome');
  registerLayerAlias(collector, rnp, 'genome');
  collector.genomeObjects.push(rnp);
  addObjectExplosion(collector, rnp, new THREE.Vector3(0.52, -0.3, -0.34), 0.6);
}

function filovirusCenterline(quality: Quality): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  const count = quality === 'high' ? 72 : 40;
  for (let index = 0; index <= count; index += 1) {
    const t = index / count;
    const angle = (t - 0.5) * Math.PI * 1.32;
    points.push(
      new THREE.Vector3(
        Math.sin(angle) * 3.15,
        (t - 0.5) * 3.1 + Math.cos(t * Math.PI * 2) * 0.22,
        Math.cos(angle) * 1.05 - 0.38,
      ),
    );
  }
  return points;
}

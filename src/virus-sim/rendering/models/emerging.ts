import * as THREE from 'three';
import type { ModelCollector } from './shared';
import {
  COLORS,
  addGenome,
  addObjectExplosion,
  createGenomeCoil,
  createRadialInstances,
  createTube,
  physicalMaterial,
  register,
  registerLayerAlias,
  registerPartAlias,
  standardMaterial,
} from './shared';
import {
  createConicalCore,
  createLipidEnvelope,
  createMatrixShell,
  createSurfaceProteinInstances,
} from './components';
import { getCoronavirusRenderProfile } from '../../catalog/envelopedProfiles';

type Quality = 'high' | 'low';

export function buildFilovirus(collector: ModelCollector, quality: Quality): void {
  collector.root.userData.envelopedFamily = 'filovirus';
  collector.root.userData.familyModel = true;
  const points = filovirusCenterline(quality);
  const envelope = createTube(points, 0.58, quality, false, 0xc86d9d);
  envelope.name = 'filovirus-tubular-envelope';
  envelope.material = physicalMaterial(0xc86d9d, 0.72);
  collector.root.add(envelope);
  register(collector, envelope, 'envelope', 'envelope', true);
  addObjectExplosion(collector, envelope, new THREE.Vector3(0.2, 0.65, 0.45), 0.68);

  const matrix = createTube(points, 0.47, quality, false, COLORS.matrix);
  matrix.name = 'filovirus-tubular-matrix';
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
  rnp.name = 'filovirus-helical-rnp';
  collector.root.add(rnp);
  register(collector, rnp, 'nucleocapsid', 'nucleocapsid');
  registerPartAlias(collector, rnp, 'genome');
  registerLayerAlias(collector, rnp, 'genome');
  collector.genomeObjects.push(rnp);
  addObjectExplosion(collector, rnp, new THREE.Vector3(0.5, -0.25, -0.3), 0.52);

  const spikeCount = quality === 'high' ? 108 : 54;
  const spikeOrigins: THREE.Vector3[] = [];
  const spikeDirections: THREE.Vector3[] = [];
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
    spikeOrigins.push(center.clone().addScaledVector(radial, 0.68));
    spikeDirections.push(radial);
  }
  const spikes = createRadialInstances(
    new THREE.CapsuleGeometry(0.045, 0.18, 2, 5),
    standardMaterial(COLORS.spike),
    spikeOrigins,
    spikeDirections,
  );
  spikes.mesh.name = 'filovirus-gp-array';
  collector.root.add(spikes.mesh);
  register(collector, spikes.mesh, 'spike', 'surface-protein', true);
  collector.instanceExplosions.push({ ...spikes, distance: 0.74 });
}

export function buildLentivirus(collector: ModelCollector, quality: Quality): void {
  collector.root.userData.envelopedFamily = 'lentivirus';
  collector.root.userData.familyModel = collector.definition.id === 'hiv-2';
  const envelope = createLipidEnvelope(2.1, quality, 0xc66f9f, 0.72);
  envelope.name = 'lentivirus-envelope';
  collector.root.add(envelope);
  register(collector, envelope, 'envelope', 'envelope', true);
  addObjectExplosion(collector, envelope, new THREE.Vector3(0.55, 0.15, 0.42), 0.74);

  const sparseEnv = collector.signature?.surfaceComponents.some(
    (component) => component.relativeAbundance === 'sparse',
  );
  const spikes = createSurfaceProteinInstances({
    id: 'env',
    radius: 2.35,
    count: quality === 'high' ? (sparseEnv ? 22 : 40) : sparseEnv ? 12 : 22,
    shape: 'club',
    color: COLORS.spike,
    scale: new THREE.Vector3(0.82, 1, 0.82),
  });
  collector.root.add(spikes.mesh);
  register(collector, spikes.mesh, 'spike', 'surface-protein', true);
  collector.instanceExplosions.push({ ...spikes, distance: 0.78 });

  const matrix = createMatrixShell(1.78, quality, 0.46);
  matrix.name = 'lentivirus-matrix';
  collector.root.add(matrix);
  register(collector, matrix, 'matrix', 'matrix', true);
  addObjectExplosion(collector, matrix, new THREE.Vector3(-0.45, 0.25, 0.38), 0.62);

  const capsid = createConicalCore(quality);
  capsid.name = 'lentivirus-conical-core';
  capsid.position.y = -0.08;
  collector.root.add(capsid);
  register(collector, capsid, 'capsid', 'capsid', true);
  addObjectExplosion(collector, capsid, new THREE.Vector3(0.48, -0.35, -0.3), 0.64);

  const genome = new THREE.Group();
  genome.name = 'lentivirus-paired-rna';
  for (const side of [-1, 1]) {
    const strand = createGenomeCoil(0.34, 12, 0.038, quality, 2);
    strand.position.set(side * 0.2, -0.15, 0);
    genome.add(strand);
  }
  addGenome(collector, genome, new THREE.Vector3(-0.45, -0.25, 0.45), 0.58);
}

export function buildCoronavirus(collector: ModelCollector, quality: Quality): void {
  const profile = getCoronavirusRenderProfile(collector.definition.id);
  collector.root.userData.envelopedFamily = 'coronavirus';
  collector.root.userData.envelopedProfileId = profile.id;

  const envelope = createLipidEnvelope(profile.envelopeRadius, quality, 0xba6b99, 0.74);
  envelope.name = 'coronavirus-envelope';
  envelope.scale.set(...profile.envelopeScale);
  collector.root.add(envelope);
  register(collector, envelope, 'envelope', 'envelope', true);
  addObjectExplosion(collector, envelope, new THREE.Vector3(0.5, 0.2, 0.42), 0.72);

  const matrix = createMatrixShell(profile.matrixRadius, quality, 0.46);
  matrix.name = 'coronavirus-membrane-layer';
  collector.root.add(matrix);
  register(collector, matrix, 'matrix', 'matrix', true);
  addObjectExplosion(collector, matrix, new THREE.Vector3(-0.5, 0.2, 0.36), 0.58);

  profile.surface.forEach((component, index) => {
    const surface = createSurfaceProteinInstances({
      id: component.id,
      radius: component.radius,
      count: quality === 'high' ? component.highCount : component.lowCount,
      shape: component.shape,
      color: component.color,
      scale: component.shape === 'crown' ? new THREE.Vector3(1.08, 1, 1.08) : undefined,
    });
    collector.root.add(surface.mesh);
    register(collector, surface.mesh, 'spike', 'surface-protein', true);
    collector.instanceExplosions.push({ ...surface, distance: 0.78 + index * 0.04 });
  });

  const rnp = new THREE.Group();
  rnp.name = 'coronavirus-helical-rnp';
  for (let strand = 0; strand < profile.rnpStrands; strand += 1) {
    const points: THREE.Vector3[] = [];
    const count = quality === 'high' ? 72 : 42;
    for (let index = 0; index <= count; index += 1) {
      const t = index / count;
      const angle = t * Math.PI * 8 + strand * 2.1;
      const radius = 0.58 + 0.28 * Math.sin(t * Math.PI);
      points.push(
        new THREE.Vector3(
          Math.cos(angle) * radius,
          (t - 0.5) * 2.3 + (strand - (profile.rnpStrands - 1) / 2) * 0.16,
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

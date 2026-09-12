import * as THREE from 'three';
import { getHumanRnpProfile } from '../../catalog/humanExpansionProfiles';
import type { ModelCollector } from './shared';
import {
  COLORS,
  addGenome,
  addObjectExplosion,
  createGenomeCoil,
  register,
  registerLayerAlias,
  registerPartAlias,
} from './shared';
import {
  createIcosahedralShell,
  createLipidEnvelope,
  createMatrixShell,
  createSegmentedRnp,
  createSurfaceProteinInstances,
} from './components';

type Quality = 'high' | 'low';

export function buildHumanRnpVirus(collector: ModelCollector, quality: Quality): void {
  const profile = getHumanRnpProfile(collector.definition.id);
  collector.root.userData.envelopedFamily = profile.family;
  collector.root.userData.humanRnpProfileId = profile.id;

  const envelope = createLipidEnvelope(profile.envelopeRadius, quality, 0xb96898, 0.72);
  envelope.name = `${profile.family}-envelope`;
  envelope.scale.set(...profile.envelopeScale);
  collector.root.add(envelope);
  register(collector, envelope, 'envelope', 'envelope', true);
  addObjectExplosion(collector, envelope, new THREE.Vector3(0.52, 0.2, 0.42), 0.76);

  profile.surfaces.forEach((component, index) => {
    const surface = createSurfaceProteinInstances({
      id: component.id,
      radius: profile.envelopeRadius + component.radiusOffset,
      count: quality === 'high' ? component.highCount : component.lowCount,
      shape: component.shape,
      color: component.color,
    });
    collector.root.add(surface.mesh);
    register(collector, surface.mesh, 'spike', 'surface-protein', true);
    collector.instanceExplosions.push({ ...surface, distance: 0.8 + index * 0.04 });
  });

  if (profile.matrix) {
    const matrix = createMatrixShell(profile.envelopeRadius * 0.84, quality, 0.5);
    matrix.name = `${profile.family}-matrix`;
    collector.root.add(matrix);
    register(collector, matrix, 'matrix', 'matrix', true);
    addObjectExplosion(collector, matrix, new THREE.Vector3(-0.5, 0.28, 0.36), 0.66);
  }

  if (profile.core === 'icosahedral') {
    const core = createIcosahedralShell(
      profile.envelopeRadius * 0.58,
      quality,
      COLORS.capsid,
      0.76,
    );
    core.name = `${profile.family}-nucleocapsid-core`;
    collector.root.add(core);
    register(collector, core, 'nucleocapsid', 'nucleocapsid', true);
    addObjectExplosion(collector, core, new THREE.Vector3(-0.48, 0.3, 0.36), 0.62);
    const genome = createGenomeCoil(
      profile.envelopeRadius * 0.3,
      11,
      0.038,
      quality,
      1.18,
    );
    genome.name = `${profile.family}-positive-rna`;
    addGenome(collector, genome, new THREE.Vector3(0.45, -0.34, -0.4), 0.56);
    return;
  }

  const rnp =
    profile.core === 'segmented'
      ? createSegmentedRnp(profile.segmentCount ?? 3, quality)
      : createHelicalRnp(profile.envelopeRadius * 0.58, quality);
  rnp.name = `${profile.family}-${profile.core}-rnp`;
  collector.root.add(rnp);
  register(collector, rnp, 'nucleocapsid', 'nucleocapsid');
  registerPartAlias(collector, rnp, 'genome');
  registerLayerAlias(collector, rnp, 'genome');
  collector.genomeObjects.push(rnp);
  addObjectExplosion(collector, rnp, new THREE.Vector3(0.48, -0.34, -0.36), 0.62);
}

function createHelicalRnp(radius: number, quality: Quality): THREE.Group {
  const group = new THREE.Group();
  for (let strand = 0; strand < 3; strand += 1) {
    const coil = createGenomeCoil(radius * (0.72 + strand * 0.08), 8, 0.055, quality);
    coil.rotation.set(strand * 0.52, strand * 0.38, strand * 0.74);
    group.add(coil);
  }
  return group;
}

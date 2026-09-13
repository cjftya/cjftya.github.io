import * as THREE from 'three';
import {
  getHumanRnpEvidence,
  getHumanRnpProfile,
} from '../../catalog/humanExpansionProfiles';
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
} from './components';
import {
  createGridLikeRnpCore,
  createIrregularRnpCore,
  createLipoproteinPatches,
  createOrganizedSurfaceInstances,
  createPleomorphicEnvelope,
} from './humanRnpGeometry';

type Quality = 'high' | 'low';

export function buildHumanRnpVirus(collector: ModelCollector, quality: Quality): void {
  const profile = getHumanRnpProfile(collector.definition.id);
  collector.root.userData.envelopedFamily = profile.family;
  collector.root.userData.humanRnpProfileId = profile.id;
  collector.root.userData.surfaceOrganization = profile.surfaceOrganization;
  collector.root.userData.coreOrganization = profile.core;
  collector.root.userData.componentEvidence = getHumanRnpEvidence(
    profile,
    collector.definition.id,
  );

  const envelope = profile.envelopeDeformation
    ? createPleomorphicEnvelope(
        profile.envelopeRadius,
        quality,
        0xb96898,
        0.72,
        profile.envelopeDeformation,
      )
    : createLipidEnvelope(profile.envelopeRadius, quality, 0xb96898, 0.72);
  envelope.name = `${profile.family}-envelope`;
  envelope.scale.set(...profile.envelopeScale);
  collector.root.add(envelope);
  register(collector, envelope, 'envelope', 'envelope', true);
  addObjectExplosion(collector, envelope, new THREE.Vector3(0.52, 0.2, 0.42), 0.76);

  profile.surfaces.forEach((component, index) => {
    const surface = createOrganizedSurfaceInstances({
      component,
      organization: profile.surfaceOrganization,
      radius: profile.envelopeRadius + component.radiusOffset,
      envelopeScale: profile.envelopeScale,
      quality,
    });
    collector.root.add(surface.mesh);
    register(collector, surface.mesh, 'spike', 'surface-protein', true);
    collector.instanceExplosions.push({ ...surface, distance: 0.8 + index * 0.04 });
  });

  if (profile.surfaceOrganization === 'irregular-patches') {
    const patches = createLipoproteinPatches(
      profile.envelopeRadius,
      quality,
      profile.envelopeScale,
    );
    collector.root.add(patches);
    register(collector, patches, 'spike', 'surface-protein', true);
    addObjectExplosion(collector, patches, new THREE.Vector3(0.42, 0.44, -0.3), 0.78);
  }

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

  if (profile.core === 'irregular-rnp' || profile.core === 'grid-like-rnp') {
    const core =
      profile.core === 'grid-like-rnp'
        ? createGridLikeRnpCore(profile.envelopeRadius * 0.64, quality)
        : createIrregularRnpCore(profile.envelopeRadius * 0.64, quality);
    core.name = `${profile.family}-${profile.core}`;
    collector.root.add(core);
    register(collector, core, 'nucleocapsid', 'nucleocapsid');
    addObjectExplosion(collector, core, new THREE.Vector3(-0.48, 0.3, 0.36), 0.62);

    const genome = createGenomeCoil(
      profile.envelopeRadius * 0.3,
      profile.core === 'grid-like-rnp' ? 9 : 7,
      0.038,
      quality,
      1.08,
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

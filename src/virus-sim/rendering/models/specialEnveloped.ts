import * as THREE from 'three';
import { getGeometryProfile } from '../../catalog/geometryProfiles';
import type { ModelCollector } from './shared';
import {
  COLORS,
  addGenome,
  addObjectExplosion,
  createGenomeCoil,
  register,
} from './shared';
import {
  createCapsomerInstances,
  createIcosahedralShell,
  createLipidEnvelope,
  createPartiallyDoubleStrandedGenome,
  createSegmentedRnp,
  createSurfaceProteinInstances,
} from './components';

type Quality = 'high' | 'low';

export function buildHBV(collector: ModelCollector, quality: Quality): void {
  const profile = getGeometryProfile(collector.definition.geometryProfileId);
  collector.root.userData.envelopedFamily = 'hepadnavirus';

  const envelope = createLipidEnvelope(profile.radius, quality, 0xd477ad, 0.7);
  envelope.name = 'hbv-dane-envelope';
  collector.root.add(envelope);
  register(collector, envelope, 'envelope', 'envelope', true);
  addObjectExplosion(collector, envelope, new THREE.Vector3(0.52, 0.2, 0.4), 0.7);

  const surface = createSurfaceProteinInstances({
    id: 'hbsag',
    radius: profile.radius + 0.11,
    count: quality === 'high' ? 34 : 18,
    shape: 'knob',
    color: COLORS.spike,
    scale: new THREE.Vector3(0.72, 0.55, 0.72),
  });
  collector.root.add(surface.mesh);
  register(collector, surface.mesh, 'spike', 'surface-protein', true);
  collector.instanceExplosions.push({ ...surface, distance: 0.74 });

  const core = createIcosahedralShell(
    profile.radius * 0.64,
    quality,
    COLORS.capsid,
    0.84,
  );
  core.name = 'hbv-icosahedral-core';
  collector.root.add(core);
  register(collector, core, 'core-capsid', 'core-capsid', true);
  addObjectExplosion(collector, core, new THREE.Vector3(-0.55, 0.22, 0.4), 0.64);

  const capsomers = createCapsomerInstances(
    profile.radius * 0.67,
    quality === 'high' ? 42 : 22,
  );
  collector.root.add(capsomers.mesh);
  register(collector, capsomers.mesh, 'capsomer', 'core-capsid', true);
  collector.instanceExplosions.push({ ...capsomers, distance: 0.58 });

  const genome = createPartiallyDoubleStrandedGenome(quality);
  genome.rotation.x = Math.PI / 2.8;
  addGenome(collector, genome, new THREE.Vector3(0.48, -0.32, -0.42), 0.54);
}

export function buildAlphavirus(collector: ModelCollector, quality: Quality): void {
  const profile = getGeometryProfile(collector.definition.geometryProfileId);
  collector.root.userData.envelopedFamily = 'alphavirus';

  const envelope = createLipidEnvelope(profile.radius, quality, 0xb96898, 0.64);
  envelope.name = 'alphavirus-envelope';
  collector.root.add(envelope);
  register(collector, envelope, 'envelope', 'envelope', true);
  addObjectExplosion(collector, envelope, new THREE.Vector3(0.52, 0.22, 0.4), 0.72);

  const surface = createSurfaceProteinInstances({
    id: 'e1-e2-trimer',
    radius: profile.radius + (profile.protrusion ?? 0.26) * 0.7,
    count:
      quality === 'high'
        ? (profile.spikeCount ?? 52)
        : Math.ceil((profile.spikeCount ?? 52) * 0.5),
    shape: 'cone',
    color: COLORS.spike,
    scale: new THREE.Vector3(1.08, 0.88, 1.08),
  });
  collector.root.add(surface.mesh);
  register(collector, surface.mesh, 'spike', 'surface-protein', true);
  collector.instanceExplosions.push({ ...surface, distance: 0.8 });

  const coreRadius = profile.radius * 0.66;
  const core = createIcosahedralShell(coreRadius, quality, COLORS.capsid, 0.8);
  core.name = 'alphavirus-icosahedral-nucleocapsid';
  collector.root.add(core);
  register(collector, core, 'nucleocapsid', 'nucleocapsid', true);
  addObjectExplosion(collector, core, new THREE.Vector3(-0.5, 0.3, 0.38), 0.66);

  const capsomers = createCapsomerInstances(
    coreRadius * 1.03,
    quality === 'high' ? (profile.unitCount ?? 42) : 22,
  );
  collector.root.add(capsomers.mesh);
  register(collector, capsomers.mesh, 'capsomer', 'nucleocapsid', true);
  collector.instanceExplosions.push({ ...capsomers, distance: 0.62 });

  const genome = createGenomeCoil(coreRadius * 0.48, 12, 0.038, quality, 1.05);
  addGenome(collector, genome, new THREE.Vector3(0.48, -0.32, -0.42), 0.58);
}

export function buildCystovirus(collector: ModelCollector, quality: Quality): void {
  const profile = getGeometryProfile(collector.definition.geometryProfileId);
  collector.root.userData.envelopedFamily = 'cystovirus';

  const envelope = createLipidEnvelope(profile.radius, quality, 0xc56d9c, 0.62);
  envelope.name = 'phi6-envelope';
  envelope.scale.set(1.03, 0.98, 1);
  collector.root.add(envelope);
  register(collector, envelope, 'envelope', 'envelope', true);
  addObjectExplosion(collector, envelope, new THREE.Vector3(0.52, 0.18, 0.42), 0.76);

  const surface = createSurfaceProteinInstances({
    id: 'attachment-protein',
    radius: profile.radius + 0.25,
    count: quality === 'high' ? (profile.spikeCount ?? 28) : 14,
    shape: 'club',
    color: COLORS.spike,
    scale: new THREE.Vector3(0.78, 0.84, 0.78),
  });
  collector.root.add(surface.mesh);
  register(collector, surface.mesh, 'spike', 'surface-protein', true);
  collector.instanceExplosions.push({ ...surface, distance: 0.8 });

  const outerCore = createIcosahedralShell(
    profile.radius * 0.72,
    quality,
    COLORS.layerBlue,
    0.72,
  );
  outerCore.name = 'phi6-outer-core';
  collector.root.add(outerCore);
  register(collector, outerCore, 'outer-capsid', 'outer-capsid', true);
  addObjectExplosion(collector, outerCore, new THREE.Vector3(-0.55, 0.28, 0.35), 0.66);

  const innerCore = createIcosahedralShell(
    profile.radius * 0.52,
    quality,
    COLORS.layerViolet,
    0.82,
  );
  innerCore.name = 'phi6-inner-core';
  collector.root.add(innerCore);
  register(collector, innerCore, 'core-capsid', 'core-capsid', true);
  addObjectExplosion(collector, innerCore, new THREE.Vector3(0.45, -0.38, 0.4), 0.58);

  const genome = createSegmentedRnp(3, quality);
  genome.name = 'phi6-three-dsrna-segments';
  genome.scale.setScalar(0.72);
  addGenome(collector, genome, new THREE.Vector3(0.48, -0.3, -0.44), 0.54);
}

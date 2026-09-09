import * as THREE from 'three';
import { getCapsidSignatureProfile } from '../../catalog/capsidProfiles';
import { getGeometryProfile } from '../../catalog/geometryProfiles';
import type { GenomeOrganization } from '../../catalog/structuralTypes';
import type { ObservationLayerId, ObservationPartId } from '../../observation/types';
import {
  createDimpleInstances,
  createFacetedShell,
  createOrderedCapsomerInstances,
  createVertexFeatureInstances,
} from './capsidComponents';
import { createSegmentedRnp } from './components';
import type { ModelCollector } from './shared';
import {
  COLORS,
  addGenome,
  addObjectExplosion,
  createGenomeCoil,
  register,
  registerLayerAlias,
  registerPartAlias,
  standardMaterial,
} from './shared';

type Quality = 'high' | 'low';

export function buildSignatureIcosahedral(
  collector: ModelCollector,
  quality: Quality,
): void {
  const profile = getGeometryProfile(collector.definition.geometryProfileId);
  const signatureProfile = getCapsidSignatureProfile(collector.definition.id);
  const topology = collector.signature?.icosahedral;
  if (!signatureProfile || !topology) {
    throw new Error(
      `Missing icosahedral signature profile: ${collector.definition.id}`,
    );
  }

  collector.root.userData.capsidProfileId = signatureProfile.id;
  collector.root.userData.surfacePattern = topology.shell.surfacePattern;
  collector.root.userData.capsomerOrganization = topology.capsomerOrganization;
  collector.root.userData.familyModel = signatureProfile.virusIds.length > 1;

  const shell = createFacetedShell({
    radius: profile.radius,
    quality,
    faceting: topology.shell.faceting,
    opacity: topology.shell.faceting === 'smooth' ? 0.76 : 0.82,
  });
  collector.root.add(shell);
  register(collector, shell, 'capsid', 'capsid', true);
  addObjectExplosion(collector, shell, new THREE.Vector3(-0.45, 0.42, 0.28), 0.56);

  const requestedUnits = profile.unitCount ?? 42;
  const unitCount =
    quality === 'high'
      ? requestedUnits
      : Math.max(12, Math.ceil(requestedUnits * 0.52));
  const units = createOrderedCapsomerInstances({
    radius: profile.radius,
    count: unitCount,
    quality,
    pattern: topology.shell.surfacePattern,
    unitScale: profile.unitScale ?? 0.15,
    protrusion: profile.protrusion ?? 0.06,
    scaleMultiplier: topology.surfaceDomainScale,
  });
  collector.root.add(units.mesh);
  const unitsPart = surfaceUnitPart(collector, topology.shell.surfacePattern);
  const unitsLayer = preferredLayer(collector, [
    topology.shell.surfacePattern === 'protruding-domain' ||
    topology.shell.surfacePattern === 'plant-protruding'
      ? 'surface-protein'
      : 'capsid',
    'capsid',
  ]);
  register(collector, units.mesh, unitsPart, unitsLayer, true);
  collector.instanceExplosions.push({ ...units, distance: 0.74 });

  if (collector.definition.parts.includes('capsomer') && unitsPart !== 'capsomer') {
    registerPartAlias(collector, units.mesh, 'capsomer');
  }
  if (
    collector.definition.parts.includes('surface-domain') &&
    unitsPart !== 'surface-domain'
  ) {
    registerPartAlias(collector, units.mesh, 'surface-domain');
  }

  let featureObject: THREE.Object3D = units.mesh;
  if (
    topology.shell.surfacePattern === 'dimpled' ||
    topology.shell.surfacePattern === 'channelled'
  ) {
    const dimples = createDimpleInstances({
      radius: profile.radius,
      count: profile.spikeCount ?? (quality === 'high' ? 20 : 12),
      quality,
      scale: topology.surfaceDomainScale ?? 1,
      channelled: topology.shell.surfacePattern === 'channelled',
    });
    collector.root.add(dimples.mesh);
    register(collector, dimples.mesh, 'surface-domain', 'capsid', true);
    collector.instanceExplosions.push({ ...dimples, distance: 0.8 });
    if (collector.definition.parts.includes('channel')) {
      registerPartAlias(collector, dimples.mesh, 'channel');
    }
    featureObject = dimples.mesh;
  }

  if (topology.vertexFeature) {
    const vertexInstances = createVertexFeatureInstances({
      radius: profile.radius,
      quality,
      feature: topology.vertexFeature,
    });
    const group = new THREE.Group();
    group.name = `vertex-feature-${topology.vertexFeature.kind}`;
    for (const item of vertexInstances) {
      group.add(item.mesh);
      collector.instanceExplosions.push({ ...item, distance: 0.86 });
    }
    collector.root.add(group);
    const partId = topology.vertexFeature.kind === 'turret' ? 'turret' : 'spike';
    register(
      collector,
      group,
      preferredPart(collector, [partId, 'surface-domain']),
      preferredLayer(collector, ['surface-protein', 'capsid']),
      true,
    );
    featureObject = group;
  }

  if (topology.asymmetricFeature === 'maturation-protein') {
    const maturation = createMaturationProtein(profile.radius, quality);
    collector.root.add(maturation);
    register(collector, maturation, 'maturation-protein', 'capsid', true);
    addObjectExplosion(collector, maturation, new THREE.Vector3(1, 0.08, 0.03), 0.84);
    featureObject = maturation;
  }

  const genome = createCapsidGenome(
    collector.signature?.genomeOrganization ?? 'single-rna-core',
    topology.genomeSegmentCount,
    profile.radius,
    quality,
  );
  addGenome(collector, genome, new THREE.Vector3(0.36, -0.48, 0.42), 0.66);
  completeAliases(collector, shell, units.mesh, featureObject, genome);
}

function createMaturationProtein(radius: number, quality: Quality): THREE.Group {
  const group = new THREE.Group();
  group.name = 'asymmetric-maturation-protein';
  const material = standardMaterial(COLORS.receptor);
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(
      0.14,
      0.28,
      quality === 'high' ? 5 : 3,
      quality === 'high' ? 9 : 6,
    ),
    material,
  );
  body.rotation.z = Math.PI / 2;
  body.position.x = radius * 1.01;
  const tip = new THREE.Mesh(
    new THREE.ConeGeometry(0.13, 0.32, quality === 'high' ? 9 : 6),
    material,
  );
  tip.rotation.z = -Math.PI / 2;
  tip.position.x = radius + 0.31;
  group.add(body, tip);
  return group;
}

function createCapsidGenome(
  organization: GenomeOrganization,
  segmentCount: number | undefined,
  radius: number,
  quality: Quality,
): THREE.Object3D {
  if (segmentCount && segmentCount > 1) {
    const segments = createSegmentedRnp(segmentCount, quality);
    segments.name = `icosahedral-${segmentCount}-genome-segments`;
    segments.scale.setScalar(radius * 0.55);
    return segments;
  }
  if (organization === 'circular-dna-core') {
    const group = new THREE.Group();
    group.name = 'circular-dna-core';
    for (const [index, scale] of [0.48, 0.62].entries()) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(
          radius * scale,
          quality === 'high' ? 0.035 : 0.045,
          quality === 'high' ? 8 : 5,
          quality === 'high' ? 48 : 24,
        ),
        standardMaterial(COLORS.genome, 1, 0x3b176b),
      );
      ring.rotation.set(index * 0.62, index * 0.4, index * 0.28);
      group.add(ring);
    }
    return group;
  }
  const turns = organization.includes('dna') ? 15 : 11;
  const genome = createGenomeCoil(radius * 0.52, turns, 0.038, quality, 1.15);
  genome.name = `genome-${organization}`;
  return genome;
}

function surfaceUnitPart(
  collector: ModelCollector,
  pattern: string,
): ObservationPartId {
  const domainPattern = [
    'pentameric',
    'protruding-domain',
    'plant-soft',
    'plant-pseudo-t3',
    'plant-protruding',
    'plant-rounded',
  ].includes(pattern);
  return preferredPart(
    collector,
    domainPattern ? ['surface-domain', 'capsomer'] : ['capsomer', 'surface-domain'],
  );
}

function preferredPart(
  collector: ModelCollector,
  candidates: readonly ObservationPartId[],
): ObservationPartId {
  return (
    candidates.find((candidate) => collector.definition.parts.includes(candidate)) ??
    collector.definition.parts[0] ??
    'capsid'
  );
}

function preferredLayer(
  collector: ModelCollector,
  candidates: readonly ObservationLayerId[],
): ObservationLayerId {
  return (
    candidates.find((candidate) =>
      collector.definition.layers.some((layer) => layer.id === candidate),
    ) ??
    collector.definition.layers[0]?.id ??
    'capsid'
  );
}

function completeAliases(
  collector: ModelCollector,
  shell: THREE.Object3D,
  units: THREE.Object3D,
  feature: THREE.Object3D,
  genome: THREE.Object3D,
): void {
  for (const partId of collector.definition.parts) {
    if (collector.parts.has(partId)) continue;
    const target =
      partId === 'genome'
        ? genome
        : partId === 'capsomer'
          ? units
          : [
                'surface-domain',
                'channel',
                'spike',
                'turret',
                'maturation-protein',
              ].includes(partId)
            ? feature
            : shell;
    registerPartAlias(collector, target, partId);
  }
  for (const layer of collector.definition.layers) {
    if (collector.layers.has(layer.id)) continue;
    const target =
      layer.id === 'genome' ? genome : layer.id === 'surface-protein' ? feature : shell;
    registerLayerAlias(collector, target, layer.id);
  }
}

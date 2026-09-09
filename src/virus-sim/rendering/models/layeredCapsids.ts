import * as THREE from 'three';
import { getCapsidSignatureProfile } from '../../catalog/capsidProfiles';
import { getGeometryProfile } from '../../catalog/geometryProfiles';
import type {
  GenomeOrganization,
  LayeredCapsidLayerSignature,
} from '../../catalog/structuralTypes';
import type { ObservationLayerId } from '../../observation/types';
import {
  createLayerShell,
  createOrderedCapsomerInstances,
  createVertexFeatureInstances,
  getIcosahedralDirections,
  getIcosahedronVertices,
} from './capsidComponents';
import { createSegmentedRnp } from './components';
import type { ModelCollector } from './shared';
import {
  COLORS,
  addGenome,
  addObjectExplosion,
  createGenomeCoil,
  createRadialInstances,
  register,
  registerLayerAlias,
  registerPartAlias,
  standardMaterial,
} from './shared';

type Quality = 'high' | 'low';

const LAYER_COLORS: Readonly<Record<LayeredCapsidLayerSignature['role'], number>> = {
  capsid: COLORS.capsid,
  'outer-capsid': COLORS.capsid,
  'middle-capsid': COLORS.layerBlue,
  'core-capsid': COLORS.layerViolet,
  'inner-membrane': 0xd477ad,
};

const EXPLOSION_DIRECTIONS: Readonly<
  Record<LayeredCapsidLayerSignature['role'], THREE.Vector3>
> = {
  capsid: new THREE.Vector3(0.7, 0.16, 0.38),
  'outer-capsid': new THREE.Vector3(0.72, 0.18, 0.32),
  'middle-capsid': new THREE.Vector3(-0.58, 0.48, 0.28),
  'core-capsid': new THREE.Vector3(0.16, -0.76, -0.34),
  'inner-membrane': new THREE.Vector3(-0.5, -0.34, 0.58),
};

export function buildLayeredCapsid(collector: ModelCollector, quality: Quality): void {
  const profile = getGeometryProfile(collector.definition.geometryProfileId);
  const signatureProfile = getCapsidSignatureProfile(collector.definition.id);
  const topology = collector.signature?.layeredCapsid;
  if (!signatureProfile || !topology) {
    throw new Error(`Missing layered signature profile: ${collector.definition.id}`);
  }

  collector.root.userData.capsidProfileId = signatureProfile.id;
  collector.root.userData.layerRoles = topology.layers.map((item) => item.role);
  collector.root.userData.genomeSegmentCount = topology.genomeSegmentCount ?? 0;
  collector.root.userData.familyModel = signatureProfile.virusIds.length > 1;

  const layerObjects = new Map<string, THREE.Object3D>();
  for (const [index, layerSignature] of topology.layers.entries()) {
    const shell = createLayerShell({
      baseRadius: profile.radius,
      quality,
      signature: layerSignature,
      color: LAYER_COLORS[layerSignature.role],
    });
    collector.root.add(shell);
    register(collector, shell, layerSignature.role, layerSignature.role, true);
    addObjectExplosion(
      collector,
      shell,
      EXPLOSION_DIRECTIONS[layerSignature.role],
      0.58 + index * 0.13,
    );
    layerObjects.set(layerSignature.role, shell);
  }

  const outerLayer = topology.layers[0]!;
  const requestedUnits = profile.unitCount ?? 42;
  const unitCount =
    quality === 'high' ? requestedUnits : Math.max(12, Math.ceil(requestedUnits * 0.5));
  const units = createOrderedCapsomerInstances({
    radius: profile.radius * outerLayer.radiusScale,
    count: unitCount,
    quality,
    pattern:
      outerLayer.surfacePattern === 'porous-protein'
        ? 'plant-soft'
        : outerLayer.surfacePattern === 'smooth-protein'
          ? 'plant-rounded'
          : 'compact-t3',
    unitScale: profile.unitScale ?? 0.15,
    protrusion: profile.protrusion ?? 0.08,
    color:
      outerLayer.surfacePattern === 'porous-protein'
        ? COLORS.receptor
        : COLORS.capsomer,
  });
  collector.root.add(units.mesh);
  const outerPart = collector.definition.parts.includes('capsomer')
    ? 'capsomer'
    : outerLayer.role;
  register(collector, units.mesh, outerPart, outerLayer.role, true);
  collector.instanceExplosions.push({ ...units, distance: 0.74 });

  let featureObject: THREE.Object3D = units.mesh;
  if (topology.vertexFeature) {
    const instances = createVertexFeatureInstances({
      radius: profile.radius,
      quality,
      feature: topology.vertexFeature,
    });
    const turrets = new THREE.Group();
    turrets.name =
      collector.definition.id === 'stiv'
        ? 'stiv-wide-vertex-turrets'
        : 'reovirus-channelled-turrets';
    for (const item of instances) {
      turrets.add(item.mesh);
      collector.instanceExplosions.push({ ...item, distance: 0.92 });
    }
    collector.root.add(turrets);
    register(collector, turrets, 'turret', 'surface-protein', true);
    featureObject = turrets;
  } else if ((topology.projectionCount ?? 0) > 0) {
    const projections = createProjectionInstances(
      profile.radius,
      topology.projectionCount ?? 12,
      profile.protrusion ?? 0.14,
      quality,
      collector.definition.id === 'rotavirus-rrv' ? 'cone' : 'knob',
    );
    collector.root.add(projections.mesh);
    const projectionLayer = preferredLayer(collector, [
      'surface-protein',
      outerLayer.role,
    ]);
    register(collector, projections.mesh, 'spike', projectionLayer, true);
    collector.instanceExplosions.push({ ...projections, distance: 0.86 });
    featureObject = projections.mesh;
  }

  const genome = createLayeredGenome(
    collector.signature?.genomeOrganization ?? 'segmented-dsrna-core',
    topology.genomeSegmentCount,
    profile.radius,
    quality,
  );
  addGenome(collector, genome, new THREE.Vector3(-0.38, -0.5, 0.46), 0.7);
  completeAliases(collector, layerObjects, units.mesh, featureObject, genome);
}

function createProjectionInstances(
  radius: number,
  count: number,
  protrusion: number,
  quality: Quality,
  shape: 'cone' | 'knob',
) {
  const directions =
    count === 12 ? getIcosahedronVertices() : getIcosahedralDirections(quality, count);
  const length = Math.max(0.22, protrusion * 2.4);
  const geometry =
    shape === 'cone'
      ? new THREE.ConeGeometry(0.105, length, quality === 'high' ? 8 : 6)
      : new THREE.CapsuleGeometry(
          0.1,
          length * 0.55,
          quality === 'high' ? 4 : 2,
          quality === 'high' ? 7 : 5,
        );
  const result = createRadialInstances(
    geometry,
    standardMaterial(COLORS.layerGold),
    directions.map((direction) =>
      direction.clone().multiplyScalar(radius + length * 0.55),
    ),
    directions,
  );
  result.mesh.name = `layered-${shape}-projections`;
  return result;
}

function createLayeredGenome(
  organization: GenomeOrganization,
  segmentCount: number | undefined,
  radius: number,
  quality: Quality,
): THREE.Object3D {
  if (segmentCount && segmentCount > 0) {
    const genome = createSegmentedRnp(segmentCount, quality);
    genome.name = `layered-${segmentCount}-genome-segments`;
    genome.scale.setScalar(radius * 0.54);
    return genome;
  }
  const genome = createGenomeCoil(
    radius * 0.36,
    organization.includes('dna') ? 15 : 11,
    0.038,
    quality,
    1.12,
  );
  genome.name = `layered-genome-${organization}`;
  return genome;
}

function preferredLayer(
  collector: ModelCollector,
  candidates: readonly ObservationLayerId[],
): ObservationLayerId {
  return (
    candidates.find((candidate) =>
      collector.definition.layers.some((item) => item.id === candidate),
    ) ??
    collector.definition.layers[0]?.id ??
    'capsid'
  );
}

function completeAliases(
  collector: ModelCollector,
  layerObjects: ReadonlyMap<string, THREE.Object3D>,
  units: THREE.Object3D,
  feature: THREE.Object3D,
  genome: THREE.Object3D,
): void {
  const firstShell = layerObjects.values().next().value ?? units;
  for (const partId of collector.definition.parts) {
    if (collector.parts.has(partId)) continue;
    const target =
      partId === 'genome'
        ? genome
        : partId === 'capsomer'
          ? units
          : partId === 'spike' || partId === 'turret' || partId === 'surface-domain'
            ? feature
            : (layerObjects.get(partId) ?? firstShell);
    registerPartAlias(collector, target, partId);
  }
  for (const layer of collector.definition.layers) {
    if (collector.layers.has(layer.id)) continue;
    const target =
      layer.id === 'genome'
        ? genome
        : layer.id === 'surface-protein'
          ? feature
          : (layerObjects.get(layer.id) ?? firstShell);
    registerLayerAlias(collector, target, layer.id);
  }
}

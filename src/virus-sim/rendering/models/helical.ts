import * as THREE from 'three';
import type { HelicalSignature } from '../../catalog/structuralTypes';
import type { ModelCollector } from './shared';
import {
  COLORS,
  addGenome,
  addObjectExplosion,
  physicalMaterial,
  register,
  registerPartAlias,
} from './shared';
import {
  createBodyCenterline,
  createGenomeAlongPath,
  createHelicalCoat,
  createTerminalStructures,
} from './filamentComponents';

type Quality = 'high' | 'low';

export function buildTMV(collector: ModelCollector, quality: Quality): void {
  const signature = requiredHelicalSignature(collector);
  const path = createBodyCenterline(
    signature.centerline,
    signature.body.length,
    quality,
  );
  const coat = createHelicalCoat({
    path,
    radius: signature.body.radius,
    pitch: signature.body.pitch ?? 0.36,
    strandCount: quality === 'high' ? (signature.body.strandCount ?? 5) : 3,
    unitScale: signature.coat.unitScale,
    unitShape: signature.coat.unitShape,
    quality,
    name: 'tmv-ordered-helical-coat',
  });
  collector.root.add(coat.mesh);
  register(collector, coat.mesh, 'coat-protein', 'capsid', true);
  registerPartAlias(collector, coat.mesh, 'capsid');
  collector.instanceExplosions.push({ ...coat, distance: 0.82 });

  const support = new THREE.Mesh(
    new THREE.TubeGeometry(
      path.curve,
      quality === 'high' ? 92 : 48,
      signature.body.radius * 0.88,
      quality === 'high' ? 28 : 16,
      false,
    ),
    physicalMaterial(COLORS.capsidDark, 0.34, false),
  );
  support.name = 'tmv-support-shell';
  collector.root.add(support);
  register(collector, support, 'capsid', 'capsid', true);
  addObjectExplosion(collector, support, new THREE.Vector3(0.7, 0.05, -0.3), 0.42);

  const channel = new THREE.Mesh(
    new THREE.TubeGeometry(
      path.curve,
      quality === 'high' ? 92 : 48,
      signature.body.radius * (signature.channel?.radiusScale ?? 0.28),
      quality === 'high' ? 18 : 10,
      false,
    ),
    new THREE.MeshBasicMaterial({
      color: 0x061322,
      transparent: true,
      opacity: 0.82,
      side: THREE.DoubleSide,
    }),
  );
  channel.name = 'tmv-open-central-channel';
  collector.root.add(channel);
  register(collector, channel, 'channel', 'capsid');
  addObjectExplosion(collector, channel, new THREE.Vector3(-0.8, 0, 0.2), 0.52);

  const genome = createGenomeAlongPath({
    path,
    kind: signature.genomePath,
    radius: signature.body.radius * 0.59,
    pitch: signature.body.pitch ?? 0.36,
    quality,
    tubeRadius: 0.04,
    name: 'tmv-coat-bound-rna-helix',
  });
  addGenome(collector, genome, new THREE.Vector3(0.8, 0.05, 0.2), 0.62);
  markHelicalModel(collector, signature, path.points);
}

export function buildM13(collector: ModelCollector, quality: Quality): void {
  const signature = requiredHelicalSignature(collector);
  const path = createBodyCenterline(
    signature.centerline,
    signature.body.length,
    quality,
  );
  const coat = createHelicalCoat({
    path,
    radius: signature.body.radius,
    pitch: signature.body.pitch ?? 0.31,
    strandCount: quality === 'high' ? (signature.body.strandCount ?? 5) : 3,
    unitScale: signature.coat.unitScale,
    unitShape: signature.coat.unitShape,
    quality,
    color: 0x6fd8ce,
    name: 'm13-thin-helical-coat',
  });
  collector.root.add(coat.mesh);
  register(collector, coat.mesh, 'coat-protein', 'capsid', true);
  registerPartAlias(collector, coat.mesh, 'capsid');
  collector.instanceExplosions.push({ ...coat, distance: 0.5 });

  const genome = createGenomeAlongPath({
    path,
    kind: signature.genomePath,
    radius: signature.body.radius * 0.28,
    pitch: 0.82,
    quality,
    tubeRadius: 0.028,
    name: 'm13-centerline-ssdna',
  });
  addGenome(collector, genome, new THREE.Vector3(0.7, 0, 0.25), 0.48);

  const terminals = createTerminalStructures({
    path,
    signatures: signature.terminalStructures ?? [],
    bodyRadius: signature.body.radius,
    quality,
    name: 'm13-asymmetric-terminal-proteins',
  });
  collector.root.add(terminals);
  register(collector, terminals, 'terminal-protein', 'capsid', true);
  addObjectExplosion(collector, terminals, new THREE.Vector3(-0.7, 0.1, 0.3), 0.55);
  markHelicalModel(collector, signature, path.points);
}

function requiredHelicalSignature(collector: ModelCollector): HelicalSignature {
  const signature = collector.signature?.helical;
  if (!signature) {
    throw new Error(`Missing helical signature for ${collector.definition.id}`);
  }
  return signature;
}

function markHelicalModel(
  collector: ModelCollector,
  signature: HelicalSignature,
  points: readonly THREE.Vector3[],
): void {
  collector.root.userData.helicalProfileId = collector.signature?.profileId;
  collector.root.userData.rigidity = signature.rigidity;
  collector.root.userData.centerline = points.map((point) => point.toArray());
}

import * as THREE from 'three';
import type {
  HelicalSignature,
  SpecialGeometrySignature,
} from '../../catalog/structuralTypes';
import { getIcosahedralDirections } from './capsidComponents';
import {
  createBodyCenterline,
  createGenomeAlongPath,
  createHelicalCoat,
  createTerminalStructures,
} from './filamentComponents';
import type { ModelCollector } from './shared';
import {
  COLORS,
  addGenome,
  addObjectExplosion,
  createGenomeCoil,
  createRadialInstances,
  physicalMaterial,
  register,
  standardMaterial,
} from './shared';

type Quality = 'high' | 'low';

export function buildPlantFilament(collector: ModelCollector, quality: Quality): void {
  const signature = requiredHelicalSignature(collector);
  const path = createBodyCenterline(
    signature.centerline,
    signature.body.length,
    quality,
  );
  const shell = new THREE.Mesh(
    new THREE.TubeGeometry(
      path.curve,
      quality === 'high' ? 88 : 46,
      signature.body.radius * 0.86,
      quality === 'high' ? 16 : 9,
      false,
    ),
    physicalMaterial(COLORS.capsidDark, 0.38),
  );
  shell.name = `${collector.definition.id}-continuous-filament-shell`;
  collector.root.add(shell);
  register(collector, shell, 'capsid', 'capsid', true);
  addObjectExplosion(collector, shell, new THREE.Vector3(-0.6, 0.1, 0.35), 0.44);

  const coat = createHelicalCoat({
    path,
    radius: signature.body.radius,
    pitch: signature.body.pitch ?? 0.48,
    strandCount: quality === 'high' ? (signature.body.strandCount ?? 4) : 2,
    unitScale: signature.coat.unitScale,
    unitShape: signature.coat.unitShape,
    quality,
    name: `${collector.definition.id}-ordered-helical-coat`,
  });
  collector.root.add(coat.mesh);
  register(collector, coat.mesh, 'coat-protein', 'capsid', true);
  collector.instanceExplosions.push({ ...coat, distance: 0.62 });

  const genome = createGenomeAlongPath({
    path,
    kind: signature.genomePath,
    radius: signature.body.radius * 0.42,
    pitch: signature.body.pitch ?? 0.48,
    quality,
    name: `${collector.definition.id}-rna-path`,
  });
  addGenome(collector, genome, new THREE.Vector3(0.55, -0.12, -0.35), 0.5);

  const terminalSignatures =
    signature.terminalStructures ??
    ([{ end: 'both', kind: 'cap', count: 1, relativeLength: 0.16 }] as const);
  const terminals = createTerminalStructures({
    path,
    signatures: terminalSignatures,
    bodyRadius: signature.body.radius,
    quality,
    name: `${collector.definition.id}-terminal-caps`,
  });
  collector.root.add(terminals);
  register(collector, terminals, 'terminal-protein', 'capsid', true);
  addObjectExplosion(collector, terminals, new THREE.Vector3(0.45, 0.1, 0.5), 0.48);

  collector.root.userData.helicalProfileId = collector.signature?.profileId;
  collector.root.userData.rigidity = signature.rigidity;
  collector.root.userData.centerline = path.points.map((point) => point.toArray());
}

export function buildArchaealRod(collector: ModelCollector, quality: Quality): void {
  const signature = requiredSpecialSignature(collector, 'rod');
  const path = createBodyCenterline('straight', signature.body.length, quality);
  const shell = new THREE.Mesh(
    new THREE.CapsuleGeometry(
      signature.body.radius,
      signature.body.length - signature.body.radius * 2,
      quality === 'high' ? 8 : 4,
      quality === 'high' ? 20 : 12,
    ),
    physicalMaterial(COLORS.capsid, 0.76),
  );
  shell.name = 'sirv2-rigid-rod-shell';
  collector.root.add(shell);
  register(collector, shell, 'capsid', 'capsid', true);
  addObjectExplosion(collector, shell, new THREE.Vector3(-0.55, 0.1, 0.35), 0.48);

  const coat = createHelicalCoat({
    path,
    radius: signature.body.radius * 1.01,
    pitch: 0.52,
    strandCount: quality === 'high' ? 4 : 2,
    unitScale: signature.body.radius * 0.105,
    unitShape: 'disc-like',
    quality,
    color: COLORS.capsomer,
    name: 'sirv2-rigid-surface-organization',
  });
  collector.root.add(coat.mesh);
  register(collector, coat.mesh, 'coat-protein', 'capsid', true);
  collector.instanceExplosions.push({ ...coat, distance: 0.56 });

  const terminals = createTerminalStructures({
    path,
    signatures: signature.terminalStructures ?? [],
    bodyRadius: signature.body.radius,
    quality,
    name: 'sirv2-three-fibers-each-end',
  });
  collector.root.add(terminals);
  register(collector, terminals, 'terminal-tail', 'tail', true);
  addObjectExplosion(collector, terminals, new THREE.Vector3(0.5, 0.1, 0.45), 0.56);

  const genome = createGenomeAlongPath({
    path,
    kind: signature.genomePath,
    radius: signature.body.radius * 0.22,
    pitch: 0.7,
    quality,
    name: 'sirv2-linear-dsdna',
  });
  addGenome(collector, genome, new THREE.Vector3(0.48, -0.2, -0.4), 0.5);
  markSpecialModel(collector, signature, path.points);
}

export function buildSpindleVirus(collector: ModelCollector, quality: Quality): void {
  const signature = requiredSpecialSignature(collector, 'spindle');
  const body = createSpindleBody(signature, quality, 1, 0x9d7cc7, 0.76);
  body.name = `${collector.definition.id}-fusiform-outer-shell`;
  collector.root.add(body);
  register(collector, body, 'envelope', 'envelope', true);
  addObjectExplosion(collector, body, new THREE.Vector3(0.55, 0.15, 0.35), 0.62);

  const inner = createSpindleBody(signature, quality, 0.82, COLORS.capsidDark, 0.52);
  inner.name = `${collector.definition.id}-tapered-capsid-body`;
  collector.root.add(inner);
  register(collector, inner, 'capsid', 'capsid', true);
  addObjectExplosion(collector, inner, new THREE.Vector3(-0.52, 0.2, 0.38), 0.5);

  const path = createBodyCenterline('straight', signature.body.length, quality);
  const terminals = createTerminalStructures({
    path,
    signatures: signature.terminalStructures ?? [],
    bodyRadius: signature.body.radius,
    quality,
    name:
      collector.definition.id === 'atv'
        ? 'atv-two-opposed-terminal-tails'
        : 'ssv1-one-polar-fiber-crown',
  });
  collector.root.add(terminals);
  register(collector, terminals, 'terminal-tail', 'tail', true);
  addObjectExplosion(collector, terminals, new THREE.Vector3(0.32, -0.18, 0.5), 0.58);

  const genome =
    signature.genomePath === 'looped-path'
      ? createGenomeCoil(signature.body.radius * 0.46, 10, 0.035, quality, 3.2)
      : createGenomeAlongPath({
          path,
          kind: signature.genomePath,
          radius: signature.body.radius * 0.25,
          pitch: 0.76,
          quality,
          name: `${collector.definition.id}-axial-dsdna`,
        });
  genome.name = `${collector.definition.id}-interior-genome`;
  addGenome(collector, genome, new THREE.Vector3(-0.45, -0.2, -0.42), 0.48);
  markSpecialModel(collector, signature, path.points);
}

export function buildGeminateCapsid(collector: ModelCollector, quality: Quality): void {
  const signature = requiredSpecialSignature(collector, 'geminate');
  const isMsv = collector.definition.id === 'maize-streak';
  const radius = isMsv ? 1.22 : 1.18;
  const spacing = isMsv ? 1.45 : 1.36;
  const lobes = new THREE.Group();
  lobes.name = `${collector.definition.id}-faceted-twin-lobes`;
  for (const side of [-1, 1]) {
    const lobe = new THREE.Mesh(
      new THREE.IcosahedronGeometry(radius, quality === 'high' ? 2 : 1),
      physicalMaterial(COLORS.capsid, 0.76, true),
    );
    lobe.position.x = side * spacing * 0.52;
    lobe.scale.set(0.8, 1.08, 0.96);
    lobes.add(lobe);
  }
  collector.root.add(lobes);
  register(collector, lobes, 'capsid', 'capsid', true);
  addObjectExplosion(collector, lobes, new THREE.Vector3(0.25, 0.55, 0.32), 0.56);

  const directions = getIcosahedralDirections(quality, quality === 'high' ? 32 : 18);
  const origins: THREE.Vector3[] = [];
  const outward: THREE.Vector3[] = [];
  for (const side of [-1, 1]) {
    for (const direction of directions) {
      origins.push(
        new THREE.Vector3(
          side * spacing * 0.52 + direction.x * radius * 0.81,
          direction.y * radius * 1.09,
          direction.z * radius * 0.97,
        ),
      );
      outward.push(direction.clone());
    }
  }
  const capsomers = createRadialInstances(
    new THREE.CylinderGeometry(0.1, isMsv ? 0.16 : 0.145, 0.13, 5),
    standardMaterial(COLORS.capsomer),
    origins,
    outward,
  );
  capsomers.mesh.name = `${collector.definition.id}-paired-capsomer-lattices`;
  collector.root.add(capsomers.mesh);
  register(collector, capsomers.mesh, 'capsomer', 'capsid', true);
  collector.instanceExplosions.push({ ...capsomers, distance: 0.64 });

  const bridge = new THREE.Mesh(
    new THREE.CylinderGeometry(
      0.62,
      0.62,
      spacing * 0.62,
      quality === 'high' ? 16 : 10,
    ),
    standardMaterial(COLORS.capsidDark),
  );
  bridge.name = 'geminate-shared-interface';
  bridge.rotation.z = Math.PI / 2;
  collector.root.add(bridge);
  register(collector, bridge, 'geminate-bridge', 'capsid', true);
  addObjectExplosion(collector, bridge, new THREE.Vector3(-0.4, -0.35, 0.35), 0.5);

  const genome = new THREE.Group();
  genome.name = `${collector.definition.id}-paired-circular-ssdna`;
  for (const side of [-1, 1]) {
    const loop = createGenomeCoil(radius * 0.42, 6, 0.035, quality, 1.25);
    loop.position.x = side * spacing * 0.52;
    loop.scale.x = 0.78;
    genome.add(loop);
  }
  addGenome(collector, genome, new THREE.Vector3(0.5, -0.25, -0.4), 0.52);
  markSpecialModel(collector, signature);
}

function createSpindleBody(
  signature: SpecialGeometrySignature,
  quality: Quality,
  scale: number,
  color: number,
  opacity: number,
): THREE.Mesh {
  const half = signature.body.length * 0.5;
  const segments = quality === 'high' ? 18 : 10;
  const profile = Array.from({ length: segments + 1 }, (_, index) => {
    const t = index / segments;
    const axial = (t - 0.5) * signature.body.length;
    const taper = Math.pow(Math.sin(t * Math.PI), signature.body.taper ?? 0.85);
    const shoulder = 0.88 + Math.sin(t * Math.PI) * 0.12;
    return new THREE.Vector2(
      Math.max(signature.body.radius * 0.06, signature.body.radius * taper * shoulder) *
        scale,
      THREE.MathUtils.clamp(axial, -half, half) * scale,
    );
  });
  return new THREE.Mesh(
    new THREE.LatheGeometry(profile, quality === 'high' ? 32 : 18),
    physicalMaterial(color, opacity),
  );
}

function requiredHelicalSignature(collector: ModelCollector): HelicalSignature {
  const value = collector.signature?.helical;
  if (!value)
    throw new Error(`Missing helical signature for ${collector.definition.id}`);
  return value;
}

function requiredSpecialSignature(
  collector: ModelCollector,
  expectedKind: SpecialGeometrySignature['kind'],
): SpecialGeometrySignature {
  const value = collector.signature?.specialGeometry;
  if (!value || value.kind !== expectedKind) {
    throw new Error(`Missing ${expectedKind} signature for ${collector.definition.id}`);
  }
  return value;
}

function markSpecialModel(
  collector: ModelCollector,
  signature: SpecialGeometrySignature,
  centerline?: readonly THREE.Vector3[],
): void {
  collector.root.userData.specialGeometryProfileId = collector.signature?.profileId;
  collector.root.userData.specialGeometryKind = signature.kind;
  if (centerline) {
    collector.root.userData.centerline = centerline.map((point) => point.toArray());
  }
}

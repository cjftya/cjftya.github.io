import * as THREE from 'three';
import { getGeometryProfile } from '../../catalog/geometryProfiles';
import type { ObservationLayerId, ObservationPartId } from '../../observation/types';
import type { ModelCollector } from './shared';
import {
  COLORS,
  addGenome,
  addObjectExplosion,
  createCylinderBetween,
  createGenomeCoil,
  createRadialInstances,
  createTube,
  fibonacciDirections,
  physicalMaterial,
  register,
  registerFlexibleSegment,
  registerLayerAlias,
  registerPartAlias,
  standardMaterial,
} from './shared';

type Quality = 'high' | 'low';

export function buildGenericIcosahedral(
  collector: ModelCollector,
  quality: Quality,
): void {
  const profile = getGeometryProfile(collector.definition.geometryProfileId);
  const shell = createIcosahedralShell(profile.radius, quality);
  collector.root.add(shell);
  register(
    collector,
    shell,
    preferredPart(collector, ['capsid', 'outer-capsid']),
    preferredLayer(collector, ['capsid', 'outer-capsid']),
    true,
  );
  addObjectExplosion(collector, shell, new THREE.Vector3(0.35, 0.65, 0.25), 0.54);

  const directions = fibonacciDirections(
    profile.unitCount ?? (quality === 'high' ? 48 : 28),
  );
  const units = createRadialInstances(
    new THREE.CylinderGeometry(
      (profile.unitScale ?? 0.16) * 0.72,
      profile.unitScale ?? 0.16,
      Math.max(0.12, (profile.protrusion ?? 0.07) + 0.1),
      6,
    ),
    standardMaterial(COLORS.capsomer),
    directions.map((direction) =>
      direction
        .clone()
        .multiplyScalar(profile.radius + (profile.protrusion ?? 0.07) * 0.45),
    ),
    directions,
  );
  collector.root.add(units.mesh);
  register(
    collector,
    units.mesh,
    preferredPart(collector, ['capsomer', 'surface-domain']),
    preferredLayer(collector, ['capsid', 'surface-protein']),
    true,
  );
  collector.instanceExplosions.push({ ...units, distance: 0.72 });

  let decoration: THREE.Object3D = units.mesh;
  if ((profile.spikeCount ?? 0) > 0) {
    decoration = createSpikes(
      profile.radius,
      profile.spikeCount ?? 12,
      profile.protrusion ?? 0.24,
      quality,
    );
    collector.root.add(decoration);
    register(
      collector,
      decoration,
      preferredPart(collector, ['spike', 'surface-domain', 'channel']),
      preferredLayer(collector, ['surface-protein', 'capsid']),
      true,
    );
    addObjectExplosion(collector, decoration, new THREE.Vector3(-0.55, 0.2, 0.5), 0.68);
  }

  const genome = createGenomeCoil(profile.radius * 0.55, 11, 0.04, quality, 1.05);
  addGenome(collector, genome, new THREE.Vector3(-0.45, -0.25, 0.55), 0.66);
  completeAliases(collector, { shell, units: units.mesh, decoration, genome });
}

export function buildGenericPhage(collector: ModelCollector, quality: Quality): void {
  const profile = getGeometryProfile(collector.definition.geometryProfileId);
  const tailLength = profile.tailLength ?? 1.4;
  const centerY = tailLength * 0.42;
  const shell = createIcosahedralShell(profile.radius, quality);
  shell.position.y = centerY;
  shell.scale.y = profile.elongation ?? 1;
  collector.root.add(shell);
  register(collector, shell, 'capsid', 'capsid', true);

  const directions = fibonacciDirections(profile.unitCount ?? 36);
  const units = createRadialInstances(
    new THREE.CylinderGeometry(0.11, 0.16, 0.15, 6),
    standardMaterial(COLORS.capsomer),
    directions.map(
      (direction) =>
        new THREE.Vector3(
          direction.x * profile.radius * 1.02,
          centerY + direction.y * profile.radius * (profile.elongation ?? 1) * 1.02,
          direction.z * profile.radius * 1.02,
        ),
    ),
    directions,
  );
  collector.root.add(units.mesh);
  register(collector, units.mesh, 'capsomer', 'capsid', true);
  collector.instanceExplosions.push({ ...units, distance: 0.7 });

  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.38, 0.36, 10),
    standardMaterial(0xc4e4ef),
  );
  neck.position.y = centerY - profile.radius * (profile.elongation ?? 1) - 0.2;
  collector.root.add(neck);
  register(collector, neck, 'neck', 'tail', true);

  const tail = new THREE.Mesh(
    new THREE.CylinderGeometry(
      profile.tailStyle === 'long' ? 0.105 : 0.15,
      profile.tailStyle === 'spiked' ? 0.27 : 0.13,
      tailLength,
      profile.tailStyle === 'spiked' ? 6 : 10,
    ),
    standardMaterial(COLORS.tail),
  );
  tail.position.y = neck.position.y - tailLength * 0.5 - 0.18;
  collector.root.add(tail);
  register(
    collector,
    tail,
    preferredPart(collector, ['flexible-tail', 'inner-tube', 'sheath']),
    'tail',
    true,
  );

  const terminalY = tail.position.y - tailLength * 0.5;
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.28, 0.2, 6),
    standardMaterial(COLORS.receptor),
  );
  base.position.y = terminalY;
  collector.root.add(base);
  register(
    collector,
    base,
    preferredPart(collector, ['baseplate', 'tailspike', 'portal']),
    'tail',
    true,
  );

  const fibers = new THREE.Group();
  const fiberMaterial = standardMaterial(COLORS.receptor);
  for (let index = 0; index < 6; index += 1) {
    const angle = (index / 6) * Math.PI * 2;
    const radial = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
    fibers.add(
      createCylinderBetween(
        radial.clone().multiplyScalar(0.25).setY(terminalY),
        radial
          .clone()
          .multiplyScalar(profile.tailStyle === 'spiked' ? 0.9 : 1.2)
          .setY(terminalY - 0.5),
        0.035,
        fiberMaterial,
      ),
    );
  }
  collector.root.add(fibers);
  register(
    collector,
    fibers,
    preferredPart(collector, ['tailspike', 'tail-fiber']),
    'tail',
    true,
  );

  const genome = createGenomeCoil(profile.radius * 0.52, 13, 0.038, quality);
  genome.position.y = centerY;
  addGenome(collector, genome);
  completeAliases(collector, {
    shell,
    units: units.mesh,
    decoration: fibers,
    genome,
    tail,
    base,
  });
}

export function buildGenericFilament(
  collector: ModelCollector,
  quality: Quality,
): void {
  const profile = getGeometryProfile(collector.definition.geometryProfileId);
  const length = profile.filamentLength ?? 6;
  const radius = profile.filamentRadius ?? 0.46;
  const segments = 5;
  const segmentLength = length / segments;
  const coatMaterial = standardMaterial(COLORS.capsid);
  let firstSegment: THREE.Group | null = null;
  for (let index = 0; index < segments; index += 1) {
    const segment = new THREE.Group();
    segment.position.y = -length * 0.5 + segmentLength * (index + 0.5);
    const shell = new THREE.Mesh(
      new THREE.CylinderGeometry(
        radius,
        radius,
        segmentLength * 0.94,
        quality === 'high' ? 20 : 12,
        1,
        true,
      ),
      coatMaterial,
    );
    segment.add(shell);
    const ringCount = quality === 'high' ? 5 : 3;
    for (let ring = 0; ring < ringCount; ring += 1) {
      const coat = new THREE.Mesh(
        new THREE.TorusGeometry(radius * 1.02, 0.055, 5, quality === 'high' ? 18 : 10),
        standardMaterial(ring % 2 === 0 ? COLORS.capsomer : COLORS.capsidDark),
      );
      coat.rotation.x = Math.PI / 2;
      coat.rotation.y = ring * 0.32 + index * 0.18;
      coat.position.y =
        (ring / Math.max(1, ringCount - 1) - 0.5) * segmentLength * 0.82;
      segment.add(coat);
    }
    collector.root.add(segment);
    register(collector, segment, 'coat-protein', 'capsid', true);
    registerFlexibleSegment(collector, segment);
    if (!firstSegment) firstSegment = segment;
  }

  const genomePoints = Array.from(
    { length: quality === 'high' ? 64 : 36 },
    (_, index) => {
      const t = index / (quality === 'high' ? 63 : 35);
      return new THREE.Vector3(
        Math.sin(t * Math.PI * 4) * radius * 0.16,
        (t - 0.5) * length * 0.92,
        Math.cos(t * Math.PI * 4) * radius * 0.16,
      );
    },
  );
  const genome = createTube(genomePoints, 0.035, quality, false);
  addGenome(collector, genome, new THREE.Vector3(0.5, 0.1, 0.4), 0.56);
  const terminal = new THREE.Group();
  const capMaterial = standardMaterial(COLORS.receptor);
  for (const side of [-1, 1]) {
    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(radius * 0.58, 12, 8),
      capMaterial,
    );
    cap.scale.y = 0.5;
    cap.position.y = side * length * 0.51;
    terminal.add(cap);
  }
  collector.root.add(terminal);
  register(collector, terminal, 'terminal-protein', 'capsid', true);
  completeAliases(collector, {
    shell: firstSegment ?? terminal,
    units: firstSegment ?? terminal,
    decoration: terminal,
    genome,
  });
}

export function buildGenericEnveloped(
  collector: ModelCollector,
  quality: Quality,
): void {
  const profile = getGeometryProfile(collector.definition.geometryProfileId);
  const coreRadius = profile.radius * 0.68;
  const envelope = new THREE.Mesh(
    new THREE.SphereGeometry(
      profile.radius,
      quality === 'high' ? 36 : 20,
      quality === 'high' ? 24 : 14,
    ),
    physicalMaterial(COLORS.envelope, 0.68),
  );
  collector.root.add(envelope);
  register(collector, envelope, 'envelope', 'envelope', true);

  const core = createIcosahedralShell(coreRadius, quality);
  collector.root.add(core);
  register(
    collector,
    core,
    preferredPart(collector, ['nucleocapsid', 'core-capsid', 'capsid']),
    preferredLayer(collector, ['nucleocapsid', 'core-capsid', 'capsid']),
    true,
  );
  addObjectExplosion(collector, core, new THREE.Vector3(-0.45, -0.2, 0.35), 0.68);

  const spikes = createSpikes(
    profile.radius,
    profile.spikeCount ?? 32,
    profile.protrusion ?? 0.25,
    quality,
  );
  collector.root.add(spikes);
  register(collector, spikes, 'spike', 'surface-protein', true);
  addObjectExplosion(collector, spikes, new THREE.Vector3(0.45, 0.45, -0.3), 0.78);

  const genome = createGenomeCoil(coreRadius * 0.55, 10, 0.04, quality);
  addGenome(collector, genome);
  completeAliases(collector, {
    shell: envelope,
    units: core,
    decoration: spikes,
    genome,
    core,
  });
}

export function buildGenericLayered(collector: ModelCollector, quality: Quality): void {
  const profile = getGeometryProfile(collector.definition.geometryProfileId);
  const layers = profile.layers ?? 2;
  const objects: THREE.Object3D[] = [];
  const layerParts: ObservationPartId[] =
    layers === 3
      ? ['outer-capsid', 'middle-capsid', 'core-capsid']
      : [
          'outer-capsid',
          collector.definition.parts.includes('inner-membrane')
            ? 'inner-membrane'
            : 'core-capsid',
        ];
  const layerIds: ObservationLayerId[] =
    layers === 3
      ? ['outer-capsid', 'middle-capsid', 'core-capsid']
      : [
          'outer-capsid',
          collector.definition.layers.some((item) => item.id === 'inner-membrane')
            ? 'inner-membrane'
            : 'core-capsid',
        ];
  for (let index = 0; index < layers; index += 1) {
    const radius = profile.radius * (1 - index * 0.2);
    const object = createIcosahedralShell(radius, quality, 0.56 + index * 0.1, index);
    collector.root.add(object);
    register(
      collector,
      object,
      layerParts[index] ?? 'capsid',
      layerIds[index] ?? 'capsid',
      index === 0,
    );
    addObjectExplosion(
      collector,
      object,
      fibonacciDirections(layers)[index] ?? new THREE.Vector3(1, 0, 0),
      0.48 + index * 0.18,
    );
    objects.push(object);
  }

  const directions = fibonacciDirections(profile.unitCount ?? 42);
  const units = createRadialInstances(
    new THREE.CylinderGeometry(0.1, profile.unitScale ?? 0.15, 0.16, 6),
    standardMaterial(COLORS.capsomer),
    directions.map((direction) =>
      direction.clone().multiplyScalar(profile.radius * 1.02),
    ),
    directions,
  );
  collector.root.add(units.mesh);
  register(
    collector,
    units.mesh,
    preferredPart(collector, ['capsomer', 'surface-domain']),
    layerIds[0] ?? 'capsid',
    true,
  );
  collector.instanceExplosions.push({ ...units, distance: 0.68 });

  let decoration: THREE.Object3D = units.mesh;
  if ((profile.turretCount ?? 0) > 0) {
    decoration = createSpikes(
      profile.radius,
      profile.turretCount ?? 12,
      profile.protrusion ?? 0.16,
      quality,
      true,
    );
    collector.root.add(decoration);
    register(
      collector,
      decoration,
      'turret',
      preferredLayer(collector, ['surface-protein', 'outer-capsid']),
      true,
    );
  }
  const genome = createGenomeCoil(profile.radius * 0.36, 12, 0.038, quality);
  addGenome(collector, genome);
  completeAliases(collector, {
    shell: objects[0] ?? units.mesh,
    units: units.mesh,
    decoration,
    genome,
    core: objects.at(-1),
  });
}

export function buildGenericGeminate(
  collector: ModelCollector,
  quality: Quality,
): void {
  const profile = getGeometryProfile(collector.definition.geometryProfileId);
  const spacing = profile.lobeSpacing ?? 1.4;
  const lobes = new THREE.Group();
  for (const side of [-1, 1]) {
    const shell = createIcosahedralShell(profile.radius, quality);
    shell.position.x = side * spacing * 0.5;
    shell.scale.x = 0.78;
    lobes.add(shell);
  }
  collector.root.add(lobes);
  register(collector, lobes, 'capsid', 'capsid', true);
  const bridge = new THREE.Mesh(
    new THREE.CylinderGeometry(0.58, 0.58, spacing * 0.58, 12),
    standardMaterial(COLORS.capsidDark),
  );
  bridge.rotation.z = Math.PI / 2;
  collector.root.add(bridge);
  register(collector, bridge, 'geminate-bridge', 'capsid', true);
  const genome = createGenomeCoil(profile.radius * 0.5, 7, 0.035, quality);
  genome.scale.x = 1.55;
  addGenome(collector, genome);
  completeAliases(collector, {
    shell: lobes,
    units: lobes,
    decoration: bridge,
    genome,
  });
}

export function buildGenericSpindle(collector: ModelCollector, quality: Quality): void {
  const profile = getGeometryProfile(collector.definition.geometryProfileId);
  const shell = new THREE.Mesh(
    new THREE.SphereGeometry(
      profile.radius,
      quality === 'high' ? 32 : 18,
      quality === 'high' ? 22 : 12,
    ),
    physicalMaterial(COLORS.capsid, 0.84),
  );
  shell.scale.y = profile.elongation ?? 2;
  collector.root.add(shell);
  register(collector, shell, 'capsid', 'capsid', true);
  const tails = new THREE.Group();
  const count = profile.terminalTails ?? 1;
  for (let index = 0; index < count; index += 1) {
    const side = count === 1 ? 1 : index === 0 ? -1 : 1;
    const tail = new THREE.Mesh(
      new THREE.ConeGeometry(0.2, profile.tailLength ?? 1, 10),
      standardMaterial(COLORS.receptor),
    );
    tail.position.y =
      side *
      (profile.radius * (profile.elongation ?? 2) + (profile.tailLength ?? 1) * 0.45);
    if (side < 0) tail.rotation.z = Math.PI;
    tails.add(tail);
  }
  collector.root.add(tails);
  register(
    collector,
    tails,
    'terminal-tail',
    preferredLayer(collector, ['surface-protein', 'capsid']),
    true,
  );
  const genome = createGenomeCoil(profile.radius * 0.46, 11, 0.035, quality, 2.3);
  addGenome(collector, genome);
  completeAliases(collector, { shell, units: shell, decoration: tails, genome });
}

export function buildGenericRod(collector: ModelCollector, quality: Quality): void {
  const profile = getGeometryProfile(collector.definition.geometryProfileId);
  const length = profile.filamentLength ?? 5.4;
  const shell = new THREE.Mesh(
    new THREE.CylinderGeometry(
      profile.radius,
      profile.radius,
      length,
      quality === 'high' ? 24 : 14,
    ),
    physicalMaterial(COLORS.capsid, 0.82),
  );
  collector.root.add(shell);
  register(collector, shell, 'capsid', 'capsid', true);
  const ends = new THREE.Group();
  const material = standardMaterial(COLORS.receptor);
  for (const side of [-1, 1]) {
    for (let index = 0; index < 3; index += 1) {
      const angle = (index / 3) * Math.PI * 2;
      const start = new THREE.Vector3(0, side * length * 0.5, 0);
      const end = new THREE.Vector3(
        Math.cos(angle) * 0.62,
        side * (length * 0.5 + (profile.tailLength ?? 0.7)),
        Math.sin(angle) * 0.62,
      );
      ends.add(createCylinderBetween(start, end, 0.035, material));
    }
  }
  collector.root.add(ends);
  register(
    collector,
    ends,
    'terminal-tail',
    preferredLayer(collector, ['surface-protein', 'capsid']),
    true,
  );
  const genome = createGenomeCoil(profile.radius * 0.46, 13, 0.035, quality, 5.2);
  addGenome(collector, genome);
  completeAliases(collector, { shell, units: shell, decoration: ends, genome });
}

function createIcosahedralShell(
  radius: number,
  quality: Quality,
  opacity = 0.78,
  colorIndex = 0,
): THREE.Mesh {
  const colors = [COLORS.capsid, COLORS.layerBlue, COLORS.layerViolet] as const;
  return new THREE.Mesh(
    new THREE.IcosahedronGeometry(radius, quality === 'high' ? 2 : 1),
    physicalMaterial(colors[colorIndex] ?? COLORS.capsid, opacity, true),
  );
}

function createSpikes(
  radius: number,
  count: number,
  length: number,
  quality: Quality,
  turret = false,
): THREE.InstancedMesh {
  const directions = fibonacciDirections(count);
  const result = createRadialInstances(
    turret
      ? new THREE.CylinderGeometry(
          0.1,
          0.18,
          Math.max(0.24, length),
          quality === 'high' ? 8 : 6,
        )
      : new THREE.ConeGeometry(0.13, Math.max(0.2, length), quality === 'high' ? 8 : 6),
    standardMaterial(turret ? COLORS.layerGold : COLORS.spike),
    directions.map((direction) =>
      direction.clone().multiplyScalar(radius + length * 0.5),
    ),
    directions,
  );
  return result.mesh;
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
  objects: {
    shell: THREE.Object3D;
    units: THREE.Object3D;
    decoration: THREE.Object3D;
    genome: THREE.Object3D;
    core?: THREE.Object3D;
    tail?: THREE.Object3D;
    base?: THREE.Object3D;
  },
): void {
  for (const part of collector.definition.parts) {
    if (collector.parts.has(part)) continue;
    const target =
      part === 'genome'
        ? objects.genome
        : [
              'spike',
              'fiber',
              'tail-fiber',
              'tailspike',
              'surface-domain',
              'channel',
              'turret',
              'terminal-protein',
              'terminal-tail',
            ].includes(part)
          ? objects.decoration
          : [
                'nucleocapsid',
                'core-capsid',
                'inner-membrane',
                'middle-capsid',
                'core-wall',
              ].includes(part)
            ? (objects.core ?? objects.shell)
            : ['neck', 'sheath', 'inner-tube', 'flexible-tail'].includes(part)
              ? (objects.tail ?? objects.shell)
              : part === 'baseplate'
                ? (objects.base ?? objects.decoration)
                : part === 'capsomer' || part === 'coat-protein'
                  ? objects.units
                  : objects.shell;
    registerPartAlias(collector, target, part);
  }
  for (const layer of collector.definition.layers) {
    if (collector.layers.has(layer.id)) continue;
    const target =
      layer.id === 'genome'
        ? objects.genome
        : [
              'core-capsid',
              'inner-membrane',
              'middle-capsid',
              'nucleocapsid',
              'core-wall',
            ].includes(layer.id)
          ? (objects.core ?? objects.shell)
          : layer.id === 'tail'
            ? (objects.tail ?? objects.decoration)
            : layer.id === 'surface-protein'
              ? objects.decoration
              : objects.shell;
    registerLayerAlias(collector, target, layer.id);
  }
}

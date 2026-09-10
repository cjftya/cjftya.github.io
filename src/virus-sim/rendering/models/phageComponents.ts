import * as THREE from 'three';
import type {
  PhageBaseplateStyle,
  PhageHeadSurfacePattern,
  PhageReceptorSignature,
  PhageStructuralSignature,
} from '../../catalog/structuralTypes';
import type { ObservationPartId } from '../../observation/types';
import { createFacetedShell, getIcosahedralDirections } from './capsidComponents';
import {
  createBodyCenterline,
  sampleCenterlineFrames,
  type CenterlinePath,
  type Quality,
} from './filamentComponents';
import type { ModelCollector } from './shared';
import {
  COLORS,
  addObjectExplosion,
  createCylinderBetween,
  createGenomeCoil,
  createRadialInstances,
  createTube,
  register,
  standardMaterial,
} from './shared';

export interface PhageAxis {
  readonly headCenterY: number;
  readonly connectorY: number;
  readonly tailEndY: number;
}

export function calculatePhageAxis(signature: PhageStructuralSignature): PhageAxis {
  const headHeight = signature.head.radius * signature.head.elongation * 2;
  const headCenterY = signature.tail.length * 0.5;
  const connectorY = headCenterY - headHeight * 0.5;
  return {
    headCenterY,
    connectorY,
    tailEndY: connectorY - signature.tail.length,
  };
}

export function addPhageHead(
  collector: ModelCollector,
  quality: Quality,
  signature: PhageStructuralSignature,
  axis: PhageAxis,
): void {
  const shell = createFacetedShell({
    radius: signature.head.radius,
    quality,
    faceting:
      signature.head.surfacePattern === 'crosslinked-thin' ? 'moderate' : 'strong',
    color: COLORS.capsid,
    opacity: signature.head.surfacePattern === 'crosslinked-thin' ? 0.7 : 0.82,
  });
  shell.name = `phage-head-${signature.head.shape}-${signature.head.surfacePattern}`;
  shell.position.y = axis.headCenterY;
  shell.scale.y = signature.head.elongation;
  collector.root.add(shell);
  register(collector, shell, 'capsid', 'capsid', true);
  addObjectExplosion(collector, shell, new THREE.Vector3(0.25, 0.9, 0.2), 0.58);

  const count =
    quality === 'high'
      ? signature.head.capsomerCount
      : Math.max(18, Math.round(signature.head.capsomerCount * 0.56));
  const directions = getIcosahedralDirections(quality, count);
  const unitScale = signature.head.surfacePattern === 'crosslinked-thin' ? 0.135 : 0.17;
  const capsomers = createRadialInstances(
    createHeadUnitGeometry(signature.head.surfacePattern, unitScale, quality),
    standardMaterial(
      signature.head.surfacePattern === 'crosslinked-thin'
        ? COLORS.layerGold
        : COLORS.capsomer,
    ),
    directions.map(
      (direction) =>
        new THREE.Vector3(
          direction.x * signature.head.radius * 1.015,
          axis.headCenterY +
            direction.y * signature.head.radius * signature.head.elongation * 1.015,
          direction.z * signature.head.radius * 1.015,
        ),
    ),
    directions,
  );
  capsomers.mesh.name = `phage-capsomers-${signature.head.surfacePattern}`;
  collector.root.add(capsomers.mesh);
  register(collector, capsomers.mesh, 'capsomer', 'capsid', true);
  collector.instanceExplosions.push({ ...capsomers, distance: 0.76 });

  const genome = createGenomeCoil(
    signature.head.radius * 0.56,
    quality === 'high' ? 17 : 11,
    0.043,
    quality,
  );
  genome.name = 'phage-head-packed-dsdna';
  genome.position.y = axis.headCenterY;
  genome.scale.y = signature.head.elongation;
  collector.root.add(genome);
  register(collector, genome, 'genome', 'genome');
  collector.genomeObjects.push(genome);
  addObjectExplosion(collector, genome, new THREE.Vector3(-0.38, 0.65, 0.32), 0.68);
}

export function addPhageConnector(
  collector: ModelCollector,
  quality: Quality,
  signature: PhageStructuralSignature,
  axis: PhageAxis,
): void {
  if (signature.portal?.present) {
    const portal = new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.32 * signature.portal.scale,
        0.45 * signature.portal.scale,
        0.28,
        quality === 'high' ? 12 : 8,
      ),
      standardMaterial(0xc0e0ee),
    );
    portal.name = 'phage-head-tail-portal';
    portal.position.y = axis.connectorY - 0.08;
    collector.root.add(portal);
    register(
      collector,
      portal,
      preferredConnectorPart(collector, 'portal'),
      'tail',
      true,
    );
    addObjectExplosion(collector, portal, new THREE.Vector3(0.58, -0.08, 0.35), 0.58);
  }

  if (!signature.neck) return;
  const neck = new THREE.Group();
  neck.name = `phage-neck-${signature.neck.style}`;
  const ringCount =
    signature.neck.style === 'ringed' ? 3 : signature.neck.style === 'collar' ? 2 : 1;
  const material = standardMaterial(COLORS.tail);
  for (let index = 0; index < ringCount; index += 1) {
    const radius = 0.39 - index * 0.035;
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(
        radius,
        0.065,
        quality === 'high' ? 8 : 5,
        quality === 'high' ? 18 : 10,
      ),
      material,
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = axis.connectorY - 0.2 - index * 0.13;
    neck.add(ring);
  }
  collector.root.add(neck);
  register(collector, neck, preferredConnectorPart(collector, 'neck'), 'tail', true);
  addObjectExplosion(collector, neck, new THREE.Vector3(0.58, 0.08, 0.38), 0.64);
}

export function addContractileTail(
  collector: ModelCollector,
  quality: Quality,
  signature: PhageStructuralSignature,
  axis: PhageAxis,
): void {
  const count =
    quality === 'high'
      ? (signature.tail.sheathRings ?? 12)
      : Math.max(7, Math.round((signature.tail.sheathRings ?? 12) * 0.62));
  const ringGeometry = new THREE.TorusGeometry(
    signature.tail.radius,
    signature.tail.radius * 0.28,
    quality === 'high' ? 8 : 5,
    quality === 'high' ? 22 : 12,
  );
  ringGeometry.rotateX(Math.PI / 2);
  const sheath = new THREE.InstancedMesh(
    ringGeometry,
    standardMaterial(COLORS.tail),
    count,
  );
  sheath.name = 'phage-contractile-stacked-sheath';
  const origins: THREE.Vector3[] = [];
  const directions: THREE.Vector3[] = [];
  const quaternions: THREE.Quaternion[] = [];
  const scales: THREE.Vector3[] = [];
  const matrix = new THREE.Matrix4();
  for (let index = 0; index < count; index += 1) {
    const t = (index + 0.5) / count;
    const origin = new THREE.Vector3(0, axis.connectorY - t * signature.tail.length, 0);
    const quaternion = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 1, 0),
      index * 0.22,
    );
    const scale = new THREE.Vector3(1, 1, 1);
    matrix.compose(origin, quaternion, scale);
    sheath.setMatrixAt(index, matrix);
    origins.push(origin);
    directions.push(new THREE.Vector3(-0.7, -0.2, 0.42));
    quaternions.push(quaternion);
    scales.push(scale);
  }
  sheath.instanceMatrix.needsUpdate = true;
  sheath.computeBoundingBox();
  sheath.computeBoundingSphere();
  collector.root.add(sheath);
  register(collector, sheath, 'sheath', 'tail', true);
  collector.instanceExplosions.push({
    mesh: sheath,
    origins,
    directions,
    quaternions,
    scales,
    distance: 0.76,
  });

  if (signature.tail.innerTube) {
    const tube = new THREE.Mesh(
      new THREE.CylinderGeometry(
        signature.tail.radius * 0.28,
        signature.tail.radius * 0.28,
        signature.tail.length * 1.03,
        quality === 'high' ? 12 : 7,
      ),
      standardMaterial(0xe4f8ff),
    );
    tube.name = 'phage-contractile-inner-tube';
    tube.position.y = axis.connectorY - signature.tail.length * 0.5;
    collector.root.add(tube);
    register(collector, tube, 'inner-tube', 'tail', true);
    addObjectExplosion(collector, tube, new THREE.Vector3(0.62, -0.1, -0.45), 0.68);
  }
}

export function addNoncontractileTail(
  collector: ModelCollector,
  quality: Quality,
  signature: PhageStructuralSignature,
  axis: PhageAxis,
): CenterlinePath {
  const archetype =
    signature.tail.flexibility === 'flexible'
      ? 'flexible-s'
      : signature.tail.flexibility === 'semi-flexible'
        ? 'gentle-bend'
        : 'straight';
  const source = createBodyCenterline(archetype, signature.tail.length, quality);
  const bendScale = signature.tail.type === 'minimal' ? 0.45 : 0.72;
  const points = source.points.map(
    (point) =>
      new THREE.Vector3(
        point.x * bendScale,
        axis.connectorY - (point.y + signature.tail.length * 0.5),
        point.z * bendScale,
      ),
  );
  const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.45);
  const path: CenterlinePath = {
    points,
    curve,
    frames: sampleCenterlineFrames(curve, points.length - 1),
  };
  const tail = createTube(
    points,
    signature.tail.radius,
    quality,
    false,
    signature.tail.type === 'minimal' ? COLORS.tailDark : COLORS.tail,
  );
  tail.name =
    signature.tail.type === 'minimal'
      ? 'phage-capsid-focused-minimal-tail'
      : 'phage-long-noncontractile-tail';
  collector.root.add(tail);
  register(collector, tail, 'flexible-tail', 'tail', true);
  addObjectExplosion(collector, tail, new THREE.Vector3(-0.56, -0.14, 0.42), 0.7);
  return path;
}

export function addShortTail(
  collector: ModelCollector,
  quality: Quality,
  signature: PhageStructuralSignature,
  axis: PhageAxis,
): void {
  const partId: ObservationPartId = collector.definition.parts.includes('inner-tube')
    ? 'inner-tube'
    : collector.definition.parts.includes('tailspike')
      ? 'tailspike'
      : 'tail-fiber';
  const tail = new THREE.Mesh(
    new THREE.CylinderGeometry(
      signature.tail.radius * 0.68,
      signature.tail.radius,
      signature.tail.length,
      quality === 'high' ? 12 : 7,
    ),
    standardMaterial(COLORS.tail),
  );
  tail.name = 'phage-compact-short-tail-nozzle';
  tail.position.y = axis.connectorY - signature.tail.length * 0.5;
  collector.root.add(tail);
  register(collector, tail, partId, 'tail', true);
  addObjectExplosion(collector, tail, new THREE.Vector3(-0.55, -0.18, 0.4), 0.62);
}

export function addDistalArchitecture(
  collector: ModelCollector,
  quality: Quality,
  signature: PhageStructuralSignature,
  axis: PhageAxis,
  tailPath?: CenterlinePath,
): void {
  const distal = signature.distal;
  if (!distal) return;
  const endpoint =
    tailPath?.points.at(-1)?.clone() ?? new THREE.Vector3(0, axis.tailEndY, 0);
  if (distal.baseplate) {
    const baseplate = createBaseplateGeometry(distal.baseplate, endpoint, quality);
    collector.root.add(baseplate);
    const partId: ObservationPartId = collector.definition.parts.includes('baseplate')
      ? 'baseplate'
      : (distal.receptor?.kind ?? 'tail-fiber');
    register(collector, baseplate, partId, 'tail', true);
    addObjectExplosion(
      collector,
      baseplate,
      new THREE.Vector3(0.32, -0.64, -0.45),
      0.68,
    );
  }
  if (distal.receptor) {
    const receptor = createReceptorGeometry(distal.receptor, endpoint, quality);
    collector.root.add(receptor);
    register(collector, receptor, distal.receptor.kind, 'tail', true);
    addObjectExplosion(
      collector,
      receptor,
      distal.receptor.kind === 'tailspike'
        ? new THREE.Vector3(0.12, -0.7, 0.58)
        : new THREE.Vector3(-0.18, -0.72, -0.42),
      0.74,
    );
  }
}

function createHeadUnitGeometry(
  pattern: PhageHeadSurfacePattern,
  scale: number,
  quality: Quality,
): THREE.BufferGeometry {
  if (pattern === 'crosslinked-thin') {
    const geometry = new THREE.TorusGeometry(
      scale * 0.62,
      scale * 0.16,
      quality === 'high' ? 7 : 5,
      quality === 'high' ? 14 : 8,
    );
    geometry.rotateX(Math.PI / 2);
    return geometry;
  }
  return new THREE.CylinderGeometry(
    scale * 0.7,
    scale,
    pattern === 'prolate-lattice' ? scale * 0.9 : scale * 0.72,
    pattern === 'prolate-lattice' ? 6 : 5,
  );
}

function createBaseplateGeometry(
  style: PhageBaseplateStyle,
  center: THREE.Vector3,
  quality: Quality,
): THREE.Group {
  const group = new THREE.Group();
  group.name = `phage-baseplate-${style}`;
  const radius =
    style === 'contractile-complex' ? 0.62 : style === 'hexagonal' ? 0.46 : 0.3;
  const material = standardMaterial(COLORS.receptor);
  const plate = new THREE.Mesh(
    new THREE.CylinderGeometry(
      radius,
      radius * 0.78,
      0.2,
      style === 'simple-hub' ? 8 : 6,
    ),
    material,
  );
  plate.position.copy(center);
  group.add(plate);
  if (style === 'simple-hub') return group;
  const wedgeCount = 6;
  for (let index = 0; index < wedgeCount; index += 1) {
    const angle = (index / wedgeCount) * Math.PI * 2;
    const radial = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
    group.add(
      createCylinderBetween(
        center.clone().addScaledVector(radial, radius * 0.42),
        center
          .clone()
          .addScaledVector(radial, radius * 0.82)
          .add(new THREE.Vector3(0, -0.24, 0)),
        quality === 'high' ? 0.045 : 0.052,
        material,
      ),
    );
  }
  return group;
}

function createReceptorGeometry(
  signature: PhageReceptorSignature,
  center: THREE.Vector3,
  quality: Quality,
): THREE.Group {
  const group = new THREE.Group();
  group.name =
    signature.kind === 'tailspike'
      ? 'phage-short-thick-tailspikes'
      : 'phage-thin-segmented-tail-fibers';
  const material = standardMaterial(COLORS.receptor);
  for (let index = 0; index < signature.count; index += 1) {
    const angle = (index / signature.count) * Math.PI * 2;
    const radial = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
    if (signature.kind === 'tailspike') {
      const start = center.clone().addScaledVector(radial, 0.22);
      const end = center
        .clone()
        .addScaledVector(radial, signature.reach)
        .add(new THREE.Vector3(0, -signature.reach * 0.36, 0));
      const spike = createCylinderBetween(
        start,
        end,
        quality === 'high' ? 0.095 : 0.11,
        material,
        6,
      );
      spike.scale.y = 1.08;
      group.add(spike);
      continue;
    }
    const start = center.clone().addScaledVector(radial, 0.28);
    const elbow = center
      .clone()
      .addScaledVector(radial, signature.reach * (signature.segmented ? 0.58 : 0.72))
      .add(new THREE.Vector3(0, -signature.reach * 0.16, 0));
    const tip = center
      .clone()
      .addScaledVector(radial, signature.reach)
      .add(new THREE.Vector3(0, -signature.reach * 0.36, 0));
    group.add(
      createCylinderBetween(start, signature.segmented ? elbow : tip, 0.032, material),
    );
    if (signature.segmented) {
      group.add(createCylinderBetween(elbow, tip, 0.024, material));
    }
  }
  return group;
}

function preferredConnectorPart(
  collector: ModelCollector,
  preferred: 'portal' | 'neck',
): ObservationPartId {
  if (collector.definition.parts.includes(preferred)) return preferred;
  if (collector.definition.parts.includes('neck')) return 'neck';
  return 'portal';
}

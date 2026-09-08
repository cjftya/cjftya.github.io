import * as THREE from 'three';
import type { ModelCollector } from './shared';
import {
  COLORS,
  addGenome,
  addObjectExplosion,
  createCylinderBetween,
  createGenomeCoil,
  createRadialInstances,
  fibonacciDirections,
  physicalMaterial,
  register,
  standardMaterial,
} from './shared';

export function buildMS2(collector: ModelCollector, quality: 'high' | 'low'): void {
  const shell = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.95, 2),
    physicalMaterial(COLORS.capsid, 0.82, true),
  );
  collector.root.add(shell);
  register(collector, shell, 'capsid', 'capsid', true);
  addObjectExplosion(collector, shell, new THREE.Vector3(-0.5, 0.2, 0.4), 0.72);
  addCapsomers(collector, quality === 'high' ? 72 : 38, 1.99, 'capsomer');

  const genome = createGenomeCoil(1.15, 12, 0.052, quality, 1.2);
  addGenome(collector, genome, new THREE.Vector3(0.45, -0.3, 0.4), 0.68);

  const maturation = new THREE.Group();
  const material = standardMaterial(COLORS.receptor);
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.35, 5, 10), material);
  body.rotation.z = Math.PI / 2;
  body.position.x = 1.94;
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.4, 8), material);
  tip.rotation.z = -Math.PI / 2;
  tip.position.x = 2.3;
  maturation.add(body, tip);
  collector.root.add(maturation);
  register(collector, maturation, 'maturation-protein', 'capsid', true);
  addObjectExplosion(collector, maturation, new THREE.Vector3(1, 0.1, 0), 0.82);
}

export function buildAdenovirus(
  collector: ModelCollector,
  quality: 'high' | 'low',
): void {
  const shell = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.9, 1),
    physicalMaterial(0x4fcac5, 0.84, true),
  );
  collector.root.add(shell);
  register(collector, shell, 'capsid', 'capsid', true);
  addObjectExplosion(collector, shell, new THREE.Vector3(-0.4, 0.3, 0.45), 0.68);
  addCapsomers(collector, quality === 'high' ? 86 : 44, 1.94, 'capsomer');

  const vertices = icosahedronVertices().map((vertex) => vertex.multiplyScalar(1.98));
  const pentonUnits = createRadialInstances(
    new THREE.CylinderGeometry(0.2, 0.27, 0.18, 5),
    standardMaterial(COLORS.layerGold),
    vertices,
    vertices.map((point) => point.clone().normalize()),
  );
  collector.root.add(pentonUnits.mesh);
  register(collector, pentonUnits.mesh, 'penton', 'capsid', true);
  collector.instanceExplosions.push({ ...pentonUnits, distance: 0.72 });

  const fibers = new THREE.Group();
  const fiberMaterial = standardMaterial(0xe8c98d);
  for (const vertex of vertices) {
    const direction = vertex.clone().normalize();
    const end = vertex.clone().addScaledVector(direction, 1.35);
    fibers.add(createCylinderBetween(vertex, end, 0.035, fiberMaterial, 6));
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.13, 9, 7), fiberMaterial);
    knob.position.copy(end);
    fibers.add(knob);
  }
  collector.root.add(fibers);
  register(collector, fibers, 'fiber', 'capsid', true);
  addObjectExplosion(collector, fibers, new THREE.Vector3(0.5, -0.2, 0.45), 0.88);

  addGenome(
    collector,
    createGenomeCoil(1.05, 18, 0.04, quality, 1.4),
    new THREE.Vector3(0.4, -0.45, -0.3),
    0.7,
  );
}

export function buildRotavirus(
  collector: ModelCollector,
  quality: 'high' | 'low',
): void {
  const layers = [
    {
      radius: 2.15,
      color: 0x63d6cb,
      opacity: 0.76,
      part: 'outer-capsid' as const,
      layer: 'outer-capsid' as const,
      direction: new THREE.Vector3(0.65, 0.15, 0.4),
    },
    {
      radius: 1.65,
      color: 0x5f8fc7,
      opacity: 0.86,
      part: 'middle-capsid' as const,
      layer: 'middle-capsid' as const,
      direction: new THREE.Vector3(-0.55, 0.35, 0.35),
    },
    {
      radius: 1.13,
      color: 0x9b7bd1,
      opacity: 0.9,
      part: 'core-capsid' as const,
      layer: 'core-capsid' as const,
      direction: new THREE.Vector3(0.2, -0.7, -0.4),
    },
  ];
  for (const [index, item] of layers.entries()) {
    const shell = new THREE.Mesh(
      new THREE.IcosahedronGeometry(item.radius, index === 0 ? 2 : 1),
      physicalMaterial(item.color, item.opacity, true),
    );
    collector.root.add(shell);
    register(collector, shell, item.part, item.layer, true);
    addObjectExplosion(collector, shell, item.direction, 0.62 + index * 0.08);
  }

  const directions = fibonacciDirections(quality === 'high' ? 44 : 24);
  const spikes = createRadialInstances(
    new THREE.ConeGeometry(0.11, 0.42, 6),
    standardMaterial(COLORS.layerGold),
    directions.map((direction) => direction.clone().multiplyScalar(2.38)),
    directions,
  );
  collector.root.add(spikes.mesh);
  register(collector, spikes.mesh, 'spike', 'outer-capsid', true);
  collector.instanceExplosions.push({ ...spikes, distance: 0.8 });

  const segmentPoints: number[] = [];
  for (let segment = 0; segment < 11; segment += 1) {
    const angle = (segment / 11) * Math.PI * 2;
    const offset = 0.18 + (segment % 3) * 0.16;
    segmentPoints.push(
      Math.cos(angle) * offset,
      -0.62,
      Math.sin(angle) * offset,
      Math.cos(angle + 0.4) * offset,
      0.62,
      Math.sin(angle + 0.4) * offset,
    );
  }
  const genome = new THREE.LineSegments(
    new THREE.BufferGeometry().setAttribute(
      'position',
      new THREE.Float32BufferAttribute(segmentPoints, 3),
    ),
    new THREE.LineBasicMaterial({ color: COLORS.genome }),
  );
  addGenome(collector, genome, new THREE.Vector3(-0.35, -0.45, 0.5), 0.68);
}

function addCapsomers(
  collector: ModelCollector,
  count: number,
  radius: number,
  partId: 'capsomer',
): void {
  const directions = fibonacciDirections(count);
  const units = createRadialInstances(
    new THREE.CylinderGeometry(0.16, 0.22, 0.15, 6),
    standardMaterial(COLORS.capsomer),
    directions.map((direction) => direction.clone().multiplyScalar(radius)),
    directions,
  );
  collector.root.add(units.mesh);
  register(collector, units.mesh, partId, 'capsid', true);
  collector.instanceExplosions.push({ ...units, distance: 0.85 });
}

function icosahedronVertices(): THREE.Vector3[] {
  const phi = (1 + Math.sqrt(5)) / 2;
  return [
    [0, 1, phi],
    [0, -1, phi],
    [0, 1, -phi],
    [0, -1, -phi],
    [1, phi, 0],
    [-1, phi, 0],
    [1, -phi, 0],
    [-1, -phi, 0],
    [phi, 0, 1],
    [-phi, 0, 1],
    [phi, 0, -1],
    [-phi, 0, -1],
  ].map(([x = 0, y = 0, z = 0]) => new THREE.Vector3(x, y, z).normalize());
}

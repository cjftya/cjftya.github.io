import * as THREE from 'three';
import type { ObservationDefinition } from '../../observation/types';
import type { ModelCollector } from './shared';
import {
  COLORS,
  addObjectExplosion,
  createCylinderBetween,
  createGenomeCoil,
  createRadialInstances,
  createTube,
  fibonacciDirections,
  physicalMaterial,
  register,
  standardMaterial,
} from './shared';

export function buildT4Phage(collector: ModelCollector, quality: 'high' | 'low'): void {
  const body = new THREE.Group();
  collector.root.add(body);
  const head = buildPhageHead(collector, body, quality, {
    radius: 1.42,
    centerY: 1.65,
    elongation: 1.22,
    unitCount: quality === 'high' ? 58 : 30,
  });
  addObjectExplosion(collector, head.shell, new THREE.Vector3(0.2, 1, 0.15), 0.58);

  const neck = new THREE.Group();
  for (let index = 0; index < 3; index += 1) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.42 - index * 0.03, 0.075, 8, 20),
      standardMaterial(index === 1 ? COLORS.tail : 0xc4e4ef),
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.05 - index * 0.16;
    neck.add(ring);
  }
  body.add(neck);
  register(collector, neck, 'neck', 'tail', true);
  addObjectExplosion(collector, neck, new THREE.Vector3(0.65, 0.1, 0.35), 0.72);

  const sheath = new THREE.Group();
  const sheathMaterial = standardMaterial(COLORS.tail);
  for (let index = 0; index < 13; index += 1) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.31, 0.095, 8, quality === 'high' ? 24 : 14),
      sheathMaterial,
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -0.39 - index * 0.18;
    ring.rotation.y = index * 0.22;
    sheath.add(ring);
  }
  body.add(sheath);
  register(collector, sheath, 'sheath', 'tail', true);
  addObjectExplosion(collector, sheath, new THREE.Vector3(-0.6, -0.2, 0.35), 0.86);

  const tube = new THREE.Mesh(
    new THREE.CylinderGeometry(0.085, 0.085, 2.78, 12),
    standardMaterial(0xe4f8ff),
  );
  tube.position.y = -1.46;
  body.add(tube);
  register(collector, tube, 'inner-tube', 'tail', true);
  addObjectExplosion(collector, tube, new THREE.Vector3(0.62, -0.1, -0.45), 0.7);

  const baseplate = createBaseplate(-2.83, 0.62, quality);
  body.add(baseplate);
  register(collector, baseplate, 'baseplate', 'tail', true);
  addObjectExplosion(collector, baseplate, new THREE.Vector3(0.2, -1, 0.2), 0.68);

  const fibers = createTailFibers(-2.86, 1.62, 6, 0.035);
  body.add(fibers);
  register(collector, fibers, 'tail-fiber', 'tail', true);
  addObjectExplosion(collector, fibers, new THREE.Vector3(-0.15, -0.75, -0.45), 0.86);

  const deliveryPath = createDeliveryPath();
  deliveryPath.visible = false;
  body.add(deliveryPath);
  register(collector, deliveryPath, 'genome', 'genome');

  const surfacePatch = createSurfacePatch(quality);
  surfacePatch.visible = false;
  collector.root.add(surfacePatch);
  collector.delivery = {
    body,
    bodyOrigin: body.position.clone(),
    sheath,
    sheathOrigin: sheath.position.clone(),
    innerTube: tube,
    innerTubeOrigin: tube.position.clone(),
    headGenome: head.genome,
    deliveryPath,
    deliveryPointCount: deliveryPath.geometry.getAttribute('position').count,
    surfacePatch,
  };
}

export function buildLambdaPhage(
  collector: ModelCollector,
  quality: 'high' | 'low',
): void {
  const body = new THREE.Group();
  collector.root.add(body);
  buildPhageHead(collector, body, quality, {
    radius: 1.28,
    centerY: 2.35,
    elongation: 1.02,
    unitCount: quality === 'high' ? 48 : 26,
  });

  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.38, 0.34, 10),
    standardMaterial(0xb6d8e7),
  );
  neck.position.y = 0.9;
  body.add(neck);
  register(collector, neck, 'neck', 'tail', true);
  addObjectExplosion(collector, neck, new THREE.Vector3(0.65, 0.2, 0.2), 0.65);

  const tailPoints: THREE.Vector3[] = [];
  const samples = quality === 'high' ? 36 : 22;
  for (let index = 0; index <= samples; index += 1) {
    const t = index / samples;
    tailPoints.push(
      new THREE.Vector3(
        Math.sin(t * Math.PI * 1.4) * 0.16,
        0.75 - t * 4.35,
        Math.sin(t * Math.PI * 2.1) * 0.1,
      ),
    );
  }
  const tail = createTube(tailPoints, 0.14, quality, false, COLORS.tail);
  body.add(tail);
  register(collector, tail, 'flexible-tail', 'tail', true);
  addObjectExplosion(collector, tail, new THREE.Vector3(-0.55, -0.1, 0.45), 0.75);

  const terminal = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.18, 0.28, 6),
    standardMaterial(COLORS.receptor),
  );
  terminal.position.copy(tailPoints.at(-1) ?? new THREE.Vector3(0, -3.6, 0));
  body.add(terminal);
  register(collector, terminal, 'tail-fiber', 'tail', true);
  const fibers = createTailFibers(terminal.position.y - 0.08, 0.72, 6, 0.022);
  fibers.position.x = terminal.position.x;
  fibers.position.z = terminal.position.z;
  body.add(fibers);
  register(collector, fibers, 'tail-fiber', 'tail', true);
}

export function buildT7Phage(collector: ModelCollector, quality: 'high' | 'low'): void {
  const body = new THREE.Group();
  collector.root.add(body);
  buildPhageHead(collector, body, quality, {
    radius: 1.5,
    centerY: 0.9,
    elongation: 0.98,
    unitCount: quality === 'high' ? 56 : 28,
  });
  const portal = new THREE.Mesh(
    new THREE.CylinderGeometry(0.38, 0.5, 0.34, 12),
    standardMaterial(0xc0e0ee),
  );
  portal.position.y = -0.72;
  body.add(portal);
  register(collector, portal, 'portal', 'tail', true);
  addObjectExplosion(collector, portal, new THREE.Vector3(0.6, -0.1, 0.35), 0.6);

  const shortTail = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.3, 0.8, 10),
    standardMaterial(COLORS.tail),
  );
  shortTail.position.y = -1.25;
  body.add(shortTail);
  register(collector, shortTail, 'inner-tube', 'tail', true);
  addObjectExplosion(collector, shortTail, new THREE.Vector3(-0.55, -0.2, 0.4), 0.62);

  const fibers = createTailFibers(-1.5, 1.02, 6, 0.03);
  body.add(fibers);
  register(collector, fibers, 'tail-fiber', 'tail', true);
  addObjectExplosion(collector, fibers, new THREE.Vector3(0.1, -0.8, -0.35), 0.76);
}

function buildPhageHead(
  collector: ModelCollector,
  parent: THREE.Group,
  quality: 'high' | 'low',
  options: {
    radius: number;
    centerY: number;
    elongation: number;
    unitCount: number;
  },
): { shell: THREE.Mesh; genome: THREE.Mesh } {
  const shell = new THREE.Mesh(
    new THREE.IcosahedronGeometry(options.radius, 1),
    physicalMaterial(COLORS.capsid, 0.83, true),
  );
  shell.position.y = options.centerY;
  shell.scale.y = options.elongation;
  parent.add(shell);
  register(collector, shell, 'capsid', 'capsid', true);

  const directions = fibonacciDirections(options.unitCount);
  const units = createRadialInstances(
    new THREE.CylinderGeometry(0.14, 0.2, 0.14, 6),
    standardMaterial(COLORS.capsomer),
    directions.map(
      (direction) =>
        new THREE.Vector3(
          direction.x * options.radius * 1.02,
          options.centerY + direction.y * options.radius * options.elongation * 1.02,
          direction.z * options.radius * 1.02,
        ),
    ),
    directions,
  );
  parent.add(units.mesh);
  register(collector, units.mesh, 'capsomer', 'capsid', true);
  collector.instanceExplosions.push({ ...units, distance: 0.82 });

  const genome = createGenomeCoil(options.radius * 0.58, 17, 0.043, quality);
  genome.position.y = options.centerY;
  genome.scale.y = options.elongation;
  parent.add(genome);
  register(collector, genome, 'genome', 'genome');
  collector.genomeObjects.push(genome);
  addObjectExplosion(collector, genome, new THREE.Vector3(-0.35, 0.7, 0.3), 0.72);
  return { shell, genome };
}

function createBaseplate(
  y: number,
  radius: number,
  quality: 'high' | 'low',
): THREE.Group {
  const group = new THREE.Group();
  const plate = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius * 0.78, 0.2, 6),
    standardMaterial(COLORS.receptor),
  );
  plate.position.y = y;
  group.add(plate);
  const material = standardMaterial(COLORS.receptor);
  for (let index = 0; index < 6; index += 1) {
    const angle = (index / 6) * Math.PI * 2;
    group.add(
      createCylinderBetween(
        new THREE.Vector3(
          Math.cos(angle) * radius * 0.52,
          y,
          Math.sin(angle) * radius * 0.52,
        ),
        new THREE.Vector3(
          Math.cos(angle) * radius * 0.78,
          y - 0.3,
          Math.sin(angle) * radius * 0.78,
        ),
        quality === 'high' ? 0.045 : 0.052,
        material,
      ),
    );
  }
  return group;
}

function createTailFibers(
  y: number,
  reach: number,
  count: number,
  radius: number,
): THREE.Group {
  const group = new THREE.Group();
  const material = standardMaterial(COLORS.receptor);
  for (let index = 0; index < count; index += 1) {
    const angle = (index / count) * Math.PI * 2;
    const radial = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
    const start = radial.clone().multiplyScalar(0.34).setY(y);
    const elbow = radial
      .clone()
      .multiplyScalar(reach * 0.62)
      .setY(y - reach * 0.18);
    const tip = radial
      .clone()
      .multiplyScalar(reach)
      .setY(y - reach * 0.34);
    group.add(
      createCylinderBetween(start, elbow, radius, material),
      createCylinderBetween(elbow, tip, radius * 0.76, material),
    );
  }
  return group;
}

function createDeliveryPath(): THREE.Line {
  const points: THREE.Vector3[] = [];
  const count = 84;
  for (let index = 0; index < count; index += 1) {
    const t = index / (count - 1);
    const headPhase = Math.min(1, t / 0.35);
    const radius = t < 0.35 ? (1 - headPhase) * 0.58 : 0.025;
    points.push(
      new THREE.Vector3(
        Math.cos(t * Math.PI * 9) * radius,
        2.3 - t * 5.85,
        Math.sin(t * Math.PI * 9) * radius,
      ),
    );
  }
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  geometry.setDrawRange(0, 2);
  return new THREE.Line(
    geometry,
    new THREE.LineBasicMaterial({
      color: COLORS.genome,
      transparent: true,
      opacity: 0.96,
    }),
  );
}

function createSurfacePatch(quality: 'high' | 'low'): THREE.Group {
  const group = new THREE.Group();
  group.position.y = -3.78;
  group.userData.ignoreCameraBounds = true;
  group.add(
    new THREE.Mesh(
      new THREE.CylinderGeometry(2.8, 2.8, 0.18, quality === 'high' ? 48 : 24),
      new THREE.MeshPhysicalMaterial({
        color: 0x6cb5d2,
        emissive: 0x102f46,
        transparent: true,
        opacity: 0.46,
        roughness: 0.52,
        depthWrite: false,
      }),
    ),
  );
  return group;
}

export function phageDefinitionSupportsDelivery(
  definition: ObservationDefinition,
): boolean {
  return definition.supportsDeliveryDemo;
}

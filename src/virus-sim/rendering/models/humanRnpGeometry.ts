import * as THREE from 'three';
import type {
  HumanRnpSurfaceProfile,
  SurfaceOrganization,
} from '../../catalog/humanExpansionProfiles';
import type { InstanceExplosion } from './types';
import {
  COLORS,
  createTube,
  fibonacciDirections,
  physicalMaterial,
  standardMaterial,
} from './shared';
import {
  createSurfaceProteinInstances,
  createSurfaceProteinInstancesAtDirections,
} from './components';

type Quality = 'high' | 'low';
type SurfaceInstances = Omit<InstanceExplosion, 'distance'>;

export function createPleomorphicEnvelope(
  radius: number,
  quality: Quality,
  color: number,
  opacity: number,
  deformation: number,
): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(
    radius,
    quality === 'high' ? 48 : 24,
    quality === 'high' ? 32 : 16,
  );
  const positions = geometry.getAttribute('position');
  const vertex = new THREE.Vector3();
  for (let index = 0; index < positions.count; index += 1) {
    vertex.fromBufferAttribute(positions, index);
    const direction = vertex.clone().normalize();
    const wave =
      Math.sin(direction.x * 4.7 + direction.z * 2.3) * 0.46 +
      Math.cos(direction.y * 5.1 - direction.x * 1.7) * 0.31 +
      direction.x * direction.y * direction.z * 1.2;
    vertex.multiplyScalar(1 + deformation * wave);
    positions.setXYZ(index, vertex.x, vertex.y, vertex.z);
  }
  positions.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  const envelope = new THREE.Mesh(geometry, physicalMaterial(color, opacity));
  envelope.name = 'pleomorphic-envelope';
  envelope.userData.pleomorphic = true;
  return envelope;
}

export function createOrganizedSurfaceInstances(options: {
  readonly component: HumanRnpSurfaceProfile;
  readonly organization: SurfaceOrganization;
  readonly radius: number;
  readonly envelopeScale: readonly [number, number, number];
  readonly quality: Quality;
}): SurfaceInstances {
  const count =
    options.quality === 'high'
      ? options.component.highCount
      : options.component.lowCount;
  if (options.organization === 'helical-rows') {
    return createSurfaceRows(
      options.component,
      options.radius,
      count,
      options.envelopeScale,
    );
  }
  if (options.organization === 'icosahedral-raft') {
    return createSurfaceRafts(
      options.component,
      options.radius,
      count,
      options.envelopeScale,
    );
  }
  if (options.organization === 'irregular-patches') {
    return createPatchSurface(
      options.component,
      options.radius,
      count,
      options.envelopeScale,
    );
  }
  if (options.envelopeScale.every((value) => value === 1)) {
    return createSurfaceProteinInstances({
      id: options.component.id,
      radius: options.radius,
      count,
      shape: options.component.shape,
      color: options.component.color,
    });
  }
  const directions = fibonacciDirections(count);
  return createAtDirections(
    options.component,
    directions,
    options.radius,
    options.envelopeScale,
    `surface-${options.organization}-${options.component.id}`,
  );
}

export function createLipoproteinPatches(
  radius: number,
  quality: Quality,
  envelopeScale: readonly [number, number, number],
): THREE.Group {
  const group = new THREE.Group();
  group.name = 'lipoprotein-associated-patches';
  group.userData.surfaceOrganization = 'irregular-patches';
  const directions = [
    new THREE.Vector3(0.77, 0.48, 0.42),
    new THREE.Vector3(-0.64, 0.34, 0.69),
    new THREE.Vector3(0.2, -0.83, -0.51),
  ].map((direction) => direction.normalize());
  const count = quality === 'high' ? directions.length : directions.length - 1;
  for (let index = 0; index < count; index += 1) {
    const direction = directions[index]!;
    const patch = new THREE.Mesh(
      new THREE.SphereGeometry(
        0.3,
        quality === 'high' ? 18 : 10,
        quality === 'high' ? 12 : 7,
      ),
      physicalMaterial(index % 2 ? 0xe5b56e : 0xd49b62, 0.78),
    );
    patch.name = `lipoprotein-patch-${index + 1}`;
    patch.position
      .copy(scaleDirection(direction, envelopeScale))
      .multiplyScalar(radius * 0.94);
    patch.scale.set(1.35, 0.72, 1.05);
    group.add(patch);
  }
  return group;
}

export function createIrregularRnpCore(radius: number, quality: Quality): THREE.Group {
  const group = new THREE.Group();
  group.name = 'irregular-rnp-core';
  group.userData.coreOrganization = 'irregular-rnp';
  const strandCount = quality === 'high' ? 4 : 3;
  for (let strand = 0; strand < strandCount; strand += 1) {
    const points: THREE.Vector3[] = [];
    const pointCount = quality === 'high' ? 28 : 18;
    for (let index = 0; index < pointCount; index += 1) {
      const t = index / pointCount;
      const angle = t * Math.PI * 2;
      const localRadius = radius * (0.54 + 0.12 * Math.sin(angle * 3 + strand));
      points.push(
        new THREE.Vector3(
          Math.cos(angle + strand * 0.83) * localRadius,
          Math.sin(angle * 2 + strand * 0.61) * radius * 0.32,
          Math.sin(angle + strand * 0.83) * localRadius,
        ),
      );
    }
    const strandMesh = createTube(points, 0.045, quality, true, COLORS.capsid);
    strandMesh.name = `irregular-capsid-rnp-strand-${strand + 1}`;
    strandMesh.rotation.set(strand * 0.34, strand * 0.47, strand * 0.29);
    group.add(strandMesh);
  }
  return group;
}

export function createGridLikeRnpCore(radius: number, quality: Quality): THREE.Group {
  const group = new THREE.Group();
  group.name = 'grid-like-rnp-core';
  group.userData.coreOrganization = 'grid-like-rnp';
  const bandCount = quality === 'high' ? 6 : 4;
  for (let band = 0; band < bandCount; band += 1) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(
        radius * (0.68 + (band % 2) * 0.08),
        0.045,
        quality === 'high' ? 8 : 5,
        quality === 'high' ? 48 : 24,
      ),
      standardMaterial(band % 2 ? COLORS.capsid : COLORS.capsomer),
    );
    ring.name = `capsid-rna-grid-band-${band + 1}`;
    ring.rotation.set(band * 0.43, band * 0.61, band * 0.28);
    group.add(ring);
  }
  return group;
}

function createSurfaceRows(
  component: HumanRnpSurfaceProfile,
  radius: number,
  count: number,
  envelopeScale: readonly [number, number, number],
): SurfaceInstances {
  const rowCount = count >= 40 ? 4 : 3;
  const directions: THREE.Vector3[] = [];
  for (let index = 0; index < count; index += 1) {
    const row = index % rowCount;
    const step = Math.floor(index / rowCount);
    const steps = Math.ceil(count / rowCount);
    const t = steps <= 1 ? 0.5 : step / (steps - 1);
    const y = -0.82 + t * 1.64;
    const ringRadius = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = t * Math.PI * 2.35 + (row / rowCount) * Math.PI * 2;
    directions.push(
      new THREE.Vector3(Math.cos(theta) * ringRadius, y, Math.sin(theta) * ringRadius),
    );
  }
  return createAtDirections(
    component,
    directions,
    radius,
    envelopeScale,
    `surface-row-${component.id}`,
  );
}

function createSurfaceRafts(
  component: HumanRnpSurfaceProfile,
  radius: number,
  count: number,
  envelopeScale: readonly [number, number, number],
): SurfaceInstances {
  const clusterSize = 3;
  const centers = fibonacciDirections(Math.ceil(count / clusterSize));
  const directions: THREE.Vector3[] = [];
  for (const center of centers) {
    const reference =
      Math.abs(center.y) > 0.86
        ? new THREE.Vector3(1, 0, 0)
        : new THREE.Vector3(0, 1, 0);
    const tangent = new THREE.Vector3().crossVectors(center, reference).normalize();
    const bitangent = new THREE.Vector3().crossVectors(center, tangent).normalize();
    for (
      let member = 0;
      member < clusterSize && directions.length < count;
      member += 1
    ) {
      const angle = (member / clusterSize) * Math.PI * 2;
      directions.push(
        center
          .clone()
          .addScaledVector(tangent, Math.cos(angle) * 0.075)
          .addScaledVector(bitangent, Math.sin(angle) * 0.075)
          .normalize(),
      );
    }
  }
  return createAtDirections(
    component,
    directions,
    radius,
    envelopeScale,
    `surface-raft-${component.id}`,
  );
}

function createPatchSurface(
  component: HumanRnpSurfaceProfile,
  radius: number,
  count: number,
  envelopeScale: readonly [number, number, number],
): SurfaceInstances {
  const centers = [
    new THREE.Vector3(0.8, 0.38, 0.46),
    new THREE.Vector3(-0.58, 0.57, 0.58),
    new THREE.Vector3(0.28, -0.82, -0.5),
    new THREE.Vector3(-0.73, -0.35, 0.59),
  ].map((direction) => direction.normalize());
  const directions = Array.from({ length: count }, (_, index) => {
    const center = centers[index % centers.length]!;
    const ring = Math.floor(index / centers.length) + 1;
    const phase = index * 2.399963;
    return center
      .clone()
      .add(
        new THREE.Vector3(
          Math.cos(phase),
          Math.sin(phase * 0.7),
          Math.sin(phase),
        ).multiplyScalar(0.035 * ring),
      )
      .normalize();
  });
  return createAtDirections(
    component,
    directions,
    radius,
    envelopeScale,
    `surface-patch-${component.id}`,
  );
}

function createAtDirections(
  component: HumanRnpSurfaceProfile,
  directions: readonly THREE.Vector3[],
  radius: number,
  envelopeScale: readonly [number, number, number],
  name: string,
): SurfaceInstances {
  const origins = directions.map((direction) =>
    scaleDirection(direction, envelopeScale).multiplyScalar(radius),
  );
  const normals = origins.map((origin) => origin.clone().normalize());
  const result = createSurfaceProteinInstancesAtDirections({
    id: component.id,
    origins,
    directions: normals,
    shape: component.shape,
    color: component.color,
  });
  result.mesh.name = name;
  return result;
}

function scaleDirection(
  direction: THREE.Vector3,
  scale: readonly [number, number, number],
): THREE.Vector3 {
  return new THREE.Vector3(
    direction.x * scale[0],
    direction.y * scale[1],
    direction.z * scale[2],
  );
}

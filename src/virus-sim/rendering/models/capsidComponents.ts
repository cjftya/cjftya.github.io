import * as THREE from 'three';
import type {
  CapsidFaceting,
  IcosahedralSurfacePattern,
  LayeredCapsidLayerSignature,
  VertexFeatureSignature,
} from '../../catalog/structuralTypes';
import type { InstanceExplosion } from './types';
import {
  COLORS,
  createRadialInstances,
  physicalMaterial,
  standardMaterial,
} from './shared';

type Quality = 'high' | 'low';
type RadialInstances = Omit<InstanceExplosion, 'distance'>;

const DIRECTION_CACHE = new Map<number, readonly THREE.Vector3[]>();

export function getIcosahedronVertices(): THREE.Vector3[] {
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

export function getIcosahedralDirections(
  quality: Quality,
  requestedCount: number,
): THREE.Vector3[] {
  const detail = quality === 'high' ? 2 : 1;
  const source = cachedSubdivisionDirections(detail);
  const count = Math.max(1, Math.min(requestedCount, source.length));
  if (count === source.length) return source.map((direction) => direction.clone());
  return Array.from({ length: count }, (_, index) =>
    source[Math.floor((index * source.length) / count)]!.clone(),
  );
}

export function createFacetedShell(options: {
  readonly radius: number;
  readonly quality: Quality;
  readonly faceting: CapsidFaceting;
  readonly color?: number;
  readonly opacity?: number;
}): THREE.Mesh {
  const detail = shellDetail(options.faceting, options.quality);
  const shell = new THREE.Mesh(
    options.faceting === 'smooth'
      ? new THREE.SphereGeometry(
          options.radius,
          options.quality === 'high' ? 42 : 22,
          options.quality === 'high' ? 28 : 14,
        )
      : new THREE.IcosahedronGeometry(options.radius, detail),
    physicalMaterial(
      options.color ?? COLORS.capsid,
      options.opacity ?? 0.8,
      options.faceting !== 'smooth',
    ),
  );
  shell.name = `capsid-shell-${options.faceting}`;
  return shell;
}

export function createOrderedCapsomerInstances(options: {
  readonly radius: number;
  readonly count: number;
  readonly quality: Quality;
  readonly pattern: IcosahedralSurfacePattern;
  readonly unitScale: number;
  readonly protrusion: number;
  readonly scaleMultiplier?: number;
  readonly directions?: readonly THREE.Vector3[];
  readonly color?: number;
}): RadialInstances {
  const directions = options.directions
    ? options.directions.map((direction) => direction.clone())
    : getIcosahedralDirections(options.quality, options.count);
  const geometry = surfaceUnitGeometry(
    options.pattern,
    options.unitScale * (options.scaleMultiplier ?? 1),
    options.protrusion,
    options.quality,
  );
  const radialOffset =
    options.radius +
    Math.max(0.025, options.protrusion * surfaceOffsetFactor(options.pattern));
  const result = createRadialInstances(
    geometry,
    standardMaterial(options.color ?? surfaceColor(options.pattern)),
    directions.map((direction) => direction.clone().multiplyScalar(radialOffset)),
    directions,
  );
  result.mesh.name = `ordered-surface-${options.pattern}`;
  result.mesh.userData.representativeCount = true;
  return result;
}

export function createDimpleInstances(options: {
  readonly radius: number;
  readonly count: number;
  readonly quality: Quality;
  readonly scale: number;
  readonly channelled?: boolean;
}): RadialInstances {
  const directions = getIcosahedralDirections(options.quality, options.count);
  const geometry = new THREE.TorusGeometry(
    0.115 * options.scale,
    options.channelled ? 0.032 : 0.024,
    options.quality === 'high' ? 7 : 5,
    options.quality === 'high' ? 14 : 9,
  );
  geometry.rotateX(Math.PI / 2);
  const result = createRadialInstances(
    geometry,
    standardMaterial(options.channelled ? COLORS.layerGold : COLORS.capsidDark),
    directions.map((direction) =>
      direction.clone().multiplyScalar(options.radius * 1.006),
    ),
    directions,
  );
  result.mesh.name = options.channelled ? 'channelled-dimple-rings' : 'dimple-rings';
  return result;
}

export function createVertexFeatureInstances(options: {
  readonly radius: number;
  readonly quality: Quality;
  readonly feature: VertexFeatureSignature;
  readonly color?: number;
}): readonly RadialInstances[] {
  const directions = getIcosahedronVertices().slice(0, options.feature.count);
  const length = Math.max(0.18, options.radius * options.feature.relativeLength);
  const isTurret = options.feature.kind === 'turret';
  const bodyGeometry = isTurret
    ? new THREE.CylinderGeometry(
        length * 0.14,
        length * 0.25,
        length,
        options.quality === 'high' ? 10 : 6,
        1,
        Boolean(options.feature.opening),
      )
    : new THREE.ConeGeometry(
        length * (options.feature.kind === 'penton-fiber' ? 0.07 : 0.2),
        length,
        options.quality === 'high' ? 9 : 6,
      );
  const body = createRadialInstances(
    bodyGeometry,
    standardMaterial(options.color ?? (isTurret ? COLORS.layerGold : COLORS.spike)),
    directions.map((direction) =>
      direction.clone().multiplyScalar(options.radius + length * 0.5),
    ),
    directions,
  );
  body.mesh.name = `vertex-${options.feature.kind}-body`;
  if (!isTurret || !options.feature.opening) return [body];

  const rimGeometry = new THREE.TorusGeometry(
    length * 0.135,
    length * 0.035,
    options.quality === 'high' ? 7 : 5,
    options.quality === 'high' ? 14 : 8,
  );
  rimGeometry.rotateX(Math.PI / 2);
  const rim = createRadialInstances(
    rimGeometry,
    standardMaterial(COLORS.receptor),
    directions.map((direction) =>
      direction.clone().multiplyScalar(options.radius + length * 1.02),
    ),
    directions,
  );
  rim.mesh.name = `vertex-${options.feature.kind}-opening`;
  return [body, rim];
}

export function createLayerShell(options: {
  readonly baseRadius: number;
  readonly quality: Quality;
  readonly signature: LayeredCapsidLayerSignature;
  readonly color: number;
}): THREE.Mesh {
  const radius = options.baseRadius * options.signature.radiusScale;
  const shell = createFacetedShell({
    radius,
    quality: options.quality,
    faceting: options.signature.faceting,
    color: options.color,
    opacity: options.signature.opacity,
  });
  shell.name = `layer-${options.signature.role}-${options.signature.surfacePattern}`;
  shell.renderOrder = Math.round(options.signature.radiusScale * 10);
  const material = shell.material;
  if (Array.isArray(material)) {
    for (const item of material) item.depthWrite = false;
  } else {
    material.depthWrite = false;
  }
  return shell;
}

function cachedSubdivisionDirections(detail: number): readonly THREE.Vector3[] {
  const cached = DIRECTION_CACHE.get(detail);
  if (cached) return cached;
  const geometry = new THREE.IcosahedronGeometry(1, detail);
  const positions = geometry.getAttribute('position');
  const unique = new Map<string, THREE.Vector3>();
  for (let index = 0; index < positions.count; index += 1) {
    const direction = new THREE.Vector3(
      positions.getX(index),
      positions.getY(index),
      positions.getZ(index),
    ).normalize();
    const key = direction
      .toArray()
      .map((value) => value.toFixed(6))
      .join(':');
    if (!unique.has(key)) unique.set(key, direction);
  }
  geometry.dispose();
  const directions = [...unique.values()];
  DIRECTION_CACHE.set(detail, directions);
  return directions;
}

function shellDetail(faceting: CapsidFaceting, quality: Quality): number {
  if (faceting === 'strong') return quality === 'high' ? 1 : 0;
  return quality === 'high' ? 2 : 1;
}

function surfaceUnitGeometry(
  pattern: IcosahedralSurfacePattern,
  scale: number,
  protrusion: number,
  quality: Quality,
): THREE.BufferGeometry {
  if (pattern === 'pentameric') {
    return new THREE.CylinderGeometry(scale * 0.72, scale, scale * 0.64, 5);
  }
  if (
    pattern === 'protruding-domain' ||
    pattern === 'plant-protruding' ||
    pattern === 'star-feature'
  ) {
    return new THREE.CapsuleGeometry(
      scale * 0.58,
      Math.max(scale * 0.42, protrusion),
      quality === 'high' ? 4 : 2,
      quality === 'high' ? 7 : 5,
    );
  }
  if (
    pattern === 'plant-soft' ||
    pattern === 'plant-rounded' ||
    pattern === 'dimpled'
  ) {
    return new THREE.SphereGeometry(
      scale * 0.74,
      quality === 'high' ? 9 : 6,
      quality === 'high' ? 7 : 5,
    );
  }
  if (pattern === 'channelled') {
    return new THREE.CylinderGeometry(
      scale * 0.55,
      scale * 0.8,
      scale * 0.8,
      5,
      1,
      true,
    );
  }
  return new THREE.CylinderGeometry(scale * 0.68, scale, scale * 0.58, 6);
}

function surfaceOffsetFactor(pattern: IcosahedralSurfacePattern): number {
  return ['protruding-domain', 'plant-protruding', 'star-feature'].includes(pattern)
    ? 0.72
    : 0.28;
}

function surfaceColor(pattern: IcosahedralSurfacePattern): number {
  if (pattern === 'pentameric') return COLORS.layerGold;
  if (pattern === 'protruding-domain' || pattern === 'plant-protruding') {
    return COLORS.receptor;
  }
  if (pattern === 'star-feature' || pattern === 'vertex-spiked') return COLORS.spike;
  if (pattern === 'plant-dense') return COLORS.layerBlue;
  return COLORS.capsomer;
}

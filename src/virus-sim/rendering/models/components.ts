import * as THREE from 'three';
import type { SurfaceComponentShape } from '../../catalog/structuralTypes';
import type { InstanceExplosion } from './types';
import {
  COLORS,
  createRadialInstances,
  createTube,
  fibonacciDirections,
  physicalMaterial,
  standardMaterial,
} from './shared';

type Quality = 'high' | 'low';

export function createLipidEnvelope(
  radius: number,
  quality: Quality,
  color: number,
  opacity = 0.74,
): THREE.Mesh {
  return new THREE.Mesh(
    new THREE.SphereGeometry(
      radius,
      quality === 'high' ? 48 : 24,
      quality === 'high' ? 32 : 16,
    ),
    physicalMaterial(color, opacity),
  );
}

export function createMatrixShell(
  radius: number,
  quality: Quality,
  opacity = 0.46,
): THREE.Mesh {
  return new THREE.Mesh(
    new THREE.SphereGeometry(
      radius,
      quality === 'high' ? 36 : 18,
      quality === 'high' ? 24 : 12,
    ),
    physicalMaterial(COLORS.matrix, opacity),
  );
}

export function createSurfaceProteinInstances(options: {
  readonly id?: string;
  readonly radius: number;
  readonly count: number;
  readonly shape: SurfaceComponentShape;
  readonly color: number;
  readonly scale?: THREE.Vector3;
}): Omit<InstanceExplosion, 'distance'> {
  const directions = fibonacciDirections(options.count);
  const geometry = surfaceGeometry(options.shape);
  const result = createRadialInstances(
    geometry,
    standardMaterial(options.color),
    directions.map((direction) => direction.clone().multiplyScalar(options.radius)),
    directions,
    options.scale,
  );
  result.mesh.name = options.id ? `surface-${options.id}` : 'surface-protein';
  return result;
}

export function createIcosahedralShell(
  radius: number,
  quality: Quality,
  color: number = COLORS.capsid,
  opacity = 0.82,
): THREE.Mesh {
  return new THREE.Mesh(
    new THREE.IcosahedronGeometry(radius, quality === 'high' ? 2 : 1),
    physicalMaterial(color, opacity, true),
  );
}

export function createCapsomerInstances(
  radius: number,
  count: number,
  color: number = COLORS.capsomer,
): Omit<InstanceExplosion, 'distance'> {
  const directions = fibonacciDirections(count);
  const result = createRadialInstances(
    new THREE.CylinderGeometry(0.09, 0.14, 0.12, 6),
    standardMaterial(color),
    directions.map((direction) => direction.clone().multiplyScalar(radius)),
    directions,
  );
  result.mesh.name = 'capsomer-array';
  return result;
}

export function createPartiallyDoubleStrandedGenome(quality: Quality): THREE.Group {
  const group = new THREE.Group();
  group.name = 'partial-double-stranded-dna';
  const segments = quality === 'high' ? 64 : 36;
  const primary = new THREE.Mesh(
    new THREE.TorusGeometry(0.48, 0.035, quality === 'high' ? 8 : 5, segments),
    standardMaterial(COLORS.genome, 1, 0x3b176b),
  );
  const partial = new THREE.Mesh(
    new THREE.TorusGeometry(
      0.39,
      0.03,
      quality === 'high' ? 8 : 5,
      segments,
      Math.PI * 1.36,
    ),
    standardMaterial(0xd1a7ff, 1, 0x3b176b),
  );
  partial.rotation.z = -0.45;
  group.add(primary, partial);
  return group;
}

export function createSegmentedRnp(
  segmentCount: number,
  quality: Quality,
): THREE.Group {
  const group = new THREE.Group();
  for (let segment = 0; segment < segmentCount; segment += 1) {
    const angle = (segment / segmentCount) * Math.PI * 2;
    const length = 1.02 + (segment % 3) * 0.2;
    const points = Array.from({ length: quality === 'high' ? 17 : 11 }, (_, index) => {
      const denominator = quality === 'high' ? 16 : 10;
      const t = index / denominator;
      return new THREE.Vector3(
        Math.cos(angle) * (0.25 + segment * 0.028) + Math.sin(t * Math.PI * 2) * 0.08,
        (t - 0.5) * length,
        Math.sin(angle) * (0.25 + segment * 0.028) + Math.cos(t * Math.PI * 2) * 0.08,
      );
    });
    group.add(
      createTube(points, 0.055, quality, false, segment % 2 ? 0xb78cff : 0xd1a7ff),
    );
  }
  return group;
}

export function createConicalCore(quality: Quality): THREE.Mesh {
  return new THREE.Mesh(
    new THREE.ConeGeometry(0.82, 2.45, quality === 'high' ? 36 : 18, 1, true),
    physicalMaterial(COLORS.capsid, 0.84),
  );
}

function surfaceGeometry(shape: SurfaceComponentShape): THREE.BufferGeometry {
  if (shape === 'crown') {
    return new THREE.LatheGeometry(
      [
        new THREE.Vector2(0.055, -0.24),
        new THREE.Vector2(0.07, 0.02),
        new THREE.Vector2(0.15, 0.12),
        new THREE.Vector2(0.18, 0.2),
        new THREE.Vector2(0.11, 0.29),
        new THREE.Vector2(0.045, 0.32),
      ],
      7,
    );
  }
  if (shape === 'cone') return new THREE.ConeGeometry(0.11, 0.48, 7);
  if (shape === 'channel') return new THREE.CylinderGeometry(0.065, 0.085, 0.22, 6);
  if (shape === 'knob') return new THREE.CapsuleGeometry(0.105, 0.22, 3, 6);
  return new THREE.CapsuleGeometry(0.11, 0.4, 3, 7);
}

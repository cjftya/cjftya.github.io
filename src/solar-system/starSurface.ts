import { IcosahedronGeometry } from 'three';

const STAR_RADIUS = 1.15;

export function sampleCoronaVariation(
  normalX: number,
  normalY: number,
  normalZ: number,
  seed: number,
): number {
  const phase = seed * 0.017;
  const broad = Math.sin(normalX * 4.7 + normalZ * 2.3 + phase);
  const crossing = Math.sin(normalY * 6.1 - normalX * 1.9 + phase * 1.37);
  const detail = Math.sin((normalX + normalY - normalZ) * 9.2 - phase * 0.71);

  return Math.max(-1, Math.min(1, broad * 0.48 + crossing * 0.34 + detail * 0.18));
}

export function createCoronaGeometry(
  seed: number,
  irregularity: number,
  phaseOffset: number,
): IcosahedronGeometry {
  const geometry = new IcosahedronGeometry(STAR_RADIUS, 3);
  const position = geometry.getAttribute('position');

  for (let index = 0; index < position.count; index += 1) {
    const x = position.getX(index);
    const y = position.getY(index);
    const z = position.getZ(index);
    const length = Math.hypot(x, y, z);
    const variation = sampleCoronaVariation(
      x / length,
      y / length,
      z / length,
      seed + phaseOffset,
    );
    const scale = 1 + variation * irregularity;

    position.setXYZ(index, x * scale, y * scale, z * scale);
  }

  position.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

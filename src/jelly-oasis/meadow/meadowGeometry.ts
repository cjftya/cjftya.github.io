import { BufferGeometry, Color, Float32BufferAttribute } from 'three';
import { createVegetationGeometry } from '../vegetation/createVegetation';
import type { MeadowKind } from './meadowConfig';
export function createMeadowGeometry(kind: MeadowKind): BufferGeometry {
  if (kind === 'grass' || kind === 'shrub') return createVegetationGeometry(kind);
  const source = createVegetationGeometry('flower'),
    p = source.attributes.position!,
    c = source.attributes.color!;
  const positions: number[] = [],
    colors: number[] = [];
  // Retain the existing stem, leaves and connected central disk. Replace only
  // the five source petal faces, without changing the approved vegetation owner.
  for (let i = 0; i < p.count; i += 3) {
    if (
      Array.from({ length: 3 }, (_, j) => i + j).every(
        (j) => p.getY(j) >= 0.4 && c.getZ(j) > c.getY(j),
      )
    )
      continue;
    for (let j = i; j < i + 3; j++) {
      positions.push(p.getX(j), p.getY(j), p.getZ(j));
      colors.push(c.getX(j), c.getY(j), c.getZ(j));
    }
  }
  for (let i = 0; i < 5; i++) {
    const angle = (i * Math.PI * 2) / 5,
      dx = Math.cos(angle),
      dz = Math.sin(angle);
    const root = [dx * 0.02, 0.405, dz * 0.02],
      left = [dx * 0.12 - dz * 0.065, 0.435, dz * 0.12 + dx * 0.065],
      tip = [dx * 0.24, 0.425, dz * 0.24],
      right = [dx * 0.12 + dz * 0.065, 0.435, dz * 0.12 - dx * 0.065];
    const color = new Color(
      kind === 'cream'
        ? i % 2
          ? '#c7c19b'
          : '#d1cbaf'
        : i % 2
          ? '#b4a1bd'
          : '#c4afd0',
    );
    for (const vertex of [root, left, tip, root, tip, right]) {
      positions.push(...vertex);
      colors.push(color.r, color.g, color.b);
    }
  }
  source.dispose();
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

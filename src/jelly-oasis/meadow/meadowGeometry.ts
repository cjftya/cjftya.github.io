import {
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  IcosahedronGeometry,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { createVegetationGeometry } from '../vegetation/createVegetation';
import type { MeadowKind } from './meadowConfig';
export function createMeadowGeometry(kind: MeadowKind): BufferGeometry {
  if (kind === 'grass') return createVegetationGeometry(kind);
  if (kind === 'shrub') {
    // A readable middle layer, built from three solid faceted lobes (240 faces).
    // Reuses the meadow instance/material owner; no alpha cards or new draws.
    const parts = Array.from({ length: 3 }, (_, i) => {
      const g = new IcosahedronGeometry(1, 1);
      g.scale(i ? 0.85 : 1.1, i ? 0.65 : 0.9, 0.86)
        .rotateY(i * 2.399)
        .translate(i ? (i === 1 ? -0.65 : 0.65) : 0, i ? 0.45 : 0.65, i ? 0.1 : -0.18);
      const c = new Color(['#65804b', '#809653', '#718b50'][i]!);
      const colors = Array.from({ length: g.attributes.position!.count }, () => [
        c.r,
        c.g,
        c.b,
      ]).flat();
      g.setAttribute('color', new Float32BufferAttribute(colors, 3));
      return g;
    });
    const g = mergeGeometries(parts, false)!;
    parts.forEach((p) => p.dispose());
    g.computeBoundingBox();
    g.computeBoundingSphere();
    return g;
  }
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
  const tuftPositions: number[] = [],
    tuftColors: number[] = [];
  for (let tuft = 0; tuft < 5; tuft++) {
    const scale = 0.56 + (tuft % 3) * 0.11,
      angle = tuft * Math.PI * 0.5,
      dx = tuft ? Math.cos(angle) * 0.37 : 0,
      dz = tuft ? Math.sin(angle) * 0.37 : 0;
    for (let i = 0; i < positions.length; i += 3) {
      tuftPositions.push(
        positions[i]! * scale + dx,
        positions[i + 1]! * scale,
        positions[i + 2]! * scale + dz,
      );
      tuftColors.push(colors[i]!, colors[i + 1]!, colors[i + 2]!);
    }
  }
  source.dispose();
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(tuftPositions, 3));
  geometry.setAttribute('color', new Float32BufferAttribute(tuftColors, 3));
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

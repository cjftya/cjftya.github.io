import { Float32BufferAttribute, Vector3 } from 'three';
import type { BufferGeometry, Color } from 'three';
import { ConvexGeometry } from 'three/examples/jsm/geometries/ConvexGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export function paintFaces(geometry: BufferGeometry, palette: Color[]): BufferGeometry {
  const normals = geometry.attributes.normal!;
  const colors: number[] = [];
  for (let i = 0; i < normals.count; i += 3) {
    const n = normals.getY(i);
    const color = palette[n > 0.45 ? 1 : n < -0.3 ? 2 : 0]!;
    for (let j = 0; j < 3; j++) colors.push(color.r, color.g, color.b);
  }
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
  return geometry;
}

/** Closed, selectively chipped stone. Corner cuts have the same broad scale
 * as the approved ruin; no smooth normals, texture or subdivision modifier. */
export function stoneHull(corners: Vector3[], cut = 0.07): BufferGeometry {
  const points: Vector3[] = [];
  const edges = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0],
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 4],
    [0, 4],
    [1, 5],
    [2, 6],
    [3, 7],
  ];
  for (const [a, b] of edges) {
    points.push(corners[a!]!.clone().lerp(corners[b!]!, cut));
    points.push(corners[b!]!.clone().lerp(corners[a!]!, cut));
  }
  return new ConvexGeometry(points);
}

export function stoneBlock(
  x: number,
  y: number,
  z: number,
  width: number,
  height: number,
  depth: number,
  seed = 0,
): BufferGeometry {
  const corners: Vector3[] = [];
  for (const yy of [-1, 1])
    for (const [xx, zz] of [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ]) {
      const lean = yy > 0 ? 0.05 * Math.sin(seed * 1.7) : 0;
      corners.push(
        new Vector3(
          x + (xx! * width) / 2 + lean,
          y + (yy * height) / 2 + (yy > 0 ? 0.055 * xx! * Math.sin(seed) : 0),
          z + (zz! * depth) / 2 + (yy > 0 ? 0.04 * Math.cos(seed * 2.1) : 0),
        ),
      );
    }
  return stoneHull(corners, 0.04 + (seed % 3) * 0.01);
}

export function mergeStoneParts(parts: BufferGeometry[]): BufferGeometry {
  const result = mergeGeometries(parts, false)!;
  parts.forEach((part) => part.dispose());
  result.computeBoundingBox();
  result.computeBoundingSphere();
  return result;
}

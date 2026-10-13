import { Float32BufferAttribute } from 'three';
import type { BufferGeometry } from 'three';
import type { TerrainConfig } from './heightfield';

type Point = readonly [number, number];
const outlines = new WeakMap<TerrainConfig, Point[]>();

/** Four faceted quarter-circles trim the empty corners without moving the land. */
export function terrainOutline(config: TerrainConfig): Point[] {
  const cached = outlines.get(config);
  if (cached) return cached;
  const half = config.size / 2;
  const radius = config.cornerRadius ?? 0;
  const inset = half - radius;
  const points: Point[] = [];
  if (!radius) points.push([-half, -half], [half, -half], [half, half], [-half, half]);
  else {
    for (let corner = 0; corner < 4; corner++) {
      const cx = corner === 0 || corner === 3 ? inset : -inset;
      const cz = corner < 2 ? inset : -inset;
      for (let step = 0; step <= 4; step++) {
        const angle = ((corner + step / 4) * Math.PI) / 2;
        points.push([cx + radius * Math.cos(angle), cz + radius * Math.sin(angle)]);
      }
    }
  }
  outlines.set(config, points);
  return points;
}

function distance(x: number, z: number, a: Point, b: Point) {
  return (
    ((b[0] - a[0]) * (z - a[1]) - (b[1] - a[1]) * (x - a[0])) /
    Math.hypot(b[0] - a[0], b[1] - a[1])
  );
}

export function insideTerrain(x: number, z: number, config: TerrainConfig, margin = 0) {
  const outline = terrainOutline(config);
  return outline.every(
    (a, i) => distance(x, z, a, outline[(i + 1) % outline.length]!) >= margin - 1e-5,
  );
}

/** Clip triangles, interpolating their original heights and colours at the cut.
 * Shared intersection vertices keep normals continuous and avoid stair-step edges. */
export function clipTerrainOutline(geometry: BufferGeometry, config: TerrainConfig) {
  if (!config.cornerRadius) return;
  const outline = terrainOutline(config);
  const attributes = Object.entries(geometry.attributes).filter(
    ([name]) => name !== 'normal',
  );
  const offsets: number[] = [];
  let stride = 0;
  for (const [, attribute] of attributes) {
    offsets.push(stride);
    stride += attribute.itemSize;
  }
  const positionOffset =
    offsets[attributes.findIndex(([name]) => name === 'position')]!;
  const source = geometry.index!;
  const values = attributes.map(() => [] as number[]);
  const indices: number[] = [];
  const ids = new Map<string, number>();
  function vertex(value: number[]) {
    const key = `${value[positionOffset]!.toFixed(6)},${value[positionOffset + 2]!.toFixed(6)}`;
    const existing = ids.get(key);
    if (existing !== undefined) return existing;
    const id = ids.size;
    ids.set(key, id);
    attributes.forEach(([, attribute], index) => {
      for (let component = 0; component < attribute.itemSize; component++)
        values[index]!.push(value[offsets[index]! + component]!);
    });
    return id;
  }
  for (let triangle = 0; triangle < source.count; triangle += 3) {
    let polygon = [0, 1, 2].map((i) => {
      const id = source.getX(triangle + i);
      return attributes.flatMap(([, attribute]) =>
        Array.from({ length: attribute.itemSize }, (_, component) =>
          attribute.getComponent(id, component),
        ),
      );
    });
    for (let edge = 0; edge < outline.length && polygon.length; edge++) {
      const a = outline[edge]!,
        b = outline[(edge + 1) % outline.length]!;
      const clipped: number[][] = [];
      for (let i = 0; i < polygon.length; i++) {
        const start = polygon[i]!,
          end = polygon[(i + 1) % polygon.length]!;
        const d0 = distance(start[positionOffset]!, start[positionOffset + 2]!, a, b);
        const d1 = distance(end[positionOffset]!, end[positionOffset + 2]!, a, b);
        if (d0 >= -1e-8) clipped.push(start);
        if (d0 >= -1e-8 !== d1 >= -1e-8) {
          const t = Math.max(0, Math.min(1, d0 / (d0 - d1)));
          clipped.push(start.map((value, j) => value + (end[j]! - value) * t));
        }
      }
      polygon = clipped;
    }
    for (let i = 1; i < polygon.length - 1; i++) {
      const a = polygon[0]!,
        b = polygon[i]!,
        c = polygon[i + 1]!;
      const p = positionOffset;
      const area =
        (b[p]! - a[p]!) * (c[p + 2]! - a[p + 2]!) -
        (b[p + 2]! - a[p + 2]!) * (c[p]! - a[p]!);
      if (Math.abs(area) > 1e-8) indices.push(vertex(a), vertex(b), vertex(c));
    }
  }
  attributes.forEach(([name, attribute], i) =>
    geometry.setAttribute(
      name,
      new Float32BufferAttribute(values[i]!, attribute.itemSize),
    ),
  );
  geometry.deleteAttribute('normal');
  geometry.setIndex(indices);
}

/** Directed boundary edges from the actual surface, including interpolated cuts. */
export function terrainBoundary(geometry: BufferGeometry): [number, number][] {
  const edges = new Map<string, [number, number]>();
  const index = geometry.index!;
  for (let i = 0; i < index.count; i += 3) {
    for (let side = 0; side < 3; side++) {
      const a = index.getX(i + side),
        b = index.getX(i + ((side + 1) % 3));
      const key = `${Math.min(a, b)},${Math.max(a, b)}`;
      if (edges.has(key)) edges.delete(key);
      else edges.set(key, [a, b]);
    }
  }
  return [...edges.values()];
}

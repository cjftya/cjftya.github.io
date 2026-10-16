import { rootedWind } from '../animation/vegetationWind';
import type { BufferGeometry } from 'three';
import { Color, IcosahedronGeometry, Vector3 } from 'three';
import type { LayoutGuide } from './landmarkConfig';
import { segmentDistance, type Footprint } from '../vegetation/vegetationPlacement';
import { polygonDistance } from '../terrain/excavateTerrain';
import { paintFaces, stoneBlock } from './sanctuaryGeometry';
import { leafBlade } from './treeFoliage';

/** Plant colonies link the trunk, lake and broken walls without paving the soil. */
export function createPrecinctGarden(
  floor: (x: number, z: number) => number,
  pond: LayoutGuide,
  approach: LayoutGuide,
  mobile: boolean,
) {
  const plants: BufferGeometry[] = [],
    stones: BufferGeometry[] = [],
    footprints: Footprint[] = [];
  const route: number[][] = [];
  for (let i = 0; i + 1 < approach.positions.length; i += 2) {
    const a = approach.positions[i]!,
      b = approach.positions[i + 1]!;
    route.push([(a[0]! + b[0]!) / 2, (a[2]! + b[2]!) / 2]);
  }
  function blocked(x: number, z: number, r: number) {
    if (
      polygonDistance(x, z, pond.positions) > -r - 0.7 ||
      Math.abs(Math.hypot(x / 34, z / 32) - 1) * 32 < 3.8 + r ||
      Math.hypot(x, z - 27) < 8.7 + r
    )
      return true;
    if (x > 12.3 - r && x < 17.7 + r && z > -11 - r && z < 0 + r) return true;
    return route
      .slice(1)
      .some(
        (b, i) =>
          segmentDistance(x, z, route[i]![0]!, route[i]![1]!, b[0]!, b[1]!) < 3.8 + r,
      );
  }
  const moss = ['#708551', '#8b995a', '#576f49'].map((c) => new Color(c));
  const stone = ['#96947a', '#b0aa8c', '#787b66'].map((c) => new Color(c));
  function pebble(x: number, z: number, r: number, seed: number) {
    if (blocked(x, z, r)) return;
    const g = new IcosahedronGeometry(1, 0);
    g.deleteAttribute('uv');
    g.scale(r, r * (0.45 + 0.12 * Math.sin(seed)), r * 0.8)
      .rotateY(seed)
      .translate(x, floor(x, z) + r * 0.16, z);
    stones.push(paintFaces(g, stone));
  }
  function rosette(x: number, z: number, seed: number, scale = 1) {
    if (blocked(x, z, scale * 0.7)) return;
    for (let i = 0; i < 5; i++)
      plants.push(
        leafBlade(
          new Vector3(x, floor(x, z) + scale * 0.6, z),
          seed + i * 2.399,
          scale * (0.7 + (i % 2) * 0.3),
          new Color(i % 2 ? '#6f9149' : '#96a75b'),
        ),
      );
  }
  function bush(x: number, z: number, r: number, seed: number) {
    if (blocked(x, z, r * 1.2)) return;
    const y = floor(x, z);
    for (let i = 0; i < 6; i++) {
      const a = seed + i * 2.399,
        rr = r * (i ? 0.4 : 0),
        g = new IcosahedronGeometry(1, 1);
      g.deleteAttribute('uv');
      g.scale(0.62 * r, r * (i ? 0.45 : 0.65), 0.58 * r)
        .rotateY(a)
        .translate(
          x + Math.cos(a) * rr,
          y + r * (i ? 0.35 : 0.65),
          z + Math.sin(a) * rr,
        );
      rootedWind(g, x, y, z, r * 1.2, r * 0.035);
      plants.push(paintFaces(g, moss));
      for (let k = 0; k < (mobile ? 3 : 5); k++)
        plants.push(
          leafBlade(
            new Vector3(
              x + Math.cos(a + k) * r * 0.5,
              y + r * 0.65,
              z + Math.sin(a + k) * r * 0.5,
            ),
            a + k,
            r * 0.6,
            new Color('#8caa59'),
          ),
        );
    }
  }
  const colonies = [
    [-18, -10, 3.8],
    [-19, -2, 2.5],
    [-16, 5, 1.5],
    [-8, -11, 2.2],
    [-22, 3, 2],
    [-18, -16, 4.3],
    [-7, -20, 3.5],
    [-23, -7, 2.2],
    [-10, -5, 1.9],
    [5, -14, 2.5],
    [7, -4, 1.6],
    [-18, 9, 2.8],
    [-14, 18, 2.3],
    [11, 18, 1.8],
    [26, 0, 3.1],
    [29, -10, 2.6],
    [-36, -25, 2.4],
    [-22, -39, 2.5],
    [3, -39, 2.2],
    [-30, -15, 3.0],
    [-31, -31, 3.3],
    [-15, -40, 3.2],
    [12, -31, 2.8],
    [21, -17, 3.1],
    [-22, 14, 2.8],
    [22, 11, 2.5],
  ];
  colonies.forEach(([x, z, r], seed) => {
    bush(x!, z!, r!, seed);
    for (let i = 0; i < (mobile ? 10 : 16); i++) {
      const a = seed + i * 2.399,
        rad = r! * (1 + Math.sqrt(i / 24) * 1.7),
        px = x! + Math.cos(a) * rad,
        pz = z! + Math.sin(a) * rad * 0.8;
      if (i % 4 === 0) pebble(px, pz, 0.35 + (i % 3) * 0.22, i);
      else rosette(px, pz, i, 0.4 + (i % 4) * 0.13);
    }
  });
  const walls = [
    { x: -23, z: 3, yaw: 0.2, columns: 4, rows: 3 },
    { x: -17, z: 18, yaw: -0.6, columns: 3, rows: 2 },
    { x: 27, z: 4, yaw: 0.4, columns: 3, rows: 3 },
    { x: 9, z: -23, yaw: 1.1, columns: 3, rows: 3 },
  ];
  walls.forEach((w, seed) => {
    let placed = false;
    for (let col = 0; col < w.columns; col++)
      for (
        let row = 0;
        row < Math.max(1, w.rows - (col === w.columns - 1 ? 1 : 0));
        row++
      ) {
        const d = (col - (w.columns - 1) / 2) * 2.1 + (row % 2 ? 0.18 : 0),
          x = w.x + Math.sin(w.yaw) * d,
          z = w.z + Math.cos(w.yaw) * d;
        if (blocked(x, z, 1.7)) continue;
        const g = stoneBlock(0, 0, 0, 1.65, 1.25, 2.05, seed + col + row);
        g.rotateY(w.yaw).translate(x, floor(x, z) + (row + 0.5) * 1.28 - 0.2, z);
        stones.push(paintFaces(g, stone));
        placed = true;
        if (row === 0)
          rosette(x + Math.cos(w.yaw) * 1.4, z - Math.sin(w.yaw) * 1.4, seed, 0.7);
        if (row === w.rows - 1)
          for (let i = 0; i < 4; i++)
            plants.push(
              leafBlade(
                new Vector3(
                  x + Math.cos(w.yaw) * 0.9,
                  floor(x, z) + row * 1.28 + 0.7 - i * 0.4,
                  z - Math.sin(w.yaw) * 0.9,
                ),
                seed + i * 2.399,
                0.7,
                new Color('#829c4f'),
              ),
            );
      }
    if (placed)
      footprints.push({ minX: w.x - 5, maxX: w.x + 5, minZ: w.z - 5, maxZ: w.z + 5 });
    for (let i = 0; i < 9; i++)
      pebble(
        w.x + Math.cos(i * 2.399) * 4,
        w.z + Math.sin(i * 2.399) * 4,
        0.5 + (i % 3) * 0.3,
        i,
      );
  });
  for (let i = 0; i < (mobile ? 85 : 140); i++) {
    const a = i * 2.399,
      r = 17 + Math.sqrt((i * 0.618) % 1) * 24;
    rosette(Math.cos(a) * r, 5 + Math.sin(a) * r, i, 0.32 + (i % 5) * 0.12);
  }
  return { plants, stones, footprints };
}

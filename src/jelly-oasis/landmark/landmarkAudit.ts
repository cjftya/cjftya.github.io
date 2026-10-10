import { Mesh, Vector3 } from 'three';
import type { OvergrownRuin } from './createOvergrownRuin';
import { landmarkWorldPoint, sampleGround, surveySite } from './landmarkPlacement';

type Point = { x: number; z: number; h: number };
interface Obstacle {
  name: string;
  points: Point[];
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

function clip(points: Point[], height: number, above: boolean): Point[] {
  const result: Point[] = [];
  for (let i = 0; i < points.length; i++) {
    const a = points[i]!,
      b = points[(i + 1) % points.length]!;
    const insideA = above ? a.h >= height : a.h <= height;
    const insideB = above ? b.h >= height : b.h <= height;
    if (insideA) result.push(a);
    if (insideA !== insideB) {
      const t = (height - a.h) / (b.h - a.h);
      result.push({ x: a.x + t * (b.x - a.x), z: a.z + t * (b.z - a.z), h: height });
    }
  }
  return result;
}
function contains(polygon: Point[], x: number, z: number): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i]!,
      b = polygon[j]!;
    if (a.z > z !== b.z > z && x < ((b.x - a.x) * (z - a.z)) / (b.z - a.z) + a.x)
      inside = !inside;
  }
  return inside;
}

/** Sampled visual clearance audit, not collision handling or a navigation mesh. */
export function auditLandmark(landmark: OvergrownRuin) {
  const { placement, terrain, assets } = landmark;
  landmark.root.updateMatrixWorld(true);
  const obstacles: Obstacle[] = [];
  const cells = new Map<string, Obstacle[]>();
  function add(name: string, points: Point[]) {
    if (points.length < 3) return;
    const obstacle = {
      name,
      points,
      minX: Math.min(...points.map((p) => p.x)),
      maxX: Math.max(...points.map((p) => p.x)),
      minZ: Math.min(...points.map((p) => p.z)),
      maxZ: Math.max(...points.map((p) => p.z)),
    };
    obstacles.push(obstacle);
    for (let x = Math.floor(obstacle.minX / 4); x <= Math.floor(obstacle.maxX / 4); x++)
      for (
        let z = Math.floor(obstacle.minZ / 4);
        z <= Math.floor(obstacle.maxZ / 4);
        z++
      ) {
        const key = `${x},${z}`;
        if (!cells.has(key)) cells.set(key, []);
        cells.get(key)!.push(obstacle);
      }
  }
  const vector = new Vector3();
  for (const [name, object] of assets.modules)
    object.traverse((child) => {
      if (!(child instanceof Mesh)) return;
      const geometry = child.geometry,
        vertices = geometry.attributes.position!;
      const count = geometry.index?.count ?? vertices.count;
      for (let i = 0; i < count; i += 3) {
        const triangle: Point[] = [];
        for (let j = 0; j < 3; j++) {
          vector
            .fromBufferAttribute(vertices, geometry.index?.getX(i + j) ?? i + j)
            .applyMatrix4(child.matrixWorld);
          triangle.push({
            x: vector.x,
            z: vector.z,
            h: vector.y - sampleGround(vector.x, vector.z, terrain),
          });
        }
        add(name, clip(clip(triangle, 0.08, true), 3, false));
      }
    });
  add(
    'Pond exclusion',
    (
      assets.pondGuide?.positions ??
      assets.layout.guides.Pond_Blockout!.positions.slice(1)
    ).map((p) => ({ ...landmarkWorldPoint(p[0]!, p[2]!, placement), h: 0 })),
  );
  function hits(x: number, z: number) {
    const p = landmarkWorldPoint(x, z, placement);
    return (cells.get(`${Math.floor(p.x / 4)},${Math.floor(p.z / 4)}`) ?? []).filter(
      (o) =>
        p.x >= o.minX &&
        p.x <= o.maxX &&
        p.z >= o.minZ &&
        p.z <= o.maxZ &&
        contains(o.points, p.x, p.z),
    );
  }
  function sample(points: number[][]) {
    const intersections: Record<string, number> = {};
    for (const p of points) {
      const names = new Set(hits(p[0]!, p[1]!).map((o) => o.name));
      for (const name of names) intersections[name] = (intersections[name] ?? 0) + 1;
    }
    return {
      samples: points.length,
      intersections,
      clear: Object.keys(intersections).length === 0,
    };
  }
  const loop: number[][] = [],
    clearing: number[][] = [],
    approach: number[][] = [];
  for (let i = 0; i < 720; i++) {
    const a = (i * Math.PI) / 360;
    for (let offset = -3; offset <= 3; offset++)
      loop.push([(34 + offset) * Math.cos(a), (32 + offset) * Math.sin(a)]);
  }
  for (let x = -8; x <= 8; x += 0.25)
    for (let z = -8; z <= 8; z += 0.25)
      if (Math.hypot(x, z) <= 8) clearing.push([x, 27 + z]);
  const guide = assets.layout.guides.CreaturePaths_ArchApproach_6m!.positions;
  const centers: number[][] = [];
  for (let i = 0; i < guide.length; i += 2)
    centers.push([
      (guide[i]![0]! + guide[i + 1]![0]!) / 2,
      (guide[i]![2]! + guide[i + 1]![2]!) / 2,
    ]);
  for (let i = 0; i < centers.length - 1; i++) {
    const a = centers[i]!,
      b = centers[i + 1]!;
    const dx = b[0]! - a[0]!,
      dz = b[1]! - a[1]!,
      length = Math.hypot(dx, dz);
    for (let step = 0; step <= 80; step++)
      for (let across = -3; across <= 3; across += 0.5) {
        const t = step / 80;
        approach.push([
          a[0]! + dx * t - (dz / length) * across,
          a[1]! + dz * t + (dx / length) * across,
        ]);
      }
  }
  // Keep a centred 4 m passage through both jambs and out the far side.
  const passage: number[][] = [];
  for (let x = 13; x <= 17; x += 0.1)
    for (let z = -9; z <= -3; z += 0.25) passage.push([x, z]);
  let left = 15,
    right = 15;
  while (left > 10 && hits(left - 0.01, -6).length === 0) left -= 0.01;
  while (right < 20 && hits(right + 0.01, -6).length === 0) right += 0.01;
  return {
    method:
      'Projected GLB triangles clipped to 0.08–3 m above sampled terrain; discrete route samples, not a continuous collision guarantee.',
    placement: { ...placement, position: { ...placement.position } },
    site: surveySite(placement, terrain),
    loop: { width: 6 * placement.scale, ...sample(loop) },
    clearing: { diameter: 16 * placement.scale, ...sample(clearing) },
    approach: sample(approach),
    passage: {
      measuredJambWidth: (right - left) * placement.scale,
      testedWidth: 4 * placement.scale,
      ...sample(passage),
    },
    contact: structuredClone(landmark.contact),
    pondHeight: landmark.pondHeight,
    pondBankMaxLift: assets.modules.get('PondEdge_Blockout')!.userData
      .maxBankLift as number,
    obstaclePolygons: obstacles.length,
  };
}

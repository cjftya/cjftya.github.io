import { Mesh, Vector3 } from 'three';
import type { Group, Object3D } from 'three';
import type { LandmarkPlacement, LayoutGuide } from '../landmark/landmarkConfig';
import { landmarkWorldPoint, sampleGround } from '../landmark/landmarkPlacement';
import type { TerrainConfig } from '../terrain/heightfield';
import { polygonDistance } from '../terrain/excavateTerrain';
import {
  VEGETATION_COUNTS,
  VEGETATION_KINDS,
  VEGETATION_SEED,
  VEGETATION_SHAPES,
} from './vegetationConfig';
import type { VegetationDensity, VegetationKind } from './vegetationConfig';
export type Footprint = { minX: number; maxX: number; minZ: number; maxZ: number };
export interface VegetationSite {
  placement: LandmarkPlacement;
  rootY: number;
  terrain: TerrainConfig;
  pond: LayoutGuide;
  approach: LayoutGuide;
  obstacles: Footprint[];
}
export function segmentDistance(
  x: number,
  z: number,
  ax: number,
  az: number,
  bx: number,
  bz: number,
) {
  const dx = bx - ax,
    dz = bz - az,
    length2 = dx * dx + dz * dz;
  const t = length2
    ? Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / length2))
    : 0;
  return Math.hypot(x - ax - dx * t, z - az - dz * t);
}
// Conservative boxes around individual near-ground triangles, never the tree canopy AABB.
export function groundFootprints(
  root: Group,
  modules: Map<string, Group>,
  terrain: TerrainConfig,
): Footprint[] {
  root.updateMatrixWorld(true);
  const inverse = root.matrixWorld.clone().invert(),
    p = new Vector3();
  const result: Footprint[] = [];
  for (const object of modules.values())
    object.traverse((child: Object3D) => {
      if (!(child instanceof Mesh) || !child.visible) return;
      const pos = child.geometry.attributes.position!,
        index = child.geometry.index;
      for (let i = 0; i < (index?.count ?? pos.count); i += 3) {
        const points: Vector3[] = [],
          heights: number[] = [];
        for (let j = 0; j < 3; j++) {
          p.fromBufferAttribute(pos, index?.getX(i + j) ?? i + j).applyMatrix4(
            child.matrixWorld,
          );
          heights.push(p.y - sampleGround(p.x, p.z, terrain));
          points.push(p.clone().applyMatrix4(inverse));
        }
        if (
          Math.min(...heights) > 1.3 * root.scale.x ||
          Math.max(...heights) < -0.5 * root.scale.x
        )
          continue;
        result.push({
          minX: Math.min(...points.map((p) => p.x)),
          maxX: Math.max(...points.map((p) => p.x)),
          minZ: Math.min(...points.map((p) => p.z)),
          maxZ: Math.max(...points.map((p) => p.z)),
        });
      }
    });
  return result;
}
export function exclusionReason(
  x: number,
  z: number,
  radius: number,
  site: VegetationSite,
): string | null {
  if (polygonDistance(x, z, site.pond.positions) >= -(1 + radius)) return 'pond';
  // Audit samples ellipses with radii (34+offset,32+offset), offset in [-3,3].
  // Use an enclosing annulus, widened by radius and an explicit safety margin.
  const normalized = Math.hypot(x / 34, z / 32);
  if (Math.abs(normalized - 1) * 32 <= 3.5 + radius) return 'loop';
  if (Math.hypot(x, z - 27) <= 8.4 + radius) return 'clearing';
  if (x >= 12.6 - radius && x <= 17.4 + radius && z >= -11 - radius && z <= -1 + radius)
    return 'passage';
  const centers: number[][] = [];
  for (let i = 0; i + 1 < site.approach.positions.length; i += 2) {
    const a = site.approach.positions[i]!,
      b = site.approach.positions[i + 1]!;
    centers.push([(a[0]! + b[0]!) / 2, (a[2]! + b[2]!) / 2]);
  }
  for (let i = 0; i + 1 < centers.length; i++) {
    const a = centers[i]!,
      b = centers[i + 1]!;
    if (segmentDistance(x, z, a[0]!, a[1]!, b[0]!, b[1]!) <= 3.4 + radius)
      return 'approach';
  }
  if (
    site.obstacles.some(
      (o) =>
        Math.hypot(
          Math.max(o.minX - x, 0, x - o.maxX),
          Math.max(o.minZ - z, 0, z - o.maxZ),
        ) <=
        radius + 0.15,
    )
  )
    return 'obstacle';
  const world = landmarkWorldPoint(x, z, site.placement);
  if (
    Math.max(Math.abs(world.x), Math.abs(world.z)) +
      (radius + 1) * site.placement.scale >=
    site.terrain.size / 2
  )
    return 'boundary';
  return null;
}
export function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export interface VegetationInstance {
  kind: VegetationKind;
  x: number;
  y: number;
  z: number;
  scale: number;
  rotation: number;
  tint: number;
  radius: number;
}
export function placeVegetation(
  site: VegetationSite,
  density: VegetationDensity = 'density-a',
  seed = VEGETATION_SEED,
) {
  const instances: VegetationInstance[] = [],
    rejected: Record<string, number> = {};
  // The same master placement feeds desktop and mobile.
  const clusters = [
    [-22, -18],
    [-20, 3],
    [-18, 18],
    [19, 13],
    [23, -20],
    [7, -23],
    [-7, -24],
    [18, 24],
    [-25, -6],
  ];
  for (const kind of VEGETATION_KINDS) {
    const random = seededRandom(seed + VEGETATION_KINDS.indexOf(kind) * 1009);
    const shape = VEGETATION_SHAPES[kind],
      target = VEGETATION_COUNTS[density][kind];
    let placed = 0;
    for (let attempt = 0; placed < target && attempt < target * 12; attempt++) {
      const cluster = clusters[Math.floor(random() * clusters.length)]!;
      const angle = random() * Math.PI * 2,
        distance = Math.sqrt(random()) * (kind === 'shrub' ? 4.5 : 6);
      const x = cluster[0]! + Math.cos(angle) * distance,
        z = cluster[1]! + Math.sin(angle) * distance;
      const scale = shape.minScale + random() * (shape.maxScale - shape.minScale),
        radius = shape.radius * scale;
      const rotation = random() * Math.PI * 2,
        tint = random();
      let reason = exclusionReason(x, z, radius, site);
      const world = landmarkWorldPoint(x, z, site.placement),
        h = sampleGround(world.x, world.z, site.terrain);
      const step = Math.max(0.35, radius * site.placement.scale);
      const footprintHeights = [
        [step, 0],
        [-step, 0],
        [0, step],
        [0, -step],
      ].map(([dx, dz]) => sampleGround(world.x + dx!, world.z + dz!, site.terrain));
      if (
        !reason &&
        Math.max(...footprintHeights.map((v) => Math.abs(v - h))) / step > shape.slope
      )
        reason = 'slope';
      if (
        !reason &&
        instances.some((p) => Math.hypot(p.x - x, p.z - z) < p.radius + radius + 0.12)
      )
        reason = 'spacing';
      if (reason) {
        rejected[reason] = (rejected[reason] ?? 0) + 1;
        continue;
      }
      instances.push({
        kind,
        x,
        z,
        y: (h - site.rootY) / site.placement.scale - 0.015 / site.placement.scale,
        scale,
        rotation,
        tint,
        radius,
      });
      placed++;
    }
  }
  return { instances, rejected, requested: { ...VEGETATION_COUNTS[density] } };
}

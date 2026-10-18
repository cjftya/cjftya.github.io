import { landmarkWorldPoint, sampleGround } from '../landmark/landmarkPlacement';
import { exclusionReason, seededRandom } from '../vegetation/vegetationPlacement';
import type {
  VegetationSite,
  VegetationInstance,
} from '../vegetation/vegetationPlacement';
import { VEGETATION_SHAPES } from '../vegetation/vegetationConfig';
import {
  COMPOSITION_KINDS,
  COMPOSITION_SEED,
  COMPOSITION_ZONES,
} from './compositionConfig';
import type {
  CompositionKind,
  CompositionVariant,
  CompositionZone,
} from './compositionConfig';
export interface CompositionInstance {
  kind: CompositionKind;
  zone: string;
  x: number;
  y: number;
  z: number;
  scale: number;
  rotation: number;
  tint: number;
  radius: number;
}
export function worldToLandmark(x: number, z: number, site: VegetationSite) {
  const { placement: p } = site,
    dx = (x - p.position.x) / p.scale,
    dz = (z - p.position.z) / p.scale;
  const c = Math.cos(p.rotationY),
    s = Math.sin(p.rotationY);
  return { x: dx * c - dz * s, z: dx * s + dz * c };
}
function zoneSeed(id: string, kind: string, seed: number) {
  let h = seed;
  for (const c of `${id}:${kind}`) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}
export function placeComposition(
  site: VegetationSite,
  vegetation: VegetationInstance[],
  variant: CompositionVariant = 'a',
  seed = COMPOSITION_SEED,
  zones: readonly CompositionZone[] = COMPOSITION_ZONES,
) {
  const instances: CompositionInstance[] = [],
    rejected: Record<string, number> = {},
    requested: Record<string, number> = {},
    zoneCounts: Record<string, number> = {};
  if (variant === 'off') return { instances, rejected, requested, zoneCounts };
  for (const zone of zones) {
    zoneCounts[zone.id] = 0;
    for (const kind of COMPOSITION_KINDS) {
      const target = Math.ceil(zone.counts[kind] * (variant === 'b' ? 1.5 : 1));
      requested[kind] = (requested[kind] ?? 0) + target;
      const random = seededRandom(zoneSeed(zone.id, kind, seed));
      let placed = 0;
      for (let attempt = 0; placed < target && attempt < target * 16; attempt++) {
        const center = zone.centers[Math.floor(random() * zone.centers.length)]!;
        const a = random() * Math.PI * 2,
          d = Math.sqrt(random()) * zone.radius;
        let x = center[0] + Math.cos(a) * d,
          z = center[1] + Math.sin(a) * d;
        if (zone.basis === 'world') {
          // World zones follow normalized outer hills; local detail retains metre offsets.
          const ratio = site.terrain.oasisX === undefined ? 1 : site.terrain.size / 320;
          ({ x, z } = worldToLandmark(x * ratio, z * ratio, site));
        }
        const scale = kind === 'rock' ? 0.5 + random() * 0.45 : 0.7 + random() * 0.35;
        const radius = (kind === 'rock' ? 1 : VEGETATION_SHAPES[kind].radius) * scale;
        const rotation = random() * Math.PI * 2,
          tint = random();
        let reason = exclusionReason(x, z, radius, site);
        const world = landmarkWorldPoint(x, z, site.placement),
          h = sampleGround(world.x, world.z, site.terrain);
        const step = Math.max(0.35, radius * site.placement.scale);
        const heights = [
          [step, 0],
          [-step, 0],
          [0, step],
          [0, -step],
        ].map(([dx, dz]) => sampleGround(world.x + dx!, world.z + dz!, site.terrain));
        if (
          !reason &&
          Math.max(...heights.map((v) => Math.abs(v - h))) / step > zone.slope
        )
          reason = 'slope';
        // New slope gardens may contain low rocks; reject deep burial instead
        // of hiding most of a small rock to cover a steep terrain step.
        if (!reason && kind === 'rock' && h - Math.min(h, ...heights) > 0.27)
          reason = 'burial';
        if (
          !reason &&
          [...vegetation, ...instances].some(
            (p) => Math.hypot(p.x - x, p.z - z) < p.radius + radius + 0.18,
          )
        )
          reason = 'spacing';
        if (reason) {
          rejected[`${zone.id}:${reason}`] =
            (rejected[`${zone.id}:${reason}`] ?? 0) + 1;
          continue;
        }
        // Rocks sink to the lowest sampled edge so a flat base never hovers on a slope.
        const ground = kind === 'rock' ? Math.min(h, ...heights) : h;
        instances.push({
          kind,
          zone: zone.id,
          x,
          z,
          y: (ground - site.rootY - 0.015) / site.placement.scale,
          scale,
          rotation,
          tint,
          radius,
        });
        placed++;
        zoneCounts[zone.id]!++;
      }
    }
  }
  return { instances, rejected, requested, zoneCounts };
}

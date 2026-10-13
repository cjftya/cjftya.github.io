import { meadowField } from './meadowField';
import { landmarkWorldPoint, sampleGround } from '../landmark/landmarkPlacement';
import { worldToLandmark } from '../composition/compositionPlacement';
import { exclusionReason, seededRandom } from '../vegetation/vegetationPlacement';
import type { VegetationSite } from '../vegetation/vegetationPlacement';
import type { Occupied } from '../scenery/sceneryPlacement';
import {
  MEADOW_KINDS,
  MEADOW_PATCHES,
  MEADOW_SEED,
  MEADOW_SHAPES,
} from './meadowConfig';
import type { MeadowKind, MeadowVariant } from './meadowConfig';
export interface MeadowInstance {
  kind: MeadowKind;
  zone: string;
  x: number;
  y: number;
  z: number;
  scale: number;
  rotation: number;
  tint: number;
  radius: number;
  slope: number;
}
export function placeMeadow(
  site: VegetationSite,
  occupied: readonly Occupied[],
  variant: MeadowVariant = 'a',
  seed = MEADOW_SEED,
) {
  const instances: MeadowInstance[] = [],
    rejected: Record<string, number> = {},
    requested: Record<string, number> = {},
    zoneCounts: Record<string, number> = {};
  if (variant === 'off') return { instances, rejected, requested, zoneCounts };
  for (const patch of MEADOW_PATCHES) {
    zoneCounts[patch.id] = 0;
    for (const [index, kind] of MEADOW_KINDS.entries()) {
      const target = Math.ceil(patch.counts[index]! * (variant === 'b' ? 1.5 : 1));
      requested[kind] = (requested[kind] ?? 0) + target;
      let hash = seed;
      for (const c of `${patch.id}:${kind}`)
        hash = Math.imul(hash ^ c.charCodeAt(0), 16777619);
      const random = seededRandom(hash),
        shape = MEADOW_SHAPES[kind];
      let placed = 0;
      for (let attempt = 0; placed < target && attempt < target * 24; attempt++) {
        const angle = random() * Math.PI * 2,
          d = Math.sqrt(random()) * patch.radius;
        const { x, z } = worldToLandmark(
          patch.center[0] * site.terrain.size + Math.cos(angle) * d,
          patch.center[1] * site.terrain.size + Math.sin(angle) * d * 0.7,
          site,
        );
        const scale =
          (kind === 'shrub' ? 1.6 + random() * 0.4 : 1.6 + random() * 1.3) /
          site.placement.scale;
        const radius = shape.radius * scale,
          rotation = random() * Math.PI * 2,
          tint = random();
        const fieldWorld = landmarkWorldPoint(x, z, site.placement);
        let reason =
          meadowField(fieldWorld.x, fieldWorld.z, patch, site.terrain.size) < 0.08
            ? 'field-edge'
            : exclusionReason(x, z, radius, site);
        if (
          !reason &&
          [...occupied, ...instances].some(
            (p) => Math.hypot(x - p.x, z - p.z) < radius + p.radius + 0.12,
          )
        )
          reason = 'spacing';
        // Rejected masks/spacing need no terrain probes.
        if (reason) {
          rejected[`${patch.id}:${reason}`] =
            (rejected[`${patch.id}:${reason}`] ?? 0) + 1;
          continue;
        }
        const world = landmarkWorldPoint(x, z, site.placement),
          h = sampleGround(world.x, world.z, site.terrain),
          step = Math.max(0.35, radius * site.placement.scale);
        const heights = Array.from({ length: 8 }, (_, i) =>
          sampleGround(
            world.x + Math.cos((i * Math.PI) / 4) * step,
            world.z + Math.sin((i * Math.PI) / 4) * step,
            site.terrain,
          ),
        );
        const slope = Math.max(...heights.map((v) => Math.abs(v - h))) / step;
        if (
          !reason &&
          (!Number.isFinite(h) || !Number.isFinite(slope) || slope > shape.slope)
        )
          reason = 'slope';
        if (reason) {
          rejected[`${patch.id}:${reason}`] =
            (rejected[`${patch.id}:${reason}`] ?? 0) + 1;
          continue;
        }
        instances.push({
          kind,
          zone: patch.id,
          x,
          z,
          y: (h - site.rootY - 0.015) / site.placement.scale,
          scale,
          rotation,
          tint,
          radius,
          slope,
        });
        placed++;
        zoneCounts[patch.id]!++;
      }
    }
  }
  return { instances, rejected, requested, zoneCounts };
}

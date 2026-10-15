import { landmarkWorldPoint, sampleGround } from '../landmark/landmarkPlacement';
import { worldToLandmark } from '../composition/compositionPlacement';
import {
  exclusionReason,
  seededRandom,
  segmentDistance,
} from '../vegetation/vegetationPlacement';
import type { VegetationSite } from '../vegetation/vegetationPlacement';
import {
  SCENERY_KINDS,
  SCENERY_SCALE,
  scenerySeparation,
  SCENERY_SEED,
  SCENERY_SHAPES,
  SCENERY_ZONES,
  TREE_KINDS,
} from './sceneryConfig';
import type { SceneryKind, SceneryVariant, SceneryZone } from './sceneryConfig';
export interface SceneryInstance {
  kind: SceneryKind;
  zone: string;
  x: number;
  y: number;
  z: number;
  scale: number;
  rotation: number;
  tint: number;
  radius: number;
  height: number;
  slope: number;
  burial: number;
}
export type Occupied = { x: number; z: number; radius: number };
export type SceneryFootprints = Partial<
  Record<SceneryKind, readonly (readonly [number, number])[]>
>;
export function placeScenery(
  site: VegetationSite,
  occupied: readonly Occupied[],
  footprints: SceneryFootprints,
  variant: SceneryVariant = 'a',
  seed = SCENERY_SEED,
  zones: readonly SceneryZone[] = SCENERY_ZONES,
) {
  const instances: SceneryInstance[] = [],
    rejected: Record<string, number> = {},
    requested: Record<string, number> = {},
    zoneCounts: Record<string, number> = {};
  if (variant === 'off') return { instances, rejected, requested, zoneCounts };
  for (const zone of zones) {
    zoneCounts[zone.id] = 0;
    const quotas = Object.fromEntries(
      SCENERY_KINDS.map((kind) => [
        kind,
        Math.ceil((zone.counts[kind] ?? 0) * (variant === 'b' ? 1.5 : 1)),
      ]),
    );
    const slots = Array.from(
      { length: Math.max(...Object.values(quotas)) },
      (_, round) => SCENERY_KINDS.filter((kind) => round < quotas[kind]!),
    ).flat();
    for (const [ordinal, kind] of slots.entries()) {
      const target = 1;
      requested[kind] = (requested[kind] ?? 0) + target;
      let hash = seed;
      for (const c of `${zone.id}:${kind}:${ordinal}`)
        hash = Math.imul(hash ^ c.charCodeAt(0), 16777619);
      const random = seededRandom(hash),
        shape = SCENERY_SHAPES[kind],
        tree = TREE_KINDS.includes(kind);
      let placed = 0;
      for (let attempt = 0; placed < target && attempt < target * 32; attempt++) {
        const section = Math.floor(
          random() * (zone.ribbon ? zone.centers.length - 1 : zone.centers.length),
        );
        const start = zone.centers[section]!,
          end = zone.centers[section + 1] ?? start,
          along = zone.ribbon ? random() : 0;
        const center = [
          start[0] + (end[0] - start[0]) * along,
          start[1] + (end[1] - start[1]) * along,
        ];
        const angle = random() * Math.PI * 2,
          d =
            Math.sqrt(random()) *
            zone.radius *
            (0.78 + 0.22 * Math.sin(section * 2.7 + along * 4.5));
        let x =
            center[0]! * (zone.basis === 'world' ? site.terrain.size : 1) +
            Math.cos(angle) * d,
          z =
            center[1]! * (zone.basis === 'world' ? site.terrain.size : 1) +
            Math.sin(angle) * d;
        if (zone.basis === 'world') ({ x, z } = worldToLandmark(x, z, site));
        const scale =
            ((tree ? 0.64 + random() * 0.62 : 0.82 + random() * 0.32) *
              SCENERY_SCALE[kind] *
              (zone.scale ?? 1)) /
            (zone.basis === 'world' ? site.placement.scale : 1),
          radius = shape.radius * scale,
          rotation = random() * Math.PI * 2,
          tint = random();
        let reason = exclusionReason(x, z, radius, site);
        // Keep the hero silhouette and oasis sight lines free of new crowns.
        if (!reason && tree && Math.hypot(x, z) < 32 + radius)
          reason = 'hero-sightline';
        // A western entry glade divides the canopy into two irregular banks.
        if (!reason && tree) {
          const p = landmarkWorldPoint(x, z, site.placement),
            s = site.terrain.size / 224;
          if (
            segmentDistance(p.x, p.z, -95 * s, 65 * s, -62 * s, 22 * s) <
            6 + radius * site.placement.scale
          )
            reason = 'western-glade';
        }
        if (
          !reason &&
          [...occupied, ...instances].some(
            (p) =>
              Math.hypot(x - p.x, z - p.z) < scenerySeparation({ kind, radius }, p),
          )
        )
          reason = 'spacing';
        // Rejected masks/spacing need no terrain probes.
        if (reason) {
          rejected[`${zone.id}:${reason}`] =
            (rejected[`${zone.id}:${reason}`] ?? 0) + 1;
          continue;
        }
        const world = landmarkWorldPoint(x, z, site.placement),
          ground = sampleGround(world.x, world.z, site.terrain),
          probeRadius = tree ? 0.6 * scale : radius,
          step = probeRadius * site.placement.scale;
        const points: (readonly [number, number])[] = Array.from(
          { length: 8 },
          (_, i) => [
            (Math.cos((i * Math.PI) / 4) * probeRadius) / scale,
            (Math.sin((i * Math.PI) / 4) * probeRadius) / scale,
          ],
        );
        if (!tree) points.push(...(footprints[kind] ?? []));
        const heights = points.map(([px, pz]) => {
          const c = Math.cos(rotation),
            s = Math.sin(rotation);
          const p = landmarkWorldPoint(
            x + (px * c + pz * s) * scale,
            z + (-px * s + pz * c) * scale,
            site.placement,
          );
          return sampleGround(p.x, p.z, site.terrain);
        });
        const slope = Math.max(...heights.map((h) => Math.abs(h - ground))) / step;
        if (!reason && (!Number.isFinite(slope) || slope > shape.slope))
          reason = 'slope';
        const base = Math.min(ground, ...heights),
          burial = Math.max(ground, ...heights) - base;
        if (
          !reason &&
          !tree &&
          burial > shape.height * scale * site.placement.scale * 0.58
        )
          reason = 'burial';
        if (reason) {
          rejected[`${zone.id}:${reason}`] =
            (rejected[`${zone.id}:${reason}`] ?? 0) + 1;
          continue;
        }
        instances.push({
          kind,
          zone: zone.id,
          x,
          z,
          y: (base - site.rootY - 0.04) / site.placement.scale,
          scale,
          rotation,
          tint,
          radius,
          height: shape.height * scale,
          slope,
          burial,
        });
        placed++;
        zoneCounts[zone.id]!++;
      }
    }
  }
  return { instances, rejected, requested, zoneCounts };
}

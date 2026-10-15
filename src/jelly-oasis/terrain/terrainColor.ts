import { Color } from 'three';
import { OVERGROWN_RUIN_CONFIG } from '../landmark/landmarkConfig';
import { SCENERY_ZONES } from '../scenery/sceneryConfig';
import { smoothstep } from './heightfield';
import type { TerrainConfig } from './heightfield';

/** Original sRGB palette, guided by Tiny Glade's grass/earth separation and
 * ISLANDERS' broad grass/stone masses. Color converts to linear vertex data. */
export const TERRAIN_PALETTE = {
  meadow: '#929f68',
  dry: '#b3a17e',
  oasis: '#6f9475',
  grove: '#7b8963',
  damp: '#547b72',
  shoulder: '#a39b87',
  dirt: '#aa9378',
  rock: '#98968d',
} as const;
const palette = Object.fromEntries(
  Object.entries(TERRAIN_PALETTE).map(([name, hex]) => [name, new Color(hex)]),
) as Record<keyof typeof TERRAIN_PALETTE, Color>;

// Follow the existing forest ribbons, rather than inventing unrelated patches.
const groveSegments = SCENERY_ZONES.filter(
  (zone) =>
    zone.basis === 'world' &&
    (zone.counts.broad ?? 0) + (zone.counts.spire ?? 0) + (zone.counts.young ?? 0) > 0,
).flatMap((zone) =>
  zone.centers
    .slice(0, -1)
    .map((a, i) => ({ a, b: zone.centers[i + 1]!, radius: zone.radius })),
);
function groveInfluence(x: number, z: number, size: number) {
  let influence = 0;
  for (const { a, b, radius } of groveSegments) {
    const ax = a[0] * size,
      az = a[1] * size;
    const dx = (b[0] - a[0]) * size,
      dz = (b[1] - a[1]) * size;
    const t = Math.max(
      0,
      Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz)),
    );
    const distance = Math.hypot(x - ax - dx * t, z - az - dz * t);
    influence = Math.max(
      influence,
      1 - smoothstep(radius * 0.45, radius * 1.65, distance),
    );
  }
  return influence;
}

/** Broad world-space fields, evaluated only on mesh creation/rebuild.
 * Shared by coarse terrain and the excavated pond mesh. Slope-based soil/stone
 * remains in the shader, using actual face normals. No added textures/geometry. */
export function sampleTerrainColor(
  x: number,
  z: number,
  height: number,
  config: TerrainConfig,
  target: Color,
  excavationDepth = 0,
): Color {
  const u = x / config.size;
  const v = z / config.size;
  const dx = x - (config.oasisX ?? OVERGROWN_RUIN_CONFIG.position.x);
  const dz = z - (config.oasisZ ?? OVERGROWN_RUIN_CONFIG.position.z);
  const phase = (((config.seed >>> 0) % 65521) / 65521) * Math.PI * 2;
  const broad = Math.sin(u * 9 + phase) * Math.cos(v * 8 - phase);
  // An elongated, irregular fertile basin rather than concentric colour rings.
  const oasisDistance =
    Math.hypot((dx + 10 * Math.sin(dz * 0.035)) / 1.2, dz / 0.86) + broad * 9;
  const oasis = 1 - smoothstep(27, 66, oasisDistance);
  const outer = smoothstep(0.23, 0.48, Math.hypot(u, v * 0.9));
  const north = 1 - smoothstep(-0.37, -0.1, v);
  target.copy(palette.meadow).lerp(palette.dry, Math.max(outer * 0.7, north * 0.72));
  target.lerp(palette.oasis, oasis * 0.96);
  target.lerp(
    palette.grove,
    groveInfluence(x, z, config.size) * (1 - oasis * 0.65) * 0.85,
  );
  const highland = smoothstep(config.maxHeight * 0.18, config.maxHeight * 0.82, height);
  // Shelf tops retain forest soil; steep rock exposure is still normal-driven.
  target.lerp(
    palette.shoulder,
    highland * (1 - oasis * 0.7) * (1 - groveInfluence(x, z, config.size) * 0.62),
  );
  // Damp colour follows low ground near the oasis and real excavation depth.
  // Low outer corners therefore do not acquire an unrelated wet fringe.
  const lowBasin = (1 - smoothstep(-config.maxHeight * 0.13, 0.5, height)) * oasis;
  const excavated = smoothstep(0.02, 0.55, excavationDepth);
  target.lerp(palette.damp, Math.max(lowBasin * 0.7, excavated * 0.85));
  return target.multiplyScalar(1 + broad * 0.045);
}

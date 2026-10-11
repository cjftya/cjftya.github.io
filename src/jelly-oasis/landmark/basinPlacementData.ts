import { LANDMARK_MODULE_OFFSETS } from './landmarkConfig';
import type { LandmarkLayout, LayoutGuide } from './landmarkConfig';
import type { ChannelSample } from '../terrain/excavateTerrain';

/** Local coordinates only. No meshes, lights or particles are created. */
export function basinPlacementData(
  guide: LayoutGuide,
  layout: LandmarkLayout,
  ground: (x: number, z: number) => number,
  waterY: number,
  channel: ChannelSample[],
) {
  const forbiddenZones = layout.modules
    .filter((m) => /^(Ruin_|Root_|Crystal_)/.test(m.name))
    .map((m) => {
      const offset = LANDMARK_MODULE_OFFSETS[m.name];
      return {
        name: m.name,
        min: [
          m.bounds.min[0]! + (offset?.x ?? 0),
          m.bounds.min[1]!,
          m.bounds.min[2]! + (offset?.z ?? 0),
        ],
        max: [
          m.bounds.max[0]! + (offset?.x ?? 0),
          m.bounds.max[1]!,
          m.bounds.max[2]! + (offset?.z ?? 0),
        ],
      };
    });
  forbiddenZones.push(
    { name: 'Tree trunk foundation', min: [-15, -5, -21], max: [-9, 30, -15] },
    { name: 'Cliff rear foundation', min: [-11, -5, -19], max: [11, 18, -9.7] },
  );
  function zone(x: number, z: number, radius: number) {
    const groundY = ground(x, z);
    return {
      position: [x, groundY, z],
      groundY,
      waterY,
      waterDepth: Math.max(0, waterY - groundY),
      signedDepth: waterY - groundY,
      radius,
    };
  }
  function safe(p: ReturnType<typeof zone>) {
    const [x, , z] = p.position as [number, number, number],
      r = p.radius + 0.4;
    return (
      !forbiddenZones.some(
        (f) =>
          x >= f.min[0]! - r &&
          x <= f.max[0]! + r &&
          z >= f.min[2]! - r &&
          z <= f.max[2]! + r,
      ) &&
      Math.hypot(x, z - 27) > 8 + r &&
      Math.hypot(x / 34, z / 32) < 1 - (3 + r) / 32 &&
      !channel.some((s) => Math.hypot(x - s.point.x, z - s.point.z) < s.width / 2 + r)
    );
  }
  function shore(offset: number, radius: number, stride: number) {
    return guide.positions
      .filter((_, i) => i % stride === 0)
      .map((p) => {
        const x = p[0]!,
          z = p[2]!,
          d = Math.hypot(x, z - 7);
        return zone(x + (x / d) * offset, z + ((z - 7) / d) * offset, radius);
      })
      .filter(safe)
      .filter((p) => p.waterDepth === 0);
  }
  return {
    coordinateFrame: 'landmark-local',
    waterY,
    forbiddenZones,
    channelFlowExclusion: channel.map((s) => ({
      position: s.point.toArray(),
      radius: s.width / 2 + 0.5,
    })),
    routeExclusions: {
      loop: { radiusX: 34, radiusZ: 32, width: 6 },
      clearing: { center: [0, 27], radius: 8 },
      archApproach: layout.guides.CreaturePaths_ArchApproach_6m,
    },
    shoreRockZones: shore(0.5, 0.65, 6),
    shoreCrystalZones: shore(0.9, 0.5, 9),
    underwaterCrystalZones: [
      [-3, 7],
      [3, 9],
      [0, 12],
    ]
      .map(([x, z]) => zone(x!, z!, 1))
      .filter(safe)
      .filter((p) => p.waterDepth > 0.6),
    materialHooks: {
      pond: 'createReflectivePond: refraction capture includes submerged meshes; shallow depth absorption and Fresnel remain active',
      emission:
        'Future standard-material emissive objects participate in reflection/refraction captures; call waterEffects.invalidate() after editing',
      lighting: 'No new lights or emission in Phase 1',
    },
  };
}

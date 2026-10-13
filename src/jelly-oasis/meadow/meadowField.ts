import { MEADOW_PATCHES } from './meadowConfig';
export function meadowField(
  x: number,
  z: number,
  patch: (typeof MEADOW_PATCHES)[number],
  size: number,
) {
  const dx = x - patch.center[0] * size,
    dz = z - patch.center[1] * size;
  const w =
    patch.radius * (0.79 + 0.13 * Math.sin(dx * 0.21) + 0.08 * Math.cos(dz * 0.29));
  return 1 - Math.hypot(dx / w, (dz - 4 * Math.sin(dx * 0.105)) / (w * 0.52));
}
export const meadowFieldGLSL = MEADOW_PATCHES.map(
  (patch, i) => `{
 vec2 d=vTerrainWorld.xz-vec2(${patch.center[0].toFixed(3)},${patch.center[1].toFixed(3)})*terrainWorldSize;
 float w=${patch.radius.toFixed(1)}*(.79+.13*sin(d.x*.21)+.08*cos(d.y*.29));
 float field=1.-length(vec2(d.x/w,(d.y-4.*sin(d.x*.105))/(w*.52)));
 grass=mix(grass,${i === 1 ? 'vec3(.42,.45,.20)' : 'vec3(.30,.29,.32)'},smoothstep(0.,.3,field)*.45);
}`,
).join('\n');

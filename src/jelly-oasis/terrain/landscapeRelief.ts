/** Continuous relief is part of the terrain mesh and its placement sampler. */
export type RidgeStation = readonly [number, number, number, number];
export const AMPHITHEATRE: readonly RidgeStation[] = [
  [-77, 38, 7, 24],
  [-80, 8, 12, 36],
  [-69, -25, 20, 39],
  [-58, -62, 29, 37],
  [-25, -80, 15, 36],
  [9, -80, 35, 30],
  [37, -85, 22, 23],
  [64, -58, 32, 32],
  [70, -44, 26, 37],
  [88, -27, 15, 27],
  [76, -9, 12, 33],
  [83, 7, 8, 24],
  [77, 38, 4, 25],
];
export const CANYON: readonly (readonly RidgeStation[])[] = [
  [
    [-79, 43, 17, 23],
    [-72, 9, 28, 26],
    [-62, -28, 33, 31],
    [-57, -66, 25, 30],
  ],
  [
    [-26, -84, 17, 24],
    [13, -74, 29, 29],
    [48, -55, 43, 28],
    [76, -29, 38, 24],
    [80, 18, 15, 24],
  ],
];
function ramp(a: number, b: number, x: number) {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}
function ridgeHeight(x: number, z: number, spine: readonly RidgeStation[]) {
  let result = 0;
  for (let i = 0; i < spine.length - 1; i++) {
    const a = spine[i]!,
      b = spine[i + 1]!,
      dx = b[0] - a[0],
      dz = b[1] - a[1];
    const t = Math.max(
      0,
      Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz)),
    );
    const cx = a[0] + dx * t,
      cz = a[1] + dz * t;
    const buttress =
      0.87 +
      0.09 * Math.sin(x * 0.17 + z * 0.09) +
      0.04 * Math.cos(z * 0.21 - x * 0.07);
    const q = Math.hypot(x - cx, z - cz) / ((a[3] + (b[3] - a[3]) * t) * buttress);
    const profile =
      q < 0.2
        ? 1 - q * 0.35
        : q < 0.75
          ? 0.93 - (q - 0.2) * 1.5
          : Math.max(0, 0.105 - (q - 0.75) * 0.42);
    result = Math.max(
      result,
      profile *
        (a[2] + (b[2] - a[2]) * t) *
        (1 + 0.025 * Math.sin(x * 0.19 + z * 0.14)),
    );
  }
  return result;
}
export function landscapeRelief(x: number, z: number, size: number, variant = 1) {
  if (!variant) return 0;
  const scale = size / 224,
    paths = variant === 2 ? CANYON : [AMPHITHEATRE];
  const angle = Math.atan2(z - 14, x - 14),
    shoulder = 88 + 8 * Math.cos(angle * 3) + 4 * Math.sin(angle * 5);
  return (
    Math.max(...paths.map((p) => ridgeHeight(x / scale, z / scale, p))) *
    ramp(60, shoulder, Math.hypot(x - 14, z - 14)) *
    (1 - ramp(size / 2 - 12, size / 2, Math.max(Math.abs(x), Math.abs(z))))
  );
}

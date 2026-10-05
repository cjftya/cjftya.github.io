export type RGB = [number, number, number];
export interface TimeFrame {
  elevation: number;
  azimuth: number;
  sunlight: number;
  ambient: number;
  stars: number;
  zenith: RGB;
  horizon: RGB;
  sun: RGB;
}
interface Keyframe {
  hour: number;
  sunlight: number;
  ambient: number;
  stars: number;
  zenith: RGB;
  horizon: RGB;
  sun: RGB;
}
const rgb = (hex: number): RGB => [
  ((hex >> 16) & 255) / 255,
  ((hex >> 8) & 255) / 255,
  (hex & 255) / 255,
];
const key = (
  hour: number,
  sunlight: number,
  ambient: number,
  stars: number,
  zenith: number,
  horizon: number,
  sun: number,
): Keyframe => ({
  hour,
  sunlight,
  ambient,
  stars,
  zenith: rgb(zenith),
  horizon: rgb(horizon),
  sun: rgb(sun),
});
const COLOR_CHANNELS = ['zenith', 'horizon', 'sun'] as const;
const KEYS = [
  key(0, 0, 0.68, 1, 0x192743, 0x505b80, 0x99b8ec),
  key(4, 0, 0.68, 1, 0x222c50, 0x646584, 0xabbcf0),
  key(5.5, 0.12, 0.85, 0.3, 0x697b9e, 0xe0b6b0, 0xffb27a),
  key(7, 1.75, 1.2, 0, 0x80b6cc, 0xede1c5, 0xffd09a),
  key(12, 2.5, 1.65, 0, 0x69a9c7, 0xdce7d6, 0xffefd0),
  key(16, 2.0, 1.45, 0, 0x8ab4c8, 0xe9dbc2, 0xffdbb0),
  key(18, 1.1, 1.02, 0, 0x777ca7, 0xe9b39a, 0xffa461),
  key(19.5, 0, 0.73, 0.65, 0x393c67, 0x9c8096, 0xd2a9d8),
  key(21, 0, 0.68, 1, 0x192743, 0x505b80, 0x99b8ec),
  key(24, 0, 0.68, 1, 0x192743, 0x505b80, 0x99b8ec),
];
export function wrapTime(hours: number): number {
  return Number.isFinite(hours) ? ((hours % 24) + 24) % 24 : 12;
}
export function advanceTime(
  hour: number,
  seconds: number,
  cycleSeconds: number,
  speed = 1,
): number {
  if (
    !Number.isFinite(seconds) ||
    seconds < 0 ||
    !Number.isFinite(cycleSeconds) ||
    cycleSeconds <= 0 ||
    !Number.isFinite(speed) ||
    speed < 0
  )
    return wrapTime(hour);
  return wrapTime(hour + ((seconds * 24) / cycleSeconds) * speed);
}
export function createTimeFrame(): TimeFrame {
  return {
    elevation: 0,
    azimuth: 0,
    sunlight: 0,
    ambient: 0,
    stars: 0,
    zenith: [0, 0, 0],
    horizon: [0, 0, 0],
    sun: [0, 0, 0],
  };
}
export function sampleTime(hour: number, out = createTimeFrame()): TimeFrame {
  const h = wrapTime(hour);
  let index = 0;
  while (index < KEYS.length - 2 && h >= KEYS[index + 1]!.hour) index++;
  const a = KEYS[index]!;
  const b = KEYS[index + 1]!;
  const t = (h - a.hour) / (b.hour - a.hour);
  const blend = t * t * (3 - 2 * t);
  out.elevation = Math.sin(((h - 6) / 24) * Math.PI * 2);
  out.azimuth = ((h - 6) / 24) * Math.PI * 2 - Math.PI / 2;
  out.sunlight = a.sunlight + (b.sunlight - a.sunlight) * blend;
  out.ambient = a.ambient + (b.ambient - a.ambient) * blend;
  out.stars = a.stars + (b.stars - a.stars) * blend;
  for (const channel of COLOR_CHANNELS) {
    for (let c = 0; c < 3; c++)
      out[channel][c] = a[channel][c]! + (b[channel][c]! - a[channel][c]!) * blend;
  }
  return out;
}

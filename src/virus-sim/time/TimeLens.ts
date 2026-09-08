export const TIME_LENS_SPEEDS = [0.1, 0.25, 0.5, 1, 2, 4, 8] as const;

export type TimeLensSpeed = (typeof TIME_LENS_SPEEDS)[number];

export function normalizeTimeLensSpeed(value: number): TimeLensSpeed {
  if (!Number.isFinite(value)) return 1;
  return TIME_LENS_SPEEDS.reduce((closest, candidate) =>
    Math.abs(candidate - value) < Math.abs(closest - value) ? candidate : closest,
  );
}

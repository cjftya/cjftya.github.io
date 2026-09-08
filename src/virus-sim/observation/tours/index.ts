import type { ObservationDefinition, StructureTourPose } from '../types';

export const SPECIES_TOUR_DURATION = 24;

export function evaluateSpeciesTour(
  definition: ObservationDefinition,
  progress: number,
): StructureTourPose {
  const value = clamp01(progress);
  const [surface, inside = surface, separated = inside] = definition.tourStops;
  if (value < 0.2) {
    return pose(
      'surface',
      0,
      0,
      false,
      value < 0.06 ? null : (surface?.partId ?? null),
      surface?.label ?? definition.feature,
    );
  }
  if (value < 0.45) {
    return pose(
      'transparent',
      0,
      0,
      true,
      surface?.partId ?? null,
      surface?.label ?? definition.feature,
    );
  }
  if (value < 0.7) {
    return pose(
      'section',
      0,
      lerp(-0.48, 0.26, ease((value - 0.45) / 0.25)),
      true,
      inside?.partId ?? null,
      inside?.label ?? '내부 층',
    );
  }
  if (value < 0.88) {
    return pose(
      'exploded',
      lerp(16, 78, ease((value - 0.7) / 0.18)),
      0,
      true,
      separated?.partId ?? null,
      separated?.label ?? '분리된 구조',
    );
  }
  return pose(
    'surface',
    lerp(78, 0, ease((value - 0.88) / 0.12)),
    0,
    value < 0.95,
    null,
    '전체 구조',
  );
}

function pose(
  view: StructureTourPose['view'],
  explosion: number,
  sectionOffset: number,
  genomeVisible: boolean,
  focusPartId: StructureTourPose['focusPartId'],
  label: string,
): StructureTourPose {
  return { view, explosion, sectionOffset, genomeVisible, focusPartId, label };
}

function ease(value: number): number {
  const clamped = clamp01(value);
  return clamped * clamped * (3 - 2 * clamped);
}

function lerp(start: number, end: number, amount: number): number {
  return start + (end - start) * amount;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
}

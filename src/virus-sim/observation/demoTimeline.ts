import type { PhageDeliveryPose, StructureTourPose } from './types';

export const STRUCTURE_TOUR_DURATION = 20;
export const PHAGE_DELIVERY_DURATION = 13;

export function evaluateStructureTour(progress: number): StructureTourPose {
  const value = clamp01(progress);
  if (value < 0.2) {
    return {
      view: 'surface',
      explosion: 0,
      sectionOffset: 0,
      genomeVisible: false,
      focusPartId: value < 0.08 ? null : 'capsomer',
    };
  }
  if (value < 0.48) {
    return {
      view: 'section',
      explosion: 0,
      sectionOffset: lerp(-0.45, 0.25, ease((value - 0.2) / 0.28)),
      genomeVisible: true,
      focusPartId: 'genome',
    };
  }
  if (value < 0.78) {
    return {
      view: 'exploded',
      explosion: lerp(0, 78, ease((value - 0.48) / 0.3)),
      sectionOffset: 0,
      genomeVisible: true,
      focusPartId: 'capsid',
    };
  }
  return {
    view: 'surface',
    explosion: lerp(78, 0, ease((value - 0.78) / 0.22)),
    sectionOffset: 0,
    genomeVisible: value < 0.92,
    focusPartId: null,
  };
}

export function evaluatePhageDelivery(progress: number): PhageDeliveryPose {
  const value = clamp01(progress);
  const approach = 1 - ease(range(value, 0, 0.22));
  const sheathContraction = ease(range(value, 0.28, 0.52));
  const tubeExtension = ease(range(value, 0.38, 0.62));
  const genomeTransfer = ease(range(value, 0.48, 0.88));
  let label: PhageDeliveryPose['label'] = '표면 접근';
  if (value >= 0.22) label = '부착';
  if (value >= 0.32) label = '꼬리집 수축';
  if (value >= 0.5) label = '유전체 전달';
  if (value >= 0.9) label = '빈 입자';
  return {
    approach,
    sheathContraction,
    tubeExtension,
    genomeTransfer,
    surfaceVisible: value > 0.03,
    label,
  };
}

function range(value: number, start: number, end: number): number {
  return clamp01((value - start) / (end - start));
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

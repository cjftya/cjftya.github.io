import type {
  InspectionView,
  SpecimenObservationState,
  StructuralRevealMode,
  StructuralTransitionState,
} from '../observation/types';

export const EMPTY_TRANSITION: StructuralTransitionState = {
  mode: 'none',
  progress: 0,
  fromExplosion: 0,
};

export function beginStructuralTransition(
  specimen: SpecimenObservationState,
  mode: Exclude<StructuralRevealMode, 'none' | 'reassemble'>,
): SpecimenObservationState {
  return {
    ...specimen,
    view: mode === 'cutaway' ? 'section' : mode === 'peel' ? 'transparent' : 'exploded',
    explosion: 0,
    sectionOffset: mode === 'cutaway' ? 1 : specimen.sectionOffset,
    genomeVisible: true,
    transition: { mode, progress: 0, fromExplosion: 0 },
  };
}

export function beginReassembly(
  specimen: SpecimenObservationState,
): SpecimenObservationState {
  return {
    ...specimen,
    transition: {
      mode: 'reassemble',
      progress: 0,
      fromExplosion: Math.max(18, specimen.explosion),
    },
  };
}

export function stepStructuralTransition(
  specimen: SpecimenObservationState,
  dt: number,
  reducedMotion: boolean,
): SpecimenObservationState {
  const transition = specimen.transition;
  if (transition.mode === 'none') return specimen;
  const duration = reducedMotion
    ? 0.12
    : transition.mode === 'reassemble'
      ? 0.72
      : 0.86;
  const progress = clamp(transition.progress + Math.max(0, dt) / duration, 0, 1);
  const eased = progress * progress * (3 - 2 * progress);
  let view: InspectionView = specimen.view;
  let explosion = specimen.explosion;
  let sectionOffset = specimen.sectionOffset;
  let genomeVisible = specimen.genomeVisible;

  switch (transition.mode) {
    case 'peel':
      view = 'transparent';
      explosion = eased * 18;
      genomeVisible = true;
      break;
    case 'cutaway':
      view = 'section';
      sectionOffset = 1 - eased;
      genomeVisible = true;
      break;
    case 'exploded':
      view = 'exploded';
      explosion = eased * 74;
      genomeVisible = true;
      break;
    case 'reassemble':
      view = 'exploded';
      explosion = transition.fromExplosion * (1 - eased);
      break;
  }

  if (progress < 1) {
    return {
      ...specimen,
      view,
      explosion,
      sectionOffset,
      genomeVisible,
      transition: { ...transition, progress },
    };
  }
  if (transition.mode === 'reassemble') {
    return {
      ...specimen,
      view: 'surface',
      explosion: 0,
      sectionOffset: 0,
      genomeVisible: false,
      transition: EMPTY_TRANSITION,
    };
  }
  return {
    ...specimen,
    view,
    explosion,
    sectionOffset,
    genomeVisible,
    transition: EMPTY_TRANSITION,
  };
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

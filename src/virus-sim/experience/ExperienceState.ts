export type ExperienceStage =
  | 'observe'
  | 'follow'
  | 'approach'
  | 'surface'
  | 'interior'
  | 'structure'
  | 'documentary'
  | 'return';

export type StructuralRevealMode =
  'none' | 'peel' | 'cutaway' | 'exploded' | 'reassemble';

export interface StructuralRevealState {
  readonly mode: StructuralRevealMode;
  readonly progress: number;
  readonly playing: boolean;
  readonly fromExplosion: number;
}

export interface ExperienceState {
  readonly stage: ExperienceStage;
  readonly previousStage: ExperienceStage;
  readonly transitionSequence: number;
  readonly guidedSequence: number;
  readonly reducedMotion: boolean;
  readonly motionTraceVisible: boolean;
  readonly temporalEchoVisible: boolean;
  readonly autoDocumentary: boolean;
  readonly reveal: StructuralRevealState;
}

export function createExperienceState(reducedMotion: boolean): ExperienceState {
  return {
    stage: 'observe',
    previousStage: 'observe',
    transitionSequence: 0,
    guidedSequence: 0,
    reducedMotion,
    motionTraceVisible: false,
    temporalEchoVisible: false,
    autoDocumentary: !reducedMotion,
    reveal: emptyReveal(),
  };
}

export function requestExperienceStage(
  state: ExperienceState,
  stage: ExperienceStage,
): ExperienceState {
  return {
    ...state,
    previousStage: state.stage,
    stage,
    transitionSequence: state.transitionSequence + 1,
    reveal: stage === 'structure' ? state.reveal : emptyReveal(),
  };
}

export function requestGuidedJourney(state: ExperienceState): ExperienceState {
  return {
    ...requestExperienceStage(state, 'interior'),
    guidedSequence: state.guidedSequence + 1,
  };
}

export function startStructuralReveal(
  state: ExperienceState,
  mode: Exclude<StructuralRevealMode, 'none' | 'reassemble'>,
  fromExplosion = 0,
): ExperienceState {
  return {
    ...requestExperienceStage(state, 'structure'),
    reveal: { mode, progress: 0, playing: true, fromExplosion },
  };
}

export function startReassembly(
  state: ExperienceState,
  fromExplosion: number,
): ExperienceState {
  return {
    ...state,
    previousStage: state.stage,
    stage: 'structure',
    transitionSequence: state.transitionSequence + 1,
    reveal: {
      mode: 'reassemble',
      progress: 0,
      playing: true,
      fromExplosion,
    },
  };
}

export function stepStructuralReveal(
  state: ExperienceState,
  dt: number,
): ExperienceState {
  if (!state.reveal.playing) return state;
  const duration = state.reducedMotion
    ? 0.18
    : state.reveal.mode === 'peel'
      ? 1.55
      : 1.8;
  const progress = Math.min(1, state.reveal.progress + Math.max(0, dt) / duration);
  return {
    ...state,
    reveal: { ...state.reveal, progress, playing: progress < 1 },
  };
}

export function emptyReveal(): StructuralRevealState {
  return { mode: 'none', progress: 0, playing: false, fromExplosion: 0 };
}

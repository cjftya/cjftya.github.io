import { getObservationPreset } from '../model/observationPresets';
import {
  createExperienceState,
  emptyReveal,
  requestExperienceStage,
  requestGuidedJourney,
  startReassembly,
  startStructuralReveal,
  stepStructuralReveal,
  type ExperienceStage,
  type StructuralRevealMode,
} from '../experience/ExperienceState';
import { normalizeTimeLensSpeed } from '../time/TimeLens';
import { SPECIES_TOUR_DURATION } from './tours';
import {
  DEFAULT_MOTION_OPTIONS,
  createObservationMotion,
  freezeObservationMotion,
  stepObservationMotion,
  switchObservationMotion,
} from './motion/index';
import type {
  DemoKind,
  InspectionView,
  LayerVisibility,
  MotionMode,
  ObservationLayerId,
  ObservationPartId,
  ObservationPresetId,
  ObservationSnapshot,
  ObservationState,
} from './types';
import { createSpecimenPersonality } from './specimen/SpecimenPersonality';

const DEFAULT_SEED = 730_421;

const ALL_LAYER_IDS: readonly ObservationLayerId[] = [
  'envelope',
  'surface-protein',
  'tegument',
  'capsid',
  'tail',
  'outer-capsid',
  'middle-capsid',
  'core-capsid',
  'inner-membrane',
  'matrix',
  'nucleocapsid',
  'membrane',
  'core-wall',
  'lateral-body',
  'genome',
] as const;

export class ObservationController {
  private state: ObservationState;
  private specimenIndex = 0;

  constructor(reducedMotion = false, seed = DEFAULT_SEED) {
    this.state = createInitialState(reducedMotion, seed);
  }

  getSnapshot(): ObservationSnapshot {
    return {
      ...this.state,
      layerVisibility: { ...this.state.layerVisibility },
      demo: { ...this.state.demo },
      motion: {
        ...this.state.motion,
        position: { ...this.state.motion.position },
        previousPosition: { ...this.state.motion.previousPosition },
        quaternion: { ...this.state.motion.quaternion },
        previousQuaternion: { ...this.state.motion.previousQuaternion },
        anchorPosition: { ...this.state.motion.anchorPosition },
        anchorQuaternion: { ...this.state.motion.anchorQuaternion },
      },
      tick: this.state.motion.tick,
      seed: this.state.motion.seed,
    };
  }

  step(dt: number): void {
    if (!this.state.running) return;
    if (this.state.demo.kind !== 'none') {
      if (!this.state.demo.playing) return;
      const nextProgress = this.state.demo.progress + dt / SPECIES_TOUR_DURATION;
      const progress = nextProgress >= 1 - 1e-12 ? 1 : nextProgress;
      this.state = {
        ...this.state,
        running: progress < 1,
        demo: { ...this.state.demo, progress, playing: progress < 1 },
      };
      return;
    }

    this.state = {
      ...this.state,
      motion: stepObservationMotion(this.state.motion, {
        ...DEFAULT_MOTION_OPTIONS,
        translationEnabled: this.state.translationEnabled,
        rotationEnabled: this.state.rotationEnabled,
        smoothRadius:
          DEFAULT_MOTION_OPTIONS.smoothRadius * this.state.personality.pathScale,
      }),
    };
  }

  stepExperience(dt: number): void {
    const previous = this.state.experience;
    const experience = stepStructuralReveal(previous, dt);
    if (experience === previous) return;
    const progress = smoothStep(experience.reveal.progress);
    let view = this.state.view;
    let explosion = this.state.explosion;
    let sectionOffset = this.state.sectionOffset;
    let genomeVisible = this.state.genomeVisible;
    switch (experience.reveal.mode) {
      case 'peel':
        view = 'transparent';
        explosion = progress * 18;
        genomeVisible = true;
        break;
      case 'cutaway':
        view = 'section';
        sectionOffset = 1 - progress;
        genomeVisible = true;
        break;
      case 'exploded':
        view = 'exploded';
        explosion = progress * 74;
        genomeVisible = true;
        break;
      case 'reassemble':
        view = 'exploded';
        explosion = experience.reveal.fromExplosion * (1 - progress);
        break;
      default:
        break;
    }
    const reassembled =
      experience.reveal.mode === 'reassemble' && experience.reveal.progress >= 1;
    this.state = {
      ...this.state,
      view: reassembled ? 'surface' : view,
      explosion: reassembled ? 0 : explosion,
      sectionOffset: reassembled ? 0 : sectionOffset,
      genomeVisible: reassembled ? false : genomeVisible,
      experience: reassembled
        ? {
            ...requestExperienceStage(experience, 'surface'),
            reveal: emptyReveal(),
          }
        : experience,
    };
  }

  setPreset(presetId: ObservationPresetId): void {
    const definition = getObservationPreset(presetId);
    this.specimenIndex += 1;
    const personality = createSpecimenPersonality(
      this.state.motion.seed,
      presetId,
      this.specimenIndex,
    );
    const motion = createObservationMotion(personality.seed, this.state.motion.mode);
    this.state = {
      ...this.state,
      presetId,
      view: 'surface',
      selectedPartId: null,
      explosion: 0,
      sectionOffset: 0,
      genomeVisible: false,
      layerVisibility: createLayerVisibility(definition.layers.map((item) => item.id)),
      demo: { kind: 'none', progress: 0, playing: false },
      motion: { ...motion, tick: this.state.motion.tick },
      experience: createExperienceState(this.state.experience.reducedMotion),
      personality,
    };
  }

  setView(view: InspectionView): void {
    this.stopDemo();
    this.state = {
      ...this.state,
      view,
      explosion: view === 'exploded' && this.state.explosion === 0 ? 62 : 0,
      experience: {
        ...requestExperienceStage(
          this.state.experience,
          view === 'surface' || view === 'transparent' ? 'surface' : 'structure',
        ),
        reveal: emptyReveal(),
      },
    };
  }

  setExplosion(explosion: number): void {
    this.stopDemo();
    const experience =
      this.state.experience.stage === 'structure'
        ? { ...this.state.experience, reveal: emptyReveal() }
        : {
            ...requestExperienceStage(this.state.experience, 'structure'),
            reveal: emptyReveal(),
          };
    this.state = {
      ...this.state,
      view: 'exploded',
      explosion: clamp(explosion, 0, 100),
      experience,
    };
  }

  setSectionOffset(sectionOffset: number): void {
    this.stopDemo();
    const experience =
      this.state.experience.stage === 'structure'
        ? { ...this.state.experience, reveal: emptyReveal() }
        : {
            ...requestExperienceStage(this.state.experience, 'structure'),
            reveal: emptyReveal(),
          };
    this.state = {
      ...this.state,
      view: 'section',
      sectionOffset: clamp(sectionOffset, -1, 1),
      experience,
    };
  }

  setGenomeVisible(genomeVisible: boolean): void {
    this.stopDemo();
    this.state = {
      ...this.state,
      genomeVisible,
      layerVisibility: genomeVisible
        ? { ...this.state.layerVisibility, genome: true }
        : this.state.layerVisibility,
    };
  }

  setLayerVisible(layer: ObservationLayerId, visible: boolean): void {
    this.stopDemo();
    this.state = {
      ...this.state,
      layerVisibility: { ...this.state.layerVisibility, [layer]: visible },
    };
  }

  selectPart(selectedPartId: ObservationPartId | null): void {
    this.state = { ...this.state, selectedPartId };
  }

  setRunning(running: boolean, interpolation = 1): void {
    const motion = running
      ? this.state.motion.mode === 'static'
        ? switchObservationMotion(this.state.motion, 'active')
        : this.state.motion
      : freezeObservationMotion(this.state.motion, interpolation);
    this.state = {
      ...this.state,
      running,
      motion,
      demo: this.state.demo.playing
        ? { ...this.state.demo, playing: running }
        : this.state.demo,
    };
  }

  freeze(interpolation: number): void {
    this.setRunning(false, interpolation);
  }

  setSpeed(speed: number): void {
    this.state = { ...this.state, speed: normalizeTimeLensSpeed(speed) };
  }

  setExperienceStage(stage: ExperienceStage): void {
    const experience = requestExperienceStage(this.state.experience, stage);
    const outerStage =
      stage === 'observe' ||
      stage === 'follow' ||
      stage === 'approach' ||
      stage === 'surface' ||
      stage === 'return';
    this.state = {
      ...this.state,
      followTarget:
        stage === 'follow' || stage === 'approach' || stage === 'surface'
          ? true
          : this.state.followTarget,
      view: outerStage ? 'surface' : this.state.view,
      explosion: outerStage ? 0 : this.state.explosion,
      sectionOffset: outerStage ? 0 : this.state.sectionOffset,
      genomeVisible:
        stage === 'interior' ? true : outerStage ? false : this.state.genomeVisible,
      experience,
    };
  }

  enterInterior(): void {
    this.state = {
      ...this.state,
      view: 'section',
      sectionOffset: 0.08,
      genomeVisible: true,
      layerVisibility: { ...this.state.layerVisibility, genome: true },
      experience: requestExperienceStage(this.state.experience, 'interior'),
    };
  }

  startGuidedJourney(): void {
    this.state = {
      ...this.state,
      view: 'section',
      sectionOffset: 0.08,
      genomeVisible: true,
      layerVisibility: { ...this.state.layerVisibility, genome: true },
      experience: requestGuidedJourney(this.state.experience),
    };
  }

  startStructuralReveal(
    mode: Exclude<StructuralRevealMode, 'none' | 'reassemble'>,
  ): void {
    this.stopDemo();
    this.state = {
      ...this.state,
      view:
        mode === 'cutaway' ? 'section' : mode === 'peel' ? 'transparent' : 'exploded',
      explosion: 0,
      sectionOffset: mode === 'cutaway' ? 1 : this.state.sectionOffset,
      genomeVisible: true,
      experience: startStructuralReveal(this.state.experience, mode),
    };
  }

  reassemble(): void {
    this.stopDemo();
    this.state = {
      ...this.state,
      experience: startReassembly(
        this.state.experience,
        Math.max(18, this.state.explosion),
      ),
    };
  }

  setMotionTraceVisible(motionTraceVisible: boolean): void {
    this.state = {
      ...this.state,
      experience: { ...this.state.experience, motionTraceVisible },
    };
  }

  setTemporalEchoVisible(temporalEchoVisible: boolean): void {
    this.state = {
      ...this.state,
      experience: { ...this.state.experience, temporalEchoVisible },
    };
  }

  setAutoDocumentary(autoDocumentary: boolean): void {
    this.state = {
      ...this.state,
      experience: { ...this.state.experience, autoDocumentary },
    };
  }

  takeManualControl(): void {
    const stage = this.state.experience.stage;
    if (stage !== 'documentary' && stage !== 'return') return;
    this.state = {
      ...this.state,
      experience: {
        ...this.state.experience,
        previousStage: stage,
        stage:
          stage === 'return' &&
          this.state.experience.previousStage !== 'return' &&
          this.state.experience.previousStage !== 'documentary'
            ? this.state.experience.previousStage
            : 'surface',
        reveal: emptyReveal(),
      },
    };
  }

  completeReturn(): void {
    if (this.state.experience.stage !== 'return') return;
    this.state = {
      ...this.state,
      view: 'surface',
      explosion: 0,
      sectionOffset: 0,
      genomeVisible: false,
      experience: {
        ...this.state.experience,
        previousStage: 'return',
        stage: 'observe',
        reveal: emptyReveal(),
      },
    };
  }

  setTranslationEnabled(translationEnabled: boolean): void {
    this.stopDemo();
    this.state = {
      ...this.state,
      translationEnabled,
      motion: freezeObservationMotion(this.state.motion, 1),
    };
  }

  setRotationEnabled(rotationEnabled: boolean): void {
    this.stopDemo();
    this.state = {
      ...this.state,
      rotationEnabled,
      motion: freezeObservationMotion(this.state.motion, 1),
    };
  }

  setMotionMode(mode: MotionMode): void {
    this.stopDemo();
    this.state = {
      ...this.state,
      running: mode !== 'static',
      motion: switchObservationMotion(this.state.motion, mode),
    };
  }

  setFollowTarget(followTarget: boolean): void {
    this.state = { ...this.state, followTarget };
  }

  startDemo(kind: Exclude<DemoKind, 'none'>): void {
    this.state = {
      ...this.state,
      running: true,
      demo: { kind, progress: 0, playing: true },
    };
  }

  toggleDemoPlayback(): void {
    if (this.state.demo.kind === 'none') return;
    const canPlay = this.state.demo.progress < 1;
    const playing = canPlay && !this.state.demo.playing;
    this.state = {
      ...this.state,
      running: playing,
      demo: { ...this.state.demo, playing },
    };
  }

  setDemoProgress(progress: number): void {
    if (this.state.demo.kind === 'none') return;
    this.state = {
      ...this.state,
      running: false,
      demo: {
        ...this.state.demo,
        progress: clamp(progress, 0, 1),
        playing: false,
      },
    };
  }

  rewindDemo(): void {
    if (this.state.demo.kind === 'none') return;
    this.state = {
      ...this.state,
      running: false,
      demo: { ...this.state.demo, progress: 0, playing: false },
    };
  }

  stopDemo(): void {
    if (this.state.demo.kind === 'none') return;
    this.state = {
      ...this.state,
      running: false,
      demo: { kind: 'none', progress: 0, playing: false },
    };
  }

  resetMotion(seed = this.state.motion.seed): void {
    this.stopDemo();
    const mode =
      this.state.motion.mode === 'static' ? 'active' : this.state.motion.mode;
    this.state = {
      ...this.state,
      running: true,
      motion: createObservationMotion(seed, mode),
    };
  }
}

function createInitialState(reducedMotion: boolean, seed: number): ObservationState {
  const personality = createSpecimenPersonality(seed, 't4');
  return {
    presetId: 't4',
    view: 'surface',
    selectedPartId: null,
    running: !reducedMotion,
    speed: 1,
    translationEnabled: true,
    rotationEnabled: true,
    followTarget: true,
    explosion: 0,
    sectionOffset: 0,
    genomeVisible: false,
    layerVisibility: createLayerVisibility(
      getObservationPreset('t4').layers.map((item) => item.id),
    ),
    demo: { kind: 'none', progress: 0, playing: false },
    motion: createObservationMotion(seed, reducedMotion ? 'static' : 'active'),
    experience: createExperienceState(reducedMotion),
    personality,
  };
}

function createLayerVisibility(
  visibleLayers: readonly ObservationLayerId[],
): LayerVisibility {
  const visible = new Set(visibleLayers);
  return Object.fromEntries(
    ALL_LAYER_IDS.map((layerId) => [layerId, visible.has(layerId)]),
  ) as unknown as LayerVisibility;
}

function clamp(value: number, minimum: number, maximum: number): number {
  const safe = Number.isFinite(value) ? value : minimum;
  return Math.min(maximum, Math.max(minimum, safe));
}

function smoothStep(value: number): number {
  const safe = clamp(value, 0, 1);
  return safe * safe * (3 - 2 * safe);
}

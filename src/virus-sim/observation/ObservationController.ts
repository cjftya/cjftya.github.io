import { getObservationPreset } from '../model/observationPresets';
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
      }),
    };
  }

  setPreset(presetId: ObservationPresetId): void {
    const definition = getObservationPreset(presetId);
    const motion = createObservationMotion(
      this.state.motion.seed,
      this.state.motion.mode,
    );
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
    };
  }

  setView(view: InspectionView): void {
    this.stopDemo();
    this.state = {
      ...this.state,
      view,
      explosion: view === 'exploded' && this.state.explosion === 0 ? 62 : 0,
    };
  }

  setExplosion(explosion: number): void {
    this.stopDemo();
    this.state = {
      ...this.state,
      view: 'exploded',
      explosion: clamp(explosion, 0, 100),
    };
  }

  setSectionOffset(sectionOffset: number): void {
    this.stopDemo();
    this.state = {
      ...this.state,
      view: 'section',
      sectionOffset: clamp(sectionOffset, -1, 1),
    };
  }

  setGenomeVisible(genomeVisible: boolean): void {
    this.stopDemo();
    this.state = { ...this.state, genomeVisible };
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
    this.state = { ...this.state, speed: clamp(speed, 0.25, 2) };
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

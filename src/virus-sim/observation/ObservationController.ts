import { PHAGE_DELIVERY_DURATION, STRUCTURE_TOUR_DURATION } from './demoTimeline';
import {
  DEFAULT_MOTION_OPTIONS,
  createObservationMotion,
  stepObservationMotion,
} from './motion';
import type {
  DemoKind,
  InspectionView,
  ObservationLayerId,
  ObservationPartId,
  ObservationPresetId,
  ObservationSnapshot,
  ObservationState,
} from './types';

const DEFAULT_SEED = 730_421;

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
      },
      tick: this.state.motion.tick,
      seed: this.state.motion.seed,
    };
  }

  step(dt: number): void {
    if (!this.state.running) return;
    if (this.state.demo.kind !== 'none') {
      if (!this.state.demo.playing) return;
      const duration =
        this.state.demo.kind === 'structure-tour'
          ? STRUCTURE_TOUR_DURATION
          : PHAGE_DELIVERY_DURATION;
      const nextProgress = this.state.demo.progress + dt / duration;
      const progress = nextProgress >= 1 - 1e-12 ? 1 : nextProgress;
      this.state = {
        ...this.state,
        running: progress < 1,
        demo: {
          ...this.state.demo,
          progress,
          playing: progress < 1,
        },
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
    this.state = {
      ...this.state,
      presetId,
      view: 'surface',
      selectedPartId: null,
      explosion: 0,
      sectionOffset: 0,
      genomeVisible: false,
      layerVisibility: { envelope: true, capsid: true, genome: true },
      demo: { kind: 'none', progress: 0, playing: false },
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

  setRunning(running: boolean): void {
    this.state = {
      ...this.state,
      running,
      demo: this.state.demo.playing
        ? { ...this.state.demo, playing: running }
        : this.state.demo,
    };
  }

  setSpeed(speed: number): void {
    this.state = { ...this.state, speed: clamp(speed, 0.25, 2) };
  }

  setTranslationEnabled(translationEnabled: boolean): void {
    this.stopDemo();
    this.state = { ...this.state, translationEnabled };
  }

  setRotationEnabled(rotationEnabled: boolean): void {
    this.stopDemo();
    this.state = { ...this.state, rotationEnabled };
  }

  setFollowTarget(followTarget: boolean): void {
    this.state = { ...this.state, followTarget };
  }

  startDemo(kind: Exclude<DemoKind, 'none'>): void {
    if (kind === 'phage-delivery' && this.state.presetId !== 'tailed-phage') return;
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
      demo: { kind: 'none', progress: 0, playing: false },
    };
  }

  resetMotion(seed = this.state.motion.seed): void {
    this.stopDemo();
    this.state = {
      ...this.state,
      running: true,
      motion: createObservationMotion(seed),
    };
  }
}

function createInitialState(reducedMotion: boolean, seed: number): ObservationState {
  return {
    presetId: 'tailed-phage',
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
    layerVisibility: { envelope: true, capsid: true, genome: true },
    demo: { kind: 'none', progress: 0, playing: false },
    motion: createObservationMotion(seed),
  };
}

function clamp(value: number, minimum: number, maximum: number): number {
  const safe = Number.isFinite(value) ? value : minimum;
  return Math.min(maximum, Math.max(minimum, safe));
}

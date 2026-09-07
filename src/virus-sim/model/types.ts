export type SimulationStatus = 'ready' | 'running' | 'paused' | 'completed';

export type RecognitionCondition = 'match' | 'mismatch';
export type ReceptorDensity = 'sparse' | 'default' | 'dense';
export type StartPlacement = 'guided' | 'random';

export interface Vec3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface SimulationConfig {
  readonly initialPhageCount: number;
  readonly recognition: RecognitionCondition;
  readonly receptorDensity: ReceptorDensity;
  readonly placement: StartPlacement;
  readonly defenseBlocksInfection?: boolean;
}

export type PhagePhase = 'free' | 'contacting' | 'attached' | 'delivering' | 'spent';

export interface PhageSnapshot {
  readonly id: number;
  readonly position: Vec3;
  readonly previousPosition: Vec3;
  readonly phase: PhagePhase;
  readonly phaseElapsed: number;
  readonly deliveryProgress: number;
  readonly contactPoint: Vec3 | null;
}

export type BacteriumPhase =
  | 'susceptible'
  | 'receiving'
  | 'producing'
  | 'assembling'
  | 'lysing'
  | 'lysed'
  | 'blocked';

export interface BacteriumSnapshot {
  readonly phase: BacteriumPhase;
  readonly phaseElapsed: number;
  readonly remainingResource: number;
  readonly internalGenomes: number;
  readonly componentBundles: number;
  readonly completedPhages: number;
  readonly releasedPhages: number;
  readonly infectionOwnerId: number | null;
}

export interface SimulationCounts {
  readonly free: number;
  readonly contacting: number;
  readonly attached: number;
  readonly delivering: number;
  readonly spent: number;
  readonly completed: number;
  readonly released: number;
  readonly contacts: number;
}

export type SimulationEventType =
  | 'contact'
  | 'contact-rejected'
  | 'attached'
  | 'detached'
  | 'delivery-started'
  | 'delivery-completed'
  | 'infection-blocked'
  | 'production-started'
  | 'assembly-started'
  | 'phage-assembled'
  | 'lysis-started'
  | 'released';

export interface SimulationEvent {
  readonly tick: number;
  readonly modelTime: number;
  readonly type: SimulationEventType;
  readonly phageId?: number;
  readonly count?: number;
  readonly reason?: 'recognition-mismatch' | 'attachment-timeout' | 'host-occupied';
}

export interface SimulationSnapshot {
  readonly schemaVersion: 1;
  readonly modelVersion: string;
  readonly seed: number;
  readonly config: SimulationConfig;
  readonly tick: number;
  readonly modelTime: number;
  readonly status: SimulationStatus;
  readonly bacterium: BacteriumSnapshot;
  readonly phages: readonly PhageSnapshot[];
  readonly counts: SimulationCounts;
  readonly firstDeliveryTime: number | null;
}

export interface Simulation {
  step(dt: number): void;
  getSnapshot(): SimulationSnapshot;
  drainEvents(): readonly SimulationEvent[];
  reset(config: SimulationConfig, seed: number): void;
  setStatus(status: Exclude<SimulationStatus, 'completed'>): void;
}

export interface RunSummary {
  readonly schemaVersion: 1;
  readonly modelVersion: string;
  readonly seed: number;
  readonly config: SimulationConfig;
  readonly ticks: number;
  readonly modelTime: number;
  readonly state: 'completed' | 'interrupted' | 'in-progress';
  readonly deliveryOccurred: boolean;
  readonly firstDeliveryTime: number | null;
  readonly releasedPhages: number;
  readonly eventLogTruncated: boolean;
  readonly events: readonly SimulationEvent[];
}

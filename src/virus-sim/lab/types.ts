import type { EvidenceLevel, ObservationPresetId } from '../catalog/types';

export type Vec3Tuple = readonly [number, number, number];
export type QuaternionTuple = readonly [number, number, number, number];
export type LabStatus = 'ready' | 'running' | 'paused' | 'completed' | 'inspecting';
export type LabScaleMode = 'representative-length' | 'physical';
export type FlowPreset = 'linear' | 'shear' | 'vortex';
export type ChamberKind = 'open' | 'obstacle';
export type PhysicsShape = 'sphere' | 'capsule' | 'filament' | 'compound';
export type LabTimeScale = 0.25 | 0.5 | 1 | 2;
export type PassageState = 'waiting' | 'moving' | 'passed' | 'not-passed';

export interface LabEnvironment {
  readonly chamber: ChamberKind;
  readonly flowPreset: FlowPreset;
  readonly drive: number;
  readonly viscosityRatio: number;
  readonly flowDirection: -1 | 1;
  readonly shearStrength: number;
  readonly vortexStrength: number;
  readonly gapWidth: number;
  readonly brownianEnabled: boolean;
}

export interface LabInitialInstance {
  readonly instanceId: string;
  readonly virusId: ObservationPresetId;
  readonly variantId: string | null;
  readonly physicsProfileId: string;
  readonly position: Vec3Tuple;
  readonly orientation: QuaternionTuple;
}

export interface LabConfig {
  readonly schemaVersion: 1;
  readonly engineVersion: 'virus-lab-v4.0';
  readonly scaleMode: LabScaleMode;
  readonly seed: number;
  readonly durationSeconds: number;
  readonly environment: LabEnvironment;
  readonly initialInstances: readonly LabInitialInstance[];
}

export interface PhysicsProfile {
  readonly id: string;
  readonly virusId: ObservationPresetId;
  readonly shape: PhysicsShape;
  readonly localAxis: Vec3Tuple;
  readonly radius: number;
  readonly halfLength: number;
  readonly segmentCount: number;
  readonly dragParallel: number;
  readonly dragPerpendicular: number;
  readonly rotationResponse: number;
  readonly flexibility: number;
  readonly compoundOffsets: readonly Vec3Tuple[];
  readonly evidence: EvidenceLevel;
  readonly approximationNote: string;
  readonly version: 1;
}

export interface LabBodySnapshot {
  readonly instanceId: string;
  readonly virusId: ObservationPresetId;
  readonly variantId: string | null;
  readonly physicsProfileId: string;
  readonly position: Vec3Tuple;
  readonly orientation: QuaternionTuple;
  readonly velocity: Vec3Tuple;
  readonly scale: number;
  readonly filamentPoints: readonly Vec3Tuple[];
}

export interface TrajectorySnapshot {
  readonly instanceId: string;
  readonly points: readonly Vec3Tuple[];
}

export interface PassageResult {
  readonly instanceId: string;
  readonly state: PassageState;
  readonly passedAt: number | null;
  readonly startPosition: Vec3Tuple;
}

export type LabCommandProperty =
  | 'drive'
  | 'viscosityRatio'
  | 'flowDirection'
  | 'shearStrength'
  | 'vortexStrength'
  | 'gapWidth'
  | 'brownianEnabled';

export interface LabCommand {
  readonly tick: number;
  readonly property: LabCommandProperty;
  readonly value: number | boolean;
}

export interface LabRunRecord {
  readonly runId: string;
  readonly initialConfig: LabConfig;
  readonly completedTick: number;
  readonly commands: readonly LabCommand[];
  readonly results: readonly PassageResult[];
}

export interface LabSnapshot {
  readonly config: LabConfig;
  readonly status: LabStatus;
  readonly tick: number;
  readonly simTime: number;
  readonly timeScale: LabTimeScale;
  readonly selectedInstanceId: string | null;
  readonly bodies: readonly LabBodySnapshot[];
  readonly trajectories: readonly TrajectorySnapshot[];
  readonly results: readonly PassageResult[];
  readonly commandCount: number;
  readonly replaying: boolean;
  readonly showAllTrajectories: boolean;
  readonly message: string | null;
}

import { getCatalogEntry, isVirusId } from '../catalog/registry';
import { normalizeSeed } from '../common/random';
import {
  bodyAabb,
  createLabWorld,
  snapshotBodies,
  stepLabWorld,
  validateWorld,
  type LabWorld,
} from './physics/world';
import { LabRandom } from './physics/random';
import { getPhysicsProfile } from './profiles/registry';
import { createChamberDescriptor, isGapChangeSafe } from './chambers/descriptors';
import { TrajectoryRecorder } from './measurements';
import type {
  ChamberKind,
  FlowPreset,
  LabCommand,
  LabCommandProperty,
  LabConfig,
  LabEnvironment,
  LabInitialInstance,
  LabRunRecord,
  LabScaleMode,
  LabSnapshot,
  LabStatus,
  LabTimeScale,
} from './types';

export const LAB_FIXED_STEP = 1 / 120;
const MAX_SUBSTEPS = 18;
const MAX_COMMANDS = 8192;
const DEFAULT_IDS = ['ms2', 'tmv', 'ebola-virus', 't4'] as const;
const PLACEMENTS: readonly (readonly [number, number])[] = [
  [-2.4, -0.9],
  [-0.8, 0.9],
  [0.8, -0.9],
  [2.4, 0.9],
  [-2.4, 0.9],
  [-0.8, -0.9],
  [0.8, 0.9],
  [2.4, -0.9],
];

export class LabSession {
  private config: LabConfig;
  private world: LabWorld;
  private random: LabRandom;
  private readonly trajectories = new TrajectoryRecorder();
  private status: LabStatus = 'ready';
  private tick = 0;
  private simTime = 0;
  private accumulator = 0;
  private timeScale: LabTimeScale = 1;
  private selectedInstanceId: string | null;
  private commands: LabCommand[] = [];
  private runInitialConfig: LabConfig;
  private lastRun: LabRunRecord | null = null;
  private replayCommands: readonly LabCommand[] = [];
  private replayCursor = 0;
  private replayEndTick: number | null = null;
  private replaying = false;
  private showAllTrajectories = false;
  private message: string | null = null;
  private runSerial = 1;
  private instanceSerial = 1;

  constructor(config: LabConfig = createDefaultLabConfig()) {
    this.config = cloneConfig(config);
    this.world = createLabWorld(this.config);
    const errors = validateWorld(this.world);
    if (errors.length > 0) throw new Error(errors.join('; '));
    this.random = new LabRandom(this.config.seed);
    this.runInitialConfig = cloneConfig(this.config);
    this.selectedInstanceId = this.config.initialInstances[0]?.instanceId ?? null;
    this.trajectories.reset(this.world);
  }

  getSnapshot(): LabSnapshot {
    return {
      config: cloneConfig(this.config),
      status: this.status,
      tick: this.tick,
      simTime: this.simTime,
      timeScale: this.timeScale,
      selectedInstanceId: this.selectedInstanceId,
      bodies: snapshotBodies(this.world),
      trajectories: this.trajectories.snapshot(),
      results: [...this.world.results.values()].map((result) => ({
        ...result,
        startPosition: [...result.startPosition],
      })),
      commandCount: this.replaying ? this.replayCommands.length : this.commands.length,
      replaying: this.replaying,
      showAllTrajectories: this.showAllTrajectories,
      message: this.message,
    };
  }

  advance(realDeltaSeconds: number): void {
    if (this.status !== 'running') return;
    this.accumulator += Math.min(0.1, Math.max(0, realDeltaSeconds)) * this.timeScale;
    let steps = 0;
    try {
      while (this.accumulator >= LAB_FIXED_STEP && steps < MAX_SUBSTEPS) {
        this.applyReplayCommands();
        stepLabWorld(
          this.world,
          this.config.environment,
          LAB_FIXED_STEP,
          this.simTime,
          this.random,
        );
        this.tick += 1;
        this.simTime = this.tick * LAB_FIXED_STEP;
        this.trajectories.sample(this.world, this.simTime);
        this.accumulator -= LAB_FIXED_STEP;
        steps += 1;
        if (this.shouldComplete()) {
          this.complete();
          break;
        }
        if (
          this.replaying &&
          this.replayEndTick !== null &&
          this.tick >= this.replayEndTick
        ) {
          this.applyReplayCommands();
          this.finishReplayAtRecordedEnd();
          break;
        }
      }
      if (steps === MAX_SUBSTEPS)
        this.accumulator = Math.min(this.accumulator, LAB_FIXED_STEP);
    } catch (error) {
      this.status = 'paused';
      this.message =
        error instanceof Error
          ? `안전 정지: ${error.message}`
          : '물리 상태 오류로 안전 정지했어요.';
    }
  }

  play(): void {
    if (this.status === 'inspecting') return;
    if (
      this.status === 'completed' ||
      (this.status === 'paused' && this.shouldComplete())
    )
      this.restartCurrent();
    if (this.status === 'ready') this.runInitialConfig = cloneConfig(this.config);
    this.status = 'running';
    this.message = null;
  }

  pause(message: string | null = null): void {
    if (this.status === 'running') this.status = 'paused';
    if (message) this.message = message;
  }

  enterInspection(): void {
    this.pause();
    this.status = 'inspecting';
  }

  leaveInspection(): void {
    if (this.status === 'inspecting') this.status = 'paused';
  }

  restartCurrent(): void {
    if (!this.replaying) this.captureCurrentRun();
    this.replaying = false;
    this.config = {
      ...cloneConfig(this.config),
      seed: normalizeSeed(this.config.seed),
      initialInstances: this.config.initialInstances.map((instance) => ({
        ...instance,
      })),
    };
    this.resetWorld('ready');
    this.message = '현재 조건과 시작 배치로 되돌렸어요.';
  }

  replayLastRun(): boolean {
    if (this.replaying) {
      this.message = '이미 이전 실행을 재생하고 있어요.';
      return false;
    }
    if (this.status === 'running' || this.status === 'inspecting') {
      this.message = '현재 실험을 정지한 뒤 이전 실행을 재생해주세요.';
      return false;
    }
    if (!this.lastRun) {
      this.message = '재생할 이전 실행이 아직 없어요.';
      return false;
    }
    const record = this.lastRun;
    this.config = cloneConfig(record.initialConfig);
    this.replayCommands = record.commands.map((command) => ({ ...command }));
    this.replayCursor = 0;
    this.replayEndTick = record.completedTick;
    this.replaying = true;
    this.resetWorld('running');
    this.message = '이전 실행의 초기 상태와 조건 변경을 재생해요.';
    return true;
  }

  setTimeScale(value: number): void {
    if (value === 0.25 || value === 0.5 || value === 1 || value === 2)
      this.timeScale = value;
  }

  setEnvironment(property: LabCommandProperty, value: number | boolean): void {
    const branchedFromReplay = this.replaying;
    const resumeAfterBranch = branchedFromReplay ? this.finishReplayBranch() : false;
    const next = sanitizeEnvironmentChange(this.config.environment, property, value);
    if (property === 'gapWidth') {
      const current = this.config.environment.gapWidth;
      const limited =
        this.status === 'running'
          ? current + Math.max(-0.2, Math.min(0.2, next.gapWidth - current))
          : next.gapWidth;
      const candidate = { ...next, gapWidth: limited };
      const bodyRanges = this.world.bodies
        .map(bodyAabb)
        .filter((bounds) => bounds.max[0] >= -0.5 && bounds.min[0] <= 0.5)
        .map((bounds) => ({ minY: bounds.min[1], maxY: bounds.max[1] }));
      if (!isGapChangeSafe(candidate, bodyRanges)) {
        this.message = branchedFromReplay
          ? '재생을 새 실행으로 분기했지만, 표본과 벽이 겹치는 통로 폭은 적용하지 않았어요.'
          : '표본과 벽이 겹치지 않는 마지막 통로 폭을 유지했어요.';
        return;
      }
      this.applyEnvironment(property, limited);
      this.resumeReplayBranch(branchedFromReplay, resumeAfterBranch);
      return;
    }
    this.applyEnvironment(property, next[property]);
    this.resumeReplayBranch(branchedFromReplay, resumeAfterBranch);
  }

  setFlowPreset(flowPreset: FlowPreset): void {
    this.updateStructuralConfig({
      environment: { ...this.config.environment, flowPreset },
    });
  }

  setChamber(chamber: ChamberKind): void {
    this.updateStructuralConfig({
      environment: { ...this.config.environment, chamber },
    });
  }

  setScaleMode(scaleMode: LabScaleMode): void {
    this.updateStructuralConfig({ scaleMode });
  }

  setDuration(seconds: number): void {
    const durationSeconds = seconds === 300 ? 300 : seconds === 120 ? 120 : 60;
    this.updateStructuralConfig({ durationSeconds });
  }

  selectInstance(instanceId: string | null): void {
    this.selectedInstanceId = this.world.bodies.some(
      (body) => body.instanceId === instanceId,
    )
      ? instanceId
      : null;
  }

  setShowAllTrajectories(value: boolean): void {
    this.showAllTrajectories = value;
  }

  addSpecimen(virusId: string): boolean {
    if (!this.canEditStructure()) return false;
    if (!isVirusId(virusId) || this.config.initialInstances.length >= 8) {
      this.message =
        this.config.initialInstances.length >= 8
          ? '표본은 최대 8개까지 추가할 수 있어요.'
          : '알 수 없는 도감 항목이에요.';
      return false;
    }
    const placement = PLACEMENTS[this.config.initialInstances.length];
    if (!placement) return false;
    const instance = createInitialInstance(
      virusId,
      this.nextInstanceId(virusId),
      placement,
    );
    const next: LabConfig = {
      ...this.config,
      initialInstances: [...this.config.initialInstances, instance],
    };
    const applied = this.applyStructuralConfig(next);
    if (applied) this.selectedInstanceId = instance.instanceId;
    return applied;
  }

  replaceSelected(virusId: string): boolean {
    if (!this.canEditStructure() || !isVirusId(virusId) || !this.selectedInstanceId)
      return false;
    const next = {
      ...this.config,
      initialInstances: this.config.initialInstances.map((instance) =>
        instance.instanceId === this.selectedInstanceId
          ? {
              ...instance,
              virusId,
              variantId: null,
              physicsProfileId: getPhysicsProfile(virusId).id,
            }
          : instance,
      ),
    };
    return this.applyStructuralConfig(next);
  }

  removeSelected(): boolean {
    if (
      !this.canEditStructure() ||
      !this.selectedInstanceId ||
      this.config.initialInstances.length <= 1
    )
      return false;
    const next = {
      ...this.config,
      initialInstances: this.config.initialInstances.filter(
        (instance) => instance.instanceId !== this.selectedInstanceId,
      ),
    };
    const applied = this.applyStructuralConfig(next);
    if (applied) this.selectedInstanceId = next.initialInstances[0]?.instanceId ?? null;
    return applied;
  }

  swapStartingPositions(): void {
    if (!this.canEditStructure() || this.config.initialInstances.length < 2) return;
    const positions = this.config.initialInstances.map((instance) => instance.position);
    const next: LabConfig = {
      ...this.config,
      initialInstances: this.config.initialInstances.map((instance, index) => ({
        ...instance,
        position: [
          positions[(index + 1) % positions.length]![0],
          positions[(index + 1) % positions.length]![1],
          positions[(index + 1) % positions.length]![2],
        ],
      })),
    };
    this.applyStructuralConfig(next);
  }

  replaceConfig(config: LabConfig): void {
    const next = cloneConfig(config);
    const world = createLabWorld(next);
    const errors = validateWorld(world);
    if (errors.length > 0) throw new Error(errors.join('; '));
    if (!this.replaying) this.captureCurrentRun();
    this.config = next;
    this.selectedInstanceId = next.initialInstances[0]?.instanceId ?? null;
    this.resetWorld('ready');
  }

  getConfig(): LabConfig {
    return cloneConfig(this.config);
  }

  setMessage(message: string): void {
    this.message = message;
  }

  getSelectedVirusId(): string | null {
    return (
      this.world.bodies.find((body) => body.instanceId === this.selectedInstanceId)
        ?.virusId ?? null
    );
  }

  private applyEnvironment(
    property: LabCommandProperty,
    value: number | boolean,
  ): void {
    this.config = {
      ...this.config,
      environment: { ...this.config.environment, [property]: value },
    };
    this.world.chamber = createChamberDescriptor(this.config.environment);
    if (this.status === 'running' || (this.status === 'paused' && this.tick > 0))
      this.recordCommand({ tick: this.tick, property, value });
    this.message = null;
  }

  private nextInstanceId(virusId: string): string {
    const occupied = new Set(
      this.config.initialInstances.map((instance) => instance.instanceId),
    );
    let candidate: string;
    do {
      candidate = `lab-${virusId}-${this.instanceSerial++}`;
    } while (occupied.has(candidate));
    return candidate;
  }

  private recordCommand(command: LabCommand): void {
    const existing = this.commands.findIndex(
      (item) => item.tick === command.tick && item.property === command.property,
    );
    if (existing >= 0) this.commands[existing] = command;
    else this.commands.push(command);
    if (this.commands.length >= MAX_COMMANDS) {
      this.pause(
        '조건 변경 기록 한도에 도달해 안전하게 정지했어요. 새 실행을 시작해주세요.',
      );
    }
  }

  private applyReplayCommands(): void {
    while (this.replayCursor < this.replayCommands.length) {
      const command = this.replayCommands[this.replayCursor]!;
      if (command.tick > this.tick) break;
      if (command.tick === this.tick) {
        this.config = {
          ...this.config,
          environment: {
            ...this.config.environment,
            [command.property]: command.value,
          },
        };
        this.world.chamber = createChamberDescriptor(this.config.environment);
      }
      this.replayCursor += 1;
    }
  }

  private finishReplayBranch(): boolean {
    const resume = this.status === 'running';
    this.replaying = false;
    this.replayCommands = [];
    this.commands = [];
    this.resetWorld('ready');
    return resume;
  }

  private finishReplayAtRecordedEnd(): void {
    this.commands = this.replayCommands.map((command) => ({ ...command }));
    this.status = 'paused';
    this.replaying = false;
    this.replayCommands = [];
    this.replayCursor = 0;
    this.replayEndTick = null;
    this.accumulator = 0;
    this.message = '이전 실행이 기록된 마지막 시점에서 재생을 멈췄어요.';
  }

  private resumeReplayBranch(branched: boolean, resume: boolean): void {
    if (!branched) return;
    if (resume) this.play();
    this.message = resume
      ? '재생을 현재 조건의 새 실행으로 분기해 처음부터 계속해요.'
      : '재생을 현재 조건의 새 실행으로 분기해 준비했어요.';
  }

  private updateStructuralConfig(
    update: Partial<Pick<LabConfig, 'scaleMode' | 'durationSeconds'>> & {
      readonly environment?: LabEnvironment;
    },
  ): void {
    if (!this.canEditStructure()) return;
    this.applyStructuralConfig({ ...this.config, ...update });
  }

  private applyStructuralConfig(next: LabConfig): boolean {
    const previous = this.config;
    try {
      const candidate = createLabWorld(next);
      const errors = validateWorld(candidate);
      if (errors.length > 0) throw new Error(errors.join('; '));
      if (!this.replaying) this.captureCurrentRun();
      this.config = cloneConfig(next);
      this.replaying = false;
      this.resetWorld('ready');
      this.message = null;
      return true;
    } catch (error) {
      this.config = previous;
      this.message =
        error instanceof Error
          ? `이 배치는 적용할 수 없어요: ${error.message}`
          : '이 배치는 적용할 수 없어요.';
      return false;
    }
  }

  private canEditStructure(): boolean {
    if (this.status === 'running' || this.status === 'inspecting') {
      this.message = '실행을 정지한 뒤 표본이나 챔버 구성을 바꿔주세요.';
      return false;
    }
    return true;
  }

  private resetWorld(status: LabStatus): void {
    this.world = createLabWorld(this.config);
    const errors = validateWorld(this.world);
    if (errors.length > 0) throw new Error(errors.join('; '));
    this.random = new LabRandom(this.config.seed);
    this.trajectories.reset(this.world);
    this.status = status;
    this.tick = 0;
    this.simTime = 0;
    this.accumulator = 0;
    this.commands = [];
    if (!this.replaying) {
      this.replayCommands = [];
      this.replayCursor = 0;
      this.replayEndTick = null;
    }
    this.runInitialConfig = cloneConfig(this.config);
  }

  private shouldComplete(): boolean {
    if (this.simTime >= this.config.durationSeconds) return true;
    return (
      this.config.environment.chamber === 'obstacle' &&
      [...this.world.results.values()].every((result) => result.state === 'passed')
    );
  }

  private complete(): void {
    for (const [id, result] of this.world.results) {
      if (result.state !== 'passed')
        this.world.results.set(id, { ...result, state: 'not-passed' });
    }
    this.status = 'completed';
    this.captureCurrentRun();
    if (this.replaying)
      this.commands = this.replayCommands.map((command) => ({ ...command }));
    this.replaying = false;
    this.replayCommands = [];
    this.replayCursor = 0;
    this.replayEndTick = null;
    this.message = '실험이 완료됐어요.';
  }

  private captureCurrentRun(): void {
    if (this.tick === 0) return;
    this.lastRun = {
      runId: `run-${Date.now()}-${this.runSerial++}`,
      initialConfig: cloneConfig(this.runInitialConfig),
      completedTick: this.tick,
      commands: (this.replaying ? this.replayCommands : this.commands).map(
        (command) => ({ ...command }),
      ),
      results: [...this.world.results.values()].map((result) => ({
        ...result,
        startPosition: [...result.startPosition],
      })),
    };
  }
}

export function createDefaultLabConfig(): LabConfig {
  return {
    schemaVersion: 1,
    engineVersion: 'virus-lab-v4.0',
    scaleMode: 'representative-length',
    seed: 0x41c6ce57,
    durationSeconds: 60,
    environment: {
      chamber: 'open',
      flowPreset: 'linear',
      drive: 0.8,
      viscosityRatio: 1,
      flowDirection: 1,
      shearStrength: 0.65,
      vortexStrength: 0.9,
      gapWidth: 2.2,
      brownianEnabled: false,
    },
    initialInstances: DEFAULT_IDS.map((id, index) =>
      createInitialInstance(id, `lab-${id}-${index + 1}`, PLACEMENTS[index]!),
    ),
  };
}

function createInitialInstance(
  virusId: string,
  instanceId: string,
  placement: readonly [number, number],
): LabInitialInstance {
  getCatalogEntry(virusId);
  return {
    instanceId,
    virusId,
    variantId: null,
    physicsProfileId: getPhysicsProfile(virusId).id,
    position: [-4.35, placement[0], placement[1]],
    orientation: [0, 0, 0, 1],
  };
}

function sanitizeEnvironmentChange(
  environment: LabEnvironment,
  property: LabCommandProperty,
  value: number | boolean,
): LabEnvironment {
  const numeric = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  switch (property) {
    case 'drive':
      return { ...environment, drive: Math.max(0, Math.min(2, numeric)) };
    case 'viscosityRatio':
      return { ...environment, viscosityRatio: Math.max(0.25, Math.min(4, numeric)) };
    case 'flowDirection':
      return { ...environment, flowDirection: numeric < 0 ? -1 : 1 };
    case 'shearStrength':
      return { ...environment, shearStrength: Math.max(0, Math.min(1.5, numeric)) };
    case 'vortexStrength':
      return { ...environment, vortexStrength: Math.max(0, Math.min(1.5, numeric)) };
    case 'gapWidth':
      return { ...environment, gapWidth: Math.max(0.7, Math.min(4.2, numeric)) };
    case 'brownianEnabled':
      return { ...environment, brownianEnabled: Boolean(value) };
  }
}

function cloneConfig(config: LabConfig): LabConfig {
  return {
    ...config,
    environment: { ...config.environment },
    initialInstances: config.initialInstances.map((instance) => ({
      ...instance,
      position: [...instance.position],
      orientation: [...instance.orientation],
    })),
  };
}

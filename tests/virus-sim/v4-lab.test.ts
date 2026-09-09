import { describe, expect, it } from 'vitest';
import { VIRUS_CATALOG } from '../../src/virus-sim/catalog/registry';
import { getPhysicalDimensions } from '../../src/virus-sim/catalog/dimensions';
import {
  LAB_FIXED_STEP,
  LabSession,
  createDefaultLabConfig,
} from '../../src/virus-sim/lab/LabSession';
import { createLabWorld, bodyAabb } from '../../src/virus-sim/lab/physics/world';
import { createChamberDescriptor } from '../../src/virus-sim/lab/chambers/descriptors';
import {
  effectiveFlowSpeed,
  sampleVelocityField,
} from '../../src/virus-sim/lab/physics/velocityField';
import {
  getPhysicsProfile,
  scalesForViruses,
  validatePhysicsProfiles,
} from '../../src/virus-sim/lab/profiles/registry';
import {
  loadLabConfigWithStatus,
  saveLabConfig,
} from '../../src/virus-sim/lab/persistence';
import type { LabConfig } from '../../src/virus-sim/lab/types';

describe('Virus Sim v4 Physics Arena', () => {
  it('maps every catalog entry and keeps TMV rigid', () => {
    expect(validatePhysicsProfiles()).toEqual([]);
    expect(VIRUS_CATALOG.map((entry) => getPhysicsProfile(entry.id))).toHaveLength(
      VIRUS_CATALOG.length,
    );
    expect(getPhysicsProfile('tmv').shape).toBe('capsule');
    expect(getPhysicsProfile('ebola-virus').shape).toBe('filament');
  });

  it('uses finite-core flow and makes viscosity reduce calculated speed', () => {
    const config = createDefaultLabConfig();
    const vortex = {
      ...config.environment,
      flowPreset: 'vortex' as const,
      vortexStrength: 1.2,
    };
    expect(sampleVelocityField(vortex, [0, 0, 0])).toEqual([0, 0, 0]);
    expect(sampleVelocityField(vortex, [0.001, 0.001, 0]).every(Number.isFinite)).toBe(
      true,
    );
    expect(
      effectiveFlowSpeed({ ...config.environment, viscosityRatio: 3 }),
    ).toBeLessThan(effectiveFlowSpeed({ ...config.environment, viscosityRatio: 0.5 }));
    const obstacleEnvironment = {
      ...config.environment,
      chamber: 'obstacle' as const,
    };
    const chamber = createChamberDescriptor(obstacleEnvironment);
    expect(sampleVelocityField(obstacleEnvironment, [0, 2, 0], chamber)).toEqual([
      0, 0, 0,
    ]);
    expect(
      sampleVelocityField(obstacleEnvironment, [0, 0, 0], chamber)[0],
    ).toBeGreaterThan(0);
  });

  it('does not advance tick, pose, PRNG-derived motion, or results while paused', () => {
    const session = new LabSession();
    const before = session.getSnapshot();
    session.advance(3);
    expect(session.getSnapshot()).toEqual(before);
    session.play();
    session.advance(1 / 30);
    session.pause();
    const paused = session.getSnapshot();
    session.advance(2);
    expect(session.getSnapshot()).toEqual(paused);
  });

  it('produces the same state for equal fixed ticks at different render cadences', () => {
    const sixty = new LabSession();
    const thirty = new LabSession();
    const oneTwenty = new LabSession();
    sixty.play();
    thirty.play();
    oneTwenty.play();
    for (let frame = 0; frame < 120; frame += 1) sixty.advance(1 / 60);
    for (let frame = 0; frame < 60; frame += 1) thirty.advance(1 / 30);
    for (let frame = 0; frame < 240; frame += 1) oneTwenty.advance(1 / 120);
    const first = sixty.getSnapshot();
    const second = thirty.getSnapshot();
    const third = oneTwenty.getSnapshot();
    expect(first.tick).toBe(second.tick);
    expect(first.tick).toBe(third.tick);
    expect(first.simTime).toBeCloseTo(first.tick * LAB_FIXED_STEP, 10);
    first.bodies.forEach((body, index) => {
      const comparison = second.bodies[index]!;
      body.position.forEach((value, axis) =>
        expect(value).toBeCloseTo(comparison.position[axis]!, 8),
      );
      body.orientation.forEach((value, axis) =>
        expect(value).toBeCloseTo(comparison.orientation[axis]!, 8),
      );
      body.position.forEach((value, axis) =>
        expect(value).toBeCloseTo(third.bodies[index]!.position[axis]!, 8),
      );
    });
  });

  it('preserves filament segment lengths and chamber depth constraints', () => {
    const base = createDefaultLabConfig();
    const ebola = base.initialInstances.find(
      (instance) => instance.virusId === 'ebola-virus',
    )!;
    const session = new LabSession({
      ...base,
      environment: {
        ...base.environment,
        flowPreset: 'vortex',
        brownianEnabled: true,
      },
      initialInstances: [{ ...ebola, position: [-2, 0, 0] }],
    });
    const initial = session.getSnapshot().bodies[0]!.filamentPoints;
    const targetLength = distance(initial[0]!, initial[1]!);
    session.play();
    for (let frame = 0; frame < 300; frame += 1) session.advance(1 / 60);
    const body = session.getSnapshot().bodies[0]!;
    for (let index = 0; index < body.filamentPoints.length - 1; index += 1) {
      const segmentLength = distance(
        body.filamentPoints[index]!,
        body.filamentPoints[index + 1]!,
      );
      expect(segmentLength).toBeGreaterThan(targetLength * 0.78);
      expect(segmentLength).toBeLessThan(targetLength * 1.22);
    }
    expect(
      body.filamentPoints.every(
        (point) => Math.abs(point[1]) < 3.2 && Math.abs(point[2]) < 2.5,
      ),
    ).toBe(true);
  });

  it('keeps physical display lengths proportional to catalog nanometres', () => {
    const ids = ['ms2', 'tmv'] as const;
    const scales = scalesForViruses(ids, 'physical');
    const displayLengths = ids.map((id, index) => {
      const profile = getPhysicsProfile(id);
      return (profile.radius * 2 + profile.halfLength * 2) * scales[index]!;
    });
    const nanometres = ids.map((id) => getPhysicalDimensions(id)!.representativeNm);
    expect(displayLengths[1]! / displayLengths[0]!).toBeCloseTo(
      nanometres[1]! / nanometres[0]!,
      8,
    );
  });

  it('changes capsule contact width when its local axis rotates', () => {
    const config = createDefaultLabConfig();
    const tmv = config.initialInstances.find((instance) => instance.virusId === 'tmv')!;
    const horizontal = createLabWorld({
      ...config,
      initialInstances: [{ ...tmv, position: [-4, 0, 0] }],
    });
    const vertical = createLabWorld({
      ...config,
      initialInstances: [
        {
          ...tmv,
          position: [-4, 0, 0],
          orientation: [0, 0, Math.SQRT1_2, Math.SQRT1_2],
        },
      ],
    });
    const horizontalBounds = bodyAabb(horizontal.bodies[0]!);
    const verticalBounds = bodyAabb(vertical.bodies[0]!);
    expect(horizontalBounds.max[0] - horizontalBounds.min[0]).toBeGreaterThan(
      horizontalBounds.max[1] - horizontalBounds.min[1],
    );
    expect(verticalBounds.max[1] - verticalBounds.min[1]).toBeGreaterThan(
      verticalBounds.max[0] - verticalBounds.min[0],
    );
  });

  it('records passage only after the entire body crosses the obstacle exit plane', () => {
    const base = createDefaultLabConfig();
    const ms2 = base.initialInstances.find((instance) => instance.virusId === 'ms2')!;
    const config: LabConfig = {
      ...base,
      durationSeconds: 60,
      environment: {
        ...base.environment,
        chamber: 'obstacle',
        flowPreset: 'linear',
        drive: 2,
        gapWidth: 4.2,
      },
      initialInstances: [{ ...ms2, position: [-4, 0, 0] }],
    };
    const session = new LabSession(config);
    session.play();
    for (let frame = 0; frame < 500; frame += 1) session.advance(1 / 60);
    const snapshot = session.getSnapshot();
    expect(snapshot.results[0]?.state).toBe('passed');
    expect(snapshot.results[0]?.passedAt).toBeGreaterThan(0);
    expect(snapshot.status).toBe('completed');
  });

  it('supports eight explicit instances without silently replacing a profile', () => {
    const session = new LabSession();
    expect(session.addSpecimen('hiv-1')).toBe(true);
    expect(session.addSpecimen('sars-cov-2')).toBe(true);
    expect(session.addSpecimen('vaccinia-mv')).toBe(true);
    expect(session.addSpecimen('m13')).toBe(true);
    const snapshot = session.getSnapshot();
    expect(snapshot.bodies).toHaveLength(8);
    expect(new Set(snapshot.bodies.map((body) => body.instanceId)).size).toBe(8);
    expect(
      snapshot.bodies.every((body) => body.physicsProfileId.includes(body.virusId)),
    ).toBe(true);
  });

  it('gives repeated specimens unique instance IDs', () => {
    const session = new LabSession();
    expect(session.addSpecimen('ms2')).toBe(true);
    expect(session.addSpecimen('ms2')).toBe(true);
    const ids = session.getSnapshot().bodies.map((body) => body.instanceId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('replays the same initial state, PRNG sequence, and tick commands', () => {
    const session = new LabSession();
    session.setEnvironment('brownianEnabled', true);
    session.play();
    for (let frame = 0; frame < 60; frame += 1) session.advance(1 / 60);
    session.pause();
    session.setEnvironment('viscosityRatio', 1.8);
    session.play();
    for (let frame = 0; frame < 60; frame += 1) session.advance(1 / 60);
    session.setEnvironment('drive', 1.25);
    const original = session.getSnapshot();
    session.restartCurrent();
    expect(session.replayLastRun()).toBe(true);
    for (let frame = 0; frame < 120; frame += 1) session.advance(1 / 60);
    const replay = session.getSnapshot();
    expect(replay.tick).toBe(original.tick);
    expect(replay.status).toBe('paused');
    expect(replay.replaying).toBe(false);
    expect(replay.config.environment.drive).toBe(original.config.environment.drive);
    original.bodies.forEach((body, index) => {
      body.position.forEach((value, axis) =>
        expect(replay.bodies[index]!.position[axis]).toBeCloseTo(value, 8),
      );
    });
    session.advance(1);
    expect(session.getSnapshot().tick).toBe(original.tick);
  });

  it('branches a changed replay as a deterministic run without replacing its source', () => {
    const session = new LabSession();
    session.setEnvironment('brownianEnabled', true);
    session.play();
    for (let frame = 0; frame < 90; frame += 1) session.advance(1 / 60);
    session.restartCurrent();
    expect(session.replayLastRun()).toBe(true);
    for (let frame = 0; frame < 15; frame += 1) session.advance(1 / 60);

    session.setEnvironment('drive', 1.3);
    const branch = session.getSnapshot();
    expect(branch.replaying).toBe(false);
    expect(branch.status).toBe('running');
    expect(branch.tick).toBe(0);
    expect(branch.config.environment.drive).toBe(1.3);

    session.pause();
    expect(session.replayLastRun()).toBe(true);
    expect(session.getSnapshot().config.environment.drive).toBe(0.8);
  });

  it('rejects corrupt and incompatible saved configs with a safe reason', () => {
    const storage = new MemoryStorage();
    const valid = createDefaultLabConfig();
    saveLabConfig(storage, valid);
    expect(loadLabConfigWithStatus(storage)).toEqual({
      config: valid,
      error: null,
    });

    storage.setItem('virus-sim:lab-config:v1', '{broken');
    const corrupt = loadLabConfigWithStatus(storage);
    expect(corrupt.config).toBeNull();
    expect(corrupt.error).toContain('JSON');
    expect(storage.length).toBe(0);

    storage.setItem(
      'virus-sim:lab-config:v1',
      JSON.stringify({ ...valid, engineVersion: 'virus-lab-v3.9' }),
    );
    const incompatible = loadLabConfigWithStatus(storage);
    expect(incompatible.config).toBeNull();
    expect(incompatible.error).toContain('물리 엔진');

    storage.setItem(
      'virus-sim:lab-config:v1',
      JSON.stringify({
        ...valid,
        initialInstances: valid.initialInstances.map((instance) => ({
          ...instance,
          position: [-4, 0, 0],
        })),
      }),
    );
    const overlapping = loadLabConfigWithStatus(storage);
    expect(overlapping.config).toBeNull();
    expect(overlapping.error).toContain('시작 배치');
  });
});

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();

  get length(): number {
    return this.values.size;
  }

  clear(): void {
    this.values.clear();
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

function distance(
  first: readonly [number, number, number],
  second: readonly [number, number, number],
): number {
  return Math.hypot(first[0] - second[0], first[1] - second[1], first[2] - second[2]);
}

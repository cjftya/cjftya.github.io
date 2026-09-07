import { describe, expect, it } from 'vitest';
import {
  DEFAULT_CONFIG,
  FIXED_DT,
  MODEL_RATES,
  WORLD,
} from '../../src/virus-sim/model/presets';
import type {
  Simulation,
  SimulationConfig,
  SimulationEvent,
  SimulationSnapshot,
} from '../../src/virus-sim/model/types';
import { createSimulation, isInsideBacterium } from '../../src/virus-sim/simulation';

function advance(simulation: Simulation, ticks: number): SimulationEvent[] {
  const events: SimulationEvent[] = [];
  for (let index = 0; index < ticks; index += 1) {
    simulation.step(FIXED_DT);
    events.push(...simulation.drainEvents());
    if (simulation.getSnapshot().status === 'completed') break;
  }
  return events;
}

function signature(
  snapshot: SimulationSnapshot,
  events: readonly SimulationEvent[],
): unknown {
  return {
    tick: snapshot.tick,
    bacterium: snapshot.bacterium,
    counts: snapshot.counts,
    phages: snapshot.phages,
    events,
  };
}

describe('Virus Sim calculation contracts', () => {
  it('reproduces the same world and event order for the same seed and tick count', () => {
    const first = createSimulation(DEFAULT_CONFIG, 41327);
    const second = createSimulation(DEFAULT_CONFIG, 41327);

    const firstEvents = advance(first, 900);
    const secondEvents = advance(second, 900);

    expect(signature(first.getSnapshot(), firstEvents)).toEqual(
      signature(second.getSnapshot(), secondEvents),
    );
  });

  it('depends on fixed ticks rather than a render schedule or playback speed', () => {
    const thirtyFpsSchedule = createSimulation(DEFAULT_CONFIG, 9981);
    const sixtyFpsSchedule = createSimulation(DEFAULT_CONFIG, 9981);

    for (let frame = 0; frame < 300; frame += 1) {
      thirtyFpsSchedule.step(FIXED_DT);
      thirtyFpsSchedule.step(FIXED_DT);
    }
    for (let frame = 0; frame < 600; frame += 1) sixtyFpsSchedule.step(FIXED_DT);

    expect(thirtyFpsSchedule.getSnapshot()).toEqual(sixtyFpsSchedule.getSnapshot());
    expect(() => sixtyFpsSchedule.step(FIXED_DT * 2)).toThrow(/fixed dt/);
  });

  it('does not advance while paused and reset clears the previous world', () => {
    const simulation = createSimulation(DEFAULT_CONFIG, 29);
    advance(simulation, 120);
    const beforePause = simulation.getSnapshot();

    simulation.setStatus('paused');
    advance(simulation, 40);
    expect(simulation.getSnapshot().tick).toBe(beforePause.tick);

    simulation.reset({ ...DEFAULT_CONFIG, initialPhageCount: 7 }, 91);
    const reset = simulation.getSnapshot();
    expect(reset.tick).toBe(0);
    expect(reset.seed).toBe(91);
    expect(reset.phages).toHaveLength(7);
    expect(reset.counts.contacts).toBe(0);
    expect(reset.bacterium.phase).toBe('susceptible');
    expect(simulation.drainEvents()).toEqual([]);
  });

  it('allows contact but never attachment or production for a recognition mismatch', () => {
    const config: SimulationConfig = { ...DEFAULT_CONFIG, recognition: 'mismatch' };
    const simulation = createSimulation(config, 82);
    const events = advance(simulation, 1_200);
    const snapshot = simulation.getSnapshot();

    expect(snapshot.counts.contacts).toBeGreaterThan(0);
    expect(events.some((event) => event.type === 'contact-rejected')).toBe(true);
    expect(events.some((event) => event.type === 'delivery-started')).toBe(false);
    expect(snapshot.bacterium.phase).toBe('susceptible');
    expect(snapshot.bacterium.completedPhages).toBe(0);
  });

  it('moves through one host-owned infection cycle and releases only completed particles', () => {
    const simulation = createSimulation(DEFAULT_CONFIG, 41327);
    const events = advance(simulation, 1_500);
    const snapshot = simulation.getSnapshot();

    expect(snapshot.status).toBe('completed');
    expect(snapshot.bacterium.phase).toBe('lysed');
    expect(snapshot.bacterium.infectionOwnerId).not.toBeNull();
    expect(events.filter((event) => event.type === 'delivery-started')).toHaveLength(1);
    expect(events.filter((event) => event.type === 'lysis-started')).toHaveLength(1);
    expect(events.filter((event) => event.type === 'released')).toHaveLength(1);
    expect(snapshot.bacterium.releasedPhages).toBe(snapshot.bacterium.completedPhages);
    expect(snapshot.bacterium.completedPhages).toBeGreaterThan(0);
    expect(snapshot.bacterium.completedPhages).toBeLessThanOrEqual(
      MODEL_RATES.maxCompletedPhages,
    );
    expect(snapshot.phages.filter((phage) => phage.phase === 'spent')).toHaveLength(1);
  });

  it('supports the internal blocked branch without starting production', () => {
    const simulation = createSimulation(
      { ...DEFAULT_CONFIG, defenseBlocksInfection: true },
      41327,
    );
    const events = advance(simulation, 700);
    const snapshot = simulation.getSnapshot();

    expect(snapshot.status).toBe('completed');
    expect(snapshot.bacterium.phase).toBe('blocked');
    expect(events.some((event) => event.type === 'delivery-completed')).toBe(true);
    expect(events.some((event) => event.type === 'production-started')).toBe(false);
    expect(snapshot.bacterium.completedPhages).toBe(0);
  });

  it('keeps attachment reversible before delivery', () => {
    let detachedEvent: SimulationEvent | undefined;
    for (let seed = 1; seed <= 80 && !detachedEvent; seed += 1) {
      const simulation = createSimulation(DEFAULT_CONFIG, seed);
      detachedEvent = advance(simulation, 500).find(
        (event) => event.type === 'detached',
      );
    }

    expect(detachedEvent?.type).toBe('detached');
  });

  it('never creates negative resources or free particles inside the host', () => {
    for (const seed of [3, 17, 41327, 999_991]) {
      const simulation = createSimulation(
        { ...DEFAULT_CONFIG, initialPhageCount: 64 },
        seed,
      );
      for (let index = 0; index < 1_500; index += 1) {
        simulation.step(FIXED_DT);
        const snapshot = simulation.getSnapshot();
        expect(snapshot.bacterium.remainingResource).toBeGreaterThanOrEqual(0);
        expect(snapshot.bacterium.internalGenomes).toBeGreaterThanOrEqual(0);
        expect(snapshot.bacterium.componentBundles).toBeGreaterThanOrEqual(0);
        expect(snapshot.bacterium.completedPhages).toBeGreaterThanOrEqual(0);
        expect(
          snapshot.phages
            .filter((phage) => phage.phase === 'free')
            .some((phage) =>
              isInsideBacterium(phage.position, WORLD.phageCollisionRadius - 1e-7),
            ),
        ).toBe(false);
        if (snapshot.status === 'completed') break;
      }
    }
  });

  it('matches the configured 3D Brownian displacement scale within sampling tolerance', () => {
    let squaredDisplacement = 0;
    let samples = 0;
    for (let seed = 1; seed <= 80; seed += 1) {
      const simulation = createSimulation(
        {
          ...DEFAULT_CONFIG,
          initialPhageCount: 64,
          placement: 'random',
          recognition: 'mismatch',
        },
        seed,
      );
      const initial = simulation.getSnapshot();
      simulation.step(FIXED_DT);
      const next = simulation.getSnapshot();
      for (let index = 0; index < next.phages.length; index += 1) {
        const before = initial.phages[index];
        const after = next.phages[index];
        if (!before || !after || after.phase !== 'free') continue;
        const dx = after.position.x - before.position.x;
        const dy = after.position.y - before.position.y;
        const dz = after.position.z - before.position.z;
        squaredDisplacement += dx * dx + dy * dy + dz * dz;
        samples += 1;
      }
    }

    const measured = squaredDisplacement / samples;
    const expected = 6 * MODEL_RATES.diffusion * FIXED_DT;
    expect(samples).toBeGreaterThan(4_500);
    expect(measured).toBeGreaterThan(expected * 0.78);
    expect(measured).toBeLessThan(expected * 1.18);
  });
});

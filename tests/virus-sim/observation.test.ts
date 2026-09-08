import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  CONCEPT_OBSERVATION_PRESETS,
  OBSERVATION_PRESETS,
} from '../../src/virus-sim/model/observationPresets';
import { DEFAULT_CONFIG } from '../../src/virus-sim/model/presets';
import {
  STRUCTURE_SOURCES,
  getStructureSource,
} from '../../src/virus-sim/model/structureSources';
import { VIRUS_CATALOG } from '../../src/virus-sim/model/virusCatalog';
import {
  evaluatePhageDelivery,
  evaluateStructureTour,
} from '../../src/virus-sim/observation/demoTimeline';
import { ObservationController } from '../../src/virus-sim/observation/ObservationController';
import {
  DEFAULT_MOTION_OPTIONS,
  OBSERVATION_FIXED_DT,
  createObservationMotion,
  freezeObservationMotion,
  stepObservationMotion,
  switchObservationMotion,
} from '../../src/virus-sim/observation/motion/index';
import {
  MAX_SMOOTH_ANGULAR_SPEED,
  evaluateSmoothAngularVelocity,
  evaluateSmoothPosition,
} from '../../src/virus-sim/observation/motion/smoothMotion';
import { calculateExplodedPosition } from '../../src/virus-sim/observation/transforms';
import { createObservationModel } from '../../src/virus-sim/rendering/models/createObservationModel';
import { createSimulation } from '../../src/virus-sim/simulation';
import { renderAppLayout } from '../../src/virus-sim/ui/layout';

describe('Virus Sim observation contracts', () => {
  it('reproduces smooth translation and rotation for the same seed and tick count', () => {
    let first = createObservationMotion(730_421);
    let second = createObservationMotion(730_421);
    for (let tick = 0; tick < 1_200; tick += 1) {
      first = stepObservationMotion(first, DEFAULT_MOTION_OPTIONS);
      second = stepObservationMotion(second, DEFAULT_MOTION_OPTIONS);
    }
    expect(first).toEqual(second);
    expect(first.mode).toBe('smooth');
  });

  it('depends on fixed ticks rather than 30, 60, or 120fps render schedules', () => {
    let thirtyFps = createObservationMotion(81_911);
    let sixtyFps = createObservationMotion(81_911);
    let oneTwentyFps = createObservationMotion(81_911);
    for (let frame = 0; frame < 300; frame += 1) {
      thirtyFps = stepObservationMotion(thirtyFps, DEFAULT_MOTION_OPTIONS);
      thirtyFps = stepObservationMotion(thirtyFps, DEFAULT_MOTION_OPTIONS);
    }
    for (let frame = 0; frame < 600; frame += 1) {
      sixtyFps = stepObservationMotion(sixtyFps, DEFAULT_MOTION_OPTIONS);
    }
    for (let frame = 0; frame < 1_200; frame += 1) {
      if (frame % 2 === 1) {
        oneTwentyFps = stepObservationMotion(oneTwentyFps, DEFAULT_MOTION_OPTIONS);
      }
    }
    expect(thirtyFps).toEqual(sixtyFps);
    expect(sixtyFps).toEqual(oneTwentyFps);
    expect(() =>
      stepObservationMotion(sixtyFps, DEFAULT_MOTION_OPTIONS, OBSERVATION_FIXED_DT * 2),
    ).toThrow(/fixed dt/);
  });

  it('keeps spline position and angular velocity continuous at segment boundaries', () => {
    const epsilon = 0.0001;
    for (const boundary of [4, 8, 12]) {
      const before = evaluateSmoothPosition(771, boundary - epsilon, 0.42);
      const at = evaluateSmoothPosition(771, boundary, 0.42);
      const after = evaluateSmoothPosition(771, boundary + epsilon, 0.42);
      const leftVelocity = difference(at, before, epsilon);
      const rightVelocity = difference(after, at, epsilon);
      expect(distance(leftVelocity, rightVelocity)).toBeLessThan(0.001);

      const angularBefore = evaluateSmoothAngularVelocity(991, boundary - epsilon);
      const angularAfter = evaluateSmoothAngularVelocity(991, boundary + epsilon);
      expect(distance(angularBefore, angularAfter)).toBeLessThan(0.001);
    }
  });

  it('keeps smooth angular velocity finite and below its documented cap', () => {
    for (let sample = 0; sample < 1_000; sample += 1) {
      const velocity = evaluateSmoothAngularVelocity(83_119, sample / 30);
      const speed = Math.hypot(velocity.x, velocity.y, velocity.z);
      expect(Number.isFinite(speed)).toBe(true);
      expect(speed).toBeLessThanOrEqual(MAX_SMOOTH_ANGULAR_SPEED + 1e-12);
    }
  });

  it('preserves the rendered pose while pausing or changing motion mode', () => {
    let motion = createObservationMotion(142);
    for (let tick = 0; tick < 37; tick += 1) {
      motion = stepObservationMotion(motion, DEFAULT_MOTION_OPTIONS);
    }
    const frozen = freezeObservationMotion(motion, 0.37);
    expect(frozen.position).toEqual(frozen.previousPosition);
    expect(frozen.quaternion).toEqual(frozen.previousQuaternion);
    const brownian = switchObservationMotion(frozen, 'brownian');
    expect(brownian.position).toEqual(frozen.position);
    expect(brownian.quaternion).toEqual(frozen.quaternion);
    expect(brownian.mode).toBe('brownian');
  });

  it('retains the legacy Brownian option with disabled axes and reflected bounds', () => {
    let motion = createObservationMotion(993, 'brownian');
    const options = {
      ...DEFAULT_MOTION_OPTIONS,
      translationEnabled: false,
      rotationalDiffusion: 0.15,
      boundary: 0.12,
    };
    for (let tick = 0; tick < 5_000; tick += 1) {
      motion = stepObservationMotion(motion, options);
    }
    expect(motion.position).toEqual({ x: 0, y: 0, z: 0 });
    expect(
      Math.hypot(
        motion.quaternion.x,
        motion.quaternion.y,
        motion.quaternion.z,
        motion.quaternion.w,
      ),
    ).toBeCloseTo(1, 10);

    let bounded = createObservationMotion(994, 'brownian');
    for (let tick = 0; tick < 5_000; tick += 1) {
      bounded = stepObservationMotion(bounded, {
        ...DEFAULT_MOTION_OPTIONS,
        diffusion: 1.4,
        boundary: 0.12,
      });
      expect(Math.abs(bounded.position.x)).toBeLessThanOrEqual(0.12);
      expect(Math.abs(bounded.position.y)).toBeLessThanOrEqual(0.12);
      expect(Math.abs(bounded.position.z)).toBeLessThanOrEqual(0.12);
    }
  });

  it('freezes disabled motion clocks so re-enabling cannot jump to a hidden pose', () => {
    const controller = new ObservationController(false, 88);
    for (let tick = 0; tick < 30; tick += 1) {
      controller.step(OBSERVATION_FIXED_DT);
    }
    controller.setTranslationEnabled(false);
    const disabled = controller.getSnapshot();
    for (let tick = 0; tick < 180; tick += 1) {
      controller.step(OBSERVATION_FIXED_DT);
    }
    const held = controller.getSnapshot();
    expect(held.motion.position).toEqual(disabled.motion.position);
    expect(held.motion.translationTick).toBe(disabled.motion.translationTick);
    expect(held.motion.rotationTick).toBeGreaterThan(disabled.motion.rotationTick);
    controller.setTranslationEnabled(true);
    controller.step(OBSERVATION_FIXED_DT);
    expect(
      distance(controller.getSnapshot().motion.position, held.motion.position),
    ).toBeLessThan(0.02);
  });

  it('pauses motion and resets species inspection state without resetting speed', () => {
    const controller = new ObservationController(false, 88);
    controller.setSpeed(0.5);
    controller.step(OBSERVATION_FIXED_DT);
    controller.setRunning(false, 0.4);
    const paused = controller.getSnapshot();
    controller.step(OBSERVATION_FIXED_DT);
    expect(controller.getSnapshot()).toEqual(paused);

    controller.setView('exploded');
    controller.setGenomeVisible(true);
    controller.selectPart('genome');
    controller.setPreset('hsv1');
    const changed = controller.getSnapshot();
    expect(changed.view).toBe('surface');
    expect(changed.explosion).toBe(0);
    expect(changed.genomeVisible).toBe(false);
    expect(changed.selectedPartId).toBeNull();
    expect(changed.speed).toBe(0.5);
    expect(changed.running).toBe(false);
  });

  it('honors reduced motion with a static default pose', () => {
    const controller = new ObservationController(true, 91);
    expect(controller.getSnapshot().running).toBe(false);
    expect(controller.getSnapshot().motion.mode).toBe('static');
  });

  it('evaluates both timelines purely and supports reverse scrubbing', () => {
    for (const progress of [-1, 0, 0.17, 0.51, 0.84, 1, 2]) {
      expect(evaluateStructureTour(progress)).toEqual(evaluateStructureTour(progress));
      expect(evaluatePhageDelivery(progress)).toEqual(evaluatePhageDelivery(progress));
    }
    const forward = evaluatePhageDelivery(0.67);
    evaluatePhageDelivery(0.91);
    expect(evaluatePhageDelivery(0.67)).toEqual(forward);
  });

  it('keeps guided tours exclusive and limits delivery playback to T4', () => {
    const controller = new ObservationController(false, 73);
    controller.startDemo('structure-tour');
    controller.step(OBSERVATION_FIXED_DT);
    expect(controller.getSnapshot().demo.kind).toBe('structure-tour');
    controller.setView('transparent');
    expect(controller.getSnapshot().demo.kind).toBe('none');

    controller.setPreset('ms2');
    controller.startDemo('phage-delivery');
    expect(controller.getSnapshot().demo.kind).toBe('none');

    controller.setPreset('t4');
    controller.startDemo('phage-delivery');
    for (let tick = 0; tick < 13 * 60; tick += 1) {
      controller.step(OBSERVATION_FIXED_DT);
    }
    const completed = controller.getSnapshot();
    expect(completed.demo.progress).toBe(1);
    expect(completed.demo.playing).toBe(false);
    expect(completed.running).toBe(false);
  });

  it('returns exploded parts exactly to their original transform', () => {
    const origin = { x: 1.25, y: -0.4, z: 0.72 };
    const direction = { x: 0.6, y: 0, z: -0.8 };
    expect(calculateExplodedPosition(origin, direction, 1, 2.5)).toEqual({
      x: 2.75,
      y: -0.4,
      z: -1.28,
    });
    expect(calculateExplodedPosition(origin, direction, 0, 2.5)).toEqual(origin);
  });

  it('does not mutate a paused infection while catalog controls change', () => {
    const infection = createSimulation(DEFAULT_CONFIG, 41327);
    infection.step(1 / 60);
    infection.drainEvents();
    infection.setStatus('paused');
    const before = infection.getSnapshot();

    const observation = new ObservationController(false, 21);
    observation.setPreset('influenza-a');
    observation.setView('section');
    observation.setSectionOffset(0.4);
    observation.setGenomeVisible(true);
    observation.setMotionMode('brownian');
    observation.step(OBSERVATION_FIXED_DT);

    expect(infection.getSnapshot()).toEqual(before);
    expect(infection.drainEvents()).toEqual([]);
  });

  it('registers exactly 12 sourced virus species with valid contracts', () => {
    expect(VIRUS_CATALOG).toHaveLength(12);
    expect(new Set(VIRUS_CATALOG.map((virus) => virus.id)).size).toBe(12);
    expect(new Set(STRUCTURE_SOURCES.map((source) => source.id)).size).toBe(
      STRUCTURE_SOURCES.length,
    );
    for (const virus of VIRUS_CATALOG) {
      expect(virus.representation).toBe('source-informed-procedural');
      expect(virus.parts.length).toBeGreaterThanOrEqual(3);
      expect(virus.layers.length).toBeGreaterThanOrEqual(2);
      expect(virus.simplifications.length).toBeGreaterThan(0);
      expect(virus.sourceIds.length).toBeGreaterThan(0);
      for (const sourceId of virus.sourceIds) {
        expect(getStructureSource(sourceId).url).toMatch(/^https:\/\//);
      }
    }
  });

  it('renders one catalog and preserves the three existing app modes', () => {
    const root = { innerHTML: '' } as HTMLElement;
    renderAppLayout(root);
    const ids = [...root.innerHTML.matchAll(/ id="([^"]+)"/g)].map((match) => match[1]);
    expect(new Set(ids).size).toBe(ids.length);
    expect(
      [...root.innerHTML.matchAll(/data-mode-button="([^"]+)"/g)].map(
        (match) => match[1],
      ),
    ).toEqual(['observatory', 'structure', 'infection']);
    expect(
      [...root.innerHTML.matchAll(/data-observation-preset="([^"]+)"/g)].map(
        (match) => match[1],
      ),
    ).toEqual(VIRUS_CATALOG.map((virus) => virus.id));
    expect(root.innerHTML).toContain('전체 12종');
  });

  it('builds all 12 species and four legacy concepts within the render budget', () => {
    const definitions = [...VIRUS_CATALOG, ...CONCEPT_OBSERVATION_PRESETS];
    expect(OBSERVATION_PRESETS).toEqual(CONCEPT_OBSERVATION_PRESETS);
    for (const definition of definitions) {
      const model = createObservationModel(definition.id, 'high');
      for (const partId of definition.parts) {
        expect(
          model.parts.get(partId)?.length ?? 0,
          `${definition.id} is missing part ${partId}`,
        ).toBeGreaterThan(0);
      }
      for (const layer of definition.layers) {
        expect(
          model.layers.get(layer.id)?.length ?? 0,
          `${definition.id} is missing layer ${layer.id}`,
        ).toBeGreaterThan(0);
      }
      expect(Boolean(model.delivery)).toBe(definition.supportsDeliveryDemo);

      let calls = 0;
      let triangles = 0;
      model.root.traverse((object) => {
        if (!isWorldVisible(object) || !('geometry' in object)) return;
        const renderable = object as THREE.Mesh | THREE.Line;
        calls += Array.isArray(renderable.material) ? renderable.material.length : 1;
        if (!(object instanceof THREE.Mesh)) return;
        const geometry = object.geometry;
        const baseTriangles =
          (geometry.index?.count ?? geometry.getAttribute('position')?.count ?? 0) / 3;
        triangles +=
          baseTriangles * (object instanceof THREE.InstancedMesh ? object.count : 1);
      });
      expect(calls, `${definition.id} draw objects`).toBeLessThanOrEqual(150);
      expect(triangles, `${definition.id} triangles`).toBeLessThanOrEqual(250_000);
    }
  });
});

function difference(
  left: { x: number; y: number; z: number },
  right: { x: number; y: number; z: number },
  divisor: number,
): { x: number; y: number; z: number } {
  return {
    x: (left.x - right.x) / divisor,
    y: (left.y - right.y) / divisor,
    z: (left.z - right.z) / divisor,
  };
}

function distance(
  left: { x: number; y: number; z: number },
  right: { x: number; y: number; z: number },
): number {
  return Math.hypot(left.x - right.x, left.y - right.y, left.z - right.z);
}

function isWorldVisible(object: THREE.Object3D): boolean {
  let candidate: THREE.Object3D | null = object;
  while (candidate) {
    if (!candidate.visible) return false;
    candidate = candidate.parent;
  }
  return true;
}

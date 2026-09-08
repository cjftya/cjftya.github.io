import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { OBSERVATION_PRESETS } from '../../src/virus-sim/model/observationPresets';
import { DEFAULT_CONFIG } from '../../src/virus-sim/model/presets';
import {
  evaluatePhageDelivery,
  evaluateStructureTour,
} from '../../src/virus-sim/observation/demoTimeline';
import { ObservationController } from '../../src/virus-sim/observation/ObservationController';
import {
  DEFAULT_MOTION_OPTIONS,
  OBSERVATION_FIXED_DT,
  createObservationMotion,
  stepObservationMotion,
} from '../../src/virus-sim/observation/motion';
import { calculateExplodedPosition } from '../../src/virus-sim/observation/transforms';
import { createSimulation } from '../../src/virus-sim/simulation';
import { renderAppLayout } from '../../src/virus-sim/ui/layout';
import { createObservationModel } from '../../src/virus-sim/rendering/models/createObservationModel';

describe('Virus Sim observation contracts', () => {
  it('reproduces translation and rotation for the same seed and tick count', () => {
    let first = createObservationMotion(730_421);
    let second = createObservationMotion(730_421);
    for (let tick = 0; tick < 1_200; tick += 1) {
      first = stepObservationMotion(first, DEFAULT_MOTION_OPTIONS);
      second = stepObservationMotion(second, DEFAULT_MOTION_OPTIONS);
    }
    expect(first).toEqual(second);
  });

  it('depends on fixed ticks rather than a 30fps or 60fps render schedule', () => {
    let thirtyFps = createObservationMotion(81_911);
    let sixtyFps = createObservationMotion(81_911);
    for (let frame = 0; frame < 300; frame += 1) {
      thirtyFps = stepObservationMotion(thirtyFps, DEFAULT_MOTION_OPTIONS);
      thirtyFps = stepObservationMotion(thirtyFps, DEFAULT_MOTION_OPTIONS);
    }
    for (let frame = 0; frame < 600; frame += 1) {
      sixtyFps = stepObservationMotion(sixtyFps, DEFAULT_MOTION_OPTIONS);
    }
    expect(thirtyFps).toEqual(sixtyFps);
    expect(() =>
      stepObservationMotion(sixtyFps, DEFAULT_MOTION_OPTIONS, OBSERVATION_FIXED_DT * 2),
    ).toThrow(/fixed dt/);
  });

  it('holds disabled axes, normalizes rotation, and reflects at the observation bound', () => {
    let motion = createObservationMotion(993);
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

    let bounded = createObservationMotion(994);
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

  it('pauses motion and resets preset-specific inspection state without resetting speed', () => {
    const controller = new ObservationController(false, 88);
    controller.setSpeed(0.5);
    controller.step(OBSERVATION_FIXED_DT);
    controller.setRunning(false);
    const paused = controller.getSnapshot();
    controller.step(OBSERVATION_FIXED_DT);
    expect(controller.getSnapshot()).toEqual(paused);

    controller.setView('exploded');
    controller.setGenomeVisible(true);
    controller.selectPart('genome');
    controller.setPreset('enveloped');
    const changed = controller.getSnapshot();
    expect(changed.view).toBe('surface');
    expect(changed.explosion).toBe(0);
    expect(changed.genomeVisible).toBe(false);
    expect(changed.selectedPartId).toBeNull();
    expect(changed.speed).toBe(0.5);
  });

  it('evaluates both timelines purely and supports reverse scrubbing', () => {
    for (const progress of [-1, 0, 0.17, 0.51, 0.84, 1, 2]) {
      expect(evaluateStructureTour(progress)).toEqual(evaluateStructureTour(progress));
      expect(evaluatePhageDelivery(progress)).toEqual(evaluatePhageDelivery(progress));
    }
    const forward = evaluatePhageDelivery(0.67);
    evaluatePhageDelivery(0.91);
    const reverse = evaluatePhageDelivery(0.67);
    expect(reverse).toEqual(forward);
    expect(forward.sheathContraction).toBeGreaterThanOrEqual(0);
    expect(forward.sheathContraction).toBeLessThanOrEqual(1);
    expect(forward.genomeTransfer).toBeGreaterThanOrEqual(0);
    expect(forward.genomeTransfer).toBeLessThanOrEqual(1);
  });

  it('keeps guided tours exclusive and limits delivery playback to the phage', () => {
    const controller = new ObservationController(false, 73);
    controller.startDemo('structure-tour');
    controller.step(OBSERVATION_FIXED_DT);
    expect(controller.getSnapshot().demo.kind).toBe('structure-tour');
    controller.setView('transparent');
    expect(controller.getSnapshot().demo.kind).toBe('none');

    controller.setPreset('icosahedral');
    controller.startDemo('phage-delivery');
    expect(controller.getSnapshot().demo.kind).toBe('none');

    controller.setPreset('tailed-phage');
    controller.startDemo('phage-delivery');
    for (let tick = 0; tick < 13 * 60; tick += 1) {
      controller.step(OBSERVATION_FIXED_DT);
    }
    const completed = controller.getSnapshot();
    expect(completed.demo.progress).toBe(1);
    expect(completed.demo.playing).toBe(false);
    expect(completed.running).toBe(false);
  });

  it('returns exploded parts exactly to their original transform without accumulation', () => {
    const origin = { x: 1.25, y: -0.4, z: 0.72 };
    const direction = { x: 0.6, y: 0, z: -0.8 };
    const exploded = calculateExplodedPosition(origin, direction, 1, 2.5);
    expect(exploded).toEqual({ x: 2.75, y: -0.4, z: -1.28 });
    expect(calculateExplodedPosition(origin, direction, 0, 2.5)).toEqual(origin);
    expect(origin).toEqual({ x: 1.25, y: -0.4, z: 0.72 });
  });

  it('does not mutate a paused infection while observation controls change', () => {
    const infection = createSimulation(DEFAULT_CONFIG, 41327);
    infection.step(1 / 60);
    infection.drainEvents();
    infection.setStatus('paused');
    const before = infection.getSnapshot();

    const observation = new ObservationController(false, 21);
    observation.setPreset('filamentous');
    observation.setView('section');
    observation.setSectionOffset(0.4);
    observation.setGenomeVisible(true);
    observation.setSpeed(2);
    observation.step(OBSERVATION_FIXED_DT);

    expect(infection.getSnapshot()).toEqual(before);
    expect(infection.drainEvents()).toEqual([]);
  });

  it('renders one complete set of observatory controls with unique element ids', () => {
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
    ).toEqual(['tailed-phage', 'icosahedral', 'filamentous', 'enveloped']);
  });

  it('builds all four detailed models with declared parts inside the render budget', () => {
    for (const preset of OBSERVATION_PRESETS) {
      const model = createObservationModel(preset.id, 'high');
      for (const partId of preset.parts) {
        expect(model.parts.get(partId)?.length).toBeGreaterThan(0);
      }
      expect(Boolean(model.delivery)).toBe(preset.supportsDeliveryDemo);

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
      expect(calls).toBeLessThanOrEqual(150);
      expect(triangles).toBeLessThanOrEqual(250_000);
    }
  });
});

function isWorldVisible(object: THREE.Object3D): boolean {
  let candidate: THREE.Object3D | null = object;
  while (candidate) {
    if (!candidate.visible) return false;
    candidate = candidate.parent;
  }
  return true;
}

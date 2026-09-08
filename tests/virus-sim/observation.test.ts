import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  GEOMETRY_PROFILES,
  getGeometryProfile,
} from '../../src/virus-sim/catalog/geometryProfiles';
import {
  VERIFIED_VIRUS_COUNT,
  VIRUS_CATALOG,
  filterVirusCatalog,
  nextDiscovery,
} from '../../src/virus-sim/catalog/registry';
import {
  STRUCTURE_SOURCES,
  getStructureSource,
} from '../../src/virus-sim/catalog/sources';
import { ObservationController } from '../../src/virus-sim/observation/ObservationController';
import {
  DEFAULT_MOTION_OPTIONS,
  OBSERVATION_FIXED_DT,
  createObservationMotion,
  freezeObservationMotion,
  stepObservationMotion,
  switchObservationMotion,
} from '../../src/virus-sim/observation/motion';
import {
  MAX_ACTIVE_ANGULAR_SPEED,
  MAX_CALM_ANGULAR_SPEED,
  evaluateSmoothAngularVelocity,
  evaluateSmoothPosition,
} from '../../src/virus-sim/observation/motion/smoothMotion';
import { evaluateSpeciesTour } from '../../src/virus-sim/observation/tours';
import { calculateExplodedPosition } from '../../src/virus-sim/observation/transforms';
import { createObservationModel } from '../../src/virus-sim/rendering/models/createObservationModel';
import { renderAppLayout } from '../../src/virus-sim/ui/layout';
import {
  loadFavorites,
  loadFontScale,
  loadRecent,
  pushRecent,
  saveFavorites,
  saveFontScale,
} from '../../src/virus-sim/ui/preferences';

describe('Virus Sim v2.5 observation contracts', () => {
  it('reproduces active translation and rotation for the same seed and tick count', () => {
    let first = createObservationMotion(730_421);
    let second = createObservationMotion(730_421);
    for (let tick = 0; tick < 1_200; tick += 1) {
      first = stepObservationMotion(first, DEFAULT_MOTION_OPTIONS);
      second = stepObservationMotion(second, DEFAULT_MOTION_OPTIONS);
    }
    expect(first).toEqual(second);
    expect(first.mode).toBe('active');
    expect(first.version).toBe('observation-motion-v2.5');
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
      if (frame % 2 === 1)
        oneTwentyFps = stepObservationMotion(oneTwentyFps, DEFAULT_MOTION_OPTIONS);
    }
    expect(thirtyFps).toEqual(sixtyFps);
    expect(sixtyFps).toEqual(oneTwentyFps);
    expect(() =>
      stepObservationMotion(sixtyFps, DEFAULT_MOTION_OPTIONS, OBSERVATION_FIXED_DT * 2),
    ).toThrow(/fixed dt/);
  });

  it('keeps active and calm splines continuous at segment boundaries', () => {
    const epsilon = 0.0001;
    for (const [mode, interval] of [
      ['active', 3.2],
      ['calm', 4.4],
    ] as const) {
      for (const boundary of [interval, interval * 2, interval * 3]) {
        const before = evaluateSmoothPosition(771, boundary - epsilon, 0.42, mode);
        const at = evaluateSmoothPosition(771, boundary, 0.42, mode);
        const after = evaluateSmoothPosition(771, boundary + epsilon, 0.42, mode);
        expect(
          distance(difference(at, before, epsilon), difference(after, at, epsilon)),
        ).toBeLessThan(0.001);
        expect(
          distance(
            evaluateSmoothAngularVelocity(991, boundary - epsilon, mode),
            evaluateSmoothAngularVelocity(991, boundary + epsilon, mode),
          ),
        ).toBeLessThan(0.001);
      }
    }
  });

  it('keeps angular velocity finite and below each documented cap', () => {
    for (let sample = 0; sample < 1_000; sample += 1) {
      const active = evaluateSmoothAngularVelocity(83_119, sample / 30, 'active');
      const calm = evaluateSmoothAngularVelocity(83_119, sample / 30, 'calm');
      expect(Math.hypot(active.x, active.y, active.z)).toBeLessThanOrEqual(
        MAX_ACTIVE_ANGULAR_SPEED + 1e-12,
      );
      expect(Math.hypot(calm.x, calm.y, calm.z)).toBeLessThanOrEqual(
        MAX_CALM_ANGULAR_SPEED + 1e-12,
      );
    }
  });

  it('preserves the rendered pose while pausing or changing motion mode', () => {
    let motion = createObservationMotion(142);
    for (let tick = 0; tick < 37; tick += 1)
      motion = stepObservationMotion(motion, DEFAULT_MOTION_OPTIONS);
    const frozen = freezeObservationMotion(motion, 0.37);
    expect(frozen.position).toEqual(frozen.previousPosition);
    expect(frozen.quaternion).toEqual(frozen.previousQuaternion);
    for (const mode of ['calm', 'brownian', 'static', 'active'] as const) {
      const changed = switchObservationMotion(frozen, mode);
      expect(changed.position).toEqual(frozen.position);
      expect(changed.quaternion).toEqual(frozen.quaternion);
    }
  });

  it('retains bounded Brownian motion as an advanced option', () => {
    let motion = createObservationMotion(994, 'brownian');
    for (let tick = 0; tick < 3_000; tick += 1) {
      motion = stepObservationMotion(motion, {
        ...DEFAULT_MOTION_OPTIONS,
        diffusion: 1.4,
        boundary: 0.12,
      });
      expect(Math.abs(motion.position.x)).toBeLessThanOrEqual(0.12);
      expect(Math.abs(motion.position.y)).toBeLessThanOrEqual(0.12);
      expect(Math.abs(motion.position.z)).toBeLessThanOrEqual(0.12);
    }
  });

  it('freezes disabled clocks and honors reduced motion', () => {
    const controller = new ObservationController(false, 88);
    for (let tick = 0; tick < 30; tick += 1) controller.step(OBSERVATION_FIXED_DT);
    controller.setTranslationEnabled(false);
    const disabled = controller.getSnapshot();
    for (let tick = 0; tick < 180; tick += 1) controller.step(OBSERVATION_FIXED_DT);
    const held = controller.getSnapshot();
    expect(held.motion.position).toEqual(disabled.motion.position);
    expect(held.motion.translationPhase).toBe(disabled.motion.translationPhase);
    expect(held.motion.rotationPhase).toBeGreaterThan(disabled.motion.rotationPhase);
    const reduced = new ObservationController(true, 91).getSnapshot();
    expect(reduced.running).toBe(false);
    expect(reduced.motion.mode).toBe('static');
  });

  it('evaluates a species-specific tour purely and completes at 24 seconds', () => {
    for (const definition of VIRUS_CATALOG) {
      for (const progress of [-1, 0, 0.19, 0.34, 0.58, 0.79, 1, 2]) {
        expect(evaluateSpeciesTour(definition, progress)).toEqual(
          evaluateSpeciesTour(definition, progress),
        );
      }
      expect(evaluateSpeciesTour(definition, 0.14).focusPartId).toBe(
        definition.tourStops[0]?.partId,
      );
    }
    const controller = new ObservationController(false, 73);
    controller.startDemo('structure-tour');
    for (let tick = 0; tick < 24 * 60; tick += 1) controller.step(OBSERVATION_FIXED_DT);
    expect(controller.getSnapshot().demo).toEqual({
      kind: 'structure-tour',
      progress: 1,
      playing: false,
    });
    expect(controller.getSnapshot().running).toBe(false);
  });

  it('returns exploded parts exactly to their original transform', () => {
    const origin = { x: 1.25, y: -0.4, z: 0.72 };
    expect(
      calculateExplodedPosition(origin, { x: 0.6, y: 0, z: -0.8 }, 1, 2.5),
    ).toEqual({ x: 2.75, y: -0.4, z: -1.28 });
    expect(
      calculateExplodedPosition(origin, { x: 0.6, y: 0, z: -0.8 }, 0, 2.5),
    ).toEqual(origin);
  });

  it('registers 56 unique, sourced, reviewed species and every geometry profile', () => {
    expect(VIRUS_CATALOG).toHaveLength(56);
    expect(VERIFIED_VIRUS_COUNT).toBe(56);
    expect(new Set(VIRUS_CATALOG.map((virus) => virus.id)).size).toBe(56);
    expect(new Set(VIRUS_CATALOG.map((virus) => virus.identityKey)).size).toBe(56);
    expect(new Set(STRUCTURE_SOURCES.map((source) => source.id)).size).toBe(
      STRUCTURE_SOURCES.length,
    );
    const usedSourceIds = new Set(VIRUS_CATALOG.flatMap((virus) => virus.sourceIds));
    expect(STRUCTURE_SOURCES.map((source) => source.id).sort()).toEqual(
      [...usedSourceIds].sort(),
    );
    for (const virus of VIRUS_CATALOG) {
      expect(virus.evidenceStatus).toBe('verified');
      expect(virus.representation).toBe('source-informed-procedural');
      expect(virus.tourStops.length).toBeGreaterThanOrEqual(2);
      expect(virus.simplifications.length).toBeGreaterThan(0);
      expect(getGeometryProfile(virus.geometryProfileId)).toBeTruthy();
      for (const sourceId of virus.sourceIds) {
        expect(getStructureSource(sourceId)?.url, `${virus.id}:${sourceId}`).toMatch(
          /^https:\/\//,
        );
      }
    }
    expect(Object.keys(GEOMETRY_PROFILES)).toHaveLength(VIRUS_CATALOG.length);
  });

  it('searches Korean, English, aliases and collection IDs', () => {
    expect(
      filterVirusCatalog('Potato virus X', 'all').map((entry) => entry.id),
    ).toContain('pvx');
    expect(filterVirusCatalog('쌍둥이', 'all').map((entry) => entry.id)).toEqual(
      expect.arrayContaining(['maize-streak', 'tylcv']),
    );
    expect(
      filterVirusCatalog('', 'plant', new Set(['pvx', 't4'])).map((entry) => entry.id),
    ).toEqual(['pvx']);
    expect(nextDiscovery('t4', ['t4']).id).not.toBe('t4');
  });

  it('renders a single observation-room layout without legacy mode panels', () => {
    const root = { innerHTML: '' } as HTMLElement;
    renderAppLayout(root);
    const ids = [...root.innerHTML.matchAll(/ id="([^"]+)"/g)].map((match) => match[1]);
    expect(new Set(ids).size).toBe(ids.length);
    expect(
      [...root.innerHTML.matchAll(/data-observation-preset="([^"]+)"/g)].map(
        (match) => match[1],
      ),
    ).toEqual(VIRUS_CATALOG.map((virus) => virus.id));
    expect(root.innerHTML).toContain('검증된 실제 바이러스 56종');
    expect(root.innerHTML).not.toContain('data-mode-button');
    expect(root.innerHTML).not.toContain('start-phage-demo');
    expect(root.innerHTML).not.toContain('data-infection-only');
  });

  it('sanitizes and persists favorites, recents and font scale', () => {
    const storage = memoryStorage();
    storage.setItem('virus-sim-v2.5-favorites', JSON.stringify(['pvx', 'missing', 3]));
    storage.setItem(
      'virus-sim-v2.5-recent',
      JSON.stringify(['t4', 'pvx', 't4', 'missing']),
    );
    expect([...loadFavorites(storage)]).toEqual(['pvx']);
    expect(loadRecent(storage)).toEqual(['t4', 'pvx']);
    expect(pushRecent(storage, loadRecent(storage), 'pvx')).toEqual(['pvx', 't4']);
    saveFavorites(storage, new Set(['pvx', 'missing']));
    expect(JSON.parse(storage.getItem('virus-sim-v2.5-favorites') ?? '[]')).toEqual([
      'pvx',
    ]);
    expect(loadFontScale(storage)).toBe('100');
    saveFontScale(storage, '130');
    expect(loadFontScale(storage)).toBe('130');
  });

  it('builds all 56 species with complete parts, layers and bounded render cost', () => {
    for (const definition of VIRUS_CATALOG) {
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
      if (definition.modelBuilder === 'generic-filament')
        expect(model.flexibleSegments.length).toBeGreaterThan(2);
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

function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => [...data.keys()][index] ?? null,
    removeItem: (key) => data.delete(key),
    setItem: (key, value) => data.set(key, value),
  };
}

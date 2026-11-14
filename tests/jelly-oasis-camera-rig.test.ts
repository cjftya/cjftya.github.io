import { describe, expect, it, vi } from 'vitest';
import { BoxGeometry, Mesh, PerspectiveCamera, Vector3 } from 'three';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createOasisCameraRig } from '../src/jelly-oasis/app/createOasisCameraRig';
import { readStartupOptions } from '../src/jelly-oasis/startupOptions';
import { sampleTerrainHeight } from '../src/jelly-oasis/terrain/createTerrain';

function fixture() {
  const camera = new PerspectiveCamera(42, 1, 0.1, 1800);
  // Exercise Three.js positions/framing without a DOM or a WebGL renderer.
  const controls = {
    target: new Vector3(),
    update: vi.fn(),
  } as unknown as OrbitControls;
  const config = readStartupOptions('').config;
  const invalidate = vi.fn();
  const terrain = new Mesh(new BoxGeometry(224, 1, 224));
  const rig = createOasisCameraRig({
    camera,
    controls,
    terrain,
    edge: terrain,
    config,
    landmark: () => null,
    invalidate,
  });
  return { camera, controls, config, invalidate, rig };
}

describe('Oasis camera ownership', () => {
  it('keeps a manually moved view across resize and late landmark load, then resets on request', () => {
    const { rig, camera, controls } = fixture();
    rig.reset();
    const initial = camera.position.clone();
    rig.releaseFraming();
    camera.position.set(200, 100, 150);
    rig.reframe();
    rig.reframeAfterLoad();
    expect(camera.position.toArray()).toEqual([200, 100, 150]);
    rig.reset();
    expect(camera.position).toEqual(initial);
    expect(controls.minDistance).toBe(1.5);
  });

  it('follows panned terrain and lifts eye/pivot together without changing view direction', () => {
    const { rig, camera, controls, config } = fixture();
    controls.target.set(0, 10, 0);
    camera.position.set(0, -100, 10);
    controls.update = () => {
      controls.target.x += 5;
      camera.position.x += 5;
      return true;
    };
    const direction = camera.position.clone().sub(controls.target);
    expect(rig.update()).toBe(true);
    expect(
      camera.position.clone().sub(controls.target).distanceTo(direction),
    ).toBeLessThan(1e-10);
    expect(camera.position.y).toBeCloseTo(sampleTerrainHeight(5, 10, config) + 6);
  });

  it('clamps ordinary panning but keeps the QA camera unbounded and uses ground eye clearance', () => {
    const { rig, camera, controls, config } = fixture();
    camera.position.set(500, 200, 0);
    controls.target.set(500, 100, 0);
    rig.update();
    expect(controls.target.x).toBeCloseTo(config.size * 0.36);
    rig.review([500, 200, 0], [500, 100, 0]);
    rig.update();
    expect(controls.target.x).toBe(500);
    rig.review([0, -100, 0], [0, -90, 0]);
    rig.update();
    expect(camera.position.y).toBeCloseTo(sampleTerrainHeight(0, 0, config) + 1.7);
  });

  it('keeps the sky pivot after manual interaction and only reframes after reset', () => {
    const { rig, camera, controls, invalidate } = fixture();
    camera.position.set(0, 100, 0);
    rig.sky(new Vector3(0, 1, 0));
    expect(controls.target.toArray()).toEqual([0, 180, 0]);
    rig.releaseFraming();
    rig.reframe();
    rig.update();
    expect(controls.target.toArray()).toEqual([0, 180, 0]);
    expect(invalidate).toHaveBeenCalled();
  });
});

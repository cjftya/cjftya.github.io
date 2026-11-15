import { Mesh, PerspectiveCamera, Vector3 } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DistantProbe } from '../src/core/scene/DistantProbe';
import { CometPass } from '../src/core/scene/CometPass';
import { MeteorField } from '../src/core/scene/MeteorField';

function setup(reduced = false, aspect = 1.8): PerspectiveCamera {
  vi.stubGlobal('window', {
    matchMedia: (q: string) => ({ matches: reduced && q.includes('reduced-motion') }),
  });
  const camera = new PerspectiveCamera(48, aspect, 0.1, 180);
  camera.position.set(0, 7, 13);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld(true);
  return camera;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('distant space travelers', () => {
  it('keeps the probe small and distant while zooming, with a bounded geometry budget', () => {
    const camera = setup();
    const probe = new DistantProbe();
    probe.update(0, camera);
    expect(probe.object.position.distanceTo(camera.position)).toBeCloseTo(85);
    const screen = probe.object.position.clone().project(camera);
    expect(screen.x).toBeCloseTo(-0.7);
    expect(screen.y).toBeCloseTo(0.48);
    expect(Math.abs(screen.z)).toBeLessThan(1);
    const offset = probe.object.position.clone().sub(camera.position);
    camera.position.multiplyScalar(4);
    probe.update(1, camera);
    expect(probe.object.position.clone().sub(camera.position)).toEqual(offset);
    let triangles = 0;
    let meshes = 0;
    probe.object.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      meshes += 1;
      triangles +=
        (object.geometry.index?.count ??
          object.geometry.getAttribute('position').count) / 3;
    });
    expect(meshes).toBe(2);
    expect(triangles).toBeLessThan(200);
    probe.dispose();
  });

  it.each([0.46, 2.1])(
    'shows one slow comet with a reused, fading tail at aspect %s',
    (aspect) => {
      const camera = setup(false, aspect);
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const comet = new CometPass();
      expect(comet.object.visible).toBe(false);
      comet.update(79, camera);
      expect(comet.active).toBe(false);
      comet.update(1, camera);
      expect(comet.active).toBe(true);
      const body = comet.object.children[0]!;
      const tail = body.children[0] as Mesh;
      const originalBuffer = tail.geometry.getAttribute('position');
      comet.update(9, camera);
      comet.object.updateMatrixWorld(true);
      const screen = body.getWorldPosition(new Vector3()).project(camera);
      expect(Math.abs(screen.x)).toBeLessThan(1);
      expect(screen.y).toBeGreaterThan(0.25);
      expect(screen.y).toBeLessThan(0.75);
      expect(screen.z).toBeLessThan(1);
      expect(tail.geometry.getAttribute('position')).toBe(originalBuffer);
      expect(originalBuffer.count).toBe(72);
      comet.update(9, camera);
      expect(comet.active).toBe(false);
      expect(comet.object.visible).toBe(false);
      comet.update(139, camera);
      expect(comet.active).toBe(false);
      comet.update(1, camera);
      expect(comet.active).toBe(true);
      comet.dispose();
    },
  );

  it('coordinates meteors and comets so they never overlap', () => {
    const camera = setup();
    const meteors = new MeteorField();
    const comet = new CometPass();
    let sawComet = false;
    let sawMeteor = false;
    for (let frame = 0; frame < 3000; frame += 1) {
      comet.update(0.1, camera, !meteors.active);
      meteors.update(0.1, camera, !comet.active);
      expect(meteors.active && comet.active).toBe(false);
      sawComet ||= comet.active;
      sawMeteor ||= meteors.active;
    }
    expect(sawComet && sawMeteor).toBe(true);
    meteors.dispose();
    comet.dispose();
  });

  it('holds the probe still and suppresses comets with reduced motion', () => {
    const camera = setup(true);
    const probe = new DistantProbe();
    const comet = new CometPass();
    probe.update(0, camera);
    const hull = probe.object.children[0]!;
    const rotation = hull.quaternion.clone();
    probe.update(120, camera);
    comet.update(120, camera);
    expect(hull.quaternion.toArray()).toEqual(rotation.toArray());
    expect(comet.active).toBe(false);
    expect(comet.object.visible).toBe(false);
    probe.dispose();
    comet.dispose();
  });

  it('releases every added mesh geometry and material', () => {
    setup();
    for (const traveler of [new DistantProbe(), new CometPass()]) {
      const disposers: ReturnType<typeof vi.spyOn>[] = [];
      traveler.object.traverse((object) => {
        if (!(object instanceof Mesh)) return;
        disposers.push(vi.spyOn(object.geometry, 'dispose'));
        disposers.push(vi.spyOn(object.material, 'dispose'));
      });
      traveler.dispose();
      expect(disposers.length).toBe(4);
      for (const dispose of disposers) expect(dispose).toHaveBeenCalledOnce();
    }
  });
});

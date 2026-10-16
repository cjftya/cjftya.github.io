import { expect, it, vi } from 'vitest';
import {
  BoxGeometry,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
} from 'three';
import {
  rootedWind,
  VegetationWind,
} from '../src/jelly-oasis/animation/vegetationWind';
import { WEATHER_PROFILES, blendWeather } from '../src/jelly-oasis/environment/weather';
import { createVegetationGeometry } from '../src/jelly-oasis/vegetation/createVegetation';
import { createMeadowGeometry } from '../src/jelly-oasis/meadow/meadowGeometry';
import { createSceneryGeometry } from '../src/jelly-oasis/scenery/sceneryGeometry';

function fixture() {
  const root = new Group();
  const geometry = rootedWind(new BoxGeometry(1, 2, 1), 0, -1, 0, 2, 0.2);
  const material = new MeshStandardMaterial({ flatShading: true });
  const mesh = new InstancedMesh(geometry, material, 2);
  mesh.setMatrixAt(0, new Matrix4().makeScale(2, 2, 2));
  mesh.setMatrixAt(1, new Matrix4().makeTranslation(10, 0, 0));
  root.add(mesh);
  const wind = new VegetationWind();
  return {
    root,
    mesh,
    geometry,
    material,
    wind,
    dispose() {
      wind.dispose();
      geometry.dispose();
      material.dispose();
      mesh.dispose();
    },
  };
}

it('keeps roots fixed while preserving painted colors and rest positions', () => {
  for (const geometry of [
    createVegetationGeometry('grass'),
    createVegetationGeometry('flower'),
    createMeadowGeometry('cream'),
    createSceneryGeometry('broad'),
  ]) {
    const before = Array.from(geometry.attributes.position!.array);
    const colors = Array.from(geometry.attributes.color!.array);
    const p = geometry.attributes.position!,
      weights = geometry.attributes.oasisWind!;
    expect(weights.count).toBe(p.count);
    let moving = 0;
    for (let i = 0; i < p.count; i++) {
      if (p.getY(i) <= 0.004) expect(weights.getZ(i)).toBe(0);
      expect(weights.getZ(i)).toBeGreaterThanOrEqual(0);
      expect(weights.getZ(i)).toBeLessThanOrEqual(0.23);
      moving += Number(weights.getZ(i) > 0);
    }
    expect(moving).toBeGreaterThan(0);
    expect(Array.from(p.array)).toEqual(before);
    expect(Array.from(geometry.attributes.color!.array)).toEqual(colors);
    geometry.dispose();
  }
});
it('shares wind materials while leaving stones with the same original material static', () => {
  const f = fixture();
  const stone = new Mesh(new BoxGeometry(), f.material),
    second = new Mesh(f.geometry, f.material);
  f.root.add(stone, second);
  f.wind.bind(f.root);
  expect(f.mesh.material).toBe(second.material);
  expect(stone.material).toBe(f.material);
  expect(f.mesh.material).not.toBe(f.material);
  expect(f.mesh.customDepthMaterial).toBe(second.customDepthMaterial);
  expect(f.wind.snapshot().materials).toBe(1);
  f.dispose();
  expect(f.mesh.material).toBe(f.material);
  expect(f.mesh.customDepthMaterial).toBeUndefined();
  stone.geometry.dispose();
});
it('pads scaled instance bounds without accumulating padding or uploading matrices each frame', () => {
  const f = fixture();
  f.mesh.computeBoundingBox();
  const rest = f.mesh.boundingBox!.clone(),
    version = f.mesh.instanceMatrix.version;
  f.wind.bind(f.root);
  const padded = f.mesh.boundingBox!.clone();
  expect(padded.min.x).toBeLessThan(rest.min.x);
  expect(padded.max.x).toBeGreaterThan(rest.max.x);
  f.wind.bind(f.root);
  expect(f.mesh.boundingBox).toEqual(padded);
  for (let i = 0; i < 120; i++) f.wind.update(1 / 60, WEATHER_PROFILES.RAIN, false);
  expect(f.mesh.instanceMatrix.version).toBe(version);
  expect(f.root.children).toHaveLength(1);
  f.dispose();
});
it('eases weather changes, caps long deltas and supports reduced motion with smooth resume', () => {
  const f = fixture();
  f.wind.bind(f.root);
  for (let i = 0; i < 120; i++) f.wind.update(1 / 60, WEATHER_PROFILES.MIST, false);
  const low = f.wind.snapshot().strength,
    weather = { ...WEATHER_PROFILES.MIST };
  for (let i = 0; i < 300; i++) {
    blendWeather(WEATHER_PROFILES.MIST, WEATHER_PROFILES.RAIN, i / 299, weather);
    f.wind.update(1 / 60, weather, false);
  }
  expect(f.wind.snapshot().strength).toBeGreaterThan(low);
  expect(f.wind.snapshot().strength + f.wind.snapshot().gust).toBeLessThan(1);
  const elapsed = f.wind.snapshot().time;
  f.wind.update(30, weather, false);
  expect(f.wind.snapshot().time - elapsed).toBeCloseTo(0.1);
  f.wind.update(NaN, weather, false);
  expect(Number.isFinite(f.wind.snapshot().time)).toBe(true);
  expect(f.wind.update(0.1, weather, true)).toBe(true);
  const stopped = f.wind.snapshot();
  expect(stopped.strength).toBe(0);
  expect(f.wind.update(0.1, weather, true)).toBe(false);
  expect(f.wind.snapshot().time).toBe(stopped.time);
  f.wind.update(1 / 60, weather, false);
  expect(f.wind.snapshot().strength).toBeGreaterThan(0);
  expect(f.wind.snapshot().strength).toBeLessThan(0.03);
  f.dispose();
});
it('rebuilds bindings without duplicate material allocations and disposes resources exactly once', () => {
  const f = fixture();
  f.wind.bind(f.root);
  const visible = f.mesh.material as MeshStandardMaterial,
    depth = f.mesh.customDepthMaterial!;
  const a = vi.fn(),
    b = vi.fn();
  visible.addEventListener('dispose', a);
  depth.addEventListener('dispose', b);
  for (let i = 0; i < 3; i++) f.wind.bind(f.root);
  expect(f.mesh.material).toBe(visible);
  expect(f.mesh.customDepthMaterial).toBe(depth);
  f.dispose();
  f.wind.dispose();
  expect(a).toHaveBeenCalledTimes(1);
  expect(b).toHaveBeenCalledTimes(1);
});

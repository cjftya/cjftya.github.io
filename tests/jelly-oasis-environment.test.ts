import { describe, expect, it } from 'vitest';
import { Mesh, PerspectiveCamera, Scene, Vector3 } from 'three';
import { EnvironmentController } from '../src/jelly-oasis/environment/EnvironmentController';
import {
  advanceTime,
  createTimeFrame,
  sampleTime,
  wrapTime,
} from '../src/jelly-oasis/environment/timeOfDay';
import {
  blendWeather,
  ENVIRONMENT_CONFIG,
  WEATHER_PRESETS,
  WEATHER_PROFILES,
} from '../src/jelly-oasis/environment/weather';
import {
  createTerrain,
  createTerrainEdge,
} from '../src/jelly-oasis/terrain/createTerrain';

const camera = new PerspectiveCamera(42, 1.5, 0.5, 1800);
camera.position.set(255, 235, 300);
const step = (environment: EnvironmentController, dt = 0.1) =>
  environment.update(dt, camera, 459, 1.5);

describe('environment time', () => {
  it('wraps time and rejects invalid inputs without NaNs', () => {
    expect(wrapTime(-1)).toBe(23);
    expect(wrapTime(48)).toBe(0);
    expect(wrapTime(NaN)).toBe(12);
    expect(advanceTime(23, 40, 480)).toBe(1);
    for (const invalid of [NaN, Infinity, -1])
      expect(advanceTime(10, invalid, 480)).toBe(10);
    expect(advanceTime(10, 1, 0)).toBe(10);
    expect(advanceTime(10, 1, 480, Infinity)).toBe(10);
  });
  it('distinguishes dawn, morning, noon, sunset, and readable night', () => {
    expect(sampleTime(5).sunlight).toBeLessThan(sampleTime(7).sunlight);
    expect(sampleTime(12).elevation).toBeCloseTo(1);
    expect(sampleTime(12).sunlight).toBeGreaterThan(sampleTime(18).sunlight);
    expect(sampleTime(18).horizon[0]).toBeGreaterThan(sampleTime(18).horizon[2]);
    expect(sampleTime(0).sunlight).toBe(0);
    expect(sampleTime(0).ambient).toBeGreaterThan(0.6);
    expect(sampleTime(0).stars).toBe(1);
    expect(sampleTime(12).stars).toBe(0);
  });
  it('is continuous across keyframes and midnight and reuses output storage', () => {
    const out = createTimeFrame();
    const horizon = out.horizon;
    for (const hour of [0, 4, 5.5, 7, 12, 16, 18, 19.5, 21, 24]) {
      const a = sampleTime(hour - 0.00001);
      const b = sampleTime(hour + 0.00001);
      expect(Math.abs(a.sunlight - b.sunlight)).toBeLessThan(0.001);
      expect(Math.abs(a.ambient - b.ambient)).toBeLessThan(0.001);
      a.horizon.forEach((v, i) =>
        expect(Math.abs(v - b.horizon[i]!)).toBeLessThan(0.001),
      );
      expect(sampleTime(hour, out)).toBe(out);
      expect(out.horizon).toBe(horizon);
    }
  });
});

describe('weather transitions and scene budgets', () => {
  it('refocuses shadows without changing the sun direction or allocating a larger map', () => {
    const environment = new EnvironmentController(new Scene(), false, true);
    step(environment, 0);
    const direction = environment.sun.position.clone().normalize();
    environment.focusShadow(new Vector3(70, -6, 58), 104);
    expect(step(environment, 0)).toBe(true);
    expect(environment.sun.shadow.camera.right).toBeCloseTo(83.2);
    expect(environment.sun.shadow.mapSize.toArray()).toEqual([1024, 1024]);
    const focusedDirection = environment.sun.position
      .clone()
      .sub(environment.sun.target.position)
      .normalize();
    expect(focusedDirection.distanceTo(direction)).toBeLessThan(1e-10);
    expect(step(environment, 0)).toBe(false);
    environment.focusShadow(new Vector3(70, -6, 58), 104);
    expect(step(environment, 0)).toBe(false);
    environment.focusShadow(new Vector3(), 1000);
    expect(step(environment, 0)).toBe(true);
    expect(environment.sun.shadow.camera.right).toBe(230);
    environment.focusShadow(new Vector3(), 5);
    expect(environment.sun.shadow.camera.right).toBe(45);
    environment.dispose();
  });
  it('bounds all profiles and interpolation, including invalid blend inputs', () => {
    for (const preset of WEATHER_PRESETS)
      for (const value of Object.values(WEATHER_PROFILES[preset])) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(1);
      }
    const out = { ...WEATHER_PROFILES.CLEAR };
    blendWeather(WEATHER_PROFILES.CLEAR, WEATHER_PROFILES.RAIN, 0.5, out);
    expect(out.rainIntensity).toBeCloseTo(0.425);
    blendWeather(WEATHER_PROFILES.CLEAR, WEATHER_PROFILES.RAIN, NaN, out);
    expect(out).toEqual(WEATHER_PROFILES.CLEAR);
    blendWeather(WEATHER_PROFILES.CLEAR, WEATHER_PROFILES.RAIN, 5, out);
    expect(out).toEqual(WEATHER_PROFILES.RAIN);
  });
  it('retargets an interrupted transition without jumping and settles exactly', () => {
    const environment = new EnvironmentController(new Scene(), false, true);
    step(environment, 0);
    environment.setWeather('RAIN');
    for (let i = 0; i < 20; i++) step(environment);
    const snapshot = { ...environment.profile };
    environment.setWeather('CLEAR');
    step(environment, 0);
    expect(environment.profile).toEqual(snapshot);
    for (let i = 0; i < 60; i++) step(environment);
    expect(environment.profile).toEqual(WEATHER_PROFILES.CLEAR);
    expect(environment.state.weatherBlend).toBe(1);
    expect(environment.rain.mesh.visible).toBe(false);
    environment.dispose();
  });
  it('pauses motion while allowing a requested weather transition to finish', () => {
    const environment = new EnvironmentController(new Scene(), false, true);
    expect(environment.state.playing).toBe(false);
    step(environment, 0);
    expect(step(environment)).toBe(false);
    const originalTime = environment.state.timeOfDay;
    environment.setWeather('RAIN');
    for (let i = 0; i < 60; i++) step(environment);
    expect(environment.state.timeOfDay).toBe(originalTime);
    expect(environment.rain.mesh.visible).toBe(true);
    expect(step(environment)).toBe(false);
    environment.setPlaying(true);
    step(environment);
    expect(environment.state.timeOfDay).toBeGreaterThan(originalTime);
    environment.dispose();
  });
  it('keeps camera-relative effects and fog valid at all supported zoom distances', () => {
    const scene = new Scene();
    const environment = new EnvironmentController(scene, true, true);
    for (const distance of [35, 459, 1050]) {
      environment.update(0, camera, distance, 1.2);
      expect(environment.sky.group.position.equals(camera.position)).toBe(true);
      expect(environment.rain.mesh.position.equals(camera.position)).toBe(true);
      expect(environment.fog.far).toBeGreaterThan(environment.fog.near);
      expect(environment.fog.far).toBeGreaterThan(distance);
    }
    environment.fogEnabled = false;
    environment.invalidate();
    step(environment);
    expect(scene.fog).toBeNull();
    environment.dispose();
  });
  it('allocates bounded geometry with no image textures and reuses it over time', () => {
    for (const mobile of [false, true]) {
      const scene = new Scene();
      const environment = new EnvironmentController(scene, mobile, false);
      const terrain = createTerrain();
      const edge = createTerrainEdge();
      scene.add(terrain, edge);
      let triangleCount = 0;
      let meshCount = 0;
      scene.traverse((object) => {
        if (object instanceof Mesh) {
          meshCount++;
          const count =
            object.geometry.index?.count ?? object.geometry.attributes.position!.count;
          const instances =
            object === environment.clouds.mesh ? environment.clouds.count : 1;
          triangleCount += (count / 3) * instances;
        }
      });
      expect(meshCount).toBe(4);
      expect(triangleCount).toBe(17968);
      expect(environment.clouds.count).toBe(50);
      expect(environment.sky.stars.geometry.attributes.position!.count).toBe(360);
      expect(environment.rain.count).toBe(mobile ? 180 : 420);
      expect(environment.rain.mesh.geometry.attributes.position!.count).toBe(
        environment.rain.count * 2,
      );
      expect(environment.clouds.mesh.material.map).toBeNull();
      expect(environment.sun.shadow.mapSize.x).toBe(1024);
      const cloudGeometry = environment.clouds.mesh.geometry;
      const rainArray = environment.rain.mesh.geometry.attributes.position!.array;
      const sceneChildren = environment.root.children.length;
      for (const preset of WEATHER_PRESETS) {
        environment.setWeather(preset);
        for (let i = 0; i < 100; i++) step(environment);
      }
      expect(environment.clouds.mesh.geometry).toBe(cloudGeometry);
      expect(environment.rain.mesh.geometry.attributes.position!.array).toBe(rainArray);
      expect(environment.root.children.length).toBe(sceneChildren);
      expect(
        Array.from(environment.clouds.mesh.instanceMatrix.array).every(Number.isFinite),
      ).toBe(true);
      environment.dispose();
      expect(scene.children).toHaveLength(2);
      terrain.geometry.dispose();
      terrain.material.dispose();
      edge.geometry.dispose();
      edge.material.dispose();
    }
  });
  it('uses the configurable day length and handles invalid deltas', () => {
    const environment = new EnvironmentController(new Scene(), false, false);
    environment.config.cycleSeconds = 240;
    environment.setTime(23.999);
    step(environment);
    expect(environment.state.timeOfDay).toBeCloseTo(0.009);
    const hour = environment.state.timeOfDay;
    step(environment, NaN);
    expect(environment.state.timeOfDay).toBe(hour);
    environment.setSpeed(NaN);
    expect(environment.state.speed).toBe(1);
    environment.setTime(Infinity);
    expect(environment.state.timeOfDay).toBe(12);
    expect(ENVIRONMENT_CONFIG.cycleSeconds).toBe(480);
    environment.dispose();
  });
});

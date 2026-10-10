import { describe, expect, it } from 'vitest';
import { PerspectiveCamera, Scene, Vector3 } from 'three';
import { AutoWeather } from '../src/jelly-oasis/environment/autoWeather';
import { EnvironmentController } from '../src/jelly-oasis/environment/EnvironmentController';
import {
  ENVIRONMENT_CONFIG,
  WEATHER_PROFILES,
} from '../src/jelly-oasis/environment/weather';

const camera = new PerspectiveCamera();
const tick = (e: EnvironmentController, seconds = 0.1) =>
  e.update(seconds, camera, 104, 1);
const run = (e: EnvironmentController, seconds: number) => {
  for (let i = 0; i < Math.ceil(seconds * 10); i++) tick(e);
};
describe('automatic weather', () => {
  it('uses a reproducible seed, bounded dwell and different adjacent outcomes', () => {
    const a = new AutoWeather(123),
      b = new AutoWeather(123);
    let current = 'CLEAR' as keyof typeof WEATHER_PROFILES;
    for (let i = 0; i < 40; i++) {
      expect(a.secondsUntilNext).toBe(b.secondsUntilNext);
      expect(a.secondsUntilNext).toBeGreaterThanOrEqual(120);
      expect(a.secondsUntilNext).toBeLessThanOrEqual(240);
      const duration = a.secondsUntilNext;
      expect(a.update(duration - 0.01, current)).toBeNull();
      const next = a.update(0.01, current)!;
      expect(next).toBe(b.update(duration, current));
      expect(next).not.toBe(current);
      current = next;
    }
  });
  it('runs while the clock is paused, blends for five seconds, and respects manual override', () => {
    const e = new EnvironmentController(new Scene(), false, false, 123);
    e.setPlaying(false);
    run(e, 121);
    expect(e.state.weather).toBe('CLEAR');
    run(e, 119);
    expect(e.state.weather).not.toBe('CLEAR');
    expect(e.state.weatherBlend).toBe(1);
    expect(e.state.timeOfDay).toBe(10);
    e.setWeather('RAIN');
    expect(e.autoWeather.enabled).toBe(false);
    run(e, 5);
    expect(e.profile).toEqual(WEATHER_PROFILES.RAIN);
    run(e, 600);
    expect(e.state.weather).toBe('RAIN');
    e.setAutoWeather(true);
    tick(e, 0);
    expect(e.state.weather).toBe('RAIN');
    expect(e.autoWeather.secondsUntilNext).toBeGreaterThanOrEqual(120);
    e.setWeather('RAIN'); // Selecting the current preset also disables auto.
    expect(e.autoWeather.enabled).toBe(false);
    e.dispose();
  });
  it('keeps reduced motion still, clamps resume gaps and preserves the 16-minute clock at every speed', () => {
    const e = new EnvironmentController(new Scene(), false, true, 12);
    expect(e.autoWeather.enabled).toBe(false);
    expect(e.animated).toBe(false);
    e.setAutoWeather(true);
    const wait = e.autoWeather.secondsUntilNext;
    tick(e, 600);
    expect(e.autoWeather.secondsUntilNext).toBeCloseTo(wait - 0.1);
    e.setAutoWeather(false);
    e.setPlaying(true);
    for (const speed of [0.25, 1, 4, 12]) {
      e.setTime(0);
      e.setSpeed(speed);
      run(e, 10);
      expect(e.state.timeOfDay).toBeCloseTo(((10 * 24) / 960) * speed, 8);
    }
    expect(ENVIRONMENT_CONFIG.cycleSeconds).toBe(960);
    e.setSpeed(1);
    e.setTime(0);
    run(e, 960);
    expect(Math.min(e.state.timeOfDay, 24 - e.state.timeOfDay)).toBeLessThan(1e-8);
    e.dispose();
  });
});
describe('moon and single shadow caster', () => {
  it('shares the disc direction with the light at both night hours and follows focus', () => {
    const e = new EnvironmentController(new Scene(), false, true);
    e.setShadows(true);
    let midnight: Vector3 | null = null;
    for (const hour of [12, 0, 3, 12]) {
      e.setTime(hour);
      e.focusShadow(new Vector3(70, -6, 58), 104);
      tick(e, 0);
      const direction = e.moon.position.clone().sub(e.moon.target.position).normalize();
      expect(
        direction.distanceTo(e.sky.material.uniforms.moonDirection!.value),
      ).toBeLessThan(1e-10);
      expect(Number(e.sun.castShadow) + Number(e.moon.castShadow)).toBe(1);
      expect(e.moon.castShadow).toBe(hour !== 12);
      expect(e.moon.target.parent).toBe(e.root);
      expect(e.moon.shadow.camera.right).toBe(e.sun.shadow.camera.right);
      expect(e.moon.shadow.mapSize.toArray()).toEqual([1024, 1024]);
      if (hour === 0) midnight = direction;
      if (hour === 3) expect(direction.distanceTo(midnight!)).toBeGreaterThan(0.3);
    }
    e.setShadows(false);
    tick(e, 0);
    expect(e.sun.castShadow || e.moon.castShadow).toBe(false);
    e.dispose();
  });
  it('enables a single mobile caster at 512px; weather attenuates disc and light', () => {
    const e = new EnvironmentController(new Scene(), true, true);
    e.setShadows(true);
    e.setTime(0);
    tick(e, 0);
    const clear = e.moon.intensity;
    for (const weather of ['OVERCAST', 'RAIN', 'MIST'] as const) {
      e.setWeather(weather);
      run(e, 5);
      expect(e.moon.intensity).toBeLessThan(clear);
      expect(e.moon.castShadow).toBe(true);
      expect(e.sun.castShadow).toBe(false);
      expect(e.moon.shadow.mapSize.toArray()).toEqual([512, 512]);
      expect(e.moon.shadow.map).toBeNull();
    }
    e.dispose();
  });
  it.each([false, true])('does not flicker through dusk/dawn (mobile=%s)', (mobile) => {
    const e = new EnvironmentController(new Scene(), mobile, true);
    e.setShadows(true);
    for (const [start, end] of [
      [18.5, 20.5],
      [4, 7],
    ]) {
      let changes = 0,
        previous = '';
      for (let hour = start!; hour <= end!; hour += 0.005) {
        e.setTime(hour);
        tick(e, 0);
        expect(
          Number(e.sun.castShadow) + Number(e.moon.castShadow),
        ).toBeLessThanOrEqual(1);
        const caster = e.sun.castShadow ? 'sun' : e.moon.castShadow ? 'moon' : '';
        if (caster && previous && previous !== caster) changes++;
        if (caster) previous = caster;
      }
      expect(changes).toBeLessThanOrEqual(1);
    }
    e.dispose();
  });
});

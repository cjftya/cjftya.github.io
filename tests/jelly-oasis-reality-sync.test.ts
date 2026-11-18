import { afterEach, describe, expect, it, vi } from 'vitest';
import { PerspectiveCamera, Scene } from 'three';
import { EnvironmentController } from '../src/jelly-oasis/environment/EnvironmentController';
import { RealitySync } from '../src/jelly-oasis/environment/RealitySync';
import {
  parseConditions,
  weatherCode,
  weatherUrl,
} from '../src/jelly-oasis/environment/liveWeather';
import { localHour, solarFrame } from '../src/jelly-oasis/environment/realTime';

const NOW = Date.parse('2026-06-21T03:00:00Z');
const data = (timezone = 'Asia/Seoul', code = 61) => ({
  timezone,
  current: {
    time: NOW / 1000,
    weather_code: code,
    cloud_cover: 80,
    precipitation: 2,
    snowfall: 0,
    wind_speed_10m: 4,
    wind_direction_10m: 90,
    wind_gusts_10m: 8,
  },
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

it('maps all supported WMO codes and rejects unknown conditions', () => {
  const groups = {
    CLEAR: [0],
    PARTLY_CLOUDY: [1, 2],
    OVERCAST: [3],
    MIST: [45, 48],
    DRIZZLE: [51, 53, 55, 56, 57],
    RAIN: [61, 63, 65, 66, 67, 80, 81, 82],
    SNOW: [71, 73, 75, 77, 85, 86],
    THUNDERSTORM: [95, 96, 99],
  };
  for (const [preset, codes] of Object.entries(groups))
    for (const code of codes) expect(weatherCode(code).preset).toBe(preset);
  expect(() => weatherCode(4)).toThrow();
  expect(weatherCode(82).label).toBe('소나기');
});
it('validates fields, freshness and timezone without accepting null as zero', () => {
  const conditions = parseConditions(data(), NOW);
  expect(conditions.profile.rainIntensity).toBeCloseTo(0.48);
  expect(conditions.windDirection).toBe(90);
  for (const field of Object.keys(data().current)) {
    const invalid = data();
    Object.assign(invalid.current, { [field]: null });
    expect(() => parseConditions(invalid, NOW)).toThrow();
  }
  expect(() => parseConditions(data(), NOW + 3 * 3600000)).toThrow();
  expect(() => parseConditions(data('Invalid/Zone'), NOW)).toThrow();
  expect(weatherUrl({ latitude: -33.87, longitude: 151.21 })).toContain(
    'timezone=auto',
  );
});
it('handles opposite date boundaries and DST through the selected IANA timezone', () => {
  const fmt = (timeZone: string) =>
    new Intl.DateTimeFormat('en-GB', {
      timeZone,
      hourCycle: 'h23',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  expect(localHour(NOW, fmt('Asia/Seoul'))).toBe(12);
  expect(localHour(NOW, fmt('America/Los_Angeles'))).toBe(20);
  expect(
    localHour(Date.parse('2026-03-08T06:59:00Z'), fmt('America/New_York')),
  ).toBeCloseTo(1 + 59 / 60);
  expect(localHour(Date.parse('2026-03-08T07:00:00Z'), fmt('America/New_York'))).toBe(
    3,
  );
});
it('moves sunlight with longitude, season and hemisphere, including polar locations', () => {
  const korea = { latitude: 37.27, longitude: 127.01 };
  expect(solarFrame(NOW, korea).altitude).toBeGreaterThan(70);
  expect(solarFrame(NOW + 12 * 3600000, korea).altitude).toBeLessThan(0);
  expect(solarFrame(Date.parse('2026-12-21T03:00Z'), korea).altitude).toBeLessThan(35);
  expect(
    solarFrame(NOW, { latitude: -33.87, longitude: 151.21 }).altitude,
  ).toBeLessThan(35);
  for (const latitude of [-90, -80, 0, 80, 90])
    for (const value of Object.values(solarFrame(NOW, { latitude, longitude: -179 })))
      expect(Number.isFinite(value)).toBe(true);
});

function fixture(fetcher?: typeof fetch) {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  const environment = new EnvironmentController(new Scene(), false, false);
  const sync = new RealitySync(environment, vi.fn(), fetcher);
  const camera = new PerspectiveCamera();
  return {
    environment,
    sync,
    update(dt = 0.1) {
      environment.update(dt, camera, 100, 1);
    },
    dispose() {
      sync.dispose();
      environment.dispose();
    },
  };
}
describe('reality synchronization lifecycle', () => {
  it('uses the Seoul clock before the response and throttles visible refreshes', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockImplementation(async () => new Response(JSON.stringify(data())));
    const f = fixture(fetcher);
    expect(f.environment.autoWeather.enabled).toBe(false);
    expect(f.environment.realtimeLocation).toEqual({
      latitude: 37.57,
      longitude: 126.98,
    });
    f.sync.tick();
    expect(f.environment.state.timeOfDay).toBe(12);
    await vi.advanceTimersByTimeAsync(0);
    f.sync.tick();
    expect(fetcher).toHaveBeenCalledTimes(1);
    const url = new URL(String(fetcher.mock.calls[0]![0]));
    expect(url.searchParams.get('latitude')).toBe('37.57');
    expect(url.searchParams.get('longitude')).toBe('126.98');
    expect(f.environment.state.weather).toBe('RAIN');
    expect(f.environment.windDirection?.x).toBeCloseTo(-1);
    for (let i = 0; i < 310; i++) f.update();
    expect(f.environment.profile.rainIntensity).toBeCloseTo(0.48);
    vi.setSystemTime(NOW + 60000);
    f.sync.tick();
    expect(f.environment.state.timeOfDay).toBeCloseTo(12 + 1 / 60);
    expect(fetcher).toHaveBeenCalledTimes(1);
    vi.setSystemTime(NOW + 16 * 60000);
    f.sync.tick();
    expect(fetcher).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(0);
    f.dispose();
  });
  it('calls the native fetch path with its global receiver and skips geolocation', async () => {
    const getCurrentPosition = vi.fn();
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition } });
    const fetcher = vi.fn(function (this: unknown) {
      if (this !== globalThis) throw new TypeError('Illegal invocation');
      return Promise.resolve(new Response(JSON.stringify(data())));
    });
    vi.stubGlobal('fetch', fetcher);
    const f = fixture();
    f.sync.tick();
    await vi.advanceTimersByTimeAsync(0);
    expect(getCurrentPosition).not.toHaveBeenCalled();
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(f.sync.status).toContain('서울 · 비');
    f.dispose();
  });
  it('keeps manual overrides until explicitly re-enabled and rejects late responses', async () => {
    let resolve!: (r: Response) => void;
    const fetcher = vi.fn<typeof fetch>().mockImplementation(
      () =>
        new Promise((r) => {
          resolve = r;
        }),
    );
    const f = fixture(fetcher);
    f.sync.tick();
    f.environment.setTime(3);
    f.environment.setWeather('SNOW');
    f.sync.tick();
    resolve(new Response(JSON.stringify(data())));
    await vi.advanceTimersByTimeAsync(0);
    expect(f.environment.state.timeOfDay).toBe(3);
    expect(f.environment.state.weather).toBe('SNOW');
    expect(f.environment.liveWeather).toBe(false);
    f.environment.setRealtimeTime(true);
    f.sync.tick(NOW + 1000);
    expect(f.environment.state.timeOfDay).not.toBe(3);
    f.dispose();
  });
  it('times out and retries once instead of issuing overlapping requests', async () => {
    const fetcher = vi.fn<typeof fetch>().mockImplementation(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new Error('abort')));
        }),
    );
    const f = fixture(fetcher);
    f.sync.tick();
    for (let i = 0; i < 20; i++) f.sync.tick();
    expect(fetcher).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(12000);
    expect(f.sync.status).toContain('재시도');
    f.sync.tick();
    expect(fetcher).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(60000);
    f.sync.tick();
    expect(fetcher).toHaveBeenCalledTimes(2);
    f.dispose();
  });
  it('ignores a weather response that arrives after disposal', async () => {
    let resolve!: (response: Response) => void;
    const fetcher = vi.fn<typeof fetch>().mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    const f = fixture(fetcher);
    f.sync.tick();
    const signal = fetcher.mock.calls[0]![1]?.signal;
    f.dispose();
    expect(signal?.aborted).toBe(true);
    resolve(new Response(JSON.stringify(data())));
    await vi.advanceTimersByTimeAsync(0);
    f.sync.tick();
    expect(f.environment.state.weather).toBe('CLEAR');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it('removes outdated weather once while keeping time sync alive', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify(data())))
      .mockRejectedValue(new Error('offline'));
    const f = fixture(fetcher);
    f.sync.tick();
    await vi.advanceTimersByTimeAsync(0);
    vi.setSystemTime(NOW + 3 * 3600000);
    f.sync.tick();
    await vi.advanceTimersByTimeAsync(0);
    expect(f.environment.state.weather).toBe('CLEAR');
    expect(f.environment.liveWeather).toBe(true);
    f.update();
    const blend = f.environment.state.weatherBlend;
    f.sync.tick(NOW + 3 * 3600000 + 1000);
    f.update();
    expect(f.environment.state.weatherBlend).toBeGreaterThan(blend);
    f.dispose();
  });
});

it('keeps real time synchronized under changed reduced-motion settings', () => {
  const e = new EnvironmentController(new Scene(), false, false);
  e.setRealtimeTime(true);
  e.setReducedMotion(true);
  e.syncClock(NOW, 12);
  e.update(0.1, new PerspectiveCamera(), 100, 1);
  expect(e.realtimeTime).toBe(true);
  expect(e.state.playing).toBe(false);
  e.setReducedMotion(false);
  expect(e.state.playing).toBe(true);
  e.dispose();
});

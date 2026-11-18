import type { EnvironmentController } from './EnvironmentController';
import { parseConditions, weatherUrl } from './liveWeather';
import { localHour } from './realTime';
import type { GeoLocation } from './realTime';

const REFRESH_MS = 15 * 60000;
const RETRY_MS = 60000;
const FIRST_RETRY_MS = 3000;
const WEATHER_CACHE_KEY = 'jelly-oasis:seoul-weather:v1';
const SEOUL_LOCATION: GeoLocation = { latitude: 37.57, longitude: 126.98 };
const SEOUL_CLOCK = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Seoul',
  hourCycle: 'h23',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

/** One request at a time, only on visible frames. Late callbacks cannot revive a scene. */
export class RealitySync {
  status = '서울 날씨를 불러오는 중…';
  private request: AbortController | null = null;
  private disposed = false;
  private nextFetch = 0;
  private retryDelay = FIRST_RETRY_MS;
  private lastClock = -1;
  private observedAt = 0;
  private wasEnabled = true;
  constructor(
    private readonly environment: EnvironmentController,
    private readonly invalidate: () => void,
    private readonly fetcher: typeof fetch = (...args) => globalThis.fetch(...args),
  ) {
    environment.realtimeLocation = SEOUL_LOCATION;
    environment.setRealtimeTime(true);
    environment.liveWeather = true;
    environment.setAutoWeather(false);
    this.restoreWeather();
  }
  private restoreWeather(): void {
    try {
      const cached = globalThis.localStorage?.getItem(WEATHER_CACHE_KEY);
      if (!cached) return;
      const conditions = parseConditions(JSON.parse(cached), Date.now());
      this.environment.applyLiveConditions(conditions);
      this.observedAt = conditions.observedAt;
      this.status = `서울 · ${conditions.label} · 최신 날씨 확인 중`;
    } catch {
      // Storage may be unavailable or contain expired weather.
    }
  }
  tick(now = Date.now()): void {
    if (this.disposed) return;
    const enabled = this.environment.liveWeather;
    if (enabled && !this.wasEnabled) {
      this.nextFetch = 0;
      this.retryDelay = FIRST_RETRY_MS;
    }
    if (!enabled && this.wasEnabled) {
      this.request?.abort();
      this.request = null;
    }
    this.wasEnabled = enabled;
    const second = Math.floor(now / 1000);
    if (second !== this.lastClock) {
      this.lastClock = second;
      if (this.environment.realtimeTime) {
        this.environment.syncClock(now, localHour(now, SEOUL_CLOCK));
        this.invalidate();
      }
      if (enabled && this.observedAt && now - this.observedAt > 2 * 3600000) {
        this.environment.clearLiveConditions(true);
        this.observedAt = 0;
        this.nextFetch = Math.min(this.nextFetch, now);
        this.status = '날씨 자료가 오래됐어요. 연동을 재시도하고 있어요.';
      }
    }
    if (enabled && !this.request && now >= this.nextFetch) void this.refresh(now);
  }
  private async refresh(now: number): Promise<void> {
    const request = new AbortController();
    this.request = request;
    this.nextFetch = now + REFRESH_MS;
    const timeout = setTimeout(() => request.abort(), 12000);
    let retrySoon = true;
    let retryAfter = 0;
    try {
      const response = await this.fetcher(weatherUrl(SEOUL_LOCATION), {
        signal: request.signal,
      });
      retrySoon = response.status === 408 || response.status >= 500;
      if (!response.ok) {
        const header = response.headers.get('Retry-After');
        if (header) {
          const seconds = Number(header);
          retryAfter = Number.isFinite(seconds)
            ? seconds * 1000
            : Date.parse(header) - Date.now();
        }
        throw new Error(`Weather HTTP ${response.status}`);
      }
      const data: unknown = await response.json();
      const conditions = parseConditions(data, Date.now());
      if (this.disposed || this.request !== request || !this.environment.liveWeather)
        return;
      this.environment.applyLiveConditions(conditions);
      this.observedAt = conditions.observedAt;
      this.retryDelay = FIRST_RETRY_MS;
      try {
        globalThis.localStorage?.setItem(WEATHER_CACHE_KEY, JSON.stringify(data));
      } catch {
        // Weather still works when storage is blocked.
      }
      this.status = `서울 · ${conditions.label} · 15분마다 갱신`;
      this.invalidate();
    } catch {
      if (!this.disposed && this.request === request && this.environment.liveWeather) {
        const delay = retrySoon || request.signal.aborted ? this.retryDelay : RETRY_MS;
        this.nextFetch = Date.now() + Math.max(delay, retryAfter || 0);
        this.retryDelay = Math.min(RETRY_MS, this.retryDelay * 4);
        this.status = this.observedAt
          ? '갱신 지연 · 마지막 날씨 유지 중'
          : '서울 날씨를 불러오지 못했어요. 잠시 후 재시도해요.';
        this.invalidate();
      }
    } finally {
      clearTimeout(timeout);
      if (this.request === request) this.request = null;
    }
  }
  dispose(): void {
    this.disposed = true;
    this.request?.abort();
    this.request = null;
  }
}

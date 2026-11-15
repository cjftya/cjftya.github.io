import type { EnvironmentController } from './EnvironmentController';
import { parseConditions, weatherUrl } from './liveWeather';
import { localHour } from './realTime';
import type { GeoLocation } from './realTime';

const REFRESH_MS = 15 * 60000;
/** One request at a time; tick only runs on visible frames. No background polling,
 * location persistence or catch-up request bursts. Late callbacks cannot revive a scene.
 */
export class RealitySync {
  status = '현재 위치 확인 중…';
  location: GeoLocation | null = null;
  timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  private formatter?: Intl.DateTimeFormat;
  private request: AbortController | null = null;
  private generation = 0;
  private disposed = false;
  private locating = false;
  private nextFetch = 0;
  private lastClock = -1;
  private observedAt = 0;
  private label = '';
  private wasEnabled = true;
  constructor(
    private readonly environment: EnvironmentController,
    private readonly invalidate: () => void,
    private readonly fetcher: typeof fetch = fetch,
  ) {
    environment.setRealtimeTime(true);
    environment.liveWeather = true;
    environment.setAutoWeather(false);
  }
  locate(): void {
    if (this.disposed || this.locating) return;
    if (!navigator.geolocation) {
      this.status = '위치를 사용할 수 없어요. HTTPS와 브라우저 설정을 확인해 주세요.';
      this.invalidate();
      return;
    }
    this.locating = true;
    const generation = ++this.generation;
    this.request?.abort();
    this.request = null;
    this.status = '위치 권한을 허용하면 현지 시간·날씨를 맞춰요.';
    this.invalidate();
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (this.disposed || generation !== this.generation) return;
        this.locating = false;
        const { latitude, longitude } = position.coords;
        if (
          !Number.isFinite(latitude) ||
          Math.abs(latitude) > 90 ||
          !Number.isFinite(longitude) ||
          Math.abs(longitude) > 180
        ) {
          this.status = '위치가 올바르지 않아요. 다시 시도해 주세요.';
          this.invalidate();
          return;
        }
        // City-scale precision is sufficient; no precise coordinates are stored.
        this.location = {
          latitude: Math.round(latitude * 100) / 100,
          longitude: Math.round(longitude * 100) / 100,
        };
        this.environment.realtimeLocation = this.location;
        this.environment.clearLiveConditions(true);
        this.formatter = undefined;
        this.observedAt = 0;
        this.nextFetch = 0;
        this.lastClock = -1;
        this.status = '현재 위치 날씨를 불러오는 중…';
        this.invalidate();
      },
      (error) => {
        if (this.disposed || generation !== this.generation) return;
        this.locating = false;
        this.status =
          error.code === 1
            ? '위치 권한이 필요해요. 브라우저 설정에서 허용한 뒤 다시 시도해 주세요.'
            : '위치를 확인하지 못했어요. 다시 시도해 주세요.';
        this.invalidate();
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 },
    );
  }
  tick(now = Date.now()): void {
    if (this.disposed) return;
    const enabled = this.environment.liveWeather;
    if (enabled && !this.wasEnabled) this.nextFetch = 0;
    if (!enabled && this.wasEnabled) {
      this.request?.abort();
      this.request = null;
    }
    this.wasEnabled = enabled;
    const second = Math.floor(now / 1000);
    if (second !== this.lastClock) {
      this.lastClock = second;
      if (this.environment.realtimeTime) {
        this.environment.syncClock(now, localHour(now, this.formatter));
        this.invalidate();
      }
      if (enabled && this.observedAt && now - this.observedAt > 2 * 3600000) {
        this.environment.clearLiveConditions(true);
        this.observedAt = 0;
        this.nextFetch = Math.min(this.nextFetch, now);
        this.status = '날씨 자료가 오래됐어요. 연동을 재시도하고 있어요.';
      }
    }
    if (
      enabled &&
      this.location &&
      !this.locating &&
      !this.request &&
      now >= this.nextFetch
    )
      void this.refresh(now);
  }
  private async refresh(now: number): Promise<void> {
    if (!this.location) return;
    const generation = this.generation;
    const request = new AbortController();
    this.request = request;
    this.nextFetch = now + REFRESH_MS;
    const timeout = setTimeout(() => request.abort(), 12000);
    try {
      const response = await this.fetcher(weatherUrl(this.location), {
        signal: request.signal,
      });
      if (!response.ok) throw new Error('Weather unavailable');
      const conditions = parseConditions(await response.json(), Date.now());
      if (
        this.disposed ||
        generation !== this.generation ||
        this.request !== request ||
        !this.environment.liveWeather
      )
        return;
      this.timezone = conditions.timezone;
      this.formatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: this.timezone,
        hourCycle: 'h23',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      this.environment.applyLiveConditions(conditions);
      this.observedAt = conditions.observedAt;
      this.label = conditions.label;
      this.status = `${this.timezone} · ${this.label} · 15분마다 갱신`;
      this.lastClock = -1;
      this.invalidate();
    } catch {
      if (
        !this.disposed &&
        generation === this.generation &&
        this.request === request &&
        this.environment.liveWeather
      ) {
        this.nextFetch = Date.now() + 60000;
        this.status = this.observedAt
          ? '갱신 지연 · 마지막 날씨 유지 중'
          : '날씨를 불러오지 못했어요. 기기 시간으로 표시하며 재시도해요.';
        this.invalidate();
      }
    } finally {
      clearTimeout(timeout);
      if (this.request === request) this.request = null;
    }
  }
  dispose(): void {
    this.disposed = true;
    this.generation++;
    this.request?.abort();
    this.request = null;
  }
}

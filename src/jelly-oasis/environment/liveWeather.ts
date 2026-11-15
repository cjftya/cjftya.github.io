import { WEATHER_PROFILES } from './weather';
import type { WeatherPreset, WeatherProfile } from './weather';
import type { GeoLocation } from './realTime';

export interface LiveConditions {
  preset: WeatherPreset;
  label: string;
  profile: WeatherProfile;
  windDirection: number;
  observedAt: number;
  timezone: string;
}
const clamp = (value: number, max = 1) => Math.min(max, Math.max(0, value));

/** Open-Meteo WMO codes, including freezing precipitation and hail showers. */
export function weatherCode(code: number): { preset: WeatherPreset; label: string } {
  if (code === 0) return { preset: 'CLEAR', label: '맑음' };
  if (code === 1 || code === 2) return { preset: 'PARTLY_CLOUDY', label: '구름 조금' };
  if (code === 3) return { preset: 'OVERCAST', label: '흐림' };
  if (code === 45 || code === 48) return { preset: 'MIST', label: '안개' };
  if ([51, 53, 55, 56, 57].includes(code))
    return { preset: 'DRIZZLE', label: '이슬비' };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code))
    return { preset: 'RAIN', label: code >= 80 ? '소나기' : '비' };
  if ([71, 73, 75, 77, 85, 86].includes(code))
    return { preset: 'SNOW', label: code >= 85 ? '눈 소나기' : '눈' };
  if ([95, 96, 99].includes(code)) return { preset: 'THUNDERSTORM', label: '뇌우' };
  throw new Error('Unsupported weather code');
}

export function weatherUrl(location: GeoLocation): string {
  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    current:
      'weather_code,cloud_cover,precipitation,snowfall,wind_speed_10m,wind_direction_10m,wind_gusts_10m',
    wind_speed_unit: 'ms',
    timeformat: 'unixtime',
    timezone: 'auto',
    forecast_days: '1',
  });
  return `https://api.open-meteo.com/v1/forecast?${params}`;
}

export function parseConditions(data: unknown, now: number): LiveConditions {
  if (!data || typeof data !== 'object') throw new Error('Invalid weather response');
  const { current, timezone } = data as {
    current?: Record<string, unknown>;
    timezone?: unknown;
  };
  if (!current || typeof timezone !== 'string')
    throw new Error('Missing current conditions');
  new Intl.DateTimeFormat('en', { timeZone: timezone }); // Reject invalid timezone.
  const number = (key: string, min: number, max: number) => {
    const value = current[key];
    if (
      typeof value !== 'number' ||
      !Number.isFinite(value) ||
      value < min ||
      value > max
    )
      throw new Error(`Invalid weather field: ${key}`);
    return value;
  };
  const observedAt = number('time', 0, Number.MAX_SAFE_INTEGER) * 1000;
  if (now - observedAt > 2 * 3600000 || observedAt - now > 15 * 60000)
    throw new Error('Stale current conditions');
  const { preset, label } = weatherCode(number('weather_code', 0, 99));
  const cloud = number('cloud_cover', 0, 100) / 100;
  const precipitation = number('precipitation', 0, 1000);
  const snow = number('snowfall', 0, 1000);
  const wind = number('wind_speed_10m', 0, 150);
  const gust = number('wind_gusts_10m', 0, 200);
  const windDirection = number('wind_direction_10m', 0, 360);
  const profile = { ...WEATHER_PROFILES[preset] };
  profile.cloudCoverage = cloud;
  profile.cloudDarkness = Math.max(
    profile.cloudDarkness * 0.5,
    cloud * (preset === 'CLEAR' ? 0.1 : 0.75),
  );
  profile.sunlightMultiplier = Math.max(0.12, 1 - profile.cloudDarkness * 0.9);
  profile.windStrength = clamp(wind / 16, 0.8);
  profile.windGust = clamp(Math.max(0, gust - wind) / 25, 0.2);
  profile.rainIntensity = ['RAIN', 'DRIZZLE', 'THUNDERSTORM'].includes(preset)
    ? clamp(0.08 + precipitation / 5)
    : 0;
  profile.snowIntensity = preset === 'SNOW' ? clamp(0.15 + snow / 1.5) : 0;
  return { preset, label, profile, windDirection, observedAt, timezone };
}

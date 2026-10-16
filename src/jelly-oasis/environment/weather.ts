export const WEATHER_PRESETS = [
  'CLEAR',
  'PARTLY_CLOUDY',
  'OVERCAST',
  'RAIN',
  'MIST',
] as const;
export type WeatherPreset = (typeof WEATHER_PRESETS)[number];
export interface WeatherProfile {
  windStrength: number;
  windGust: number;
  cloudCoverage: number;
  cloudDarkness: number;
  sunlightMultiplier: number;
  ambientMultiplier: number;
  fogStrength: number;
  rainIntensity: number;
}
export const WEATHER_PROFILES: Record<WeatherPreset, Readonly<WeatherProfile>> = {
  CLEAR: {
    windStrength: 0.24,
    windGust: 0.12,
    cloudCoverage: 0.22,
    cloudDarkness: 0,
    sunlightMultiplier: 1,
    ambientMultiplier: 1,
    fogStrength: 0.08,
    rainIntensity: 0,
  },
  PARTLY_CLOUDY: {
    windStrength: 0.32,
    windGust: 0.15,
    cloudCoverage: 0.55,
    cloudDarkness: 0.1,
    sunlightMultiplier: 0.85,
    ambientMultiplier: 0.96,
    fogStrength: 0.15,
    rainIntensity: 0,
  },
  OVERCAST: {
    windStrength: 0.43,
    windGust: 0.19,
    cloudCoverage: 1,
    cloudDarkness: 0.62,
    sunlightMultiplier: 0.3,
    ambientMultiplier: 0.88,
    fogStrength: 0.48,
    rainIntensity: 0,
  },
  RAIN: {
    windStrength: 0.58,
    windGust: 0.24,
    cloudCoverage: 1,
    cloudDarkness: 0.85,
    sunlightMultiplier: 0.18,
    ambientMultiplier: 0.82,
    fogStrength: 0.66,
    rainIntensity: 0.85,
  },
  MIST: {
    windStrength: 0.12,
    windGust: 0.06,
    cloudCoverage: 0.4,
    cloudDarkness: 0.24,
    sunlightMultiplier: 0.55,
    ambientMultiplier: 0.94,
    fogStrength: 1,
    rainIntensity: 0,
  },
};
export const WEATHER_LABELS: Record<WeatherPreset, string> = {
  CLEAR: '맑음',
  PARTLY_CLOUDY: '구름 조금',
  OVERCAST: '흐림',
  RAIN: '비',
  MIST: '옅은 안개',
};
const CHANNELS = Object.keys(WEATHER_PROFILES.CLEAR) as (keyof WeatherProfile)[];
export function blendWeather(
  from: Readonly<WeatherProfile>,
  to: Readonly<WeatherProfile>,
  amount: number,
  out: WeatherProfile,
): WeatherProfile {
  const t = Number.isFinite(amount) ? Math.min(1, Math.max(0, amount)) : 0;
  if (t === 0) return Object.assign(out, from);
  if (t === 1) return Object.assign(out, to);
  const blend = t * t * (3 - 2 * t);
  for (const channel of CHANNELS)
    out[channel] = from[channel] + (to[channel] - from[channel]) * blend;
  return out;
}
export interface EnvironmentState {
  timeOfDay: number;
  weather: WeatherPreset;
  weatherBlend: number;
  playing: boolean;
  speed: number;
}
export const ENVIRONMENT_CONFIG = {
  cycleSeconds: 960,
  autoWeatherMinSeconds: 120,
  autoWeatherMaxSeconds: 240,
  transitionSeconds: 5,
  desktopRainCount: 420,
  mobileRainCount: 180,
  cloudClusters: 10,
  puffsPerCluster: 5,
  starCount: 360,
};
/** Each system gets its own deterministic stream, without global random state. */
export function seededRandom(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

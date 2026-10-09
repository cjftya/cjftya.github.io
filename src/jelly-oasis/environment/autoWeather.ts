import { ENVIRONMENT_CONFIG, seededRandom, WEATHER_PRESETS } from './weather';
import type { WeatherPreset } from './weather';

// Adjacent conditions dominate; every other preset remains reachable.
const WEIGHTS: Record<WeatherPreset, readonly number[]> = {
  CLEAR: [0, 8, 1, 0.1, 2],
  PARTLY_CLOUDY: [4, 0, 5, 1, 2],
  OVERCAST: [1, 4, 0, 5, 3],
  RAIN: [0.1, 1, 7, 0, 4],
  MIST: [2, 3, 5, 1, 0],
};

/** No wall-clock timers: hidden pages cannot accumulate missed weather changes. */
export class AutoWeather {
  private readonly random: () => number;
  secondsUntilNext = 0;
  constructor(
    readonly seed = Math.floor(Math.random() * 4294967296),
    public enabled = true,
  ) {
    this.random = seededRandom(seed);
    this.reset();
  }
  reset(): void {
    this.secondsUntilNext =
      ENVIRONMENT_CONFIG.autoWeatherMinSeconds +
      this.random() *
        (ENVIRONMENT_CONFIG.autoWeatherMaxSeconds -
          ENVIRONMENT_CONFIG.autoWeatherMinSeconds);
  }
  setEnabled(enabled: boolean): void {
    if (enabled && !this.enabled) this.reset();
    this.enabled = enabled;
  }
  update(seconds: number, current: WeatherPreset): WeatherPreset | null {
    if (!this.enabled || !Number.isFinite(seconds) || seconds <= 0) return null;
    this.secondsUntilNext -= seconds;
    if (this.secondsUntilNext > 1e-8) return null;
    const weights = WEIGHTS[current];
    let choice = this.random() * weights.reduce((a, b) => a + b, 0);
    let next: WeatherPreset = current;
    for (let i = 0; i < weights.length; i++) {
      choice -= weights[i]!;
      if (choice < 0) {
        next = WEATHER_PRESETS[i]!;
        break;
      }
    }
    this.reset();
    return next;
  }
}

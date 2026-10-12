import { Vector2 } from 'three';
import type { Vector4 } from 'three';
import { seededRandom } from '../../environment/weather';

export class PondImpulseScheduler {
  private readonly random;
  private readonly candidates: Vector2[] = [];
  private ambientClock = 0;
  private ambientDelay = 0;
  private rainCredit = 0;
  private elapsed = 0;
  private ambient = 0;
  private rain = 0;
  private dropped = 0;
  private last: {
    source: string;
    point: number[];
    strength: number;
    radius: number;
  } | null = null;
  constructor(
    bounds: Vector4,
    mask: (x: number, z: number) => number,
    private readonly mobile: boolean,
    seed = 19271,
    n = 64,
  ) {
    this.random = seededRandom(seed);
    this.ambientDelay = this.delay();
    for (let j = 0; j < n; j++)
      for (let i = 0; i < n; i++) {
        const x = bounds.x + ((i + 0.5) / n) * bounds.z,
          z = bounds.y + ((j + 0.5) / n) * bounds.w;
        if (mask(x, z) >= 0.7) this.candidates.push(new Vector2(x, z));
      }
  }
  private delay() {
    return 1.8 + this.random() * 1.7;
  }
  update(
    dt: number,
    rainIntensity: number,
    stopped: boolean,
    emit: (point: Vector2, strength: number, radius: number) => boolean,
  ) {
    if (stopped || !Number.isFinite(dt) || dt <= 0 || dt > 0.15) {
      this.rainCredit = 0;
      return;
    }
    if (!this.candidates.length) return;
    const seconds = Math.min(dt, 0.05),
      wet = Math.max(
        0,
        Math.min(1, (Number.isFinite(rainIntensity) ? rainIntensity : 0) / 0.85),
      );
    this.elapsed += seconds;
    this.ambientClock += seconds * (1 - wet);
    const impact = (source: 'ambient' | 'rain') => {
      const point =
        this.candidates[Math.floor(this.random() * this.candidates.length)]!;
      const strength =
        source === 'ambient'
          ? 0.035 + this.random() * 0.045
          : 0.008 + this.random() * 0.017;
      const radius =
        source === 'ambient' ? 0.6 + this.random() * 0.5 : 0.25 + this.random() * 0.3;
      if (!emit(point, strength, radius)) {
        this.dropped++;
        return;
      }
      if (source === 'rain') this.rain++;
      else this.ambient++;
      this.last = { source, point: point.toArray(), strength, radius };
    };
    if (this.ambientClock >= this.ambientDelay) {
      impact('ambient');
      this.ambientClock = 0;
      this.ambientDelay = this.delay();
    }
    this.rainCredit += seconds * wet * (this.mobile ? 4 : 8);
    let budget = 2;
    while (this.rainCredit >= 1 && budget-- > 0) {
      impact('rain');
      this.rainCredit -= 1;
    }
    if (this.rainCredit >= 1) {
      this.dropped += Math.floor(this.rainCredit);
      this.rainCredit %= 1;
    }
  }
  snapshot() {
    return {
      ambient: this.ambient,
      rain: this.rain,
      dropped: this.dropped,
      elapsed: this.elapsed,
      averageRate: this.elapsed ? (this.rain + this.ambient) / this.elapsed : 0,
      candidates: this.candidates.length,
      last: this.last,
    };
  }
}

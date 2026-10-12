import {
  DataTexture,
  FloatType,
  LinearFilter,
  RGBAFormat,
  UnsignedByteType,
  Vector2,
  Vector4,
} from 'three';
import type { BufferGeometry } from 'three';
import { pondDomain, waveCoefficients } from './gpgpuPondSurface';
import type { GPGPUPondSurface, PondControls } from './gpgpuPondSurface';

export type PondSurface = Pick<
  GPGPUPondSurface,
  | 'n'
  | 'bounds'
  | 'maskTexture'
  | 'active'
  | 'amplitude'
  | 'neutral'
  | 'texture'
  | 'diagnosticPoint'
  | 'maskAt'
  | 'paused'
  | 'impulse'
  | 'configure'
  | 'suspend'
  | 'reset'
  | 'update'
  | 'readHeights'
  | 'dispose'
>;

/** Same damped height equation as the GPU, with a bounded 32² CPU budget. */
export class CPUPondSurface implements PondSurface {
  readonly n = 32;
  readonly bounds: Vector4;
  readonly maskAt: (x: number, z: number) => number;
  readonly maskTexture: DataTexture;
  readonly active = { value: 1 };
  readonly amplitude = { value: 1 };
  readonly neutral = { value: 0 };
  readonly diagnosticPoint = new Vector2();
  readonly texture;
  paused = false;
  private current = new Float32Array(this.n * this.n);
  private previous = new Float32Array(this.n * this.n);
  private next = new Float32Array(this.n * this.n);
  private readonly data = new Float32Array(this.n * this.n * 4);
  private readonly weights = new Float32Array(this.n * this.n);
  private pending: Vector4[] = [];
  private accumulator = 0;
  private damping = 0.995;
  private speed = 3.5;
  private disposed = false;
  constructor(
    geometry: BufferGeometry,
    ground: (x: number, z: number) => number,
    level: number,
  ) {
    const domain = pondDomain(geometry);
    this.bounds = domain.bounds;
    this.maskAt = (x, z) => {
      const d = Math.max(0, Math.min(1, (level - ground(x, z)) / 0.4));
      return domain.mask(x, z) * d * d * (3 - 2 * d);
    };
    const mask = new Uint8Array(this.n * this.n * 4);
    let best = -1;
    for (let j = 0; j < this.n; j++)
      for (let i = 0; i < this.n; i++) {
        const x = this.bounds.x + ((i + 0.5) / this.n) * this.bounds.z;
        const z = this.bounds.y + ((j + 0.5) / this.n) * this.bounds.w;
        const k = j * this.n + i,
          weight = this.maskAt(x, z);
        this.weights[k] = weight;
        mask[k * 4] = Math.round(weight * 255);
        if (weight > best) {
          best = weight;
          this.diagnosticPoint.set(x, z);
        }
      }
    this.maskTexture = new DataTexture(
      mask,
      this.n,
      this.n,
      RGBAFormat,
      UnsignedByteType,
    );
    const field = new DataTexture(this.data, this.n, this.n, RGBAFormat, FloatType);
    for (const t of [field, this.maskTexture]) {
      t.minFilter = t.magFilter = LinearFilter;
      t.needsUpdate = true;
    }
    this.texture = { value: field };
  }
  impulse(point = this.diagnosticPoint, strength = 0.16, radius = 0.65) {
    if (
      this.disposed ||
      this.pending.length >= 4 ||
      this.maskAt(point.x, point.y) < 0.5 ||
      !Number.isFinite(strength) ||
      !Number.isFinite(radius) ||
      radius <= 0
    )
      return false;
    this.pending.push(new Vector4(point.x, point.y, radius, strength));
    return true;
  }
  configure(c: PondControls) {
    if (c.paused !== undefined) {
      this.paused = c.paused;
      this.accumulator = 0;
      this.pending = [];
    }
    if (c.neutral !== undefined) this.neutral.value = +c.neutral;
    if (c.amplitude !== undefined && Number.isFinite(c.amplitude))
      this.amplitude.value = Math.max(0.25, Math.min(2, c.amplitude));
    if (c.damping !== undefined && Number.isFinite(c.damping))
      this.damping = Math.max(0.98, Math.min(0.999, c.damping));
    if (c.waveSpeed !== undefined && Number.isFinite(c.waveSpeed))
      this.speed = Math.max(1, Math.min(5, c.waveSpeed));
    if (c.reset) this.reset();
    if (c.impulse) this.impulse();
  }
  suspend() {
    this.pending = [];
    this.accumulator = 0;
  }
  reset() {
    this.current.fill(0);
    this.previous.fill(0);
    this.next.fill(0);
    this.data.fill(0);
    this.pending = [];
    this.accumulator = 0;
    this.texture.value.needsUpdate = true;
  }
  update(dt: number) {
    if (this.disposed || this.paused || !Number.isFinite(dt) || dt <= 0) return;
    if (dt > 0.15) {
      this.accumulator = 0;
      this.pending = [];
      return;
    }
    this.accumulator += Math.min(dt, 0.05);
    const step = 1 / 60,
      c = waveCoefficients(this.n, this.bounds, this.speed, step);
    for (let pass = 0; this.accumulator >= step && pass < 3; pass++) {
      const pulse = this.pending.shift();
      for (let j = 0; j < this.n; j++)
        for (let i = 0; i < this.n; i++) {
          const k = j * this.n + i,
            h = this.current[k]!;
          let value =
            (2 * h -
              this.previous[k]! +
              c.x *
                (this.current[j * this.n + Math.min(this.n - 1, i + 1)]! +
                  this.current[j * this.n + Math.max(0, i - 1)]! -
                  2 * h) +
              c.y *
                (this.current[Math.min(this.n - 1, j + 1) * this.n + i]! +
                  this.current[Math.max(0, j - 1) * this.n + i]! -
                  2 * h)) *
            this.damping;
          if (pulse) {
            const x = this.bounds.x + ((i + 0.5) / this.n) * this.bounds.z,
              z = this.bounds.y + ((j + 0.5) / this.n) * this.bounds.w;
            const influence = Math.max(
              0,
              1 - Math.hypot(x - pulse.x, z - pulse.y) / pulse.z,
            );
            value += influence * influence * pulse.w;
          }
          this.next[k] = Math.max(-0.35, Math.min(0.35, value * this.weights[k]!));
        }
      const old = this.current;
      this.current = this.next;
      this.next = this.previous;
      this.previous = old;
      // Previous height is shore-damped just like the GPU G channel.
      for (let k = 0; k < this.previous.length; k++)
        this.previous[k] = this.previous[k]! * this.weights[k]!;
      this.accumulator -= step;
    }
    this.accumulator %= step;
    for (let k = 0; k < this.current.length; k++) this.data[k * 4] = this.current[k]!;
    this.texture.value.needsUpdate = true;
  }
  readHeights() {
    return this.data.slice();
  }
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.active.value = 0;
    this.pending = [];
    this.texture.value.dispose();
    this.maskTexture.dispose();
  }
}

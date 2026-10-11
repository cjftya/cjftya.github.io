import {
  DataTexture,
  LinearFilter,
  RGBAFormat,
  UnsignedByteType,
  Vector2,
} from 'three';
import type { Vector4 } from 'three';
// Display gain only; the conservative solver and its height texture stay unchanged.
const RENDER_WAVE_SCALE = 3;
export interface InletSource {
  point: Vector2;
  direction: Vector2;
  width: number;
  speed: number;
  discharge: number;
}
/** Linear depth-averaged shallow-water approximation on staggered faces.
 * Conservative H flux; balanced distributed return drain; reflective dry faces.
 * CPU backend deliberately avoids float render targets; byte field works on WebGL2.
 * No full nonlinear hydraulic jumps or 3D volume simulation. */
export class ShallowWater {
  readonly n: number;
  readonly bounds: Vector4;
  readonly depth: Float32Array;
  readonly height: Float32Array;
  readonly u: Float32Array;
  readonly v: Float32Array;
  readonly foam: Float32Array;
  readonly texture: DataTexture;
  private readonly weights: Float32Array;
  private readonly nextFoam: Float32Array;
  private readonly bytes: Uint8Array;
  private readonly dx: number;
  private readonly dz: number;
  private readonly gravity: number;
  private readonly step: number;
  private accumulator = 0;
  private elapsed = 0;
  private active = 0;
  private weightSum = 0;
  private input = 0;
  private output = 0;
  private initialVolume = 0;
  private dropped = 0;
  private updateCpuMs = 0;
  private cpuTotal = 0;
  private updates = 0;
  private source: InletSource;
  flowRate = 1;
  constructor(
    n: number,
    bounds: Vector4,
    bed: (x: number, z: number) => number,
    source: InletSource,
    scale = 1,
  ) {
    this.n = n;
    this.bounds = bounds;
    this.source = source;
    this.dx = bounds.z / n;
    this.dz = bounds.w / n;
    this.gravity = 9.81 / scale;
    this.depth = new Float32Array(n * n);
    this.height = new Float32Array(n * n);
    this.foam = new Float32Array(n * n);
    this.nextFoam = new Float32Array(n * n);
    this.weights = new Float32Array(n * n);
    this.u = new Float32Array((n + 1) * n);
    this.v = new Float32Array(n * (n + 1));
    this.bytes = new Uint8Array(n * n * 4);
    this.texture = new DataTexture(this.bytes, n, n, RGBAFormat, UnsignedByteType);
    this.texture.minFilter = this.texture.magFilter = LinearFilter;
    this.texture.generateMipmaps = false;
    let maxDepth = 0;
    for (let j = 0; j < n; j++)
      for (let i = 0; i < n; i++) {
        const k = j * n + i,
          x = bounds.x + (i + 0.5) * this.dx,
          z = bounds.y + (j + 0.5) * this.dz;
        const d = Math.max(0, bed(x, z));
        this.depth[k] = d > 0.025 ? Math.min(d, 2.5) : 0;
        if (this.depth[k]! > 0) {
          this.active++;
          this.initialVolume += this.depth[k]! * this.dx * this.dz;
          maxDepth = Math.max(maxDepth, d);
        }
        const delta = new Vector2(x - source.point.x, z - source.point.y),
          along = delta.dot(source.direction);
        const across = delta.x * source.direction.y - delta.y * source.direction.x;
        const weight =
          this.depth[k]! > 0
            ? Math.exp(
                (-across * across) / (source.width * source.width * 0.18) -
                  (along * along) / 0.8,
              )
            : 0;
        this.weights[k] = weight;
        this.weightSum += weight;
      }
    // Conservative fixed timestep derived from the maximum depth and speed budget.
    this.step = Math.min(
      1 / 120,
      (0.32 * Math.min(this.dx, this.dz)) /
        (Math.sqrt(this.gravity * Math.max(maxDepth, 0.03)) + 4),
    );
    this.upload();
  }
  update(dt: number, paused = false) {
    if (paused || !Number.isFinite(dt) || dt <= 0) {
      this.accumulator = 0;
      return;
    }
    const started = performance.now();
    const accepted = Math.min(dt, 0.1);
    this.dropped += Math.max(0, dt - accepted);
    this.accumulator += accepted;
    let steps = 0;
    while (this.accumulator >= this.step && steps < 24) {
      this.integrate(this.step);
      this.accumulator -= this.step;
      steps++;
    }
    if (steps === 24) {
      this.dropped += this.accumulator;
      this.accumulator = 0;
    }
    this.upload();
    this.updateCpuMs = performance.now() - started;
    this.cpuTotal += this.updateCpuMs;
    this.updates++;
  }
  private integrate(dt: number) {
    const n = this.n,
      h = this.height,
      d = this.depth,
      g = this.gravity;
    const drag = Math.exp(-dt * 1.8);
    for (let j = 0; j < n; j++)
      for (let i = 1; i < n; i++) {
        const left = j * n + i - 1,
          right = left + 1,
          k = j * (n + 1) + i;
        this.u[k] =
          d[left]! > 0 && d[right]! > 0
            ? Math.max(
                -4,
                Math.min(
                  4,
                  (this.u[k]! - (g * dt * (h[right]! - h[left]!)) / this.dx) * drag,
                ),
              )
            : 0;
      }
    for (let j = 1; j < n; j++)
      for (let i = 0; i < n; i++) {
        const bottom = (j - 1) * n + i,
          top = bottom + n,
          k = j * n + i;
        this.v[k] =
          d[bottom]! > 0 && d[top]! > 0
            ? Math.max(
                -4,
                Math.min(
                  4,
                  (this.v[k]! - (g * dt * (h[top]! - h[bottom]!)) / this.dz) * drag,
                ),
              )
            : 0;
      }
    const q = Math.max(0, Math.min(3, this.flowRate)) * this.source.discharge;
    const pulse =
      1 +
      0.27 * Math.sin(this.elapsed * 8.1) +
      0.13 * Math.sin(this.elapsed * 13.7 + 0.8);
    const amount = q * pulse * dt,
      area = this.dx * this.dz;
    if (this.weightSum > 1e-8) {
      this.input += amount;
      this.output += amount;
      for (let j = 0; j < n; j++)
        for (let i = 0; i < n; i++) {
          const k = j * n + i;
          if (d[k]! <= 0) continue;
          const weight = this.weights[k]! / this.weightSum;
          // Momentum has the same inlet direction and Q as the cliff/channel model.
          const force =
            ((dt * q * weight) / Math.max(0.025, d[k]! * area)) * this.source.speed;
          const uk = j * (n + 1) + i + 1,
            vk = (j + 1) * n + i;
          if (i < n - 1 && d[k + 1]! > 0)
            this.u[uk] = Math.max(
              -4,
              Math.min(
                4,
                this.u[uk]! +
                  force *
                    (this.source.direction.x +
                      0.28 *
                        Math.sin(this.elapsed * 3.7 + j * 0.37) *
                        this.source.direction.y),
              ),
            );
          if (j < n - 1 && d[k + n]! > 0)
            this.v[vk] = Math.max(
              -4,
              Math.min(
                4,
                this.v[vk]! +
                  force *
                    (this.source.direction.y -
                      0.28 *
                        Math.sin(this.elapsed * 3.7 + i * 0.29) *
                        this.source.direction.x),
              ),
            );
          h[k] = h[k]! + (amount * (weight - 1 / this.active)) / area;
        }
    }
    for (let j = 0; j < n; j++)
      for (let i = 0; i < n; i++) {
        const k = j * n + i;
        if (d[k]! <= 0) continue;
        const faceDepth = (other: number) =>
          other >= 0 && other < n * n && d[other]! > 0 ? Math.min(d[k]!, d[other]!) : 0;
        const divergence =
          (this.u[j * (n + 1) + i + 1]! * faceDepth(i < n - 1 ? k + 1 : -1) -
            this.u[j * (n + 1) + i]! * faceDepth(i > 0 ? k - 1 : -1)) /
            this.dx +
          (this.v[(j + 1) * n + i]! * faceDepth(j < n - 1 ? k + n : -1) -
            this.v[j * n + i]! * faceDepth(j > 0 ? k - n : -1)) /
            this.dz;
        h[k] = h[k]! - dt * divergence;
        const vx = (this.u[j * (n + 1) + i]! + this.u[j * (n + 1) + i + 1]!) * 0.5,
          vz = (this.v[j * n + i]! + this.v[(j + 1) * n + i]!) * 0.5;
        // Upwind transport and finite lifetime, with strain-driven local generation.
        const upstreamX = vx >= 0 ? Math.max(0, i - 1) : Math.min(n - 1, i + 1),
          upstreamZ = vz >= 0 ? Math.max(0, j - 1) : Math.min(n - 1, j + 1);
        const transported =
          this.foam[k]! +
          ((Math.abs(vx) * dt) / this.dx) *
            (this.foam[j * n + upstreamX]! - this.foam[k]!) +
          ((Math.abs(vz) * dt) / this.dz) *
            (this.foam[upstreamZ * n + i]! - this.foam[k]!);
        this.nextFoam[k] = Math.min(
          0.65,
          Math.max(
            0,
            transported * Math.exp(-dt * 0.85) +
              dt * Math.max(0, Math.abs(divergence) - 0.08) * 0.18,
          ),
        );
      }
    this.foam.set(this.nextFoam);
    this.elapsed += dt;
    // Enforce bounded energy while preserving mean height (balanced water volume).
    let mean = 0;
    for (let k = 0; k < h.length; k++)
      if (d[k]! > 0) {
        h[k] = Number.isFinite(h[k])
          ? Math.max(-Math.min(0.24, d[k]! * 0.7), Math.min(0.24, h[k]!))
          : 0;
        mean += h[k]!;
      }
    mean /= Math.max(1, this.active);
    for (let k = 0; k < h.length; k++) if (d[k]! > 0) h[k] = h[k]! - mean;
  }
  private upload() {
    const n = this.n;
    for (let j = 0; j < n; j++)
      for (let i = 0; i < n; i++) {
        const k = j * n + i,
          base = k * 4;
        this.bytes[base] = Math.round(128 + (this.height[k]! / 0.3) * 127);
        this.bytes[base + 1] = Math.round(
          128 + ((this.u[j * (n + 1) + i]! + this.u[j * (n + 1) + i + 1]!) / 8) * 127,
        );
        this.bytes[base + 2] = Math.round(
          128 + ((this.v[j * n + i]! + this.v[(j + 1) * n + i]!) / 8) * 127,
        );
        this.bytes[base + 3] = Math.round(this.foam[k]! * 255);
      }
    this.texture.needsUpdate = true;
  }
  snapshot() {
    let mass = 0,
      maxHeight = 0,
      maxSpeed = 0,
      energy = 0;
    for (let k = 0; k < this.height.length; k++) {
      mass += this.height[k]! * this.dx * this.dz;
      maxHeight = Math.max(maxHeight, Math.abs(this.height[k]!));
      energy += this.height[k]! ** 2;
    }
    for (const speed of [...this.u, ...this.v])
      maxSpeed = Math.max(maxSpeed, Math.abs(speed));
    return {
      backend: 'cpu-staggered-shallow-water',
      updateCpuMs: this.updateCpuMs,
      averageUpdateCpuMs: this.cpuTotal / Math.max(1, this.updates),
      renderWaveScale: RENDER_WAVE_SCALE,
      resolution: this.n,
      elapsed: this.elapsed,
      fixedDt: this.step,
      cfl:
        ((Math.sqrt(this.gravity * 2.5) + 4) * this.step) / Math.min(this.dx, this.dz),
      maxHeight,
      maxSpeed,
      heightEnergy: energy,
      meanHeight: mass / (Math.max(1, this.active) * this.dx * this.dz),
      volume: this.initialVolume + mass,
      inputVolume: this.input,
      returnDrainVolume: this.output,
      massError: mass - this.input + this.output,
      droppedTime: this.dropped,
      textureBytes: this.bytes.byteLength,
      flowRate: this.flowRate,
      source: {
        ...this.source,
        point: this.source.point.toArray(),
        direction: this.source.direction.toArray(),
      },
    };
  }
  dispose() {
    this.texture.dispose();
  }
}
export const shallowWaterGLSL = `
uniform sampler2D fluidField; uniform vec4 fluidBounds;
vec4 fluidSample(vec2 p) {
 vec2 uv=(p-fluidBounds.xy)/fluidBounds.zw;
 float valid=step(0.0,uv.x)*step(0.0,uv.y)*step(uv.x,1.0)*step(uv.y,1.0);
 vec4 f=texture2D(fluidField,clamp(uv,0.0,1.0));
 return vec4((f.r*255.0-128.0)/127.0*0.3,(f.gb*255.0-128.0)/127.0*4.0,f.a)*valid;
}
float waterHeight(vec2 p,float depth){
 float ambient=sin(dot(p,vec2(1.31,0.73))-waterTime*0.68)*0.014
   +sin(dot(p,vec2(-2.17,2.63))-waterTime*0.97)*0.008
   +sin(dot(p,vec2(5.37,3.91))+waterTime*1.19)*0.003;
 return fluidSample(p).r*${RENDER_WAVE_SCALE.toFixed(1)}*smoothstep(0.015,0.24,depth)
   +ambient*smoothstep(0.02,0.5,depth);
}
float waterFoam(vec2 p,float depth){return fluidSample(p).a*smoothstep(0.03,0.2,depth);}
`;

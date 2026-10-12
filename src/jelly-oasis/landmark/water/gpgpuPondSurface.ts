import {
  DataTexture,
  FloatType,
  HalfFloatType,
  LinearFilter,
  RGBAFormat,
  UnsignedByteType,
  Vector2,
  Vector4,
} from 'three';
import type { BufferGeometry, WebGLRenderer } from 'three';
import { GPUComputationRenderer } from 'three/examples/jsm/misc/GPUComputationRenderer.js';
import { pondComputeGLSL } from './gpgpuPondShader';

export interface PondControls {
  neutral?: boolean;
  wireframe?: boolean;
  paused?: boolean;
  amplitude?: number;
  damping?: number;
  waveSpeed?: number;
  reset?: boolean;
  impulse?: boolean;
}

/** Keep the exact polygon footprint. Distance to its boundary supplies a C1 fade. */
export function pondDomain(geometry: BufferGeometry, shoreWidth = 0.8) {
  geometry.computeBoundingBox();
  const box = geometry.boundingBox!;
  const bounds = new Vector4(
    box.min.x,
    box.min.z,
    box.max.x - box.min.x,
    box.max.z - box.min.z,
  );
  const p = geometry.attributes.position!,
    index = geometry.index!;
  const edges = new Map<string, { a: number; b: number; count: number }>();
  for (let i = 0; i < index.count; i += 3) {
    const ids = [index.getX(i), index.getX(i + 1), index.getX(i + 2)];
    for (let j = 0; j < 3; j++) {
      const a = ids[j]!,
        b = ids[(j + 1) % 3]!;
      const key = a < b ? `${a}:${b}` : `${b}:${a}`;
      const edge = edges.get(key);
      if (edge) edge.count++;
      else edges.set(key, { a, b, count: 1 });
    }
  }
  const boundary = [...edges.values()].filter((e) => e.count === 1);
  const mask = (x: number, z: number) => {
    let inside = false;
    for (let k = 0; k < index.count; k += 3) {
      const a = index.getX(k),
        b = index.getX(k + 1),
        c = index.getX(k + 2);
      const ax = p.getX(a),
        az = p.getZ(a),
        bx = p.getX(b),
        bz = p.getZ(b),
        cx = p.getX(c),
        cz = p.getZ(c);
      const det = (bz - cz) * (ax - cx) + (cx - bx) * (az - cz);
      if (Math.abs(det) < 1e-12) continue;
      const u = ((bz - cz) * (x - cx) + (cx - bx) * (z - cz)) / det;
      const v = ((cz - az) * (x - cx) + (ax - cx) * (z - cz)) / det;
      if (u >= -1e-8 && v >= -1e-8 && u + v <= 1 + 1e-8) {
        inside = true;
        break;
      }
    }
    if (!inside) return 0;
    let distance = Infinity;
    for (const { a, b } of boundary) {
      const ax = p.getX(a),
        az = p.getZ(a),
        dx = p.getX(b) - ax,
        dz = p.getZ(b) - az;
      const t = Math.max(
        0,
        Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1)),
      );
      distance = Math.min(distance, Math.hypot(x - ax - t * dx, z - az - t * dz));
    }
    const t = Math.min(1, distance / shoreWidth);
    return t * t * (3 - 2 * t);
  };
  return { bounds, mask, boundaryEdges: boundary.length };
}

export function waveCoefficients(
  n: number,
  bounds: Vector4,
  speed: number,
  step: number,
) {
  const dx = bounds.z / n,
    dz = bounds.w / n;
  // Two-dimensional CFL stability: cx + cz <= 0.45, below the 1.0 limit.
  const requested = new Vector2(((speed * step) / dx) ** 2, ((speed * step) / dz) ** 2);
  if (requested.x + requested.y > 0.45)
    requested.multiplyScalar(0.45 / (requested.x + requested.y));
  return requested;
}

/** GPU resource owner. No readback in the frame loop. */
export class GPGPUPondSurface {
  readonly n: number;
  readonly bounds: Vector4;
  readonly maskTexture: DataTexture;
  readonly active = { value: 1 };
  readonly amplitude = { value: 1 };
  readonly neutral = { value: 1 };
  readonly texture;
  readonly inlet: Vector2;
  readonly diagnosticPoint: Vector2;
  flowRate = 1;
  automaticInlet = true;
  paused = false;
  private readonly gpu: GPUComputationRenderer;
  private readonly variable;
  private readonly step = 1 / 60;
  private accumulator = 0;
  private inletClock = 0;
  private steps = 0;
  private dropped = 0;
  private pulses = 0;
  private cpuMs = 0;
  private disposed = false;
  private pending: Vector4[] = [];
  private speed = 3.5;
  private damping = 0.995;
  readonly maskAt: (x: number, z: number) => number;
  constructor(
    renderer: WebGLRenderer,
    geometry: BufferGeometry,
    inlet: Vector2 | undefined,
    direction: Vector2 | undefined,
    ground: (x: number, z: number) => number,
    level: number,
    mobile: boolean,
  ) {
    if (
      !renderer.extensions.has('EXT_color_buffer_float') ||
      renderer.capabilities.maxVertexTextures < 1
    )
      throw new Error('Float render targets or vertex textures unavailable');
    this.n = mobile ? 64 : 128;
    const domain = pondDomain(geometry);
    this.bounds = domain.bounds;
    // Pond-only uses the full depth mask; legacy coupled callers retain inlet fading.
    this.maskAt = (x, z) => {
      const t =
        !inlet || !direction
          ? 1
          : Math.max(
              0,
              Math.min(1, (new Vector2(x, z).sub(inlet!).dot(direction!) - 0.15) / 1),
            );
      const depth = Math.max(0, Math.min(1, (level - ground(x, z)) / 0.4));
      return domain.mask(x, z) * t * t * (3 - 2 * t) * depth * depth * (3 - 2 * depth);
    };
    this.inlet =
      inlet && direction
        ? inlet.clone().addScaledVector(direction, 1.8)
        : new Vector2();
    this.automaticInlet = !!inlet && !!direction;
    this.diagnosticPoint = new Vector2(
      this.bounds.x + this.bounds.z / 2,
      this.bounds.y + this.bounds.w / 2,
    );
    const bytes = new Uint8Array(this.n * this.n * 4);
    for (let j = 0; j < this.n; j++)
      for (let i = 0; i < this.n; i++) {
        const x = this.bounds.x + ((i + 0.5) / this.n) * this.bounds.z;
        const z = this.bounds.y + ((j + 0.5) / this.n) * this.bounds.w;
        const weight = this.maskAt(x, z);
        bytes[(j * this.n + i) * 4] = Math.round(weight * 255);
      }
    if (this.maskAt(this.diagnosticPoint.x, this.diagnosticPoint.y) < 0.95) {
      let bestWeight = -1;
      for (let j = 0; j < this.n; j++)
        for (let i = 0; i < this.n; i++) {
          const weight = bytes[(j * this.n + i) * 4]!;
          if (weight > bestWeight) {
            bestWeight = weight;
            this.diagnosticPoint.set(
              this.bounds.x + ((i + 0.5) / this.n) * this.bounds.z,
              this.bounds.y + ((j + 0.5) / this.n) * this.bounds.w,
            );
          }
        }
    }
    this.maskTexture = new DataTexture(
      bytes,
      this.n,
      this.n,
      RGBAFormat,
      UnsignedByteType,
    );
    this.maskTexture.minFilter = this.maskTexture.magFilter = LinearFilter;
    this.maskTexture.needsUpdate = true;
    this.gpu = new GPUComputationRenderer(this.n, this.n, renderer);
    this.gpu.setDataType(HalfFloatType);
    this.variable = this.gpu.addVariable(
      'pondState',
      pondComputeGLSL,
      this.gpu.createTexture(),
    );
    this.variable.minFilter = this.variable.magFilter = LinearFilter;
    this.gpu.setVariableDependencies(this.variable, [this.variable]);
    Object.assign(this.variable.material.uniforms, {
      pondMask: { value: this.maskTexture },
      pondBounds: { value: this.bounds },
      impulse: { value: new Vector4(0, 0, 1, 0) },
      courant: { value: waveCoefficients(this.n, this.bounds, this.speed, this.step) },
      damping: { value: this.damping },
    });
    const previousTarget = renderer.getRenderTarget();
    const prior = renderer.debug.onShaderError;
    let shaderFailed = false;
    renderer.debug.onShaderError = () => {
      shaderFailed = true;
    };
    try {
      const error = this.gpu.init();
      if (error) throw new Error(error);
      for (const target of this.variable.renderTargets) {
        renderer.setRenderTarget(target);
        const gl = renderer.getContext();
        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE)
          throw new Error('Incomplete GPU pond framebuffer');
      }
      renderer.setRenderTarget(previousTarget);
      this.gpu.compute();
      if (shaderFailed) throw new Error('GPU pond shader compilation failed');
      this.texture = { value: this.gpu.getCurrentRenderTarget(this.variable).texture };
    } catch (error) {
      this.gpu.dispose();
      this.maskTexture.dispose();
      throw error;
    } finally {
      renderer.setRenderTarget(previousTarget);
      renderer.debug.onShaderError = prior;
    }
  }
  impulse(point = this.diagnosticPoint, strength = 0.16, radius = 0.65) {
    if (
      this.disposed ||
      !Number.isFinite(strength) ||
      !Number.isFinite(radius) ||
      radius <= 0 ||
      this.maskAt(point.x, point.y) < 0.5 ||
      this.pending.length >= 4
    )
      return false;
    this.pending.push(new Vector4(point.x, point.y, radius, strength));
    return true;
  }
  configure(controls: PondControls) {
    if (controls.paused !== undefined) {
      this.paused = controls.paused;
      this.suspend();
    }
    if (controls.amplitude !== undefined && Number.isFinite(controls.amplitude))
      this.amplitude.value = Math.max(0.25, Math.min(2, controls.amplitude));
    if (controls.neutral !== undefined) this.neutral.value = +controls.neutral;
    if (controls.damping !== undefined && Number.isFinite(controls.damping))
      this.damping = Math.max(0.98, Math.min(0.999, controls.damping));
    if (controls.waveSpeed !== undefined && Number.isFinite(controls.waveSpeed))
      this.speed = Math.max(1, Math.min(5, controls.waveSpeed));
    if (controls.reset) this.reset();
    if (controls.impulse) this.impulse();
  }
  suspend() {
    this.pending = [];
    this.accumulator = 0;
  }
  reset() {
    this.pending = [];
    this.pulses = 0;
    this.accumulator = this.inletClock = 0;
    for (const target of this.variable.renderTargets)
      this.gpu.renderTexture(this.variable.initialValueTexture, target);
    this.texture.value = this.gpu.getCurrentRenderTarget(this.variable).texture;
  }
  update(dt: number) {
    if (
      this.disposed ||
      this.paused ||
      !this.active.value ||
      !Number.isFinite(dt) ||
      dt <= 0
    )
      return;
    const start = performance.now();
    // A resumed tab never catches up its stale elapsed time.
    if (dt > 0.15) {
      this.suspend();
      this.dropped++;
      return;
    }
    this.accumulator += Math.min(dt, 0.05);
    let substeps = 0;
    while (this.accumulator >= this.step && substeps < 3) {
      this.inletClock += this.step;
      if (
        this.automaticInlet &&
        this.flowRate > 0 &&
        this.inletClock > 0.38 + 0.1 * Math.sin(this.pulses * 2.4)
      ) {
        const point = this.inlet
          .clone()
          .add(new Vector2(Math.sin(this.pulses * 1.7) * 0.15, 0));
        this.impulse(
          point,
          (0.012 + 0.005 * Math.sin(this.pulses * 2.1)) * this.flowRate,
          0.65,
        );
        this.inletClock = 0;
        this.pulses++;
      }
      const uniforms = this.variable.material.uniforms;
      uniforms.impulse!.value.copy(this.pending.shift() ?? new Vector4(0, 0, 1, 0));
      uniforms.courant!.value.copy(
        waveCoefficients(this.n, this.bounds, this.speed, this.step),
      );
      uniforms.damping!.value = this.damping;
      this.gpu.compute();
      this.steps++;
      substeps++;
      this.accumulator -= this.step;
    }
    if (this.accumulator >= this.step) {
      this.accumulator %= this.step;
      this.dropped++;
    }
    this.texture.value = this.gpu.getCurrentRenderTarget(this.variable).texture;
    this.cpuMs = performance.now() - start;
  }
  /** Explicit, bounded diagnostic readback; never called by update/snapshot. */
  readHeights(renderer: WebGLRenderer) {
    const target = this.gpu.getCurrentRenderTarget(this.variable);
    const raw =
      target.texture.type === FloatType
        ? new Float32Array(this.n * this.n * 4)
        : new Uint16Array(this.n * this.n * 4);
    renderer.readRenderTargetPixels(target, 0, 0, this.n, this.n, raw);
    return raw;
  }
  snapshot() {
    return {
      active: !!this.active.value,
      n: this.n,
      bounds: this.bounds.toArray(),
      inlet: this.inlet.toArray(),
      diagnosticPoint: this.diagnosticPoint.toArray(),
      steps: this.steps,
      computePasses: this.steps,
      maxSubsteps: 3,
      dropped: this.dropped,
      updateCpuMs: this.cpuMs,
      flowRate: this.flowRate,
      automaticInlet: this.automaticInlet,
      paused: this.paused,
      amplitude: this.amplitude.value,
      neutral: !!this.neutral.value,
      damping: this.damping,
      waveSpeed: this.speed,
      renderTargets: 2,
      targetBytes: this.n * this.n * 8 * 2,
      shorelineFade: 0.8,
      channelFade: 1,
    };
  }
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.active.value = 0;
    this.gpu.dispose();
    this.maskTexture.dispose();
  }
}

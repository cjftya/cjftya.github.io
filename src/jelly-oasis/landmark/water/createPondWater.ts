import { Group } from 'three';
import type { BufferGeometry, Mesh, MeshStandardMaterial } from 'three';
import { GPGPUPondSurface } from './gpgpuPondSurface';
import type { PondControls } from './gpgpuPondSurface';
import { CPUPondSurface } from './cpuPondSurface';
import type { PondSurface } from './cpuPondSurface';
import { PondImpulseScheduler } from './pondImpulseScheduler';
import { createReflectivePond } from './createReflectivePond';
import { tessellatePond } from './subdividePond';
import type { WaterOptions } from './createWaterEffects';

/** Owns only the pond footprint, solver and planar optics; never traces cliff flow. */
export function createPondWater(
  root: Group,
  content: Group,
  pond: Mesh<BufferGeometry, MeshStandardMaterial>,
  pondY: () => number,
  ground: (x: number, z: number) => number,
  options: WaterOptions,
) {
  const group = new Group();
  group.name = 'PondOnlyWater';
  content.add(group);
  const source = pond.geometry.clone();
  const field: { value: PondSurface | undefined } = { value: undefined };
  let reflection: ReturnType<typeof createReflectivePond> | undefined;
  let scheduler: PondImpulseScheduler;
  let gpuError: string | null = null;
  let solver = 'cpu-heightfield';
  let elapsed = 0,
    environment = '',
    disposed = false,
    shaderFailed = false;
  let controls: PondControls = { neutral: options.gpuNeutral ?? false };
  const priorShaderError = options.renderer?.debug.onShaderError;
  if (options.renderer)
    options.renderer.debug.onShaderError = (...args) => {
      shaderFailed = true;
      priorShaderError?.(...args);
    };
  function rebuild(forceCpu = options.forceCpu ?? false) {
    reflection?.dispose();
    field.value?.dispose();
    field.value = undefined;
    const positions = source.attributes.position!;
    for (let i = 0; i < positions.count; i++) positions.setY(i, pondY());
    gpuError = forceCpu ? 'CPU fallback explicitly selected' : null;
    if (!forceCpu && options.renderer) {
      try {
        field.value = new GPGPUPondSurface(
          options.renderer,
          source,
          undefined,
          undefined,
          ground,
          pondY(),
          options.mobile ?? false,
        );
      } catch (error) {
        gpuError = String(error);
      }
    }
    solver = field.value ? 'gpgpu-heightfield' : 'cpu-heightfield';
    field.value ??= new CPUPondSurface(source, ground, pondY());
    field.value.configure(controls);
    const old = pond.geometry;
    pond.geometry = tessellatePond(
      source,
      options.mobile || solver === 'cpu-heightfield' ? 0.7 : 0.45,
      pondY(),
    );
    old.dispose();
    // Release cached programs: the next material compilation must bind this owner.
    pond.material.dispose();
    reflection = createReflectivePond(
      root,
      pond,
      ground,
      options.mobile ?? false,
      true,
      true,
      undefined,
      field,
      false,
    );
    scheduler = new PondImpulseScheduler(
      field.value.bounds,
      field.value.maskAt,
      (options.mobile ?? false) || solver === 'cpu-heightfield',
      19271,
      field.value.n,
    );
    shaderFailed = false;
    elapsed = 0;
  }
  try {
    rebuild();
  } catch (error) {
    dispose();
    throw error;
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    if (options.renderer)
      options.renderer.debug.onShaderError = priorShaderError ?? null;
    reflection?.dispose();
    field.value?.dispose();
    source.dispose();
    group.removeFromParent();
  }
  return {
    group,
    rebuild,
    dispose,
    restorePond: () => rebuild(),
    invalidate: () => reflection?.invalidate(),
    update(
      dt: number,
      hour: number,
      reduced: boolean,
      environmentKey = '',
      rainIntensity = 0,
    ) {
      if (disposed) return false;
      if (shaderFailed && solver === 'gpgpu-heightfield') {
        rebuild(true);
        gpuError = 'GPU pond surface shader failed; CPU fallback active';
      }
      const key = `${Math.floor(hour * 60)}:${environmentKey}`;
      if (environment !== key) {
        environment = key;
        reflection?.invalidate();
      }
      const stopped =
        reduced || !root.visible || !pond.visible || !!field.value?.paused;
      scheduler.update(
        dt,
        rainIntensity,
        stopped,
        (p, s, r) => field.value?.impulse(p, s, r) ?? false,
      );
      if (stopped || !Number.isFinite(dt) || dt <= 0 || dt > 0.15) {
        field.value?.suspend();
        return false;
      }
      try {
        field.value?.update(dt);
      } catch (error) {
        rebuild(true);
        gpuError = String(error);
      }
      elapsed = (elapsed + Math.min(dt, 0.05)) % 10000;
      if (reflection) reflection.time.value = elapsed;
      return true;
    },
    configurePond(settings: PondControls) {
      controls = { ...controls, ...settings, reset: false, impulse: false };
      field.value?.configure(settings);
      if (settings.wireframe !== undefined)
        pond.material.wireframe = settings.wireframe;
      reflection?.invalidate();
    },
    readPondHeights() {
      if (!field.value || !options.renderer) return null;
      const raw = field.value.readHeights(options.renderer);
      return {
        halfFloat: raw instanceof Uint16Array,
        n: field.value.n,
        values: Array.from(raw),
      };
    },
    snapshot: () => ({
      version: 1,
      flightDuration: 0,
      impact: null,
      path: [],
      pondOnly: true,
      water: true,
      waterfall: false,
      solver,
      gpuError,
      gpuPond: field.value instanceof GPGPUPondSurface ? field.value.snapshot() : null,
      cpuPond:
        solver === 'cpu-heightfield'
          ? { n: field.value?.n, paused: field.value?.paused }
          : null,
      impulses: scheduler.snapshot(),
      reflection: reflection?.snapshot(),
      elapsed,
      rockFlowCount: 0,
      rockPaths: [],
      droplets: 0,
      ripples: 0,
      regions: ['pond'],
      triangles: 0,
      fallingFlow: null,
      flowError: null,
      channelStates: [],
      fluid: null,
    }),
  };
}

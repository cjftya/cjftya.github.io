import {
  Float32BufferAttribute,
  Group,
  Mesh,
  Line,
  InstancedMesh,
  Vector2,
  Vector3,
  Vector4,
} from 'three';
import type { BufferGeometry, MeshStandardMaterial } from 'three';
import { traceFallingFlow } from './fallingFlow';
import type { FallingFlow } from './fallingFlow';
import { createFallingFilm } from './createFallingFilm';
import { GPGPUPondSurface } from './gpgpuPondSurface';
import type { PondControls } from './gpgpuPondSurface';
import { ShallowWater } from './shallowWater';
import { continuousSurface } from './continuousSurface';
import { solveFlow } from './flowDynamics';
import { subdividePond, tessellatePond } from './subdividePond';
import { createReflectivePond } from './createReflectivePond';
import { traceWaterFlow } from './flowPath';
import type { WaterFlowPath } from './flowPath';
import { createRockFlow } from './createRockFlow';
import { createFallingWater } from './createFallingWater';
import { traceAttachedFlow, makeChannel } from './continuousFlow';
import { createImpactZone } from './createImpactZone';
import type { WaterOptions } from './createWaterEffects';

export function createRealWaterEffects(
  root: Group,
  content: Group,
  pond: Mesh<BufferGeometry, MeshStandardMaterial>,
  cliff: Group,
  pondY: () => number,
  ground: (x: number, z: number) => number,
  options: WaterOptions,
) {
  const time = { value: 0 },
    group = new Group();
  group.name = 'RealWaterSystemV6';
  content.add(group);
  const originalPond = options.dynamics ? pond.geometry.clone() : undefined;
  const fluid: { value: ShallowWater | undefined } = { value: undefined };
  const gpu: { value: GPGPUPondSurface | undefined } = { value: undefined };
  let falling: FallingFlow | undefined;
  let flowError: string | null = null;
  let inletClock = 0,
    inletEvents = 0,
    inletDelay = 0;
  let gpuError: string | null = null;
  let flowRate = 1;
  let pondControls: PondControls = { neutral: options.gpuNeutral ?? true };
  let flowStates: ReturnType<typeof solveFlow> = [];
  let channelStates: ReturnType<typeof solveFlow> = [];
  let seam = {
    surface: 'separate-v7-meshes',
    heightDifference: 0.035,
    overlappingFaces: true,
  };
  function prepareSurface() {
    if (!originalPond) return;
    const p = originalPond.attributes.position!;
    for (let i = 0; i < p.count; i++) p.setY(i, pondY());
    originalPond.computeBoundingBox();
    const bounds = originalPond.boundingBox!;
    const attached = traceAttachedFlow(root, cliff);
    const channel = makeChannel(attached.launch, pondY(), bounds.min.z + 1.4, true);
    const lane = channel.map((s) => ({ ...s, normal: new Vector3(0, 1, 0) }));
    flowStates = solveFlow(attached.lanes[3]!, 0.032, root.scale.x);
    channelStates = solveFlow(lane, 0.032 * 7, root.scale.x, flowStates.at(-1)!.speed);
    const end = channel.at(-1)!,
      previous = channel.at(-2)!;
    const direction = new Vector2(
      end.point.x - previous.point.x,
      end.point.z - previous.point.z,
    ).normalize();
    const index = originalPond.index!;
    function inPond(x: number, z: number) {
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
        const u = ((bz - cz) * (x - cx) + (cx - bx) * (z - cz)) / det;
        const v = ((cz - az) * (x - cx) + (ax - cx) * (z - cz)) / det;
        if (u >= 0 && v >= 0 && u + v <= 1) return true;
      }
      return false;
    }
    gpu.value?.dispose();
    gpu.value = undefined;
    fluid.value?.dispose();
    fluid.value = new ShallowWater(
      options.mobile ? 64 : 128,
      new Vector4(
        bounds.min.x,
        bounds.min.z - 3,
        bounds.max.x - bounds.min.x,
        bounds.max.z - bounds.min.z + 3,
      ),
      (x, z) => {
        let y = inPond(x, z) ? pondY() : undefined;
        for (let i = 0; i < channel.length - 1; i++) {
          const a = channel[i]!,
            b = channel[i + 1]!;
          if (z < a.point.z || z > b.point.z) continue;
          const t = (z - a.point.z) / (b.point.z - a.point.z),
            cx = a.point.x + (b.point.x - a.point.x) * t,
            w = a.width + (b.width - a.width) * t;
          if (Math.abs(x - cx) <= w / 2) y = a.point.y + (b.point.y - a.point.y) * t;
        }
        return y === undefined ? 0 : Math.max(0, y - ground(x, z));
      },
      {
        point: new Vector2(end.point.x, end.point.z),
        direction,
        width: end.width,
        speed: channelStates.at(-1)!.speed,
        discharge: channelStates.at(-1)!.discharge,
      },
      root.scale.x,
    );
    fluid.value.flowRate = flowRate;
    if (options.gpgpuPrototype && options.renderer) {
      try {
        gpu.value = new GPGPUPondSurface(
          options.renderer,
          originalPond,
          new Vector2(end.point.x, end.point.z),
          direction,
          ground,
          pondY(),
          options.mobile ?? false,
        );
        gpu.value.flowRate = flowRate;
        gpu.value.configure(pondControls);
        gpuError = null;
      } catch (error) {
        gpuError = String(error);
      }
    }
    const previousGeometry = pond.geometry;
    pond.geometry = continuousSurface(originalPond, channel);
    previousGeometry.dispose();
    seam = {
      surface: 'single-welded-surface-shared-material',
      heightDifference: 0,
      overlappingFaces: false,
    };
  }
  prepareSurface();
  function makeReflection(subdivide = true) {
    // Rebuilding replaces uniform owners; release the material program cache too.
    if (!subdivide) pond.material.dispose();
    return createReflectivePond(
      root,
      pond,
      ground,
      options.mobile ?? false,
      true,
      options.continuous ?? false,
      options.dynamics ? fluid : undefined,
      gpu.value?.active.value ? gpu : undefined,
      subdivide,
    );
  }
  let reflection = makeReflection();
  const priorShaderError = options.renderer?.debug.onShaderError;
  let shaderFailed = false;
  if (options.gpgpuPrototype && options.renderer) {
    options.renderer.debug.onShaderError = (...args) => {
      shaderFailed = true;
      priorShaderError?.(...args);
    };
  }
  function fallback(error: unknown) {
    gpuError = String(error);
    gpu.value?.dispose();
    gpu.value = undefined;
    reflection.dispose();
    reflection = makeReflection(false);
    shaderFailed = false;
  }

  function channelAttributes() {
    if (!options.dynamics) return;
    const channel = makeChannel(
      traceAttachedFlow(root, cliff).launch,
      pondY(),
      originalPond!.boundingBox!.min.z + 1.4,
      true,
    );
    const p = pond.geometry.attributes.position!,
      travel: number[] = [],
      mask: number[] = [];
    for (let k = 0; k < p.count; k++) {
      const x = p.getX(k),
        z = p.getZ(k);
      let ttime = 0,
        weight = 0;
      for (let i = 0; i < channel.length - 1; i++) {
        const a = channel[i]!,
          b = channel[i + 1]!;
        if (z < a.point.z || z > b.point.z) continue;
        const t = (z - a.point.z) / (b.point.z - a.point.z),
          cx = a.point.x + (b.point.x - a.point.x) * t,
          w = a.width + (b.width - a.width) * t;
        if (Math.abs(x - cx) <= w / 2 + 1e-5) {
          ttime =
            channelStates[i]!.travelTime +
            (channelStates[i + 1]!.travelTime - channelStates[i]!.travelTime) * t;
          weight = Math.min(1, Math.max(0, (channel.at(-1)!.point.z - z) / 1.2));
        }
      }
      travel.push(ttime);
      mask.push(weight);
    }
    pond.geometry.setAttribute('channelTravel', new Float32BufferAttribute(travel, 1));
    pond.geometry.setAttribute('channelMask', new Float32BufferAttribute(mask, 1));
  }
  channelAttributes();
  let flow: WaterFlowPath | undefined,
    impact: ReturnType<typeof createImpactZone> | undefined;
  let triangles = 0,
    elapsed = 0,
    environment = '';
  function retire() {
    group.traverse((object) => {
      if (object instanceof Mesh || object instanceof Line) {
        object.geometry.dispose();
        if (Array.isArray(object.material)) object.material.forEach((m) => m.dispose());
        else object.material.dispose();
        if (object instanceof InstancedMesh) object.dispose();
      }
    });
    group.clear();
    impact = undefined;
  }
  let initial = true;
  function rebuild() {
    retire();
    const rebuilding = !initial;
    if (options.dynamics && rebuilding) {
      prepareSurface();
      const combined = pond.geometry;
      pond.geometry = gpu.value?.active.value
        ? tessellatePond(combined, options.mobile ? 0.7 : 0.45, pondY())
        : subdividePond(combined, options.mobile ? 2 : 3);
      combined.dispose();
    }
    initial = false;
    channelAttributes();
    if (options.gpgpuPrototype && rebuilding) {
      reflection.dispose();
      reflection = makeReflection(false);
    } else reflection.rebuild();
    reflection.setImpact(null);
    flow = undefined;
    triangles = 0;
    falling = undefined;
    flowError = null;
    inletClock = inletEvents = inletDelay = 0;
    if (gpu.value) gpu.value.automaticInlet = true;
    if (!options.waterfall) return;
    if (options.continuous) {
      pond.geometry.computeBoundingBox();
      flow = traceAttachedFlow(root, cliff);
      const channel = makeChannel(
        flow.launch,
        pondY(),
        (originalPond?.boundingBox?.min.z ?? pond.geometry.boundingBox!.min.z) + 1.4,
        options.dynamics,
      );
      flow.impact = channel.at(-1)!.point.clone().setY(pondY());
      if (options.fallingFlow && options.dynamics) {
        try {
          // Fixed narrower source from the outset, not velocities selected to aim at water.
          falling = traceFallingFlow(
            root,
            cliff,
            channel,
            { ...flow, lanes: flow.lanes.slice(2, 5) },
            ground,
            (p) =>
              channel.some((s, i) => {
                const b = channel[i + 1];
                if (!b || p.z < s.point.z || p.z > b.point.z) return false;
                const t = (p.z - s.point.z) / (b.point.z - s.point.z);
                return (
                  Math.abs(p.x - s.point.x - (b.point.x - s.point.x) * t) <
                  (s.width + (b.width - s.width) * t) / 2
                );
              }),
          );
          const centre = falling.paths[1]!;
          flow = { ...centre, lanes: falling.paths.map((p) => p.lanes[0]!) };
          group.add(
            createFallingFilm(
              falling,
              time,
              options.mobile ?? false,
              options.flowPaths,
            ),
          );
          impact = createImpactZone(centre, options.mobile ?? false, {
            gravity: falling.gravity,
            count: options.mobile ? 12 : 24,
            surface: 'channel',
          });
          group.add(impact.group);
          const tail = channelStates.find(
            (s) => s.distance >= centre.impact.distanceTo(channel[0]!.point),
          );
          inletDelay =
            falling.travelTime +
            centre.duration +
            Math.max(0, channelStates.at(-1)!.travelTime - (tail?.travelTime ?? 0));
          if (gpu.value) gpu.value.automaticInlet = false;
        } catch (error) {
          flowError = String(error); // Preserve baseline on incompatible geometry/placement.
          falling = undefined;
        }
      }
      group.add(createRockFlow(flow, time, options.dynamics, root.scale.x));
      if (!options.dynamics) {
        const watercourse = createRockFlow(
          {
            ...flow,
            lanes: [channel.map((s) => ({ ...s, normal: new Vector3(0, 1, 0) }))],
          },
          time,
        );
        watercourse.name = 'ExcavatedChannelWater';
        group.add(watercourse);
        reflection.setImpact(
          new Vector2(flow.impact.x, flow.impact.z),
          0.36,
          new Vector2(0, 1),
        );
      }
    } else {
      flow = traceWaterFlow(root, cliff, pond, pondY());
      group.add(
        createRockFlow(flow, time),
        createFallingWater(flow, time, options.mobile ?? false),
      );
      impact = createImpactZone(flow, options.mobile ?? false);
      group.add(impact.group);
      const impactSpeed = Math.hypot(
        flow.velocity.x,
        flow.velocity.y - 9.8 * flow.duration,
        flow.velocity.z,
      );
      reflection.setImpact(
        new Vector2(flow.impact.x, flow.impact.z),
        Math.min(1.15, impactSpeed / 14),
        new Vector2(flow.velocity.x, flow.velocity.z),
      );
    }
    group.traverse((object) => {
      if (object instanceof Mesh)
        triangles +=
          ((object.geometry.index?.count ??
            object.geometry.attributes.position!.count) /
            3) *
          (object instanceof InstancedMesh ? object.count : 1);
    });
  }
  try {
    rebuild();
  } catch (error) {
    if (options.gpgpuPrototype && options.renderer)
      options.renderer.debug.onShaderError = priorShaderError ?? null;
    retire();
    group.removeFromParent();
    reflection.dispose();
    gpu.value?.dispose();
    fluid.value?.dispose();
    originalPond?.dispose();
    throw error;
  }
  return {
    group,
    rebuild,
    update(dt: number, hour: number, reduced: boolean, environmentKey = '') {
      const key = `${Math.floor(hour * 60)}:${environmentKey}`;
      if (environment !== key) {
        environment = key;
        reflection.invalidate();
      }
      if (shaderFailed && gpu.value)
        fallback('GPU pond surface shader compilation failed');
      if (reduced || dt <= 0 || !Number.isFinite(dt) || !root.visible || !pond.visible)
        return false;
      elapsed = (elapsed + Math.min(dt, 0.1)) % 10000;
      time.value = reflection.time.value = elapsed;
      if (falling) {
        group.visible = flowRate > 0;
        if (flowRate > 0 && gpu.value?.active.value && !gpu.value.paused) {
          inletClock += Math.min(dt, 0.05);
          if (inletClock >= inletDelay + 0.38) {
            gpu.value.impulse(
              gpu.value.inlet,
              0.016 * flowRate * (falling.paths.length / 7),
              0.65,
            );
            inletClock -= 0.38;
            inletEvents++;
          }
        }
      }
      if (gpu.value?.active.value) {
        try {
          gpu.value.update(dt);
        } catch (error) {
          fallback(error);
        }
      } else fluid.value?.update(dt);
      impact?.update(elapsed);
      return true;
    },
    setFlowRate(value: number) {
      if (!Number.isFinite(value)) return;
      flowRate = Math.max(0, Math.min(3, value));
      if (fluid.value) fluid.value.flowRate = flowRate;
      if (gpu.value) gpu.value.flowRate = flowRate;
      if (falling) {
        group.visible = flowRate > 0;
        if (flowRate === 0) inletClock = 0;
      }
    },
    configurePond(settings: PondControls) {
      pondControls = { ...pondControls, ...settings, reset: false, impulse: false };
      gpu.value?.configure(settings);
      if (settings.wireframe !== undefined)
        pond.material.wireframe = settings.wireframe;
      reflection.invalidate();
    },
    readPondHeights() {
      if (!gpu.value || !options.renderer) return null;
      const raw = gpu.value.readHeights(options.renderer);
      return {
        halfFloat: raw instanceof Uint16Array,
        n: gpu.value.n,
        values: Array.from(raw),
      };
    },
    restorePond() {
      if (options.gpgpuPrototype) rebuild();
    },
    invalidate: () => reflection.invalidate(),
    dispose() {
      if (options.gpgpuPrototype && options.renderer)
        options.renderer.debug.onShaderError = priorShaderError ?? null;
      retire();
      group.removeFromParent();
      reflection.dispose();
      gpu.value?.dispose();
      fluid.value?.dispose();
      originalPond?.dispose();
    },
    snapshot: () => ({
      ...Object.fromEntries(
        Object.entries(options).filter(([key]) => key !== 'renderer'),
      ),
      gpuPond: gpu.value?.snapshot() ?? null,
      gpuError,
      fallingFlow: falling
        ? {
            status: 'GEOMETRY_PASS',
            releaseIndex: falling.releaseIndex,
            gravity: falling.gravity,
            landing: falling.landing,
            inletDelay,
            inletEvents,
            sourceWidth: 0.65,
            paths: falling.paths.map((p) => ({
              launch: p.launch.toArray(),
              velocity: p.velocity.toArray(),
              impact: p.impact.toArray(),
              duration: p.duration,
              clearance: p.clearance,
            })),
            artApproval: 'USER_REVIEW',
          }
        : null,
      flowError,
      solver: gpu.value?.active.value ? 'gpgpu-heightfield' : 'cpu-v8',
      version: options.dynamics ? 8 : options.continuous ? 7 : 6,
      pondVersion: 4,
      elapsed,
      triangles,
      flightDuration: flow?.duration ?? 0,
      flightStartIndex: flow?.lanes[0]?.length ?? 0,
      rockClearance: flow?.clearance ?? null,
      rockLength: flow?.rockLength ?? 0,
      rockPaths:
        flow?.lanes.map((l) =>
          l.map((s) => root.localToWorld(s.point.clone()).toArray()),
        ) ?? [],
      rockFlowCount: flow?.lanes.length ?? 0,
      regions: falling
        ? [
            'attached-film',
            'shelf-release',
            'gravity-fall',
            'channel-impact',
            'channel',
            'pond-inlet',
          ]
        : options.continuous
          ? ['rock-flow', 'rock-foot', 'channel', 'pond-inlet']
          : ['rock-flow', 'crest', 'falling-volume', 'impact-pond'],
      launch: flow?.launch.toArray() ?? null,
      velocity: flow?.velocity.toArray() ?? null,
      impact: flow ? [flow.impact.x, flow.impact.z] : null,
      reflection: reflection.snapshot(),
      droplets: impact?.count ?? 0,
      ripples: 0,
      path:
        (falling
          ? flow?.fall
          : options.continuous
            ? flow?.lanes[3]?.map((s) => s.point)
            : flow?.fall
        )?.map((p) => root.localToWorld(p.clone()).toArray()) ?? [],
      waveModel: options.dynamics
        ? 'depth-averaged-height-and-momentum'
        : 'jittered-directional-packets-and-advected-turbulence',
      seam: options.dynamics ? seam : null,
      flowStates: options.dynamics ? flowStates : undefined,
      channelStates: options.dynamics ? channelStates : undefined,
      fluid: fluid.value?.snapshot() ?? null,
    }),
  };
}

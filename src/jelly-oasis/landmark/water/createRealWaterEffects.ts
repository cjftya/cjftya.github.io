import {
  Float32BufferAttribute,
  Group,
  Mesh,
  InstancedMesh,
  Vector2,
  Vector3,
  Vector4,
} from 'three';
import type { BufferGeometry, MeshStandardMaterial } from 'three';
import { ShallowWater } from './shallowWater';
import { continuousSurface } from './continuousSurface';
import { solveFlow } from './flowDynamics';
import { subdividePond } from './subdividePond';
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
  const reflection = createReflectivePond(
    root,
    pond,
    ground,
    options.mobile ?? false,
    true,
    options.continuous ?? false,
    options.dynamics ? fluid : undefined,
  );
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
      if (object instanceof Mesh) {
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
    if (options.dynamics && !initial) {
      prepareSurface();
      const combined = pond.geometry;
      pond.geometry = subdividePond(combined, options.mobile ? 2 : 3);
      combined.dispose();
    }
    initial = false;
    channelAttributes();
    reflection.rebuild();
    reflection.setImpact(null);
    flow = undefined;
    triangles = 0;
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
    retire();
    group.removeFromParent();
    reflection.dispose();
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
      if (reduced || dt <= 0 || !Number.isFinite(dt) || !root.visible || !pond.visible)
        return false;
      elapsed = (elapsed + Math.min(dt, 0.1)) % 10000;
      time.value = reflection.time.value = elapsed;
      fluid.value?.update(dt);
      impact?.update(elapsed);
      return true;
    },
    setFlowRate(value: number) {
      if (fluid.value && Number.isFinite(value))
        fluid.value.flowRate = Math.max(0, Math.min(3, value));
    },
    invalidate: () => reflection.invalidate(),
    dispose() {
      retire();
      group.removeFromParent();
      reflection.dispose();
      fluid.value?.dispose();
      originalPond?.dispose();
    },
    snapshot: () => ({
      ...options,
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
      regions: options.continuous
        ? ['rock-flow', 'rock-foot', 'channel', 'pond-inlet']
        : ['rock-flow', 'crest', 'falling-volume', 'impact-pond'],
      launch: flow?.launch.toArray() ?? null,
      velocity: flow?.velocity.toArray() ?? null,
      impact: flow ? [flow.impact.x, flow.impact.z] : null,
      reflection: reflection.snapshot(),
      droplets: impact?.count ?? 0,
      ripples: 0,
      path:
        (options.continuous ? flow?.lanes[3]?.map((s) => s.point) : flow?.fall)?.map(
          (p) => root.localToWorld(p.clone()).toArray(),
        ) ?? [],
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

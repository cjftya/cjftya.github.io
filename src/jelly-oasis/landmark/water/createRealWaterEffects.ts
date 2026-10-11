import { Group, Mesh, InstancedMesh, Vector2 } from 'three';
import type { BufferGeometry, MeshStandardMaterial } from 'three';
import { createReflectivePond } from './createReflectivePond';
import { traceWaterFlow } from './flowPath';
import type { WaterFlowPath } from './flowPath';
import { createRockFlow } from './createRockFlow';
import { createFallingWater } from './createFallingWater';
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
  const reflection = createReflectivePond(
    root,
    pond,
    ground,
    options.mobile ?? false,
    true,
  );
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
  function rebuild() {
    retire();
    reflection.rebuild();
    reflection.setImpact(null);
    flow = undefined;
    triangles = 0;
    if (!options.waterfall) return;
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
      impact?.update(elapsed);
      return true;
    },
    invalidate: () => reflection.invalidate(),
    dispose() {
      retire();
      group.removeFromParent();
      reflection.dispose();
    },
    snapshot: () => ({
      ...options,
      version: 6,
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
      regions: ['rock-flow', 'crest', 'falling-volume', 'impact-pond'],
      launch: flow?.launch.toArray() ?? null,
      velocity: flow?.velocity.toArray() ?? null,
      impact: flow ? [flow.impact.x, flow.impact.z] : null,
      reflection: reflection.snapshot(),
      droplets: impact?.count ?? 0,
      ripples: 0,
      path: flow?.fall.map((p) => root.localToWorld(p.clone()).toArray()) ?? [],
      waveModel: 'jittered-directional-packets-and-advected-turbulence',
    }),
  };
}

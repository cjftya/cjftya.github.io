import {
  BufferGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Matrix3,
  Mesh,
  MeshBasicMaterial,
  Raycaster,
  Vector3,
} from 'three';
import type { ChannelSample } from '../../terrain/excavateTerrain';
import type { Group, Material } from 'three';
import { solveFlow } from './flowDynamics';
import type { WaterFlowPath } from './flowPath';

export interface FallingFlow {
  releaseIndex: number;
  paths: WaterFlowPath[];
  gravity: number;
  landing: 'channel';
  travelTime: number;
}

export function ballisticPoint(p: Vector3, v: Vector3, gravity: number, t: number) {
  return p
    .clone()
    .addScaledVector(v, t)
    .add(new Vector3(0, (-gravity * t * t) / 2, 0));
}

/** Sample only at creation/replacement. No target position enters the launch velocity. */
export function traceFallingFlow(
  root: Group,
  cliff: Group,
  channel: ChannelSample[],
  attached: WaterFlowPath,
  ground: (x: number, z: number) => number,
  inChannel: (p: Vector3) => boolean,
): FallingFlow {
  if (
    Math.abs(root.scale.x - root.scale.y) > 1e-6 ||
    Math.abs(root.scale.x - root.scale.z) > 1e-6 ||
    root.scale.x <= 0
  )
    throw new Error('GEOMETRY_BLOCKER: uniform positive landmark scale required');
  root.updateMatrixWorld(true);
  // Collision-only copy of the exact existing strip cross-sections. Avoid tracing the
  // tessellated lake (tens of thousands of triangles) at every flight sample.
  const positions: number[] = [],
    indices: number[] = [];
  for (let i = 0; i < channel.length; i++) {
    const s = channel[i]!;
    positions.push(
      s.point.x - s.width / 2,
      s.point.y,
      s.point.z,
      s.point.x + s.width / 2,
      s.point.y,
      s.point.z,
    );
    if (i) {
      const a = (i - 1) * 2,
        b = i * 2;
      indices.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  const surface = new Mesh(geometry, new MeshBasicMaterial({ side: DoubleSide }));
  surface.matrixWorld.copy(root.matrixWorld);
  const gravity = 9.81 / root.scale.x;
  const centre = attached.lanes[Math.floor(attached.lanes.length / 2)]!;
  const states = solveFlow(centre, 0.032, root.scale.x);
  const ray = new Raycaster();
  const materials = new Map<Material, Material['side']>();
  cliff.traverse((o) => {
    if (!(o instanceof Mesh)) return;
    for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
      if (!materials.has(m)) {
        materials.set(m, m.side);
        m.side = DoubleSide;
      }
    }
  });
  const inverse = new Matrix3().setFromMatrix4(root.matrixWorld).invert();
  const normalMatrix = new Matrix3();
  const toward = new Vector3(0, 0, -1).transformDirection(root.matrixWorld);
  function clearance(p: Vector3) {
    ray.set(root.localToWorld(new Vector3(p.x, p.y, cliff.position.z + 20)), toward);
    ray.far = Infinity;
    const hit = ray.intersectObject(cliff, true)[0];
    return hit ? p.z - root.worldToLocal(hit.point.clone()).z : Infinity;
  }
  const rejected: string[] = [];
  try {
    for (let index = 8; index < centre.length - 12; index++) {
      // A measured shelf followed by a steep face, rather than a normal threshold alone.
      const shelf = centre.slice(index - 3, index + 1).some((s) => s.normal.y > 0.55);
      const tangent = centre[index]!.point.clone()
        .sub(centre[index - 3]!.point)
        .normalize();
      const next = centre[index + 3]!.point.clone()
        .sub(centre[index]!.point)
        .normalize();
      if (!shelf || tangent.z < 0.3 || next.z >= tangent.z * 0.8) continue;
      const velocity = tangent.multiplyScalar(states[index]!.speed);
      const paths: WaterFlowPath[] = [];
      for (const lane of attached.lanes) {
        const launch = lane[index]!.point.clone();
        const end = lane[index]!;
        const across = new Vector3()
          .crossVectors(
            end.point
              .clone()
              .sub(lane[index - 1]!.point)
              .normalize(),
            end.normal,
          )
          .normalize();
        function profile(t: number, u: number) {
          const speed = velocity
            .clone()
            .add(new Vector3(0, -gravity * t, 0))
            .length();
          const width = end.width * Math.sqrt(velocity.length() / speed);
          return ballisticPoint(launch, velocity, gravity, t).addScaledVector(
            across,
            (u - 0.5) * width,
          );
        }
        const fall = [launch.clone()];
        let duration = 0,
          minGap = Infinity,
          impact: Vector3 | undefined;
        let collisionType = '';
        const offsets = [0, 0.5, 1];
        for (let step = 1; step <= 600 && !impact; step++) {
          const t = step * 0.005;
          const p = ballisticPoint(launch, velocity, gravity, t);
          let earliest = 1;
          for (const offset of offsets) {
            const from = profile(t - 0.005, offset);
            const to = profile(t, offset);
            const worldFrom = root.localToWorld(from.clone());
            const worldTo = root.localToWorld(to.clone());
            ray.set(worldFrom, worldTo.clone().sub(worldFrom).normalize());
            ray.far = worldFrom.distanceTo(worldTo);
            const hits = ray.intersectObjects([cliff, surface], true);
            const hit = hits[0];
            if (hit) {
              const fraction = hit.distance / ray.far;
              if (fraction <= earliest) {
                earliest = fraction;
                collisionType = hit.object === surface ? 'channel' : 'rock';
                // Record measured surface normal for diagnostics if the cliff intercepts.
                if (hit.face) {
                  normalMatrix.getNormalMatrix(hit.object.matrixWorld);
                  const n = hit.face.normal
                    .clone()
                    .applyMatrix3(normalMatrix)
                    .applyMatrix3(inverse)
                    .normalize();
                  if (collisionType === 'rock') collisionType += `(${n.y.toFixed(2)})`;
                }
              }
            }
            if (to.y < ground(to.x, to.z)) {
              // Heightfield surface crossing, refined within this short swept interval.
              let lo = 0,
                hi = 1;
              for (let k = 0; k < 12; k++) {
                const mid = (lo + hi) / 2,
                  q = from.clone().lerp(to, mid);
                if (q.y > ground(q.x, q.z)) lo = mid;
                else hi = mid;
              }
              if (hi < earliest) {
                earliest = hi;
                collisionType = 'ground';
              }
            }
          }
          if (collisionType) {
            duration = (step - 1 + earliest) * 0.005;
            impact = ballisticPoint(launch, velocity, gravity, duration);
            fall.push(impact);
            break;
          }
          for (const offset of offsets)
            if (step > 5) minGap = Math.min(minGap, clearance(profile(t, offset)));
          fall.push(p);
        }
        if (
          !impact ||
          collisionType !== 'channel' ||
          !inChannel(impact) ||
          duration < 0.2 ||
          minGap < 0.015
        ) {
          rejected.push(
            `${index}:${collisionType || 'no-hit'}:${duration.toFixed(3)}:${minGap.toFixed(3)}`,
          );
          break;
        }
        const samples = lane.slice(0, index + 1);
        paths.push({
          lanes: [samples],
          launch,
          impact,
          velocity: velocity.clone(),
          duration,
          fall,
          clearance: minGap,
          rockLength: samples
            .slice(1)
            .reduce((sum, s, i) => sum + s.point.distanceTo(samples[i]!.point), 0),
        });
      }
      if (paths.length === attached.lanes.length)
        return {
          releaseIndex: index,
          paths,
          gravity,
          landing: 'channel',
          travelTime: states[index]!.travelTime,
        };
    }
    throw new Error(
      `GEOMETRY_BLOCKER: no full-width shelf trajectory reaches existing channel (${rejected.join('; ')})`,
    );
  } finally {
    geometry.dispose();
    surface.material.dispose();
    for (const [m, side] of materials) m.side = side;
  }
}

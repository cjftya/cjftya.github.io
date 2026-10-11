import { Matrix3, Raycaster, Vector3 } from 'three';
import type { Group } from 'three';
import type { WaterFlowPath, FlowSample } from './flowPath';
import type { ChannelSample } from '../../terrain/excavateTerrain';

/** No ballistic release: sample the full loaded face down to its buried foot. */
export function traceAttachedFlow(root: Group, cliff: Group): WaterFlowPath {
  root.updateMatrixWorld(true);
  const ray = new Raycaster(),
    normalMatrix = new Matrix3();
  const inverse = new Matrix3().setFromMatrix4(root.matrixWorld).invert();
  const direction = new Vector3(0, 0, -1).transformDirection(root.matrixWorld);
  function hit(x: number, y: number) {
    ray.set(root.localToWorld(new Vector3(x, y, cliff.position.z + 20)), direction);
    const sample = ray.intersectObject(cliff, true)[0];
    if (!sample?.face) return null;
    normalMatrix.getNormalMatrix(sample.object.matrixWorld);
    const normal = sample.face.normal
      .clone()
      .applyMatrix3(normalMatrix)
      .applyMatrix3(inverse)
      .normalize();
    if (normal.z < 0) normal.negate();
    return { point: root.worldToLocal(sample.point.clone()), normal };
  }
  const lanes: FlowSample[][] = Array.from({ length: 7 }, () => []);
  for (let h = 16.8; h >= -0.001; h -= 0.1) {
    const x = cliff.position.x + Math.sin(h * 0.45) * 0.16,
      y = cliff.position.y + h;
    const samples = lanes.map((_, i) => hit(x + (i - 3) * 0.205, y));
    if (samples.some((s) => !s)) continue;
    samples.forEach((s, i) =>
      lanes[i]!.push({
        point: s!.point.clone().addScaledVector(s!.normal, 0.035),
        normal: s!.normal,
        width: 0.22 + 0.03 * Math.sin(h * 0.7 + i),
      }),
    );
  }
  if (lanes[3]!.length < 100) throw new Error('v7: incomplete attached cliff flow');
  const centre = lanes[3]!,
    foot = centre.at(-1)!.point.clone();
  const rockLength = centre
    .slice(1)
    .reduce((d, s, i) => d + s.point.distanceTo(centre[i]!.point), 0);
  return {
    lanes,
    launch: foot,
    impact: foot.clone(),
    velocity: new Vector3(0, 0, 1),
    duration: 0,
    fall: [],
    clearance: 0.035,
    rockLength,
  };
}

export function makeChannel(
  foot: Vector3,
  waterY: number,
  inletZ: number,
): ChannelSample[] {
  if (foot.y <= waterY) throw new Error('v7: channel cannot flow uphill');
  const path: ChannelSample[] = [];
  const length = inletZ - foot.z,
    steps = Math.ceil(length / 0.2);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = foot.x + Math.sin(t * Math.PI) * 0.38;
    const y = waterY + 0.035 + (foot.y - waterY - 0.035) * (1 - t);
    path.push({
      point: new Vector3(x, y, foot.z + length * t),
      width: 1.8 + 0.2 * Math.sin(t * 8.3) + t * 0.35,
    });
  }
  return path;
}

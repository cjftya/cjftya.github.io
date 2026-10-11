import { Matrix3, Raycaster, Vector3 } from 'three';
import type { BufferGeometry, Group, Mesh, MeshStandardMaterial } from 'three';

export interface FlowSample {
  point: Vector3;
  normal: Vector3;
  width: number;
}
export interface WaterFlowPath {
  lanes: FlowSample[][];
  launch: Vector3;
  impact: Vector3;
  velocity: Vector3;
  duration: number;
  fall: Vector3[];
  clearance: number;
  rockLength: number;
}

/** All points, normals and velocities use the landmark root frame. */
export function traceWaterFlow(
  root: Group,
  cliff: Group,
  pond: Mesh<BufferGeometry, MeshStandardMaterial>,
  pondY: number,
): WaterFlowPath {
  root.updateMatrixWorld(true);
  const ray = new Raycaster();
  const towardRock = new Vector3(0, 0, -1).transformDirection(root.matrixWorld);
  const normalMatrix = new Matrix3();
  const rootInverse = new Matrix3().setFromMatrix4(root.matrixWorld).invert();
  function surface(x: number, y: number) {
    ray.set(root.localToWorld(new Vector3(x, y, cliff.position.z + 20)), towardRock);
    const hit = ray.intersectObject(cliff, true)[0];
    if (!hit?.face) return null;
    normalMatrix.getNormalMatrix(hit.object.matrixWorld);
    const normal = hit.face.normal
      .clone()
      .applyMatrix3(normalMatrix)
      .applyMatrix3(rootInverse)
      .normalize();
    if (normal.z < 0) normal.negate();
    return { point: root.worldToLocal(hit.point.clone()), normal };
  }
  const center: FlowSample[] = [];
  for (let h = 16.8; h >= 0.4; h -= 0.2) {
    const x = cliff.position.x + Math.sin(h * 0.45) * 0.22;
    const hit = surface(x, cliff.position.y + h);
    if (hit) center.push({ ...hit, width: 1.45 });
  }
  const start = center.findIndex((s) =>
    [-0.75, -0.615, -0.41, -0.205, 0, 0.205, 0.41, 0.615, 0.75].every((dx) =>
      surface(s.point.x + dx, s.point.y),
    ),
  );
  if (start > 0) center.splice(0, start);
  if (center.length < 30) throw new Error('v6: insufficient cliff surface samples');
  const waterRay = new Raycaster();
  const down = new Vector3(0, -1, 0).transformDirection(root.matrixWorld);
  const last = center[center.length - 1]!.point;
  pond.geometry.computeBoundingBox();
  const end = pond.geometry.boundingBox!.max.z;
  let impact: Vector3 | undefined;
  for (let z = last.z + 0.25; z < end; z += 0.2) {
    waterRay.set(root.localToWorld(new Vector3(last.x, pondY + 30, z)), down);
    const hit = waterRay.intersectObject(pond)[0];
    if (!hit) continue;
    // Move into the basin, but validate this exact point, not a guessed circle.
    const candidate = root.worldToLocal(hit.point.clone());
    candidate.z += 1.35;
    candidate.y = pondY;
    waterRay.set(root.localToWorld(candidate.clone().add(new Vector3(0, 20, 0))), down);
    if (waterRay.intersectObject(pond).length) {
      impact = candidate;
      break;
    }
  }
  if (!impact) throw new Error('v6: outlet misses shared pond');
  let launchIndex = -1;
  let duration = 0;
  let clearance = Infinity;
  let velocity = new Vector3();
  let fall: Vector3[] = [];
  const diagnostics: number[] = [];
  // Search ledges after several metres of attached flow; never emit in mid-air.
  for (let i = 22; i < Math.min(center.length - 16, 48); i++) {
    const ledge = center
      .slice(Math.max(0, i - 3), i + 1)
      .some((sample) => sample.normal.y > 0.5);
    if (!ledge) continue;
    const source = center[i]!.point.clone().addScaledVector(center[i]!.normal, 0.09);
    const section = [-0.8, 0, 0.8]
      .map((offset) => surface(source.x + offset, source.y))
      .filter((hit) => hit !== null);
    source.z = Math.max(source.z, ...section.map((hit) => hit.point.z + 0.19));
    const initialY = -0.8;
    const flight =
      (initialY + Math.sqrt(initialY ** 2 + 19.6 * (source.y - impact.y))) / 9.8;
    if (!(flight > 0)) continue;
    const speed = impact.clone().sub(source).divideScalar(flight);
    speed.y = initialY;
    const candidate: Vector3[] = [];
    let min = Infinity;
    for (let j = 0; j <= 96; j++) {
      const t = (j / 96) * flight;
      const point = source.clone().addScaledVector(speed, t);
      point.y -= 4.9 * t * t;
      candidate.push(point);
      if (j < 3 || j === 96) continue;
      for (const offset of [-0.8, 0, 0.8]) {
        const hit = surface(point.x + offset, point.y);
        if (hit) min = Math.min(min, point.z - hit.point.z);
      }
    }
    diagnostics.push(min);
    if (min < 0.19) continue;
    launchIndex = i;
    duration = flight;
    velocity = speed;
    clearance = min;
    fall = candidate;
    break;
  }
  if (launchIndex < 0)
    throw new Error(
      'v6: no clear ledge after attached rock section ' + JSON.stringify(diagnostics),
    );
  const launch = fall[0]!;
  const lanes: FlowSample[][] = [];
  for (let lane = 0; lane < 7; lane++) {
    const samples: FlowSample[] = [];
    for (let i = 0; i <= launchIndex; i++) {
      const base = center[i]!;
      const fraction = i / launchIndex;
      const merge = Math.sin(fraction * Math.PI);
      const offset =
        (lane - 3) * 0.205 + Math.sin(i * 0.16 + lane * 1.7) * 0.08 * merge;
      const hit = surface(base.point.x + offset, base.point.y);
      if (!hit) throw new Error(`v6: surface gap in lane ${lane}/${i}`);
      const width = 0.14 + 0.1 * (0.5 + 0.5 * Math.sin(i * 0.21 + lane * 2.3));
      samples.push({
        point: hit.point.clone().addScaledVector(hit.normal, 0.026),
        normal: hit.normal,
        width,
      });
    }
    // Blend the last four samples into the measured release section.
    const end = launch.clone().add(new Vector3((lane - 3) * 0.205, 0, 0));
    for (let k = 0; k < 4; k++) {
      const index = samples.length - 4 + k;
      samples[index]!.point.lerp(
        end.clone().setY(samples[index]!.point.y),
        (k + 1) / 4,
      );
    }
    samples[samples.length - 1]!.point.copy(end);
    lanes.push(samples);
  }
  const rockLength = lanes[3]!
    .slice(1)
    .reduce((sum, s, i) => sum + s.point.distanceTo(lanes[3]![i]!.point), 0);
  return { lanes, launch, impact, velocity, duration, fall, clearance, rockLength };
}

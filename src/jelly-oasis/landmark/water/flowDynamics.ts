import type { FlowSample } from './flowPath';

export interface FlowState {
  distance: number;
  slope: number;
  width: number;
  depth: number;
  speed: number;
  travelTime: number;
  discharge: number;
}
/** Local units; one world unit is one metre. Q and speed convert with root scale. */
export function solveFlow(
  lane: FlowSample[],
  discharge: number,
  scale = 1,
  initialSpeed = 0.75,
): FlowState[] {
  let distance = 0,
    travelTime = 0,
    speed = initialSpeed;
  return lane.map((s, i) => {
    let slope = 0;
    if (i) {
      const previous = lane[i - 1]!,
        ds = s.point.distanceTo(previous.point);
      const drop = Math.max(0, previous.point.y - s.point.y);
      slope = drop / Math.max(ds, 1e-6);
      const accelerated = Math.sqrt(
        Math.max(
          0.25,
          speed * speed + 2 * (9.81 / scale) * drop - 0.11 * speed * speed * ds,
        ),
      );
      const expansion = Math.min(1, previous.width / Math.max(s.width, 0.01));
      const next = Math.min(8 / scale, Math.max(0.5 / scale, accelerated * expansion));
      travelTime += (2 * ds) / (speed + next);
      distance += ds;
      speed = next;
    }
    return {
      distance,
      slope,
      width: s.width,
      speed,
      travelTime,
      discharge,
      depth: discharge / (s.width * speed),
    };
  });
}

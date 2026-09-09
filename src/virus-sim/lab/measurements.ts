import type { LabWorld } from './physics/world';
import type { TrajectorySnapshot, Vec3Tuple } from './types';

const MAX_POINTS = 384;
const SAMPLE_INTERVAL = 0.2;

export class TrajectoryRecorder {
  private readonly points = new Map<string, Vec3Tuple[]>();
  private lastSampleTime = -Infinity;

  reset(world: LabWorld): void {
    this.points.clear();
    for (const body of world.bodies)
      this.points.set(body.instanceId, [[...body.position]]);
    this.lastSampleTime = 0;
  }

  sample(world: LabWorld, simTime: number): void {
    if (simTime - this.lastSampleTime + 1e-9 < SAMPLE_INTERVAL) return;
    this.lastSampleTime = simTime;
    for (const body of world.bodies) {
      const points = this.points.get(body.instanceId) ?? [];
      points.push([...body.position]);
      if (points.length > MAX_POINTS) points.splice(0, points.length - MAX_POINTS);
      this.points.set(body.instanceId, points);
    }
  }

  snapshot(): readonly TrajectorySnapshot[] {
    return [...this.points].map(([instanceId, points]) => ({
      instanceId,
      points: points.map((point) => [...point]),
    }));
  }
}

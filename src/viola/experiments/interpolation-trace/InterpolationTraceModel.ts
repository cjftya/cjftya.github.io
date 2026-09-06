import { Vector2 } from '../../core/Vector2';

export class InterpolationTraceModel {
  public readonly positions = Array.from({ length: 20 }, () => new Vector2());
  private readonly velocities = Array.from({ length: 20 }, () => new Vector2());

  public step(): void {
    for (let index = 0; index < this.positions.length - 1; index += 1) {
      const leader = this.positions[index];
      const follower = this.positions[index + 1];
      const velocity = this.velocities[index + 1];
      if (leader && follower && velocity)
        velocity.set((leader.x - follower.x) * 0.9, (leader.y - follower.y) * 0.9);
    }
    for (let index = 1; index < this.positions.length; index += 1) {
      const position = this.positions[index];
      const velocity = this.velocities[index];
      if (position && velocity) position.add(velocity);
    }
  }

  public attach(point: Readonly<Vector2>): void {
    this.positions[0]?.copy(point);
  }
}

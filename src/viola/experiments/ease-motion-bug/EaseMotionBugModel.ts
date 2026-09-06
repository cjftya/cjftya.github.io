import type { Random } from '../../core/Random';
import { Vector2, clamp } from '../../core/Vector2';

export interface BugChain {
  positions: Vector2[];
  velocities: Vector2[];
  color: number;
  changeRate: number;
  ticks: number;
}

export class EaseMotionBugModel {
  public readonly bugs: BugChain[];

  public constructor(
    private readonly random: Random,
    bugCount = 8,
    bodyCount = 18,
  ) {
    this.bugs = Array.from({ length: bugCount }, () => ({
      positions: Array.from({ length: bodyCount }, () => new Vector2(400, 300)),
      velocities: Array.from({ length: bodyCount }, () => new Vector2()),
      color:
        (random.integer(50, 255) << 16) |
        (random.integer(50, 255) << 8) |
        random.integer(50, 255),
      changeRate: random.integer(4, 8),
      ticks: 0,
    }));
  }

  public step(): void {
    for (const bug of this.bugs) {
      for (let index = 0; index < bug.positions.length - 1; index += 1) {
        const leader = bug.positions[index];
        const follower = bug.positions[index + 1];
        const velocity = bug.velocities[index + 1];
        if (leader && follower && velocity)
          velocity.add({
            x: (leader.x - follower.x) * 0.9,
            y: (leader.y - follower.y) * 0.9,
          });
      }
      for (let index = 0; index < bug.positions.length; index += 1) {
        const position = bug.positions[index];
        const velocity = bug.velocities[index];
        if (!position || !velocity) continue;
        if (index > 0) velocity.scale(0.3);
        position.add(velocity);
      }
      const head = bug.positions[0];
      const headVelocity = bug.velocities[0];
      if (head && headVelocity) {
        if (head.x < 5 || head.x > 995) {
          head.x = clamp(head.x, 5, 995);
          headVelocity.x *= -1;
        }
        if (head.y < 5 || head.y > 695) {
          head.y = clamp(head.y, 5, 695);
          headVelocity.y *= -1;
        }
        bug.ticks += 1;
        if (bug.ticks === bug.changeRate) {
          headVelocity
            .scale(0.9)
            .add({ x: this.random.integer(-3, 4), y: this.random.integer(-3, 4) });
          bug.ticks = 0;
        }
      }
    }
  }
}

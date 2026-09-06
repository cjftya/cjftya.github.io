import type { Random } from '../../core/Random';
import { Vector2 } from '../../core/Vector2';
import { resolveCircleOverlap } from '../../physics/collision/CircleOverlap';

export interface CircleCollisionBody {
  position: Vector2;
  velocity: Vector2;
  radius: number;
  color: number;
  rotation: number;
}

export class CircleCollisionModel {
  public readonly circles: CircleCollisionBody[];
  private selectedIndex = -1;

  public constructor(random: Random, count = 500) {
    this.circles = Array.from({ length: count }, () => ({
      position: new Vector2(random.integer(100, 900), random.integer(100, 900)),
      velocity: new Vector2(),
      radius: random.integer(5, 20),
      color: 0xe8fffb,
      rotation: 0,
    }));
  }

  public step(): void {
    for (let iteration = 0; iteration < 3; iteration += 1) {
      this.resolveCollisions();

      for (let index = 0; index < this.circles.length; index += 1) {
        const circle = this.circles[index];
        if (!circle || index === this.selectedIndex) continue;
        circle.velocity.y += 0.5 / 9;
        circle.position.add(circle.velocity);
        this.constrain(circle);
      }
    }
  }

  public accelerateFirst(x: number, y: number): void {
    const first = this.circles[0];
    if (!first) return;
    first.velocity.x += x;
    first.velocity.y += y;
  }

  public pick(point: Readonly<Vector2>): void {
    this.selectedIndex = this.circles.findIndex(
      (circle) => Vector2.distanceSquared(circle.position, point) < circle.radius ** 2,
    );
  }

  public moveSelected(point: Readonly<Vector2>): void {
    const selected = this.circles[this.selectedIndex];
    if (!selected) return;
    selected.position.copy(point);
    selected.velocity.set(0, 0);
  }

  public release(): void {
    const selected = this.circles[this.selectedIndex];
    selected?.velocity.set(0, 0);
    this.selectedIndex = -1;
  }

  private resolveCollisions(): void {
    for (let leftIndex = 0; leftIndex < this.circles.length; leftIndex += 1) {
      const left = this.circles[leftIndex];
      if (!left) continue;
      for (let rightIndex = 0; rightIndex < this.circles.length; rightIndex += 1) {
        if (leftIndex === rightIndex) continue;
        const right = this.circles[rightIndex];
        if (right) resolveCircleOverlap(left, right);
      }
    }
  }

  private constrain(circle: CircleCollisionBody): void {
    const bounce = -0.7;
    if (circle.position.x < circle.radius) {
      circle.position.x = circle.radius;
      circle.velocity.x *= bounce;
    } else if (circle.position.x > 1_000 - circle.radius) {
      circle.position.x = 1_000 - circle.radius;
      circle.velocity.x *= bounce;
    }
    if (circle.position.y < circle.radius) {
      circle.position.y = circle.radius;
      circle.velocity.y *= bounce;
    } else if (circle.position.y > 700 - circle.radius) {
      circle.position.y = 700 - circle.radius;
      circle.velocity.y *= bounce;
    }
  }
}

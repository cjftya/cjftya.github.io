import type { Random } from '../../core/Random';
import { PHYSICS_EPSILON, Vector2 } from '../../core/Vector2';

export interface AreaForceParticle {
  position: Vector2;
  velocity: Vector2;
  radius: number;
  color: number;
}

export interface DirectionField {
  position: Vector2;
  direction: Vector2;
  angle: number;
  radius: number;
}

export class AreaForceModel {
  public readonly particles: AreaForceParticle[];
  public readonly fields: DirectionField[];
  private selectedIndex = -1;
  private rotating = false;
  private readonly previousPointer = new Vector2();

  public constructor(random: Random) {
    this.fields = [];
    for (let row = 80; row <= 320; row += 80) {
      for (let column = 80; column <= 320; column += 80) {
        this.fields.push({
          position: new Vector2(column + 300, row + 150),
          direction: new Vector2(1, 0),
          angle: 0,
          radius: 40,
        });
      }
    }
    this.particles = Array.from({ length: 10 }, () => ({
      position: new Vector2(random.integer(100, 200), random.integer(200, 300)),
      velocity: new Vector2(),
      radius: 5,
      color: 0xff5757,
    }));
  }

  public step(): void {
    for (let leftIndex = 0; leftIndex < this.particles.length; leftIndex += 1) {
      const left = this.particles[leftIndex];
      if (!left) continue;
      for (
        let rightIndex = leftIndex + 1;
        rightIndex < this.particles.length;
        rightIndex += 1
      ) {
        const right = this.particles[rightIndex];
        if (!right) continue;
        const dx = left.position.x - right.position.x;
        const dy = left.position.y - right.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance >= 10 || distance <= PHYSICS_EPSILON) continue;
        const depth = (10 - distance) * 0.5;
        const fx = (dx / distance) * depth;
        const fy = (dy / distance) * depth;
        left.position.add({ x: fx, y: fy });
        right.position.add({ x: -fx, y: -fy });
        left.velocity.add({ x: fx, y: fy });
        right.velocity.add({ x: -fx, y: -fy });
      }
      for (const field of this.fields) {
        if (
          Math.abs(left.position.x - field.position.x) <= field.radius &&
          Math.abs(left.position.y - field.position.y) <= field.radius
        )
          left.velocity.addScaled(field.direction, 0.03);
      }
      left.velocity.scale(0.95);
      left.position.add(left.velocity);
    }
  }

  public pick(point: Readonly<Vector2>): void {
    this.particles[0]?.position.copy(point);
    this.selectedIndex = this.fields.findIndex((field) => {
      if (Vector2.distanceSquared(point, field.position) < 8 * 8) {
        this.rotating = true;
        return true;
      }
      return (
        Vector2.distanceSquared(point, field.position) < field.radius * field.radius
      );
    });
    this.previousPointer.copy(point);
  }

  public drag(point: Readonly<Vector2>): void {
    const field = this.fields[this.selectedIndex];
    if (!field) return;
    const dx = point.x - this.previousPointer.x;
    const dy = point.y - this.previousPointer.y;
    if (this.rotating) {
      field.angle += dx / 50;
      field.direction.set(Math.cos(field.angle), Math.sin(field.angle));
    } else {
      field.position.add({ x: dx, y: dy });
    }
    this.previousPointer.copy(point);
  }

  public release(): void {
    this.selectedIndex = -1;
    this.rotating = false;
  }
}

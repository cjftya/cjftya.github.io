import type { Random } from '../../core/Random';
import { Vector2 } from '../../core/Vector2';
import { resolveCircleOverlap } from '../../physics/collision/CircleOverlap';
import { UniformGrid } from '../../physics/spatial/UniformGrid';

export interface CellSpaceBody {
  position: Vector2;
  velocity: Vector2;
  radius: number;
  color: number;
}

export class CellSpaceModel {
  public readonly bodies: CellSpaceBody[];
  private readonly positions: Vector2[];
  private readonly grid = new UniformGrid(1_000, 700, 35);
  private selectedIndex = -1;

  public constructor(random: Random, count = 7_000) {
    this.bodies = Array.from({ length: count }, () => ({
      position: new Vector2(random.integer(50, 950), random.integer(50, 650)),
      velocity: new Vector2(),
      radius: random.integer(3, 5),
      color:
        (random.integer(50, 250) << 16) |
        (random.integer(50, 250) << 8) |
        random.integer(50, 250),
    }));
    this.positions = this.bodies.map((body) => body.position);
  }

  public step(): void {
    this.grid.rebuild(this.positions);
    this.grid.forEachNeighborPair((leftIndex, rightIndex) => {
      const left = this.bodies[leftIndex];
      const right = this.bodies[rightIndex];
      if (left && right) resolveCircleOverlap(left, right);
    });

    for (let index = 0; index < this.bodies.length; index += 1) {
      const body = this.bodies[index];
      if (!body || index === this.selectedIndex) continue;
      body.velocity.scale(0.995);
      body.position.add(body.velocity);
      this.constrain(body);
    }
  }

  public pick(point: Readonly<Vector2>): void {
    this.selectedIndex = this.bodies.findIndex(
      (body) => Vector2.distanceSquared(body.position, point) < body.radius ** 2,
    );
  }

  public moveSelected(point: Readonly<Vector2>): void {
    this.bodies[this.selectedIndex]?.position.copy(point);
  }

  public release(): void {
    this.bodies[this.selectedIndex]?.velocity.set(0, 0);
    this.selectedIndex = -1;
  }

  private constrain(body: CellSpaceBody): void {
    const bounce = -0.7;
    if (body.position.x < body.radius) {
      body.position.x = body.radius;
      body.velocity.x *= bounce;
    } else if (body.position.x > 1_000 - body.radius) {
      body.position.x = 1_000 - body.radius;
      body.velocity.x *= bounce;
    }
    if (body.position.y < body.radius) {
      body.position.y = body.radius;
      body.velocity.y *= bounce;
    } else if (body.position.y > 700 - body.radius) {
      body.position.y = 700 - body.radius;
      body.velocity.y *= bounce;
    }
  }
}

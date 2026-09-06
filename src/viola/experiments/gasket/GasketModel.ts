import { Vector2 } from '../../core/Vector2';

export interface GasketTriangle {
  a: Vector2;
  b: Vector2;
  c: Vector2;
}

export class GasketModel {
  public readonly triangles: GasketTriangle[] = [];

  public constructor(depth = 5) {
    this.subdivide(
      new Vector2(500, 10),
      new Vector2(50, 700),
      new Vector2(900, 700),
      depth,
    );
  }

  public step(): void {}

  private subdivide(a: Vector2, b: Vector2, c: Vector2, depth: number): void {
    if (depth <= 0) {
      this.triangles.push({ a, b, c });
      return;
    }
    const ab = new Vector2((a.x + b.x) * 0.5, (a.y + b.y) * 0.5);
    const bc = new Vector2((b.x + c.x) * 0.5, (b.y + c.y) * 0.5);
    const ac = new Vector2((a.x + c.x) * 0.5, (a.y + c.y) * 0.5);
    this.subdivide(a, ab, ac, depth - 1);
    this.subdivide(ab, b, bc, depth - 1);
    this.subdivide(ac, bc, c, depth - 1);
  }
}

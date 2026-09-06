import { PHYSICS_EPSILON, Vector2 } from '../../core/Vector2';

export class VectorRadiansModel {
  public readonly position = new Vector2(200, 100);
  public readonly target = new Vector2();
  public readonly direction = new Vector2(0, -1);
  public readonly vertices = Array.from({ length: 4 }, () => new Vector2());
  public headingDegrees = 0;
  public output = 0;

  public constructor() {
    this.rebuildShape();
  }

  public step(): void {}

  public setTarget(point: Readonly<Vector2>): void {
    this.target.copy(point);
    const dx = point.x - this.position.x;
    const dy = point.y - this.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance <= PHYSICS_EPSILON) return;
    this.output =
      this.direction.x * (dx / distance) + this.direction.y * (dy / distance);
  }

  public rotateDegrees(delta: number): void {
    this.headingDegrees += delta;
    this.rebuildShape();
  }

  private rebuildShape(): void {
    const scale = 0.7;
    const local = [
      [-20 * scale, 25 * scale],
      [0, -40 * scale],
      [20 * scale, 25 * scale],
      [0, 15 * scale],
    ] as const;
    const radians = (this.headingDegrees * Math.PI) / 180;
    const cosine = Math.cos(radians);
    const sine = Math.sin(radians);
    local.forEach(([x, y], index) => {
      this.vertices[index]?.set(
        this.position.x + x * cosine - y * sine,
        this.position.y + x * sine + y * cosine,
      );
    });
    const nose = this.vertices[1];
    const tail = this.vertices[3];
    if (nose && tail) this.direction.copy(Vector2.subtract(nose, tail).normalize());
  }
}

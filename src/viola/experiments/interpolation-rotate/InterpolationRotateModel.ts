import { Vector2 } from '../../core/Vector2';

export class InterpolationRotateModel {
  public readonly position = new Vector2(300, 400);
  public readonly velocity = new Vector2();
  public angle = 0;
  public angularVelocity = 0;
  public selected = false;
  private readonly previousPointer = new Vector2();

  public step(): void {
    this.velocity.scale(0.95);
    this.position.add(this.velocity);
    if (this.selected) {
      this.angularVelocity += (0.75 - this.angle) * 0.1;
      this.angle += this.angularVelocity;
    }
  }

  public pick(point: Readonly<Vector2>): void {
    if (Vector2.distanceSquared(point, this.position) >= 20 * 20) return;
    this.selected = true;
    this.previousPointer.copy(point);
  }

  public drag(point: Readonly<Vector2>): void {
    if (!this.selected) return;
    this.velocity.add({
      x: (point.x - this.previousPointer.x) / 10,
      y: (point.y - this.previousPointer.y) / 10,
    });
    this.previousPointer.copy(point);
  }

  public release(): void {
    this.selected = false;
  }

  public corners(): Vector2[] {
    return [
      new Vector2(-20, -20),
      new Vector2(20, -20),
      new Vector2(20, 20),
      new Vector2(-20, 20),
    ].map((point) => point.rotate(this.angle).add(this.position));
  }
}

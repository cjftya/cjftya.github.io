import { Vector2 } from '../../core/Vector2';

export class BoxThrowingModel {
  public readonly position = new Vector2(300, 400);
  public readonly velocity = new Vector2();
  public readonly halfSize = 20;
  public angle = 0;
  public angularVelocity = 0;
  private readonly previousPointer = new Vector2();
  private selected = false;

  public step(): void {
    this.velocity.scale(0.95);
    this.position.add(this.velocity);
    this.angularVelocity *= 0.95;
    this.angle += this.angularVelocity;
  }

  public pick(point: Readonly<Vector2>): void {
    if (Vector2.distanceSquared(this.position, point) >= this.halfSize ** 2) return;
    this.selected = true;
    this.previousPointer.copy(point);
  }

  public drag(point: Readonly<Vector2>): void {
    if (!this.selected) return;
    const deltaX = point.x - this.previousPointer.x;
    const deltaY = point.y - this.previousPointer.y;
    this.velocity.x += deltaX / 10;
    this.velocity.y += deltaY / 10;
    this.angularVelocity += deltaX / 600;
    this.previousPointer.copy(point);
  }

  public release(): void {
    this.selected = false;
  }

  public corners(): Vector2[] {
    return [
      new Vector2(-this.halfSize, -this.halfSize),
      new Vector2(this.halfSize, -this.halfSize),
      new Vector2(this.halfSize, this.halfSize),
      new Vector2(-this.halfSize, this.halfSize),
    ].map((point) => point.rotate(this.angle).add(this.position));
  }
}

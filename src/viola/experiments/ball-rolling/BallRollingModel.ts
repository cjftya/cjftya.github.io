import { Vector2 } from '../../core/Vector2';

export class BallRollingModel {
  public readonly position = new Vector2(100, 100);
  public readonly velocity = new Vector2();
  public readonly radius = 30;
  public angle = 0;
  public angularVelocity = 0;

  public step(): void {
    this.velocity.y += 0.3;
    this.velocity.scale(0.995);
    this.position.add(this.velocity);
    this.angle += this.angularVelocity;
    this.angularVelocity *= 0.995;

    if (this.position.x < this.radius) {
      this.position.x = this.radius;
      this.velocity.x *= -0.7;
      this.rollFromCollision(1, 0);
    } else if (this.position.x > 1_000 - this.radius) {
      this.position.x = 1_000 - this.radius;
      this.velocity.x *= -0.7;
      this.rollFromCollision(-1, 0);
    }
    if (this.position.y < this.radius) {
      this.position.y = this.radius;
      this.velocity.y *= -0.7;
      this.rollFromCollision(0, 1);
    } else if (this.position.y > 700 - this.radius) {
      this.position.y = 700 - this.radius;
      this.velocity.y *= -0.7;
      this.rollFromCollision(0, -1);
    }
  }

  public accelerate(x: number, y: number): void {
    this.velocity.x += x;
    this.velocity.y += y;
  }

  private rollFromCollision(normalX: number, normalY: number): void {
    const tangentVelocity = this.velocity.y * normalX - this.velocity.x * normalY;
    this.angularVelocity = tangentVelocity / this.radius;
  }
}

import { Vector2 } from '../../core/Vector2';

export class ParticleTailModel {
  public readonly position = new Vector2(100, 100);
  public readonly previous = new Vector2(100, 100);
  public readonly velocity = new Vector2();
  public readonly radius = 2;

  public step(): void {
    this.velocity.scale(0.995);
    this.previous.set(
      this.position.x - this.velocity.x,
      this.position.y - this.velocity.y,
    );
    this.position.add(this.velocity);
    if (this.position.x >= 900 - this.radius) {
      this.position.x = 900 - this.radius;
      this.velocity.x *= -1;
    } else if (this.position.x <= this.radius) {
      this.position.x = this.radius;
      this.velocity.x *= -1;
    }
    if (this.position.y >= 700 - this.radius) {
      this.position.y = 700 - this.radius;
      this.velocity.y *= -1;
    } else if (this.position.y <= this.radius) {
      this.position.y = this.radius;
      this.velocity.y *= -1;
    }
  }

  public keyDown(code: string): void {
    if (code === 'KeyA') this.velocity.x -= 10;
    else if (code === 'KeyD') this.velocity.x += 10;
    else if (code === 'KeyW') this.velocity.y -= 10;
    else if (code === 'KeyS') this.velocity.y += 10;
  }
}

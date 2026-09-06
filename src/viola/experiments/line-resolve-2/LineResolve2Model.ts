import { Vector2, closestPointOnSegment } from '../../core/Vector2';

export class LineResolve2Model {
  public readonly start = new Vector2(800, 500);
  public readonly end = new Vector2(100, 980);
  public readonly position = new Vector2(500, 500);
  public readonly velocity = new Vector2();
  public readonly closest = new Vector2();
  public readonly radius = 20;

  public step(): void {
    this.position.add(this.velocity);
    this.closest.copy(closestPointOnSegment(this.position, this.start, this.end));
    if (Vector2.distanceSquared(this.position, this.closest) < this.radius ** 2)
      this.resolveCrossing();
  }

  public reset(point: Readonly<Vector2>): void {
    this.position.copy(point);
    this.velocity.set(0, 0);
  }

  public keyDown(code: string): void {
    if (code === 'KeyA') this.velocity.x -= 5;
    else if (code === 'KeyD') this.velocity.x += 5;
    else if (code === 'KeyW') this.velocity.y -= 5;
    else if (code === 'KeyS') this.velocity.y += 5;
  }

  private resolveCrossing(): void {
    const angle = Math.atan2(this.end.y - this.start.y, this.end.x - this.start.x);
    const reverseAngle = Math.atan2(
      this.start.y - this.end.y,
      this.start.x - this.end.x,
    );
    let cosine = Math.cos(angle);
    let sine = Math.sin(angle);
    const relativeX = this.position.x - this.start.x;
    const relativeY = this.position.y - this.start.y;
    let localX = cosine * relativeX + sine * relativeY;
    let localY = cosine * relativeY - sine * relativeX;
    let velocityX = cosine * this.velocity.x + sine * this.velocity.y;
    let velocityY = cosine * this.velocity.y - sine * this.velocity.x;
    const reverseCosine = Math.cos(reverseAngle);
    const reverseSine = Math.sin(reverseAngle);
    const reverseX = reverseCosine * relativeX + reverseSine * relativeY;
    const reverseY = reverseCosine * relativeY - reverseSine * relativeX;
    const reverseVelocityX =
      reverseCosine * this.velocity.x + reverseSine * this.velocity.y;
    const reverseVelocityY =
      reverseCosine * this.velocity.y - reverseSine * this.velocity.x;

    if (!(localY > -this.radius && localY < velocityY)) {
      if (!(reverseY > -this.radius && reverseY < reverseVelocityY)) return;
      localX = reverseX;
      velocityX = reverseVelocityX;
      velocityY = reverseVelocityY;
      cosine = reverseCosine;
      sine = reverseSine;
    }

    localY = -this.radius;
    velocityY *= -0.5;
    const worldX = cosine * localX - sine * localY;
    const worldY = cosine * localY + sine * localX;
    this.velocity.set(
      cosine * velocityX - sine * velocityY,
      cosine * velocityY + sine * velocityX,
    );
    this.position.set(worldX + this.start.x, worldY + this.start.y);
  }
}

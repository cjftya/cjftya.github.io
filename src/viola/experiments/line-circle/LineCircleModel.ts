import { PHYSICS_EPSILON, Vector2, closestPointOnSegment } from '../../core/Vector2';

export interface CollisionLine {
  start: Vector2;
  end: Vector2;
}

export class LineCircleModel {
  public readonly position = new Vector2(100, 100);
  public readonly velocity = new Vector2();
  public readonly radius = 20;
  public readonly lines: CollisionLine[] = [
    { start: new Vector2(100, 100), end: new Vector2(700, 700) },
    { start: new Vector2(800, 100), end: new Vector2(600, 800) },
    { start: new Vector2(50, 120), end: new Vector2(900, 200) },
    { start: new Vector2(500, 250), end: new Vector2(600, 450) },
  ];
  public dt = 1;

  public step(): void {
    this.position.addScaled(this.velocity, this.dt);
    this.velocity.y += 0.3;
    this.velocity.scale(0.995);
    for (const line of this.lines) this.resolve(line);
  }

  public reset(point: Readonly<Vector2>): void {
    this.position.copy(point);
    this.velocity.set(0, 0);
  }

  public keyDown(code: string): void {
    if (code === 'KeyQ') this.dt += 0.01;
    else if (code === 'KeyE') this.dt -= 0.01;
    else if (code === 'KeyW') this.velocity.y -= 2;
    else if (code === 'KeyS') this.velocity.y += 2;
    else if (code === 'KeyA') this.velocity.x -= 2;
    else if (code === 'KeyD') this.velocity.x += 2;
  }

  private resolve(line: CollisionLine): void {
    const closest = closestPointOnSegment(this.position, line.start, line.end);
    const dx = closest.x - this.position.x;
    const dy = closest.y - this.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance >= this.radius || distance <= PHYSICS_EPSILON) return;
    const nx = dx / distance;
    const ny = dy / distance;
    const depth = this.radius - distance;
    this.position.x -= nx * depth;
    this.position.y -= ny * depth;
    const projection = this.velocity.x * nx + this.velocity.y * ny;
    const projectedX = nx * projection;
    const projectedY = ny * projection;
    this.velocity.x = this.velocity.x - projectedX - projectedX * 0.7;
    this.velocity.y = this.velocity.y - projectedY - projectedY * 0.7 + 0.3;
  }
}

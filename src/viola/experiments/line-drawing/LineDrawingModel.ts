import { PHYSICS_EPSILON, Vector2, closestPointOnSegment } from '../../core/Vector2';

export interface DrawnLine {
  start: Vector2;
  end: Vector2;
}

export class LineDrawingModel {
  public readonly position = new Vector2(100, 100);
  public readonly velocity = new Vector2();
  public readonly radius = 20;
  public readonly lines: DrawnLine[] = [];
  public readonly pending: Vector2[] = [];
  public angle = 0;
  public angularVelocity = 0;

  public step(): void {
    this.velocity.y += 0.3;
    this.velocity.scale(0.995);
    this.position.add(this.velocity);
    this.constrainBounds();
    this.angle += this.angularVelocity;
    this.angularVelocity *= 0.995;
    for (const line of this.lines) this.resolveLine(line);
  }

  public beginLine(point: Readonly<Vector2>): void {
    this.pending.length = 0;
    this.pending.push(new Vector2(point.x, point.y));
  }

  public extendLine(point: Readonly<Vector2>): void {
    const previous = this.pending.at(-1);
    if (!previous || Vector2.distanceSquared(previous, point) <= 1_600) return;
    if (this.pending.length < 500) this.pending.push(new Vector2(point.x, point.y));
  }

  public endLine(): void {
    for (let index = 0; index < this.pending.length - 1; index += 1) {
      const start = this.pending[index];
      const end = this.pending[index + 1];
      if (start && end && this.lines.length < 500)
        this.lines.push({ start: start.clone(), end: end.clone() });
    }
    this.pending.length = 0;
  }

  public resetLines(): void {
    this.lines.length = 0;
    this.pending.length = 0;
  }

  public keyDown(code: string): void {
    if (code === 'KeyQ') this.resetLines();
    else if (code === 'KeyW') this.velocity.y -= 2;
    else if (code === 'KeyS') this.velocity.y += 2;
    else if (code === 'KeyA') this.velocity.x -= 2;
    else if (code === 'KeyD') this.velocity.x += 2;
  }

  private constrainBounds(): void {
    if (this.position.x < this.radius) {
      this.position.x = this.radius;
      this.velocity.x *= -0.7;
      this.roll(1, 0);
    } else if (this.position.x > 1_200 - this.radius) {
      this.position.x = 1_200 - this.radius;
      this.velocity.x *= -0.7;
      this.roll(-1, 0);
    }
    if (this.position.y < this.radius) {
      this.position.y = this.radius;
      this.velocity.y *= -0.7;
      this.roll(0, 1);
    } else if (this.position.y > 700 - this.radius) {
      this.position.y = 700 - this.radius;
      this.velocity.y *= -0.7;
      this.roll(0, -1);
    }
  }

  private resolveLine(line: DrawnLine): void {
    const closest = closestPointOnSegment(this.position, line.start, line.end);
    const dx = closest.x - this.position.x;
    const dy = closest.y - this.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance >= this.radius || distance <= PHYSICS_EPSILON) return;
    const nx = dx / distance;
    const ny = dy / distance;
    const depth = this.radius - distance;
    const correctionX = nx * depth;
    const correctionY = ny * depth;
    this.position.x -= correctionX;
    this.position.y -= correctionY;
    const atEndpoint =
      Vector2.distanceSquared(closest, line.start) <= PHYSICS_EPSILON ||
      Vector2.distanceSquared(closest, line.end) <= PHYSICS_EPSILON;
    if (atEndpoint) {
      this.velocity.x -= correctionX;
      this.velocity.y -= correctionY;
    } else {
      const projection = this.velocity.x * nx + this.velocity.y * ny;
      const projectedX = nx * projection;
      const projectedY = ny * projection;
      this.velocity.x = this.velocity.x - projectedX - projectedX * 0.8;
      this.velocity.y = this.velocity.y - projectedY - projectedY * 0.5;
    }
    this.roll(-nx, -ny);
  }

  private roll(normalX: number, normalY: number): void {
    this.angularVelocity =
      (this.velocity.y * normalX - this.velocity.x * normalY) / this.radius;
  }
}

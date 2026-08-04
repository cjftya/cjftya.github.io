const EPSILON = 1e-6;

export interface VectorLike {
  x: number;
  y: number;
}

export class Vector2 {
  public constructor(
    public x = 0,
    public y = 0,
  ) {}

  public set(x = 0, y = 0): this {
    this.x = x;
    this.y = y;
    return this;
  }

  public copy(other: Readonly<VectorLike>): this {
    return this.set(other.x, other.y);
  }

  public clone(): Vector2 {
    return new Vector2(this.x, this.y);
  }

  public add(other: Readonly<VectorLike>): this {
    this.x += other.x;
    this.y += other.y;
    return this;
  }

  public addScaled(other: Readonly<VectorLike>, scale: number): this {
    this.x += other.x * scale;
    this.y += other.y * scale;
    return this;
  }

  public subtract(other: Readonly<VectorLike>): this {
    this.x -= other.x;
    this.y -= other.y;
    return this;
  }

  public scale(value: number): this {
    this.x *= value;
    this.y *= value;
    return this;
  }

  public lengthSquared(): number {
    return this.x * this.x + this.y * this.y;
  }

  public length(): number {
    return Math.sqrt(this.lengthSquared());
  }

  public normalize(): this {
    const magnitude = this.length();
    if (magnitude <= EPSILON) return this.set(0, 0);
    return this.scale(1 / magnitude);
  }

  public dot(other: Readonly<VectorLike>): number {
    return this.x * other.x + this.y * other.y;
  }

  public cross(other: Readonly<VectorLike>): number {
    return this.x * other.y - this.y * other.x;
  }

  public perpendicular(): Vector2 {
    return new Vector2(-this.y, this.x);
  }

  public rotate(angle: number, center?: Readonly<VectorLike>): this {
    const cx = center?.x ?? 0;
    const cy = center?.y ?? 0;
    const x = this.x - cx;
    const y = this.y - cy;
    const cosine = Math.cos(angle);
    const sine = Math.sin(angle);
    this.x = x * cosine - y * sine + cx;
    this.y = x * sine + y * cosine + cy;
    return this;
  }

  public static subtract(a: Readonly<VectorLike>, b: Readonly<VectorLike>): Vector2 {
    return new Vector2(a.x - b.x, a.y - b.y);
  }

  public static distanceSquared(
    a: Readonly<VectorLike>,
    b: Readonly<VectorLike>,
  ): number {
    const x = a.x - b.x;
    const y = a.y - b.y;
    return x * x + y * y;
  }

  public static distance(a: Readonly<VectorLike>, b: Readonly<VectorLike>): number {
    return Math.sqrt(Vector2.distanceSquared(a, b));
  }
}

export function safeUnit(
  x: number,
  y: number,
): { x: number; y: number; length: number } {
  const length = Math.sqrt(x * x + y * y);
  if (length <= EPSILON) return { x: 0, y: 0, length: 0 };
  return { x: x / length, y: y / length, length };
}

export function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

export function closestPointOnSegment(
  point: Readonly<VectorLike>,
  start: Readonly<VectorLike>,
  end: Readonly<VectorLike>,
): Vector2 {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared <= EPSILON) return new Vector2(start.x, start.y);
  const ratio = clamp(
    ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared,
    0,
    1,
  );
  return new Vector2(start.x + dx * ratio, start.y + dy * ratio);
}

export const PHYSICS_EPSILON = EPSILON;

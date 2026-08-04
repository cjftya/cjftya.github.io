import { Graphics } from 'pixi.js';
import type { Experiment, ExperimentContext, Viewport } from '../core/Experiment';
import { Vector2, closestPointOnSegment, safeUnit } from '../core/Vector2';
import { polygonsOverlap } from './shared';

interface Segment {
  a: Vector2;
  b: Vector2;
}

export class CollisionExperiment implements Experiment {
  public readonly context: ExperimentContext;
  private readonly graphics = new Graphics();
  private readonly segments: Segment[] = [];
  private ball = new Vector2();
  private previous = new Vector2();
  private radius = 28;
  private drawingStart: Vector2 | null = null;
  private rotation = 0;
  private hit = false;
  private contact = new Vector2();

  public constructor(context: ExperimentContext) {
    this.context = context;
    context.root.addChild(this.graphics);
    this.reset();
  }

  private reset(): void {
    const { width, height } = this.context.viewport;
    this.ball.set(width * 0.28, height * 0.2);
    this.previous.set(this.ball.x - 2.2, this.ball.y);
    this.segments.length = 0;
    this.segments.push(
      {
        a: new Vector2(width * 0.08, height * 0.68),
        b: new Vector2(width * 0.38, height * 0.54),
      },
      {
        a: new Vector2(width * 0.38, height * 0.54),
        b: new Vector2(width * 0.7, height * 0.73),
      },
      {
        a: new Vector2(width * 0.7, height * 0.73),
        b: new Vector2(width * 0.94, height * 0.57),
      },
    );
  }

  public update(stepScale: number): void {
    const id = this.context.definition.id;
    this.rotation += 0.008 * stepScale;
    if (id === 'line-resolve-drawing' || id === 'line-resolve-2')
      this.updateMovingBall(stepScale);
  }

  private updateMovingBall(stepScale: number): void {
    const velocity = Vector2.subtract(this.ball, this.previous);
    this.previous.copy(this.ball);
    this.ball.addScaled(velocity, stepScale);
    this.ball.y += 0.24 * stepScale * stepScale;
    this.hit = false;
    for (const segment of this.segments) {
      const closest = closestPointOnSegment(this.ball, segment.a, segment.b);
      const unit = safeUnit(this.ball.x - closest.x, this.ball.y - closest.y);
      if (unit.length <= 0 || unit.length >= this.radius) continue;
      this.ball.set(closest.x + unit.x * this.radius, closest.y + unit.y * this.radius);
      const reflected = Vector2.subtract(this.ball, this.previous);
      const normal = new Vector2(unit.x, unit.y);
      const normalVelocity = reflected.dot(normal);
      reflected.addScaled(normal, -1.55 * normalVelocity).scale(0.82);
      this.previous.set(this.ball.x - reflected.x, this.ball.y - reflected.y);
      this.hit = true;
      this.contact.copy(closest);
    }
    const { width, height } = this.context.viewport;
    if (
      this.ball.x < -this.radius ||
      this.ball.x > width + this.radius ||
      this.ball.y > height + this.radius * 2
    )
      this.resetBall();
  }

  private resetBall(): void {
    this.ball.set(this.context.viewport.width * 0.2, 50);
    this.previous.set(this.ball.x - 2.6, this.ball.y - 0.5);
  }

  public render(): void {
    const graphics = this.graphics.clear();
    const id = this.context.definition.id;
    if (id === 'collision-circle-circle') this.renderCircleCircle(graphics);
    else if (id === 'collision-line-circle') this.renderLineCircle(graphics);
    else if (id === 'collision-capsule-circle') this.renderCapsuleCircle(graphics);
    else if (id === 'collision-poly-circle') this.renderPolygonCircle(graphics);
    else if (id === 'closest-point') this.renderClosestPoint(graphics);
    else if (id === 'sat') this.renderSat(graphics);
    else this.renderResolvedLines(graphics);
  }

  private renderCircleCircle(graphics: Graphics): void {
    const fixed = new Vector2(
      this.context.viewport.width * 0.5,
      this.context.viewport.height * 0.5,
    );
    const moving = this.context.pointer.position;
    const fixedRadius = 92;
    const movingRadius = 54;
    const unit = safeUnit(moving.x - fixed.x, moving.y - fixed.y);
    const hit = unit.length < fixedRadius + movingRadius;
    const contact = fixed.clone().addScaled(unit, fixedRadius);
    graphics
      .circle(fixed.x, fixed.y, fixedRadius)
      .fill({ color: hit ? 0xff8d78 : 0x67e8bd, alpha: 0.18 })
      .stroke({ color: hit ? 0xff8d78 : 0x67e8bd, width: 3 });
    graphics
      .circle(moving.x, moving.y, movingRadius)
      .stroke({ color: 0xe8fffb, width: 3 });
    if (hit && unit.length > 0) {
      graphics
        .moveTo(fixed.x, fixed.y)
        .lineTo(moving.x, moving.y)
        .stroke({ color: 0xffbd71, width: 2 });
      graphics.circle(contact.x, contact.y, 6).fill({ color: 0xffbd71 });
    }
  }

  private renderLineCircle(graphics: Graphics): void {
    const { width, height } = this.context.viewport;
    const a = new Vector2(width * 0.15, height * 0.66);
    const b = new Vector2(width * 0.84, height * 0.34);
    this.renderSegmentContact(graphics, a, b, this.context.pointer.position, 44);
  }

  private renderCapsuleCircle(graphics: Graphics): void {
    const { width, height } = this.context.viewport;
    const a = new Vector2(width * 0.24, height * 0.68);
    const b = new Vector2(width * 0.76, height * 0.32);
    const capsuleRadius = 48;
    const circleRadius = 38;
    const moving = this.context.pointer.position;
    const closest = closestPointOnSegment(moving, a, b);
    const hit = Vector2.distance(closest, moving) < capsuleRadius + circleRadius;
    graphics
      .moveTo(a.x, a.y)
      .lineTo(b.x, b.y)
      .stroke({
        color: hit ? 0xff8d78 : 0x67e8bd,
        width: capsuleRadius * 2,
        alpha: 0.22,
      });
    graphics
      .moveTo(a.x, a.y)
      .lineTo(b.x, b.y)
      .stroke({ color: hit ? 0xff8d78 : 0x67e8bd, width: 3 });
    graphics
      .circle(moving.x, moving.y, circleRadius)
      .stroke({ color: 0xe8fffb, width: 3 });
    graphics.circle(closest.x, closest.y, 6).fill({ color: 0xffbd71 });
  }

  private renderPolygonCircle(graphics: Graphics): void {
    const center = new Vector2(
      this.context.viewport.width * 0.5,
      this.context.viewport.height * 0.5,
    );
    const polygon = this.regularPolygon(center, 118, 6, this.rotation);
    const circle = this.context.pointer.position;
    let closest = polygon[0]?.clone() ?? center.clone();
    for (let index = 0; index < polygon.length; index += 1) {
      const a = polygon[index];
      const b = polygon[(index + 1) % polygon.length];
      if (!a || !b) continue;
      const candidate = closestPointOnSegment(circle, a, b);
      if (
        Vector2.distanceSquared(candidate, circle) <
        Vector2.distanceSquared(closest, circle)
      )
        closest = candidate;
    }
    const hit = Vector2.distance(closest, circle) < 42;
    this.drawPolygon(graphics, polygon, hit ? 0xff8d78 : 0x67e8bd, true);
    graphics.circle(circle.x, circle.y, 42).stroke({ color: 0xe8fffb, width: 3 });
    graphics.circle(closest.x, closest.y, 6).fill({ color: 0xffbd71 });
  }

  private renderClosestPoint(graphics: Graphics): void {
    const { width, height } = this.context.viewport;
    const a = new Vector2(width * 0.18, height * 0.72);
    const b = new Vector2(width * 0.82, height * 0.32);
    const point = this.context.pointer.position;
    const closest = closestPointOnSegment(point, a, b);
    graphics.moveTo(a.x, a.y).lineTo(b.x, b.y).stroke({ color: 0x67e8bd, width: 5 });
    graphics
      .moveTo(point.x, point.y)
      .lineTo(closest.x, closest.y)
      .stroke({ color: 0xffbd71, width: 2 });
    graphics
      .circle(point.x, point.y, 9)
      .circle(closest.x, closest.y, 7)
      .fill({ color: 0xe8fffb });
  }

  private renderSat(graphics: Graphics): void {
    const { width, height } = this.context.viewport;
    const fixed = this.regularPolygon(
      new Vector2(width * 0.48, height * 0.5),
      98,
      5,
      this.rotation,
    );
    const moving = this.regularPolygon(
      this.context.pointer.position,
      72,
      4,
      -this.rotation * 1.4,
    );
    const hit = polygonsOverlap(fixed, moving);
    this.drawPolygon(graphics, fixed, hit ? 0xff8d78 : 0x67e8bd, true);
    this.drawPolygon(graphics, moving, hit ? 0xffbd71 : 0xe8fffb, false);
  }

  private renderResolvedLines(graphics: Graphics): void {
    for (const segment of this.segments)
      graphics.moveTo(segment.a.x, segment.a.y).lineTo(segment.b.x, segment.b.y);
    graphics.stroke({ color: 0x67e8bd, width: 4 });
    if (this.drawingStart)
      graphics
        .moveTo(this.drawingStart.x, this.drawingStart.y)
        .lineTo(this.context.pointer.position.x, this.context.pointer.position.y)
        .stroke({ color: 0xffbd71, width: 2 });
    graphics
      .circle(this.ball.x, this.ball.y, this.radius)
      .fill({ color: this.hit ? 0xff8d78 : 0x91f5cf, alpha: 0.2 })
      .stroke({ color: this.hit ? 0xff8d78 : 0x91f5cf, width: 3 });
    if (this.hit)
      graphics.circle(this.contact.x, this.contact.y, 6).fill({ color: 0xffbd71 });
  }

  private renderSegmentContact(
    graphics: Graphics,
    a: Vector2,
    b: Vector2,
    point: Vector2,
    radius: number,
  ): void {
    const closest = closestPointOnSegment(point, a, b);
    const hit = Vector2.distance(closest, point) < radius;
    graphics
      .moveTo(a.x, a.y)
      .lineTo(b.x, b.y)
      .stroke({ color: hit ? 0xff8d78 : 0x67e8bd, width: 5 });
    graphics.circle(point.x, point.y, radius).stroke({ color: 0xe8fffb, width: 3 });
    graphics
      .moveTo(point.x, point.y)
      .lineTo(closest.x, closest.y)
      .stroke({ color: 0xffbd71, width: 2 });
    graphics.circle(closest.x, closest.y, 6).fill({ color: 0xffbd71 });
  }

  private regularPolygon(
    center: Vector2,
    radius: number,
    count: number,
    rotation: number,
  ): Vector2[] {
    return Array.from({ length: count }, (_, index) => {
      const angle = rotation + (index * Math.PI * 2) / count;
      return new Vector2(
        center.x + Math.cos(angle) * radius,
        center.y + Math.sin(angle) * radius,
      );
    });
  }

  private drawPolygon(
    graphics: Graphics,
    points: Vector2[],
    color: number,
    fill: boolean,
  ): void {
    const first = points[0];
    if (!first) return;
    graphics.moveTo(first.x, first.y);
    for (const point of points.slice(1)) graphics.lineTo(point.x, point.y);
    graphics.closePath();
    if (fill) graphics.fill({ color, alpha: 0.13 });
    graphics.stroke({ color, width: 3 });
  }

  public pointerDown(): void {
    if (this.context.definition.id === 'line-resolve-drawing')
      this.drawingStart = this.context.pointer.position.clone();
    else if (this.context.definition.id === 'line-resolve-2') this.resetBall();
  }

  public pointerUp(): void {
    if (!this.drawingStart) return;
    const end = this.context.pointer.position.clone();
    if (Vector2.distance(this.drawingStart, end) > 8)
      this.segments.push({ a: this.drawingStart, b: end });
    this.drawingStart = null;
  }

  public resize(viewport: Viewport): void {
    this.context.viewport = viewport;
    this.reset();
  }

  public destroy(): void {
    this.graphics.destroy();
  }
}

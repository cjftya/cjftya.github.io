import type { Graphics } from 'pixi.js';
import { Vector2, PHYSICS_EPSILON, clamp, safeUnit } from '../core/Vector2';

export interface Body {
  position: Vector2;
  previous: Vector2;
  acceleration: Vector2;
  radius: number;
  pinned?: boolean;
}

export interface Link {
  a: number;
  b: number;
  length: number;
  stiffness: number;
  breakAt?: number;
}

export function createBody(x: number, y: number, radius = 4): Body {
  return {
    position: new Vector2(x, y),
    previous: new Vector2(x, y),
    acceleration: new Vector2(),
    radius,
  };
}

export function integrateVerlet(body: Body, stepScale: number, damping = 0.995): void {
  if (body.pinned) return;
  const velocityX = (body.position.x - body.previous.x) * damping;
  const velocityY = (body.position.y - body.previous.y) * damping;
  body.previous.copy(body.position);
  body.position.x +=
    velocityX * stepScale + body.acceleration.x * stepScale * stepScale;
  body.position.y +=
    velocityY * stepScale + body.acceleration.y * stepScale * stepScale;
  body.acceleration.set(0, 0);
}

export function solveLink(bodies: Body[], link: Link): number {
  const a = bodies[link.a];
  const b = bodies[link.b];
  if (!a || !b) return 0;
  const delta = safeUnit(b.position.x - a.position.x, b.position.y - a.position.y);
  if (delta.length <= PHYSICS_EPSILON) return 0;
  const error = (delta.length - link.length) * link.stiffness;
  const movable = Number(!a.pinned) + Number(!b.pinned);
  if (movable === 0) return Math.abs(error);
  if (!a.pinned) a.position.addScaled(delta, error / movable);
  if (!b.pinned) b.position.addScaled(delta, -error / movable);
  return Math.abs(error);
}

export function constrainBounds(
  body: Body,
  width: number,
  height: number,
  bounce = 0.35,
): void {
  if (body.pinned) return;
  const velocityX = body.position.x - body.previous.x;
  const velocityY = body.position.y - body.previous.y;
  const radius = body.radius;
  if (body.position.x < radius) {
    body.position.x = radius;
    body.previous.x = body.position.x + velocityX * bounce;
  } else if (body.position.x > width - radius) {
    body.position.x = width - radius;
    body.previous.x = body.position.x + velocityX * bounce;
  }
  if (body.position.y < radius) {
    body.position.y = radius;
    body.previous.y = body.position.y + velocityY * bounce;
  } else if (body.position.y > height - radius) {
    body.position.y = height - radius;
    body.previous.y = body.position.y + velocityY * bounce;
  }
}

export function solveBodyPair(a: Body, b: Body, padding = 0): void {
  const minimum = a.radius + b.radius + padding;
  const unit = safeUnit(b.position.x - a.position.x, b.position.y - a.position.y);
  if (unit.length >= minimum || unit.length <= PHYSICS_EPSILON) return;
  const overlap = minimum - unit.length;
  const movable = Number(!a.pinned) + Number(!b.pinned);
  if (movable === 0) return;
  if (!a.pinned) a.position.addScaled(unit, -overlap / movable);
  if (!b.pinned) b.position.addScaled(unit, overlap / movable);
}

export function distanceToSegmentSquared(
  point: Readonly<Vector2>,
  a: Readonly<Vector2>,
  b: Readonly<Vector2>,
): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared <= PHYSICS_EPSILON) return Vector2.distanceSquared(point, a);
  const t = clamp(((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSquared, 0, 1);
  const x = a.x + dx * t - point.x;
  const y = a.y + dy * t - point.y;
  return x * x + y * y;
}

export function segmentsIntersect(
  a: Readonly<Vector2>,
  b: Readonly<Vector2>,
  c: Readonly<Vector2>,
  d: Readonly<Vector2>,
): boolean {
  const orient = (p: Readonly<Vector2>, q: Readonly<Vector2>, r: Readonly<Vector2>) =>
    (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
  const abC = orient(a, b, c);
  const abD = orient(a, b, d);
  const cdA = orient(c, d, a);
  const cdB = orient(c, d, b);
  return abC * abD <= 0 && cdA * cdB <= 0;
}

export function drawGrid(
  graphics: Graphics,
  width: number,
  height: number,
  size: number,
): void {
  for (let x = size; x < width; x += size) graphics.moveTo(x, 0).lineTo(x, height);
  for (let y = size; y < height; y += size) graphics.moveTo(0, y).lineTo(width, y);
  graphics.stroke({ color: 0x1c2930, width: 1, alpha: 0.55 });
}

export function polygonAxes(points: Vector2[]): Vector2[] {
  const axes: Vector2[] = [];
  for (let index = 0; index < points.length; index += 1) {
    const next = (index + 1) % points.length;
    const currentPoint = points[index];
    const nextPoint = points[next];
    if (!currentPoint || !nextPoint) continue;
    axes.push(
      new Vector2(
        -(nextPoint.y - currentPoint.y),
        nextPoint.x - currentPoint.x,
      ).normalize(),
    );
  }
  return axes;
}

export function polygonsOverlap(a: Vector2[], b: Vector2[]): boolean {
  for (const axis of [...polygonAxes(a), ...polygonAxes(b)]) {
    let aMin = Number.POSITIVE_INFINITY;
    let aMax = Number.NEGATIVE_INFINITY;
    let bMin = Number.POSITIVE_INFINITY;
    let bMax = Number.NEGATIVE_INFINITY;
    for (const point of a) {
      const projection = point.dot(axis);
      aMin = Math.min(aMin, projection);
      aMax = Math.max(aMax, projection);
    }
    for (const point of b) {
      const projection = point.dot(axis);
      bMin = Math.min(bMin, projection);
      bMax = Math.max(bMax, projection);
    }
    if (aMax < bMin || bMax < aMin) return false;
  }
  return true;
}

import { PHYSICS_EPSILON, type Vector2 } from '../../core/Vector2';

export interface CollisionCircle {
  position: Vector2;
  velocity: Vector2;
  radius: number;
}

export function resolveCircleOverlap(
  left: CollisionCircle,
  right: CollisionCircle,
): boolean {
  const dx = right.position.x - left.position.x;
  const dy = right.position.y - left.position.y;
  const minimumDistance = left.radius + right.radius;
  const distanceSquared = dx * dx + dy * dy;
  if (distanceSquared >= minimumDistance * minimumDistance) return false;

  const distance = Math.sqrt(distanceSquared);
  const normalX = distance > PHYSICS_EPSILON ? dx / distance : 1;
  const normalY = distance > PHYSICS_EPSILON ? dy / distance : 0;
  const correction = (minimumDistance - distance) * 0.5;
  const correctionX = normalX * correction;
  const correctionY = normalY * correction;

  left.position.x -= correctionX;
  left.position.y -= correctionY;
  right.position.x += correctionX;
  right.position.y += correctionY;
  left.velocity.x -= correctionX;
  left.velocity.y -= correctionY;
  right.velocity.x += correctionX;
  right.velocity.y += correctionY;
  return true;
}

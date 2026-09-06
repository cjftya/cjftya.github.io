import { PHYSICS_EPSILON, Vector2 } from '../../core/Vector2';

export interface VerletNode {
  position: Vector2;
  previous: Vector2;
  acceleration: Vector2;
  fixed: boolean;
}

export interface DistanceLink {
  from: number;
  to: number;
  length: number;
  limit: number;
  alive: boolean;
}

export function createVerletNode(x: number, y: number, fixed = false): VerletNode {
  const position = new Vector2(x, y);
  return { position, previous: position.clone(), acceleration: new Vector2(), fixed };
}

export function createDistanceLink(
  nodes: ReadonlyArray<VerletNode>,
  from: number,
  to: number,
  extraLimit: number,
): DistanceLink {
  const left = nodes[from];
  const right = nodes[to];
  const length = left && right ? Vector2.distance(left.position, right.position) : 0;
  return { from, to, length, limit: length + extraLimit, alive: true };
}

export function solveDistanceLink(
  nodes: ReadonlyArray<VerletNode>,
  link: DistanceLink,
  selectedIndex: number,
  response = 0.5,
  tensionOnly = false,
): number {
  if (!link.alive) return 0;
  const left = nodes[link.from];
  const right = nodes[link.to];
  if (!left || !right) return 0;
  const dx = right.position.x - left.position.x;
  const dy = right.position.y - left.position.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  if (distance <= PHYSICS_EPSILON) return distance;
  let error = distance - link.length;
  if (tensionOnly && error < 0) error = 0;
  const fx = (dx / distance) * error * response;
  const fy = (dy / distance) * error * response;
  if (!left.fixed && link.from !== selectedIndex) left.position.add({ x: fx, y: fy });
  if (!right.fixed && link.to !== selectedIndex) right.position.add({ x: -fx, y: -fy });
  return distance;
}

export function integrateVerlet(
  node: VerletNode,
  damping: number,
  gravity: number,
): void {
  const nextX =
    node.position.x +
    (node.position.x - node.previous.x) * damping +
    node.acceleration.x;
  const nextY =
    node.position.y +
    (node.position.y - node.previous.y) * damping +
    gravity +
    node.acceleration.y;
  node.previous.copy(node.position);
  node.position.set(nextX, nextY);
  node.acceleration.set(0, 0);
}

export function closestNode(
  nodes: ReadonlyArray<VerletNode>,
  point: Readonly<Vector2>,
  radius: number,
): number {
  return nodes.findIndex(
    (node) => Vector2.distanceSquared(node.position, point) < radius * radius,
  );
}

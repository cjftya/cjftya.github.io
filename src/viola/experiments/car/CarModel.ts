import { PHYSICS_EPSILON, Vector2, closestPointOnSegment } from '../../core/Vector2';

export interface CarNode {
  position: Vector2;
  previous: Vector2;
}

export interface CarLink {
  left: number;
  right: number;
  length: number;
  visible: boolean;
}

export interface CarWheel {
  position: Vector2;
  velocity: Vector2;
  radius: number;
  angle: number;
  angularVelocity: number;
  collision: boolean;
}

const linkDefinitions = [
  [2, 3, true],
  [2, 4, true],
  [3, 5, true],
  [4, 5, true],
  [2, 5, true],
  [3, 4, true],
  [2, 6, false],
  [3, 7, false],
  [6, 7, false],
  [2, 7, false],
  [3, 6, false],
  [0, 2, true],
  [1, 3, true],
  [0, 3, false],
  [1, 2, false],
] as const;

const terrain = [
  [new Vector2(0, 500), new Vector2(800, 600)],
  [new Vector2(100, 700), new Vector2(1_000, 200)],
] as const;

export class CarModel {
  public readonly nodes: CarNode[];
  public readonly links: CarLink[];
  public readonly wheels = new Map<number, CarWheel>();

  public constructor(x = 200, y = 100) {
    const points = [
      [x - 10, y - 20],
      [x + 130, y - 20],
      [x, y + 20],
      [x + 120, y + 20],
      [x, y + 50],
      [x + 120, y + 50],
      [x, y + 70],
      [x + 120, y + 70],
    ] as const;
    this.nodes = points.map(([px, py]) => ({
      position: new Vector2(px, py),
      previous: new Vector2(px, py),
    }));
    this.links = linkDefinitions.map(([left, right, visible]) => ({
      left,
      right,
      visible,
      length: Vector2.distance(
        this.nodes[left]?.position ?? new Vector2(),
        this.nodes[right]?.position ?? new Vector2(),
      ),
    }));
    for (const index of [6, 7]) {
      const position = this.nodes[index]?.position.clone() ?? new Vector2();
      this.wheels.set(index, {
        position,
        velocity: new Vector2(),
        radius: 20,
        angle: 0,
        angularVelocity: 0,
        collision: false,
      });
    }
  }

  public step(): void {
    this.solveLinks();
    this.captureWheels();
    this.integrate();
    for (const wheel of this.wheels.values()) {
      wheel.position.add(wheel.velocity);
      wheel.angle += wheel.angularVelocity;
      wheel.angularVelocity *= 0.995;
    }
    this.constrainBounds();
    for (let index = 0; index < this.nodes.length; index += 1)
      for (const [start, end] of terrain) this.resolveTerrain(index, start, end);
  }

  public drive(direction: -1 | 1): void {
    const wheel = this.wheels.get(7);
    const node = this.nodes[7];
    if (!wheel || !node) return;
    if (wheel.collision) node.position.x += direction * 2;
    wheel.angularVelocity += direction * 0.2;
  }

  public jump(): void {
    const node = this.nodes[7];
    if (node) node.position.y -= 20;
  }

  public readonly terrain = terrain;

  private solveLinks(): void {
    for (const link of this.links) {
      const left = this.nodes[link.left];
      const right = this.nodes[link.right];
      if (!left || !right) continue;
      const dx = left.position.x - right.position.x;
      const dy = left.position.y - right.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance <= PHYSICS_EPSILON) continue;
      const correction = (link.length - distance) * 0.5;
      const fx = (dx / distance) * correction;
      const fy = (dy / distance) * correction;
      left.position.x += fx;
      left.position.y += fy;
      right.position.x -= fx;
      right.position.y -= fy;
    }
  }

  private captureWheels(): void {
    for (const [index, wheel] of this.wheels) {
      const node = this.nodes[index];
      if (!node) continue;
      wheel.velocity.copy(Vector2.subtract(node.position, node.previous));
      wheel.position.copy(node.position);
    }
  }

  private integrate(): void {
    for (const node of this.nodes) {
      const nextX = node.position.x + (node.position.x - node.previous.x) * 0.995;
      const nextY = node.position.y + (node.position.y - node.previous.y) * 0.995 + 0.2;
      node.previous.copy(node.position);
      node.position.set(nextX, nextY);
    }
  }

  private constrainBounds(): void {
    for (let index = 0; index < this.nodes.length; index += 1) {
      const node = this.nodes[index];
      if (!node) continue;
      const wheel = this.wheels.get(index);
      const radius = wheel?.radius ?? 0;
      const friction = wheel ? 0.0001 : 0.1;
      if (node.position.x < radius) {
        node.position.x = radius;
        if (wheel) this.roll(wheel, 1, 0);
      } else if (node.position.x > 1_000 - radius) {
        node.position.x = 1_000 - radius;
        if (wheel) this.roll(wheel, -1, 0);
      }
      if (node.position.y < radius) {
        node.position.y = radius;
        if (wheel) this.roll(wheel, 0, 1);
      } else if (node.position.y > 600 - radius) {
        node.position.y = 600 - radius;
        node.position.x -= (node.position.x - node.previous.x) * friction;
        if (wheel) this.roll(wheel, 0, -1);
      }
    }
  }

  private resolveTerrain(index: number, start: Vector2, end: Vector2): void {
    const node = this.nodes[index];
    if (!node) return;
    const closest = closestPointOnSegment(node.position, start, end);
    const dx = closest.x - node.position.x;
    const dy = closest.y - node.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const wheel = this.wheels.get(index);
    const radius = wheel?.radius ?? 10;
    if (distance >= radius || distance <= PHYSICS_EPSILON) return;
    const nx = dx / distance;
    const ny = dy / distance;
    const depth = radius - distance;
    node.position.x -= nx * depth;
    node.position.y -= ny * depth;
    if (wheel) {
      this.roll(wheel, -nx, -ny);
      wheel.collision = true;
    }
  }

  private roll(wheel: CarWheel, normalX: number, normalY: number): void {
    const tangentVelocity = wheel.velocity.y * normalX - wheel.velocity.x * normalY;
    wheel.angularVelocity = tangentVelocity / wheel.radius;
  }
}

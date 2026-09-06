import { PHYSICS_EPSILON, Vector2, clamp } from '../../core/Vector2';

export interface JellyNode {
  position: Vector2;
  velocity: Vector2;
  radius: number;
}

export class CircleJellyModel {
  public readonly nodes: JellyNode[];
  public readonly anchors: JellyNode[];
  public readonly collider: JellyNode = {
    position: new Vector2(200, 50),
    velocity: new Vector2(),
    radius: 10,
  };
  private selectedIndex = -1;

  public constructor() {
    const slice = (Math.PI * 2) / 20;
    this.nodes = Array.from({ length: 20 }, (_, index) => ({
      position: new Vector2(
        200 + Math.cos(index * slice) * 150,
        400 + Math.sin(index * slice) * 150,
      ),
      velocity: new Vector2(),
      radius: 25,
    }));
    this.anchors = this.nodes.map((node) => ({
      position: node.position.clone(),
      velocity: new Vector2(),
      radius: 0,
    }));
  }

  public step(): void {
    this.applySprings();
    this.constrainFloor();
    this.resolveCollider();
    this.nodes.forEach((node, index) => {
      if (index === this.selectedIndex) return;
      node.velocity.x = clamp(node.velocity.x * 0.9, -30, 30);
      node.velocity.y = clamp(node.velocity.y * 0.9, -30, 30);
      node.position.add(node.velocity);
      const anchor = this.anchors[index];
      if (anchor) {
        anchor.velocity.scale(0.95);
        anchor.position.add(anchor.velocity);
      }
    });
    this.collider.velocity.y += 0.5;
    this.collider.position.add(this.collider.velocity);
  }

  public pick(point: Readonly<Vector2>): void {
    this.selectedIndex = this.nodes.findIndex(
      (node) =>
        Vector2.distanceSquared(node.position, point) < node.radius * node.radius,
    );
  }

  public drag(point: Readonly<Vector2>): void {
    this.nodes[this.selectedIndex]?.position.copy(point);
  }

  public release(): void {
    const node = this.nodes[this.selectedIndex];
    if (node) node.velocity.set(0, 0);
    this.selectedIndex = -1;
  }

  public keyDown(code: string): void {
    const impulse = new Vector2();
    if (code === 'ArrowUp') impulse.y = -2;
    else if (code === 'ArrowDown') impulse.y = 2;
    else if (code === 'ArrowLeft') impulse.x = -2;
    else if (code === 'ArrowRight') impulse.x = 2;
    else return;
    this.nodes.forEach((node, index) => {
      node.velocity.add(impulse);
      this.anchors[index]?.velocity.add(impulse);
    });
  }

  private applySprings(): void {
    const force = 0.2;
    this.nodes.forEach((node, index) => {
      const anchor = this.anchors[index];
      if (anchor)
        node.velocity.addScaled(
          Vector2.subtract(anchor.position, node.position),
          force,
        );
      const previousIndex = (index + this.nodes.length - 1) % this.nodes.length;
      const previous = this.nodes[previousIndex];
      if (!previous) return;
      const delta = Vector2.subtract(previous.position, node.position).scale(force);
      node.velocity.add(delta);
      previous.velocity.addScaled(delta, -1);
    });
  }

  private constrainFloor(): void {
    for (const node of this.nodes) {
      if (node.position.y <= 500 - node.radius) continue;
      node.position.y = 500 - node.radius;
      node.velocity.y *= 0.01;
    }
  }

  private resolveCollider(): void {
    for (const node of this.nodes) {
      const dx = node.position.x - this.collider.position.x;
      const dy = node.position.y - this.collider.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const radius = node.radius + this.collider.radius;
      if (distance >= radius || distance <= PHYSICS_EPSILON) continue;
      const penetration = radius - distance;
      const fx = (dx / distance) * penetration * 0.5;
      const fy = (dy / distance) * penetration * 0.5;
      this.collider.position.add({ x: -fx, y: -fy });
      node.position.add({ x: fx, y: fy });
      this.collider.velocity.add({ x: -fx, y: -fy });
      node.velocity.add({ x: fx, y: fy });
    }
  }
}

import type { Random } from '../../core/Random';
import { PHYSICS_EPSILON, Vector2, clamp } from '../../core/Vector2';

export interface ConstraintNode {
  position: Vector2;
  previous: Vector2;
  fixed: boolean;
}

export class ConstraintListModel {
  public readonly nodes: ConstraintNode[];
  public readonly links = [
    { from: 0, to: 1, length: 150 },
    { from: 0, to: 2, length: 150 },
  ] as const;
  public readonly targetAngle = 0.5;
  private selectedIndex = -1;

  public constructor(random: Random) {
    this.nodes = Array.from({ length: 4 }, (_, index) => {
      const position = new Vector2(random.integer(200, 310), random.integer(200, 310));
      return { position, previous: position.clone(), fixed: index === 1 };
    });
  }

  public step(): void {
    for (const link of this.links) this.solveDistance(link.from, link.to, link.length);
    this.solveAngle(0, 1, 2);
    this.nodes.forEach((node, index) => {
      if (node.fixed || index === this.selectedIndex) return;
      const nextX = node.position.x + (node.position.x - node.previous.x) * 0.95;
      const nextY = node.position.y + (node.position.y - node.previous.y) * 0.95;
      node.previous.copy(node.position);
      node.position.set(clamp(nextX, 10, 990), clamp(nextY, 10, 640));
    });
  }

  public pick(point: Readonly<Vector2>): void {
    this.selectedIndex = this.nodes.findIndex(
      (node) => Vector2.distanceSquared(node.position, point) < 20 * 20,
    );
    this.drag(point);
  }

  public drag(point: Readonly<Vector2>): void {
    const node = this.nodes[this.selectedIndex];
    if (!node) return;
    node.position.copy(point);
    node.previous.copy(point);
  }

  public release(): void {
    this.selectedIndex = -1;
  }

  private solveDistance(from: number, to: number, targetLength: number): void {
    const left = this.nodes[from];
    const right = this.nodes[to];
    if (!left || !right) return;
    const dx = right.position.x - left.position.x;
    const dy = right.position.y - left.position.y;
    const squared = dx * dx + dy * dy;
    if (squared <= PHYSICS_EPSILON) return;
    const error = ((targetLength * targetLength - squared) / squared) * 0.01;
    const fx = dx * error;
    const fy = dy * error;
    if (!left.fixed && from !== this.selectedIndex)
      left.position.addScaled({ x: fx, y: fy }, -1);
    if (!right.fixed && to !== this.selectedIndex) right.position.add({ x: fx, y: fy });
  }

  private solveAngle(aIndex: number, pivotIndex: number, cIndex: number): void {
    const a = this.nodes[aIndex];
    const pivot = this.nodes[pivotIndex];
    const c = this.nodes[cIndex];
    if (!a || !pivot || !c) return;
    const ba = Vector2.subtract(a.position, pivot.position);
    const bc = Vector2.subtract(c.position, pivot.position);
    let difference = Math.atan2(ba.cross(bc), ba.dot(bc)) - this.targetAngle;
    if (difference > Math.PI) difference -= Math.PI * 2;
    else if (difference < -Math.PI) difference += Math.PI * 2;
    difference *= 0.1;
    a.position.rotate(difference, pivot.position);
    c.position.rotate(-difference, pivot.position);
    pivot.position.rotate(difference, a.position);
    pivot.position.rotate(-difference, c.position);
  }
}

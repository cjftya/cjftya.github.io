import { PHYSICS_EPSILON, Vector2 } from '../../core/Vector2';

export interface SoftbodyNode {
  position: Vector2;
  previous: Vector2;
  acceleration: Vector2;
  fixed: boolean;
}

export interface SoftbodyLink {
  left: number;
  right: number;
  restLength: number;
}

const linkPairs = [
  [0, 1],
  [1, 2],
  [2, 4],
  [4, 7],
  [7, 6],
  [6, 5],
  [5, 3],
  [3, 0],
  [1, 3],
  [2, 5],
  [4, 6],
  [3, 6],
  [0, 7],
  [1, 4],
  [3, 4],
  [1, 6],
  [8, 9],
  [10, 11],
  [12, 13],
  [14, 15],
  [8, 10],
  [10, 12],
  [12, 14],
  [9, 11],
  [11, 13],
  [13, 15],
  [8, 11],
  [9, 10],
  [10, 13],
  [11, 12],
  [12, 15],
  [13, 14],
] as const;

export class SoftbodyModel {
  public readonly nodes: SoftbodyNode[];
  public readonly links: SoftbodyLink[];
  private selectedIndex = -1;

  public constructor(x = 400, y = 100) {
    const positions = [
      [x, y],
      [x + 50, y],
      [x + 100, y],
      [x, y + 50],
      [x + 100, y + 50],
      [x, y + 100],
      [x + 50, y + 100],
      [x + 100, y + 100],
      [x, y],
      [x + 50, y],
      [x, y + 50],
      [x + 50, y + 50],
      [x, y + 100],
      [x + 50, y + 100],
      [x, y + 150],
      [x + 50, y + 150],
    ] as const;
    this.nodes = positions.map(([positionX, positionY], index) => ({
      position: new Vector2(positionX, positionY),
      previous: new Vector2(positionX, positionY),
      acceleration: new Vector2(),
      fixed: index === 14 || index === 15,
    }));
    this.links = linkPairs.map(([left, right]) => ({
      left,
      right,
      restLength: Vector2.distance(
        this.nodes[left]?.position ?? new Vector2(),
        this.nodes[right]?.position ?? new Vector2(),
      ),
    }));
  }

  public step(): void {
    for (let iteration = 0; iteration < 5; iteration += 1) {
      this.integrate();
      this.solveLinks();
    }
  }

  public pick(point: Readonly<Vector2>): void {
    this.selectedIndex = this.nodes.findIndex(
      (node) => Vector2.distanceSquared(node.position, point) < 100,
    );
  }

  public moveSelected(point: Readonly<Vector2>): void {
    const selected = this.nodes[this.selectedIndex];
    if (!selected) return;
    selected.position.copy(point);
    selected.previous.copy(point);
    selected.acceleration.set(0, 0);
  }

  public release(): void {
    const selected = this.nodes[this.selectedIndex];
    selected?.acceleration.set(0, 0);
    this.selectedIndex = -1;
  }

  private integrate(): void {
    this.nodes.forEach((node, index) => {
      if (node.fixed || index === this.selectedIndex) return;
      node.acceleration.y = 0.02;
      const nextX =
        node.position.x +
        (node.position.x - node.previous.x) * 0.9995 +
        node.acceleration.x;
      const nextY =
        node.position.y +
        (node.position.y - node.previous.y) * 0.9995 +
        node.acceleration.y;
      node.previous.copy(node.position);
      node.position.set(nextX, nextY);
      node.acceleration.set(0, 0);
      this.constrain(node);
    });
  }

  private solveLinks(): void {
    for (const link of this.links) {
      const left = this.nodes[link.left];
      const right = this.nodes[link.right];
      if (!left || !right) continue;
      const dx = right.position.x - left.position.x;
      const dy = right.position.y - left.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance <= PHYSICS_EPSILON) continue;
      const error = (distance - link.restLength) * 0.05;
      const forceX = (dx / distance) * error;
      const forceY = (dy / distance) * error;
      if (!left.fixed && link.left !== this.selectedIndex) {
        left.position.x += forceX;
        left.position.y += forceY;
      }
      if (!right.fixed && link.right !== this.selectedIndex) {
        right.position.x -= forceX;
        right.position.y -= forceY;
      }
    }
  }

  private constrain(node: SoftbodyNode): void {
    if (node.position.x < 0) node.position.x = 0;
    else if (node.position.x > 1_300) node.position.x = 1_300;
    if (node.position.y < 0) node.position.y = 0;
    else if (node.position.y > 750) {
      node.position.y = 750;
      node.position.x -= node.position.x - node.previous.x;
    }
  }
}

import type { Vector2 } from '../../core/Vector2';
import {
  closestNode,
  createDistanceLink,
  createVerletNode,
  integrateVerlet,
  solveDistanceLink,
  type DistanceLink,
  type VerletNode,
} from '../common/VerletNetwork';

export class FigureModel {
  public readonly nodes: VerletNode[];
  public readonly links: DistanceLink[];
  public readonly headRadius = 15;
  private selectedIndex = -1;

  public constructor(x = 100, y = 100, size = 30) {
    const torsoY = y + size * 0.8;
    const hipY = torsoY + size * 1.5;
    this.nodes = [
      createVerletNode(x, y),
      createVerletNode(x, torsoY),
      createVerletNode(x - size * 0.8, torsoY),
      createVerletNode(x - size * 0.8, torsoY + size * 0.8),
      createVerletNode(x + size * 0.8, torsoY),
      createVerletNode(x + size * 0.8, torsoY + size * 0.8),
      createVerletNode(x, hipY),
      createVerletNode(x - size, hipY),
      createVerletNode(x - size, hipY + size),
      createVerletNode(x + size, hipY),
      createVerletNode(x + size, hipY + size),
    ];
    const pairs = [
      [0, 1],
      [1, 2],
      [2, 3],
      [1, 4],
      [4, 5],
      [1, 6],
      [6, 7],
      [7, 8],
      [6, 9],
      [9, 10],
    ] as const;
    this.links = pairs.map(([from, to]) =>
      createDistanceLink(this.nodes, from, to, 50),
    );
  }

  public step(): void {
    for (let iteration = 0; iteration < 5; iteration += 1) {
      this.nodes.forEach((node, index) => {
        if (node.fixed || index === this.selectedIndex) return;
        integrateVerlet(node, 0.9995, 0.018);
        const radius = index === 0 ? 30 : 0;
        if (node.position.x < radius) node.position.x = radius;
        else if (node.position.x > 1_000 - radius) node.position.y = 1_000 - radius;
        if (node.position.y < radius) node.position.y = radius;
        else if (node.position.y > 750 - radius) {
          node.position.y = 750 - radius;
          node.position.x -= node.position.x - node.previous.x;
        }
      });
      for (const link of this.links) {
        const distance = solveDistanceLink(this.nodes, link, this.selectedIndex);
        if (distance > link.limit && this.selectedIndex > 0) {
          const selectedLink = this.links[this.selectedIndex - 1];
          if (selectedLink) selectedLink.alive = false;
        }
      }
    }
  }

  public pick(point: Readonly<Vector2>): void {
    this.selectedIndex = closestNode(this.nodes, point, 10);
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
}

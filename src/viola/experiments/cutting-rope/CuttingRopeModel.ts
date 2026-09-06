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

export class CuttingRopeModel {
  public readonly nodes: VerletNode[];
  public readonly links: DistanceLink[];
  private selectedIndex = -1;

  public constructor() {
    this.nodes = Array.from({ length: 40 }, (_, index) =>
      createVerletNode(400 + index * 15, 50, index === 0 || index === 20),
    );
    this.links = Array.from({ length: 39 }, (_, index) =>
      createDistanceLink(this.nodes, index, index + 1, 20),
    );
  }

  public step(): void {
    for (let iteration = 0; iteration < 5; iteration += 1) {
      for (const link of this.links) {
        const distance = solveDistanceLink(this.nodes, link, this.selectedIndex);
        if (distance > link.limit && this.selectedIndex > 0) {
          const selectedLink = this.links[this.selectedIndex - 1];
          if (selectedLink) selectedLink.alive = false;
        }
      }
      this.nodes.forEach((node, index) => {
        if (node.fixed || index === this.selectedIndex) return;
        integrateVerlet(node, 0.9995, 0.018);
        if (node.position.y > 750) node.position.y = 750;
      });
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
    node.acceleration.set(0, 0);
  }

  public release(): void {
    this.selectedIndex = -1;
  }
}

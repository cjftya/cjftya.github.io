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

export class ClothDestroyModel {
  public readonly rows = 5;
  public readonly columns = 5;
  public readonly nodes: VerletNode[];
  public readonly links: DistanceLink[] = [];
  private selectedIndex = -1;

  public constructor() {
    this.nodes = Array.from({ length: this.rows * this.columns }, (_, index) => {
      const row = Math.floor(index / this.columns);
      const column = index % this.columns;
      return createVerletNode(
        200 + column * 40,
        100 + row * 40,
        row === 0 && (column === 0 || column === this.columns - 1),
      );
    });
    for (let row = 0; row < this.rows; row += 1) {
      for (let column = 0; column < this.columns; column += 1) {
        const from = this.index(row, column);
        if (row > 0 && column + 1 < this.columns)
          this.addLink(from, this.index(row - 1, column + 1));
        if (column + 1 < this.columns) this.addLink(from, this.index(row, column + 1));
        if (row + 1 < this.rows) this.addLink(from, this.index(row + 1, column));
        if (row + 1 < this.rows && column + 1 < this.columns)
          this.addLink(from, this.index(row + 1, column + 1));
      }
    }
  }

  public step(): void {
    this.nodes.forEach((node, index) => {
      if (!node.fixed && index !== this.selectedIndex)
        integrateVerlet(node, 0.9995, 0.2);
    });
    for (const link of this.links) {
      if (!link.alive) continue;
      const from = this.nodes[link.from];
      const to = this.nodes[link.to];
      if (from && to && Vector2Distance(from.position, to.position) > link.limit) {
        link.alive = false;
        continue;
      }
      solveDistanceLink(this.nodes, link, this.selectedIndex, 0.4, true);
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

  private index(row: number, column: number): number {
    return row * this.columns + column;
  }

  private addLink(from: number, to: number): void {
    this.links.push(createDistanceLink(this.nodes, from, to, 80));
  }
}

function Vector2Distance(a: Readonly<Vector2>, b: Readonly<Vector2>): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

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

export type StructureMode = 'vertex' | 'connect' | 'simulate';

export class SoftbodyStructTestModel {
  public readonly nodes: VerletNode[] = [];
  public readonly links: DistanceLink[] = [];
  public mode: StructureMode = 'vertex';
  public fixEditing = false;
  public cutMode = false;
  public pointsVisible = true;
  public gravity = 0;
  public stiffness = 0.5;
  private selectedIndex = -1;
  private pendingConnection = -1;

  public step(): void {
    if (this.mode !== 'simulate') return;
    for (let iteration = 0; iteration < 5; iteration += 1) {
      for (const link of this.links) {
        const distance = solveDistanceLink(
          this.nodes,
          link,
          this.selectedIndex,
          this.stiffness,
        );
        if (this.cutMode && distance > link.limit && this.selectedIndex > 0) {
          const selectedLink = this.links[this.selectedIndex - 1];
          if (selectedLink) selectedLink.alive = false;
        }
      }
      this.nodes.forEach((node, index) => {
        if (node.fixed || index === this.selectedIndex) return;
        integrateVerlet(node, 1, this.gravity);
        this.constrain(node);
      });
    }
  }

  public pointerDown(point: Readonly<Vector2>): void {
    if (this.mode === 'vertex') {
      if (this.fixEditing) this.toggleFixed(point);
      else this.addVertex(point);
    } else if (this.mode === 'connect') this.connectPick(point);
    else this.selectedIndex = closestNode(this.nodes, point, 10);
  }

  public pointerUp(point: Readonly<Vector2>): void {
    if (this.mode === 'connect') this.connectPick(point);
    this.selectedIndex = -1;
  }

  public drag(point: Readonly<Vector2>): void {
    if (this.mode !== 'simulate') return;
    const node = this.nodes[this.selectedIndex];
    if (!node) return;
    node.position.copy(point);
    node.previous.copy(point);
    node.acceleration.set(0, 0);
  }

  public keyDown(code: string): void {
    if (code === 'Digit1') this.mode = 'vertex';
    else if (code === 'Digit2') this.mode = 'connect';
    else if (code === 'Digit3') this.mode = 'simulate';
    else if (code === 'KeyF') this.fixEditing = !this.fixEditing;
    else if (code === 'KeyC') this.cutMode = !this.cutMode;
    else if (code === 'KeyP') this.pointsVisible = !this.pointsVisible;
    else if (code === 'KeyG') this.gravity = this.gravity === 0 ? 0.2 : 0;
    else if (code === 'KeyR') this.reset();
  }

  private addVertex(point: Readonly<Vector2>): void {
    if (this.nodes.length >= 1_000) return;
    this.nodes.push(createVerletNode(point.x, point.y));
  }

  private toggleFixed(point: Readonly<Vector2>): void {
    const node = this.nodes[closestNode(this.nodes, point, 10)];
    if (node) node.fixed = !node.fixed;
  }

  private connectPick(point: Readonly<Vector2>): void {
    const index = closestNode(this.nodes, point, 10);
    if (index < 0) return;
    if (this.pendingConnection < 0) {
      this.pendingConnection = index;
      return;
    }
    const from = this.pendingConnection;
    this.pendingConnection = -1;
    if (from === index || this.links.length >= 2_000) return;
    const exists = this.links.some(
      (link) =>
        link.alive &&
        ((link.from === from && link.to === index) ||
          (link.from === index && link.to === from)),
    );
    if (!exists) this.links.push(createDistanceLink(this.nodes, from, index, 20));
  }

  private constrain(node: VerletNode): void {
    if (node.position.x < 0 || node.position.x > 1_400) {
      const velocity = node.previous.x - node.position.x;
      node.position.x = Math.max(0, Math.min(1_400, node.position.x));
      node.previous.x = node.position.x - velocity * 0.7;
    }
    if (node.position.y < 0 || node.position.y > 750) {
      const velocity = node.previous.y - node.position.y;
      node.position.y = Math.max(0, Math.min(750, node.position.y));
      node.previous.y = node.position.y - velocity * 0.7;
      if (node.position.y === 750) node.position.x -= node.position.x - node.previous.x;
    }
  }

  private reset(): void {
    this.nodes.length = 0;
    this.links.length = 0;
    this.mode = 'vertex';
    this.fixEditing = false;
    this.selectedIndex = -1;
    this.pendingConnection = -1;
  }
}

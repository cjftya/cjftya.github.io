import type { Container } from 'pixi.js';
import type { Viewport } from './Experiment';
import { Vector2, type VectorLike } from './Vector2';

export interface ReferenceSize {
  width: number;
  height: number;
}

export class ReferenceViewport {
  private scale = 1;
  private offsetX = 0;
  private offsetY = 0;

  public constructor(private readonly reference: ReferenceSize) {}

  public fit(viewport: Viewport, target: Container): void {
    this.scale = Math.min(
      viewport.width / this.reference.width,
      viewport.height / this.reference.height,
    );
    this.offsetX = (viewport.width - this.reference.width * this.scale) * 0.5;
    this.offsetY = (viewport.height - this.reference.height * this.scale) * 0.5;
    target.position.set(this.offsetX, this.offsetY);
    target.scale.set(this.scale);
  }

  public toReference(point: Readonly<VectorLike>, output = new Vector2()): Vector2 {
    return output.set(
      (point.x - this.offsetX) / this.scale,
      (point.y - this.offsetY) / this.scale,
    );
  }
}

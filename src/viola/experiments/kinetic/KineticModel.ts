import { Vector2, type VectorLike } from '../../core/Vector2';

export interface KineticSegment {
  start: Vector2;
  end: Vector2;
  angle: number;
}

export class KineticModel {
  public readonly focus = new Vector2();
  public readonly segments: KineticSegment[];
  public readonly width = 30;
  public readonly height = 7;

  public constructor(count = 15) {
    this.segments = Array.from({ length: count }, (_, index) => ({
      start: new Vector2(100 + index * this.width, 100),
      end: new Vector2(100 + (index + 1) * this.width, 100),
      angle: 0,
    }));
  }

  public setFocus(point: Readonly<Vector2>): void {
    this.focus.copy(point);
  }

  public step(): void {
    const first = this.segments[0];
    if (!first) return;
    this.aim(first, this.focus);
    let targetX = this.focus.x - (first.end.x - first.start.x);
    let targetY = this.focus.y - (first.end.y - first.start.y);

    for (let index = 1; index < this.segments.length; index += 1) {
      const segment = this.segments[index];
      if (!segment) continue;
      this.aim(segment, { x: targetX, y: targetY });
      targetX -= segment.end.x - segment.start.x;
      targetY -= segment.end.y - segment.start.y;
    }
    for (let index = this.segments.length - 2; index >= 0; index -= 1) {
      const segment = this.segments[index];
      const next = this.segments[index + 1];
      if (!segment || !next) continue;
      segment.start.copy(next.end);
      this.updateEnd(segment);
    }
  }

  private aim(segment: KineticSegment, target: Readonly<VectorLike>): void {
    segment.angle = Math.atan2(target.y - segment.start.y, target.x - segment.start.x);
    this.updateEnd(segment);
  }

  private updateEnd(segment: KineticSegment): void {
    segment.end.set(
      segment.start.x + Math.cos(segment.angle) * this.width,
      segment.start.y + Math.sin(segment.angle) * this.width,
    );
  }
}

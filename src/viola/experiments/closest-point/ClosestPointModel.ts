import { Vector2, closestPointOnSegment } from '../../core/Vector2';

export class ClosestPointModel {
  public readonly start = new Vector2(100, 100);
  public readonly end = new Vector2(200, 300);
  public readonly query = new Vector2();
  public readonly closest = new Vector2(100, 100);

  public setQuery(point: Readonly<Vector2>): void {
    this.query.copy(point);
  }

  public step(): void {
    this.closest.copy(closestPointOnSegment(this.query, this.start, this.end));
  }
}

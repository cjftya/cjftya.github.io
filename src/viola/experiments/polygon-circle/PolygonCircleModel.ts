import { PHYSICS_EPSILON, Vector2, closestPointOnSegment } from '../../core/Vector2';

export class PolygonCircleModel {
  public readonly polygonPosition = new Vector2(200, 200);
  public readonly polygonRadius = 50;
  public readonly polygonAngle = 0.2;
  public readonly circlePosition = new Vector2(300, 600);
  public readonly circleVelocity = new Vector2();
  public readonly circleRadius = 30;
  public readonly contact = new Vector2();
  private selected = false;

  public step(): void {
    const vertices = this.vertices();
    let inside = true;
    let bestFaceDistance = -Infinity;
    let faceNormal = new Vector2(1, 0);
    let closest = vertices[0]?.clone() ?? new Vector2();
    let closestDistanceSquared = Infinity;

    for (let index = 0; index < vertices.length; index += 1) {
      const start = vertices[index];
      const end = vertices[(index + 1) % vertices.length];
      if (!start || !end) continue;
      const edgeX = end.x - start.x;
      const edgeY = end.y - start.y;
      const length = Math.sqrt(edgeX * edgeX + edgeY * edgeY);
      if (length <= PHYSICS_EPSILON) continue;
      const normal = new Vector2(-edgeY / length, edgeX / length);
      const distance =
        normal.x * (this.circlePosition.x - end.x) +
        normal.y * (this.circlePosition.y - end.y);
      if (distance > 0) inside = false;
      if (distance > bestFaceDistance) {
        bestFaceDistance = distance;
        faceNormal = normal;
      }
      const point = closestPointOnSegment(this.circlePosition, start, end);
      const pointDistance = Vector2.distanceSquared(point, this.circlePosition);
      if (pointDistance < closestDistanceSquared) {
        closestDistanceSquared = pointDistance;
        closest = point;
      }
    }

    if (!inside && closestDistanceSquared >= this.circleRadius ** 2) return;
    let nx: number;
    let ny: number;
    let penetration: number;
    if (inside) {
      nx = faceNormal.x;
      ny = faceNormal.y;
      penetration = this.circleRadius - bestFaceDistance;
      this.contact.set(
        this.circlePosition.x - nx * this.circleRadius,
        this.circlePosition.y - ny * this.circleRadius,
      );
    } else {
      const dx = this.circlePosition.x - closest.x;
      const dy = this.circlePosition.y - closest.y;
      const distance = Math.sqrt(closestDistanceSquared);
      nx = distance > PHYSICS_EPSILON ? dx / distance : faceNormal.x;
      ny = distance > PHYSICS_EPSILON ? dy / distance : faceNormal.y;
      penetration = this.circleRadius - distance;
      this.contact.copy(closest);
    }
    const correction = penetration * 0.5;
    this.circlePosition.x += nx * correction;
    this.circlePosition.y += ny * correction;
    this.polygonPosition.x -= nx * correction;
    this.polygonPosition.y -= ny * correction;
  }

  public vertices(): Vector2[] {
    return [
      new Vector2(-this.polygonRadius, -this.polygonRadius),
      new Vector2(-this.polygonRadius, this.polygonRadius),
      new Vector2(this.polygonRadius, this.polygonRadius),
      new Vector2(this.polygonRadius, -this.polygonRadius),
    ].map((point) => point.rotate(this.polygonAngle).add(this.polygonPosition));
  }

  public pick(point: Readonly<Vector2>): void {
    this.selected =
      Vector2.distanceSquared(point, this.circlePosition) < this.circleRadius ** 2;
  }

  public drag(point: Readonly<Vector2>): void {
    if (!this.selected) return;
    this.circlePosition.copy(point);
    this.circleVelocity.set(0, 0);
  }

  public release(): void {
    this.selected = false;
  }

  public keyDown(code: string): void {
    if (code === 'KeyA') this.circleVelocity.x -= 1;
    else if (code === 'KeyD') this.circleVelocity.x += 1;
    else if (code === 'KeyW') this.circleVelocity.y -= 1;
    else if (code === 'KeyS') this.circleVelocity.y += 1;
  }
}

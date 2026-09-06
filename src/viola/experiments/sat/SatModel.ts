import { PHYSICS_EPSILON, Vector2 } from '../../core/Vector2';

export interface SatPolygon {
  position: Vector2;
  velocity: Vector2;
  angle: number;
  angularVelocity: number;
}

export class SatModel {
  public readonly first: SatPolygon = this.createPolygon(100, 100);
  public readonly second: SatPolygon = this.createPolygon(300, 300);
  public readonly minimumTranslation = new Vector2();
  public intersect = false;
  public willIntersect = false;

  public step(): void {
    this.integrate(this.first);
    this.integrate(this.second);
    const relativeVelocity = Vector2.subtract(
      this.first.velocity,
      this.second.velocity,
    );
    this.testCollision(relativeVelocity);
    if (this.willIntersect)
      this.first.position.add(relativeVelocity).add(this.minimumTranslation);
    else this.first.position.add(relativeVelocity);
  }

  public moveSecond(point: Readonly<Vector2>): void {
    this.second.position.copy(point);
  }

  public spinSecond(): void {
    this.second.angularVelocity += 0.1;
  }

  public vertices(polygon: SatPolygon): Vector2[] {
    return [
      new Vector2(0, -25),
      new Vector2(-35, 0),
      new Vector2(-25, 45),
      new Vector2(25, 45),
      new Vector2(35, 0),
    ].map((point) => point.rotate(polygon.angle).add(polygon.position));
  }

  private createPolygon(x: number, y: number): SatPolygon {
    return {
      position: new Vector2(x, y),
      velocity: new Vector2(),
      angle: 0,
      angularVelocity: 0,
    };
  }

  private integrate(polygon: SatPolygon): void {
    polygon.position.add(polygon.velocity);
    polygon.angularVelocity *= 0.95;
    polygon.angle += polygon.angularVelocity;
  }

  private testCollision(velocity: Readonly<Vector2>): void {
    const firstVertices = this.vertices(this.first);
    const secondVertices = this.vertices(this.second);
    this.intersect = true;
    this.willIntersect = true;
    let minimumDistance = Infinity;
    let minimumAxis = new Vector2();
    const edgeSources = [firstVertices, secondVertices];

    for (const vertices of edgeSources) {
      for (let index = 0; index < vertices.length; index += 1) {
        const start = vertices[index];
        const end = vertices[(index + 1) % vertices.length];
        if (!start || !end) continue;
        const edgeX = end.x - start.x;
        const edgeY = end.y - start.y;
        const length = Math.sqrt(edgeX * edgeX + edgeY * edgeY);
        if (length <= PHYSICS_EPSILON) continue;
        const axis = new Vector2(-edgeY / length, edgeX / length);
        const firstProjection = this.project(firstVertices, axis);
        const secondProjection = this.project(secondVertices, axis);
        if (
          this.intervalDistance(
            firstProjection.minimum,
            firstProjection.maximum,
            secondProjection.minimum,
            secondProjection.maximum,
          ) > 0
        )
          this.intersect = false;

        const velocityProjection = axis.dot(velocity);
        if (velocityProjection < 0) firstProjection.minimum += velocityProjection;
        else firstProjection.maximum += velocityProjection;
        const distance = this.intervalDistance(
          firstProjection.minimum,
          firstProjection.maximum,
          secondProjection.minimum,
          secondProjection.maximum,
        );
        if (distance > 0) this.willIntersect = false;
        if (!this.intersect && !this.willIntersect) {
          this.minimumTranslation.set(0, 0);
          return;
        }
        if (Math.abs(distance) < minimumDistance) {
          minimumDistance = Math.abs(distance);
          minimumAxis = axis;
          const centers = Vector2.subtract(this.first.position, this.second.position);
          if (centers.dot(minimumAxis) < 0) minimumAxis.scale(-1);
        }
      }
    }
    if (this.willIntersect)
      this.minimumTranslation.copy(minimumAxis).scale(minimumDistance);
    else this.minimumTranslation.set(0, 0);
  }

  private project(
    vertices: Vector2[],
    axis: Readonly<Vector2>,
  ): { minimum: number; maximum: number } {
    let minimum = axis.dot(vertices[0] ?? new Vector2());
    let maximum = minimum;
    for (const point of vertices) {
      const value = axis.dot(point);
      minimum = Math.min(minimum, value);
      maximum = Math.max(maximum, value);
    }
    return { minimum, maximum };
  }

  private intervalDistance(
    minimumA: number,
    maximumA: number,
    minimumB: number,
    maximumB: number,
  ): number {
    return minimumA < minimumB ? minimumB - maximumA : minimumA - maximumB;
  }
}

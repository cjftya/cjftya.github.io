import { PHYSICS_EPSILON, Vector2 } from '../../core/Vector2';

export interface GearRectangle {
  position: Vector2;
  velocity: Vector2;
  force: Vector2;
  forceLocation: Vector2;
  width: number;
  height: number;
  mass: number;
  inertia: number;
  angle: number;
  angularVelocity: number;
}

export class GearModel {
  public readonly bodies: GearRectangle[] = [
    this.createBody(250, 100, 5, 800),
    this.createBody(450, 300, 2, 800),
  ];
  public readonly collisionRadius = 10;
  private readonly pointer = new Vector2();
  private time = 0;

  public setPointer(point: Readonly<Vector2>): void {
    this.pointer.copy(point);
  }

  public step(): void {
    const first = this.bodies[0];
    const second = this.bodies[1];
    if (!first || !second) return;
    first.position.set(300, 200);
    second.position.copy(this.pointer);
    this.time += 0.05;
    this.collide(first, second);
    for (const body of this.bodies) {
      body.velocity.addScaled(body.force, 1 / body.mass).scale(0.95);
      body.position.add(body.velocity);
      const arm = Vector2.subtract(body.forceLocation, body.position);
      const torque = arm.cross(body.force);
      body.angularVelocity = (body.angularVelocity + torque / body.inertia) * 0.95;
      body.angle = body.angularVelocity;
      body.force.set(0, 0);
    }
    second.angle = this.time;
  }

  public corners(body: GearRectangle): Vector2[] {
    const halfWidth = body.width * 0.5;
    const halfHeight = body.height * 0.5;
    return [
      new Vector2(-halfWidth, -halfHeight),
      new Vector2(halfWidth, -halfHeight),
      new Vector2(halfWidth, halfHeight),
      new Vector2(-halfWidth, halfHeight),
    ].map((point) => point.rotate(body.angle).add(body.position));
  }

  private createBody(
    x: number,
    y: number,
    mass: number,
    inertia: number,
  ): GearRectangle {
    return {
      position: new Vector2(x, y),
      velocity: new Vector2(),
      force: new Vector2(),
      forceLocation: new Vector2(x - 25, y - 25),
      width: 50,
      height: 50,
      mass,
      inertia,
      angle: 0,
      angularVelocity: 0,
    };
  }

  private collide(first: GearRectangle, second: GearRectangle): void {
    const firstCorners = this.corners(first);
    const secondCorners = this.corners(second);
    for (const firstCorner of firstCorners) {
      for (const secondCorner of secondCorners) {
        const dx = firstCorner.x - secondCorner.x;
        const dy = firstCorner.y - secondCorner.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance >= this.collisionRadius * 2 || distance <= PHYSICS_EPSILON)
          continue;
        const nx = dx / distance;
        const ny = dy / distance;
        first.forceLocation.copy(firstCorner);
        second.forceLocation.copy(secondCorner);
        first.force.x += nx;
        first.force.y += ny;
        second.force.x -= nx;
        second.force.y -= ny;
        first.velocity.x += nx;
        first.velocity.y += ny;
        second.velocity.x -= nx;
        second.velocity.y -= ny;
      }
    }
  }
}

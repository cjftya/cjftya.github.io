import { Vector2 } from '../../core/Vector2';

export class TorqueModel {
  public readonly position = new Vector2(250, 100);
  public readonly force = new Vector2();
  public readonly width = 100;
  public readonly height = 100;
  public angle = 0;
  public angularVelocity = 0;
  private angularAcceleration = 0;

  public step(): void {
    const corner = this.corners()[3] ?? this.position;
    const armX = corner.x - this.position.x;
    const armY = corner.y - this.position.y;
    const torque = armX * this.force.y - armY * this.force.x;
    this.angularAcceleration += torque / 200;
    this.angularVelocity += this.angularAcceleration;
    this.angularVelocity *= 0.95;
    this.angle += this.angularVelocity;
    this.angularAcceleration = 0;
  }

  public keyDown(code: string): void {
    if (code === 'KeyW') this.force.y -= 0.05;
    else if (code === 'KeyS') this.force.y += 0.05;
    else if (code === 'KeyA') this.force.x -= 0.05;
    else if (code === 'KeyD') this.force.x = 0.05;
  }

  public releaseForce(): void {
    this.force.set(0, 0);
  }

  public corners(): Vector2[] {
    const halfWidth = this.width * 0.5;
    const halfHeight = this.height * 0.5;
    return [
      new Vector2(-halfWidth, -halfHeight),
      new Vector2(halfWidth, -halfHeight),
      new Vector2(halfWidth, halfHeight),
      new Vector2(-halfWidth, halfHeight),
    ].map((point) => point.rotate(this.angle).add(this.position));
  }
}

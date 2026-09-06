import { Vector2 } from '../../core/Vector2';

export class TimeScalingModel {
  public readonly position = new Vector2(100, 100);
  public readonly velocity = new Vector2();
  public readonly radius = 20;
  public dt = 0.1;

  public step(): void {
    this.position.addScaled(this.velocity, this.dt);
    this.velocity.scale(0.995);
  }

  public addHorizontalImpulse(): void {
    this.velocity.x += 5;
  }

  public changeTimeScale(delta: number): void {
    this.dt += delta;
  }
}

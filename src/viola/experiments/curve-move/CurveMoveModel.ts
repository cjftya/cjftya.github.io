import { Vector2 } from '../../core/Vector2';

export class CurveMoveModel {
  public readonly curve = Array.from({ length: 600 }, (_, x) =>
    CurveMoveModel.height(x),
  );
  public readonly position = new Vector2(70, 0);
  public readonly velocity = new Vector2();
  private jumping = false;
  private leavingCurve = false;

  public static height(x: number): number {
    return (x * (x - 200) * (x - 500)) / 100_000 + 200;
  }

  public step(): void {
    this.velocity.y += 0.9;
    this.position.add(this.velocity);
    const index = Math.max(
      0,
      Math.min(this.curve.length - 1, Math.trunc(this.position.x)),
    );
    const ground = (this.curve[index] ?? 0) - 10;
    if (this.position.y > ground && !this.leavingCurve) {
      if (this.jumping) {
        this.velocity.y *= -0.2;
        this.jumping = false;
      }
      this.position.y = ground;
    }
    if (this.position.x > 290 && this.position.y < 50) {
      if (!this.leavingCurve) this.velocity.y = -this.velocity.x / 2;
      this.leavingCurve = true;
    } else if (this.position.y < ground) {
      this.leavingCurve = false;
    }
  }

  public keyDown(code: string): void {
    if (code === 'KeyW') {
      this.jumping = true;
      this.velocity.y = -7;
    } else if (code === 'KeyA') this.velocity.x = -7;
    else if (code === 'KeyD') this.velocity.x = 7;
  }

  public keyUp(): void {
    this.velocity.x = 0;
  }
}

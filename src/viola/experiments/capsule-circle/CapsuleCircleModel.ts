import { PHYSICS_EPSILON, Vector2, closestPointOnSegment } from '../../core/Vector2';

export class CapsuleCircleModel {
  public readonly capsulePosition = new Vector2(300, 300);
  public readonly capsuleLength = 200;
  public readonly capsuleRadius = 20;
  public readonly capsuleAngle = 1;
  public readonly circlePosition = new Vector2(300, 600);
  public readonly circleVelocity = new Vector2();
  public readonly circleRadius = 30;
  public readonly contact = new Vector2();
  private selected = false;

  public step(): void {
    const { start, end } = this.segment();
    const closest = closestPointOnSegment(this.circlePosition, start, end);
    const dx = this.circlePosition.x - closest.x;
    const dy = this.circlePosition.y - closest.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const radiusSum = this.circleRadius + this.capsuleRadius;
    if (distance >= radiusSum) return;
    const fallbackX = -Math.sin(this.capsuleAngle);
    const fallbackY = Math.cos(this.capsuleAngle);
    const nx = distance > PHYSICS_EPSILON ? dx / distance : fallbackX;
    const ny = distance > PHYSICS_EPSILON ? dy / distance : fallbackY;
    const correction = (radiusSum - distance) * 0.5;
    this.contact.set(
      this.circlePosition.x - nx * this.circleRadius,
      this.circlePosition.y - ny * this.circleRadius,
    );
    this.circlePosition.x += nx * correction;
    this.circlePosition.y += ny * correction;
    this.capsulePosition.x -= nx * correction;
    this.capsulePosition.y -= ny * correction;
  }

  public segment(): { start: Vector2; end: Vector2 } {
    return {
      start: this.capsulePosition.clone(),
      end: new Vector2(
        this.capsulePosition.x + Math.cos(this.capsuleAngle) * this.capsuleLength,
        this.capsulePosition.y + Math.sin(this.capsuleAngle) * this.capsuleLength,
      ),
    };
  }

  public outline(): Vector2[] {
    const { start, end } = this.segment();
    const nx = -Math.sin(this.capsuleAngle) * this.capsuleRadius;
    const ny = Math.cos(this.capsuleAngle) * this.capsuleRadius;
    return [
      start,
      new Vector2(start.x + nx, start.y + ny),
      new Vector2(end.x + nx, end.y + ny),
      end,
      new Vector2(end.x - nx, end.y - ny),
      new Vector2(start.x - nx, start.y - ny),
    ];
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

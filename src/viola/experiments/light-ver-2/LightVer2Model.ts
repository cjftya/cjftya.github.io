import type { Random } from '../../core/Random';
import { PHYSICS_EPSILON, Vector2 } from '../../core/Vector2';

export interface LightningDust {
  position: Vector2;
  velocity: Vector2;
  radius: number;
  color: number;
  alpha: number;
}

export class LightVer2Model {
  public readonly points = Array.from({ length: 20 }, () => new Vector2());
  public readonly dust: LightningDust[];
  public drawnSegments = 0;
  public lightWidth = 1;
  public lightColor = 10;
  public lightAlpha = 0;
  private shot = false;
  private dustVisible = false;

  public constructor(private readonly random: Random) {
    this.points[0]?.set(500, 100);
    this.points.at(-1)?.set(300, 300);
    this.dust = Array.from({ length: 20 }, () => ({
      position: new Vector2(),
      velocity: new Vector2(),
      radius: 2,
      color: 0xffffff,
      alpha: 0,
    }));
  }

  public step(): void {
    this.lightColor = this.random.integer(10, 150);
    this.lightWidth = this.random.integer(1, 5);
    if (this.lightAlpha > 0) this.lightAlpha = Math.max(0, this.lightAlpha - 10 / 255);
    if (this.shot) {
      this.drawnSegments += 2;
      if (this.drawnSegments >= this.points.length - 1) {
        this.drawnSegments = this.points.length - 1;
        this.shot = false;
        this.dustVisible = true;
        this.lightAlpha = 1;
      }
    }
    if (!this.dustVisible) return;
    const nextAlpha = Math.max(0, (this.dust[0]?.alpha ?? 0) - 10 / 255);
    if (nextAlpha <= 0) this.dustVisible = false;
    for (const particle of this.dust) {
      particle.alpha = nextAlpha;
      particle.position.add(particle.velocity);
    }
  }

  public fire(target: Readonly<Vector2>): void {
    const start = this.points[0];
    if (!start) return;
    const dx = target.x - start.x;
    const dy = target.y - start.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const nx = distance > PHYSICS_EPSILON ? dx / distance : 0;
    const ny = distance > PHYSICS_EPSILON ? dy / distance : 0;
    const spacing = distance / (this.points.length - 1);
    for (let index = 1; index < this.points.length; index += 1) {
      this.points[index]?.set(
        start.x + nx * spacing * index,
        start.y + ny * spacing * index,
      );
    }
    for (let index = 1; index < this.points.length - 1; index += 1) {
      this.points[index]?.add({
        x: this.random.integer(-10, 10),
        y: this.random.integer(-10, 10),
      });
    }
    for (const particle of this.dust) {
      particle.position.copy(target);
      particle.velocity.set(this.random.integer(-10, 10), this.random.integer(-10, 10));
      particle.alpha = 1;
    }
    this.drawnSegments = 0;
    this.lightAlpha = 1;
    this.dustVisible = false;
    this.shot = true;
  }
}

import type { Random } from '../../core/Random';
import { Vector2, clamp } from '../../core/Vector2';

export interface EnergyParticle {
  position: Vector2;
  velocity: Vector2;
  radius: number;
  color: number;
  alpha: number;
}

export class MouseMovingEnergyModel {
  public readonly particles: EnergyParticle[];
  private readonly previousPointer = new Vector2();

  public constructor(random: Random, count = 10_000) {
    this.particles = Array.from({ length: count }, () => ({
      position: new Vector2(random.integer(10, 950), random.integer(10, 600)),
      velocity: new Vector2(),
      radius: 1,
      color: 0xffffff,
      alpha: 50 / 255,
    }));
  }

  public step(): void {
    for (const particle of this.particles) {
      particle.alpha = Math.max(50 / 255, particle.alpha - 2 / 255);
      particle.velocity.scale(0.995);
      particle.position.add(particle.velocity);
      if (particle.position.x < 1 || particle.position.x > 999) {
        particle.position.x = clamp(particle.position.x, 1, 999);
        particle.velocity.x *= -1;
        particle.alpha = Math.min(
          1,
          particle.alpha + (particle.position.x > 500 ? 100 : 20) / 255,
        );
      }
      if (particle.position.y < 1 || particle.position.y > 699) {
        particle.position.y = clamp(particle.position.y, 1, 699);
        particle.velocity.y *= -1;
        particle.alpha = Math.min(1, particle.alpha + 100 / 255);
      }
    }
  }

  public beginGesture(point: Readonly<Vector2>): void {
    this.previousPointer.copy(point);
  }

  public gesture(point: Readonly<Vector2>): void {
    const vx = (point.x - this.previousPointer.x) * 0.01;
    const vy = (point.y - this.previousPointer.y) * 0.01;
    for (const particle of this.particles) {
      if (Vector2.distanceSquared(particle.position, point) >= 100 * 100) continue;
      particle.velocity.add({ x: vx, y: vy });
      particle.alpha = Math.min(1, particle.alpha + 10 / 255);
    }
    this.previousPointer.copy(point);
  }
}

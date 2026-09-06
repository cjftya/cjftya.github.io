import type { Random } from '../../core/Random';
import { Vector2 } from '../../core/Vector2';

export interface MouseParticle {
  position: Vector2;
  velocity: Vector2;
  radius: number;
  color: number;
  alpha: number;
}

export class ParticleMouseModel {
  public readonly particles: MouseParticle[];
  private nextIndex = 0;

  public constructor(
    private readonly random: Random,
    count = 500,
  ) {
    this.particles = Array.from({ length: count }, () => ({
      position: new Vector2(-100, -100),
      velocity: new Vector2(),
      radius: random.integer(8, 10),
      color: 0xffffff,
      alpha: 0,
    }));
  }

  public step(): void {
    for (const particle of this.particles) {
      if (particle.alpha <= 0) continue;
      particle.position.x += particle.velocity.x + this.random.integer(-2, 3) * 0.3;
      particle.position.y += particle.velocity.y + this.random.integer(-2, 3) * 0.3;
      particle.radius -= 0.5;
      if (particle.radius <= 0) {
        particle.radius = this.random.integer(8, 10);
        particle.alpha = 0;
      }
      particle.position.add(particle.velocity);
    }
  }

  public emit(point: Readonly<Vector2>): void {
    const particle = this.particles[this.nextIndex];
    if (!particle) return;
    particle.position.copy(point);
    particle.velocity.set(
      this.random.integer(-2, 2) * 0.5,
      this.random.integer(-2, 2) * 0.5,
    );
    particle.alpha = 1;
    this.nextIndex += 1;
    if (this.nextIndex >= this.particles.length - 1) this.nextIndex = 0;
  }
}

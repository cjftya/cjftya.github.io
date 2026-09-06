import type { Random } from '../../core/Random';
import { Vector2 } from '../../core/Vector2';

export interface PoolParticle {
  position: Vector2;
  velocity: Vector2;
  radius: number;
  color: number;
  alpha: number;
}

export class ParticlePoolModel {
  public readonly particles: PoolParticle[];
  private nextIndex = 0;

  public constructor(
    private readonly random: Random,
    count = 200,
  ) {
    this.particles = Array.from({ length: count }, () => ({
      position: new Vector2(),
      velocity: new Vector2(),
      radius: 0,
      color: 0xff4b4b,
      alpha: 0,
    }));
  }

  public step(): void {
    for (const particle of this.particles) {
      if (particle.alpha <= 0) continue;
      particle.velocity.y += 0.9;
      particle.position.add(particle.velocity);
      particle.radius -= 0.5;
      if (particle.radius <= 0) {
        particle.radius = 0;
        particle.alpha = 0;
      }
    }
  }

  public burst(point: Readonly<Vector2>): void {
    for (let offset = 0; offset < 20; offset += 1) {
      const particle = this.particles[this.nextIndex + offset];
      if (!particle) continue;
      particle.position.copy(point);
      particle.velocity.set(this.random.integer(-10, 10), this.random.integer(-20, 3));
      particle.radius = this.random.integer(1, 20);
      particle.alpha = 1;
    }
    this.nextIndex += 20;
    if (this.nextIndex >= this.particles.length) this.nextIndex = 20;
  }
}

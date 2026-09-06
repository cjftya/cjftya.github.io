import type { Random } from '../../core/Random';
import { PHYSICS_EPSILON, Vector2 } from '../../core/Vector2';

export interface ConnectionParticle {
  position: Vector2;
  previous: Vector2;
  radius: number;
  color: number;
}

export class ParticleConnectionModel {
  public readonly particles: ConnectionParticle[];
  private readonly gestureStart = new Vector2();

  public constructor(random: Random, count = 500) {
    this.particles = Array.from({ length: count }, () => {
      const position = new Vector2(random.integer(20, 700), random.integer(20, 500));
      return {
        position,
        previous: position.clone(),
        radius: 5,
        color: 0xff4b4b,
      };
    });
  }

  public step(): void {
    for (const particle of this.particles) {
      const nextX = particle.position.x * 2 - particle.previous.x;
      const nextY = particle.position.y * 2 - particle.previous.y;
      particle.previous.copy(particle.position);
      particle.position.set(nextX, nextY);
      this.constrain(particle);
    }
    for (let leftIndex = 0; leftIndex < this.particles.length; leftIndex += 1) {
      const left = this.particles[leftIndex];
      if (!left) continue;
      for (let rightIndex = 0; rightIndex < this.particles.length; rightIndex += 1) {
        if (leftIndex === rightIndex) continue;
        const right = this.particles[rightIndex];
        if (!right) continue;
        const dx = right.position.x - left.position.x;
        const dy = right.position.y - left.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance >= 22 || distance <= PHYSICS_EPSILON) continue;
        const correction = (20 - distance) * 0.5 * 0.25;
        const fx = (dx / distance) * correction;
        const fy = (dy / distance) * correction;
        left.position.x -= fx;
        left.position.y -= fy;
        right.position.x += fx;
        right.position.y += fy;
      }
    }
  }

  public beginGesture(point: Readonly<Vector2>): void {
    this.gestureStart.copy(point);
  }

  public gesture(point: Readonly<Vector2>): void {
    const vx = point.x - this.gestureStart.x;
    const vy = point.y - this.gestureStart.y;
    for (const particle of this.particles) {
      if (Vector2.distanceSquared(point, particle.position) >= 400) continue;
      particle.position.x += vx * 0.005;
      particle.position.y += vy * 0.005;
    }
  }

  private constrain(particle: ConnectionParticle): void {
    if (particle.position.x < 10) {
      const velocity = particle.previous.x - particle.position.x;
      particle.position.x = 10;
      particle.previous.x = particle.position.x - velocity * 0.7;
    } else if (particle.position.x > 690) {
      const velocity = particle.previous.x - particle.position.x;
      particle.position.x = 690;
      particle.previous.x = particle.position.x - velocity * 0.7;
    }
    if (particle.position.y > 690) {
      const velocity = particle.previous.y - particle.position.y;
      particle.position.y = 690;
      particle.previous.y = particle.position.y - velocity * 0.7;
    } else if (particle.position.y < 10) {
      const velocity = particle.previous.y - particle.position.y;
      particle.position.y = 10;
      particle.previous.y = particle.position.y - velocity * 0.7;
    }
  }
}

import type { Random } from '../../core/Random';
import { PHYSICS_EPSILON, Vector2 } from '../../core/Vector2';

export interface GravityDust {
  position: Vector2;
  velocity: Vector2;
  mass: number;
  radius: number;
  color: number;
}

export interface GravityWell {
  position: Vector2;
  mass: number;
  gravity: number;
}

export class GForceModel {
  public readonly particles: GravityDust[];
  public readonly wells: GravityWell[] = [
    { position: new Vector2(500, 300), mass: 100, gravity: 0.98 },
    { position: new Vector2(200, 100), mass: 100, gravity: 0.98 },
  ];

  public constructor(random: Random, count = 500) {
    this.particles = Array.from({ length: count }, () => {
      const mass = random.integer(2, 5);
      return {
        position: new Vector2(random.integer(10, 1_000), random.integer(10, 700)),
        velocity: new Vector2(),
        mass,
        radius: mass,
        color: 0xffffff,
      };
    });
  }

  public step(): void {
    for (const particle of this.particles) {
      particle.velocity.scale(0.995);
      particle.position.add(particle.velocity);
    }
    this.solveDustCollisions();
    for (const well of this.wells) this.applyWell(well);
  }

  public movePointerWell(point: Readonly<Vector2>): void {
    this.wells[1]?.position.copy(point);
  }

  private solveDustCollisions(): void {
    for (let leftIndex = 0; leftIndex < this.particles.length; leftIndex += 1) {
      const left = this.particles[leftIndex];
      if (!left) continue;
      for (
        let rightIndex = leftIndex + 1;
        rightIndex < this.particles.length;
        rightIndex += 1
      ) {
        const right = this.particles[rightIndex];
        if (!right) continue;
        const dx = left.position.x - right.position.x;
        const dy = left.position.y - right.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const radius = left.radius + right.radius;
        if (distance >= radius || distance <= PHYSICS_EPSILON) continue;
        const depth = (radius - distance) * 0.5;
        const fx = (dx / distance) * depth;
        const fy = (dy / distance) * depth;
        left.position.add({ x: fx, y: fy });
        right.position.add({ x: -fx, y: -fy });
        left.velocity.add({ x: fx, y: fy });
        right.velocity.add({ x: -fx, y: -fy });
      }
    }
  }

  private applyWell(well: GravityWell): void {
    for (const particle of this.particles) {
      const dx = well.position.x - particle.position.x;
      const dy = well.position.y - particle.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance <= PHYSICS_EPSILON) continue;
      const nx = dx / distance;
      const ny = dy / distance;
      const radius = well.mass + particle.mass;
      if (distance < radius) {
        const depth = radius - distance;
        particle.position.add({ x: -depth * nx, y: -depth * ny });
        particle.velocity.add({ x: -depth * nx, y: -depth * ny });
      }
      const force =
        well.gravity * ((well.mass * particle.mass) / (distance * distance));
      particle.velocity.add({ x: force * nx, y: force * ny });
    }
  }
}

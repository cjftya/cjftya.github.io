import type { Random } from '../../core/Random';
import { Vector2 } from '../../core/Vector2';

export interface CircleParticle {
  position: Vector2;
  velocity: Vector2;
  target: Vector2;
  radius: number;
  color: number;
  alpha: number;
  fade: number;
  active: boolean;
  movementDone: boolean;
  released: boolean;
}

export class ParticleCircleModel {
  public readonly particles: CircleParticle[];
  public readonly center = new Vector2();
  private pressed = false;
  private inverse = false;

  public constructor(
    private readonly random: Random,
    count = 300,
  ) {
    this.particles = Array.from({ length: count }, () => this.createParticle());
  }

  public step(): void {
    for (const particle of this.particles) {
      if (this.pressed) {
        const dx = particle.position.x - particle.target.x;
        const dy = particle.position.y - particle.target.y;
        if (dx * dx + dy * dy < 25 && particle.alpha < 0) {
          const angle = this.random.integer(1, 360) * (Math.PI / 180);
          particle.position.set(
            this.center.x + Math.cos(angle) * 100,
            this.center.y + Math.sin(angle) * 100,
          );
          particle.movementDone = true;
        }
        if (particle.alpha > 0 && !particle.movementDone) {
          particle.position.x -= dx * 0.05 * (particle.radius * 0.1);
          particle.position.y -= dy * 0.05 * (particle.radius * 0.1);
        }
      } else if (this.inverse) {
        const dx = particle.position.x - particle.target.x;
        const dy = particle.position.y - particle.target.y;
        if (particle.alpha <= 0) particle.active = false;
        particle.position.x -= dx * 0.05 * (particle.radius * 0.1);
        particle.position.y -= dy * 0.05 * (particle.radius * 0.1);
      }
      if (particle.active) {
        particle.alpha -= particle.fade;
        if (particle.alpha <= 0) {
          if (!particle.released) this.resetAttributes(particle);
          else particle.alpha = 0;
        }
      }
      particle.velocity.scale(0.995);
      particle.position.add(particle.velocity);
    }
  }

  public press(point: Readonly<Vector2>): void {
    this.center.copy(point);
    this.pressed = true;
    this.inverse = false;
    for (const particle of this.particles) {
      particle.active = true;
      particle.movementDone = false;
      particle.released = false;
      const angle = this.random.integer(1, 360) * (Math.PI / 180);
      const radius = this.random.integer(20, 80) + 150;
      const cosine = Math.cos(angle);
      const sine = Math.sin(angle);
      particle.position.set(point.x + cosine * radius, point.y + sine * radius);
      particle.target.set(point.x + cosine * 100, point.y + sine * 100);
    }
  }

  public release(): void {
    this.pressed = false;
    this.inverse = true;
    for (const particle of this.particles) {
      const angle = this.random.integer(1, 360) * (Math.PI / 180);
      const cosine = Math.cos(angle);
      const sine = Math.sin(angle);
      particle.position.set(this.center.x + cosine * 150, this.center.y + sine * 150);
      particle.target.set(this.center.x + cosine * 300, this.center.y + sine * 300);
      particle.released = true;
    }
  }

  private createParticle(): CircleParticle {
    const particle: CircleParticle = {
      position: new Vector2(-100, -100),
      velocity: new Vector2(),
      target: new Vector2(),
      radius: 1,
      color: 0xffffff,
      alpha: 0,
      fade: 0,
      active: false,
      movementDone: false,
      released: false,
    };
    this.resetAttributes(particle);
    return particle;
  }

  private resetAttributes(particle: CircleParticle): void {
    particle.radius = this.random.integer(1, 7);
    particle.alpha = this.random.integer(100, 255) / 255;
    particle.fade = (this.random.integer(2, 15) * 0.5) / 255;
  }
}

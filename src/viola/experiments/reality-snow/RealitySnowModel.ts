import type { Random } from '../../core/Random';
import { Vector2 } from '../../core/Vector2';

export interface SnowParticle {
  position: Vector2;
  velocity: Vector2;
  radius: number;
  color: number;
}

export class RealitySnowModel {
  public readonly snow: SnowParticle[];
  public wind = 0;

  public constructor(
    private readonly random: Random,
    count = 500,
  ) {
    this.snow = Array.from({ length: count }, () => {
      const size = random.integer(5, 30);
      return {
        position: new Vector2(random.integer(20, 900), -random.integer(100, 1_000)),
        velocity: new Vector2(),
        radius: size * 0.25,
        color: 0xffffff,
      };
    });
  }

  public step(): void {
    for (const particle of this.snow) {
      const gravity = (particle.radius * 4) / 20;
      particle.velocity.x += this.random.integer(-2, 3) * gravity * 0.01;
      particle.velocity.x = Math.max(-2, Math.min(2, particle.velocity.x));
      particle.position.x += particle.velocity.x + this.wind;
      particle.position.y += particle.velocity.y + gravity;
      if (particle.position.y >= 800)
        particle.position.y = -this.random.integer(100, 1_000);
      if (particle.position.x >= 1_200) particle.position.x = -30;
      else if (particle.position.x <= -40) particle.position.x = 1_150;
    }
  }

  public keyDown(code: string): void {
    if (code === 'KeyA') this.wind -= 0.1;
    else if (code === 'KeyD') this.wind += 0.1;
  }
}

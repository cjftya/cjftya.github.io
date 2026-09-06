import type { Random } from '../../core/Random';
import { PHYSICS_EPSILON, Vector2, clamp } from '../../core/Vector2';

export interface EffectParticle {
  position: Vector2;
  origin: Vector2;
  velocity: Vector2;
  angularVelocity: number;
  radius: number;
  originalRadius: number;
  mass: number;
  color: number;
}

export class ParticleEffectModel {
  public readonly particles: EffectParticle[];
  public forceValue = 1_000;
  public pushing = true;
  public gravityEnabled = false;
  public returnForceEnabled = false;
  public clockwise = true;
  private pressed = false;
  private rotating = false;
  private cycleRadius = 1;
  private readonly pointer = new Vector2();
  private readonly rotationCenter = new Vector2();
  private red = 255;
  private green = 255;
  private blue = 255;
  private colorDelta = new Vector2();
  private blueDelta = 0;
  private colorTicks = 0;

  public constructor(
    private readonly random: Random,
    count = 8_000,
  ) {
    this.particles = Array.from({ length: count }, () => {
      const position = new Vector2(random.integer(20, 820), random.integer(20, 570));
      return {
        position,
        origin: position.clone(),
        velocity: new Vector2(),
        angularVelocity: 0,
        radius: 1,
        originalRadius: 1,
        mass: 2,
        color: 0xffffff,
      };
    });
    this.randomizeColorDelta();
  }

  public step(): void {
    this.updateColor();
    if (this.rotating) this.applyAngularArea();
    if (this.pressed) this.applyPointerForce();
    if (this.returnForceEnabled) this.applyReturnForce();
    for (const particle of this.particles) {
      const radius = particle.radius;
      if (particle.position.x < radius || particle.position.x > 900 - radius) {
        particle.position.x = clamp(particle.position.x, radius, 900 - radius);
        particle.velocity.x *= -1;
      }
      if (particle.position.y < radius || particle.position.y > 600 - radius) {
        particle.position.y = clamp(particle.position.y, radius, 600 - radius);
        particle.velocity.y *= -1;
      }
      if (this.gravityEnabled) particle.velocity.y += 1;
      particle.velocity.scale(0.995);
      particle.angularVelocity *= 0.995;
      particle.position.add(particle.velocity);
      particle.position.rotate(
        (this.clockwise ? 1 : -1) * (particle.angularVelocity / particle.mass),
        this.rotationCenter,
      );
    }
  }

  public movePointer(point: Readonly<Vector2>): void {
    this.pointer.copy(point);
  }

  public press(point: Readonly<Vector2>): void {
    this.pointer.copy(point);
    this.pressed = true;
  }

  public release(): void {
    this.pressed = false;
  }

  public keyDown(code: string): void {
    if (code === 'KeyW') this.pushing = !this.pushing;
    else if (code === 'KeyS') this.reset();
    else if (code === 'KeyQ') this.forceValue += 100;
    else if (code === 'KeyA') this.forceValue -= 100;
    else if (code === 'Space') {
      this.rotating = true;
      this.rotationCenter.copy(this.pointer);
      this.cycleRadius += 0.5;
    } else if (code === 'KeyZ') this.clockwise = !this.clockwise;
    else if (code === 'KeyG') this.gravityEnabled = !this.gravityEnabled;
    else if (code === 'KeyF') this.returnForceEnabled = !this.returnForceEnabled;
    else if (code === 'KeyR') {
      for (const particle of this.particles) particle.velocity.scale(0.1);
    } else if (code === 'KeyO') this.setRadius(() => 0.5);
    else if (code === 'KeyP') this.setRadius(() => 1);
    else if (code === 'KeyI')
      this.setRadius(() => (this.random.next() + 0.2 <= 0.5 ? 0.5 : 1));
    else if (code === 'KeyU')
      this.setRadius(() => Math.max(0.5, this.random.next() + 0.2));
  }

  public keyUp(): void {
    this.rotating = false;
    this.cycleRadius = 1;
  }

  private applyPointerForce(): void {
    for (const particle of this.particles) {
      const dx = particle.position.x - this.pointer.x;
      const dy = particle.position.y - this.pointer.y;
      const squared = dx * dx + dy * dy;
      if (squared < 15 * 15) {
        particle.velocity.set(0, 0);
        continue;
      }
      const distance = Math.sqrt(squared);
      if (distance <= PHYSICS_EPSILON) continue;
      const power = (particle.mass * this.forceValue) / squared;
      const sign = this.pushing ? 1 : -1;
      particle.velocity.add({
        x: sign * power * (dx / distance),
        y: sign * power * (dy / distance),
      });
    }
  }

  private applyAngularArea(): void {
    const squaredRadius = this.cycleRadius * this.cycleRadius;
    for (const particle of this.particles) {
      if (Vector2.distanceSquared(particle.position, this.pointer) < squaredRadius)
        particle.angularVelocity += 0.017;
    }
  }

  private applyReturnForce(): void {
    for (const particle of this.particles)
      particle.velocity.add({
        x: (particle.origin.x - particle.position.x) * 0.005,
        y: (particle.origin.y - particle.position.y) * 0.005,
      });
  }

  private reset(): void {
    for (const particle of this.particles) {
      particle.position.set(this.random.integer(20, 870), this.random.integer(20, 570));
      particle.origin.copy(particle.position);
      particle.velocity.set(0, 0);
      particle.angularVelocity = 0;
      particle.radius = particle.originalRadius;
      particle.mass = particle.radius * 2;
    }
  }

  private setRadius(factory: () => number): void {
    for (const particle of this.particles) {
      particle.radius = factory();
      particle.originalRadius = particle.radius;
      particle.mass = particle.radius * 2;
    }
  }

  private randomizeColorDelta(): void {
    this.colorDelta.set(this.random.integer(1, 10) - 5, this.random.integer(1, 10) - 5);
    this.blueDelta = this.random.integer(1, 10) - 5;
  }

  private updateColor(): void {
    if ((this.particles[0]?.radius ?? 0) > 0.5) {
      this.colorTicks += 1;
      if (this.colorTicks > 100) {
        this.colorTicks = 0;
        this.randomizeColorDelta();
      }
      this.red = clamp(this.red + this.colorDelta.x, 200, 255);
      this.green = clamp(this.green + this.colorDelta.y, 200, 255);
      this.blue = clamp(this.blue + this.blueDelta, 200, 255);
    } else {
      this.red = this.green = this.blue = 255;
    }
    const color =
      (Math.floor(this.red) << 16) |
      (Math.floor(this.green) << 8) |
      Math.floor(this.blue);
    for (const particle of this.particles) particle.color = color;
  }
}

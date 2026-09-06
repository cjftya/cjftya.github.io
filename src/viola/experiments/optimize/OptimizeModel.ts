import type { Random } from '../../core/Random';
import { PHYSICS_EPSILON, Vector2, safeUnit } from '../../core/Vector2';
import { UniformGrid } from '../../physics/spatial/UniformGrid';

export type OptimizeParticleType = 'green' | 'blue' | 'red';

export interface OptimizeParticle {
  position: Vector2;
  velocity: Vector2;
  force: Vector2;
  density: number;
  nearDensity: number;
  radius: number;
  color: number;
  type: OptimizeParticleType;
}

interface OptimizeNeighbor {
  left: number;
  right: number;
  nx: number;
  ny: number;
  weight: number;
}

export class OptimizeModel {
  public readonly particles: OptimizeParticle[];
  private readonly positions: Vector2[];
  private readonly grid = new UniformGrid(600, 500, 15);
  private readonly neighbors: OptimizeNeighbor[] = [];
  private readonly interaction = new Vector2();
  private interactionEnabled = false;

  public constructor(random: Random, countPerType = 500) {
    this.particles = [
      ...this.createParticles(random, countPerType, 'green', 100, 400, 0x32d96b),
      ...this.createParticles(random, countPerType, 'blue', 400, 500, 0x4c78ff),
      ...this.createParticles(random, countPerType, 'red', 1_500, 1_600, 0xff4b4b),
    ];
    this.positions = this.particles.map((particle) => particle.position);
  }

  public step(): void {
    this.prepareNeighbors();
    this.solveForces();
    for (const particle of this.particles) this.integrate(particle);
    this.applyInteraction();
  }

  public setInteraction(point: Readonly<Vector2>, enabled: boolean): void {
    this.interaction.copy(point);
    this.interactionEnabled = enabled;
  }

  private createParticles(
    random: Random,
    count: number,
    type: OptimizeParticleType,
    minimumY: number,
    maximumY: number,
    color: number,
  ): OptimizeParticle[] {
    return Array.from({ length: count }, () => ({
      position: new Vector2(random.integer(0, 300), random.integer(minimumY, maximumY)),
      velocity: new Vector2(),
      force: new Vector2(),
      density: 0,
      nearDensity: 0,
      radius: 3.5,
      color,
      type,
    }));
  }

  private prepareNeighbors(): void {
    this.neighbors.length = 0;
    for (const particle of this.particles) {
      particle.force.set(0, 0);
      particle.density = 0;
      particle.nearDensity = 0;
    }
    this.grid.rebuild(this.positions);
    this.grid.forEachNeighborPair((leftIndex, rightIndex) => {
      const left = this.particles[leftIndex];
      const right = this.particles[rightIndex];
      if (!left || !right) return;
      const unit = safeUnit(
        left.position.x - right.position.x,
        left.position.y - right.position.y,
      );
      if (unit.length <= PHYSICS_EPSILON || unit.length >= 16) return;
      const weight = 1 - unit.length / 16;
      const density = weight * weight;
      const nearDensity = density * weight;
      left.density += density;
      right.density += density;
      left.nearDensity += nearDensity;
      right.nearDensity += nearDensity;
      this.neighbors.push({
        left: leftIndex,
        right: rightIndex,
        nx: unit.x,
        ny: unit.y,
        weight,
      });
    });
  }

  private solveForces(): void {
    for (const neighbor of this.neighbors) {
      const left = this.particles[neighbor.left];
      const right = this.particles[neighbor.right];
      if (!left || !right) continue;
      const pressure = 0;
      const nearPressure = left.nearDensity + right.nearDensity;
      const pressureWeight =
        neighbor.weight * (pressure + neighbor.weight * nearPressure);
      const viscosityWeight = neighbor.weight * 0.1;
      const forceX =
        neighbor.nx * pressureWeight +
        (right.velocity.x - left.velocity.x) * viscosityWeight;
      const forceY =
        neighbor.ny * pressureWeight +
        (right.velocity.y - left.velocity.y) * viscosityWeight;
      left.force.x += forceX;
      left.force.y += forceY;
      right.force.x -= forceX;
      right.force.y -= forceY;
    }
  }

  private integrate(particle: OptimizeParticle): void {
    particle.velocity.y -= 0.1;
    if (particle.density > 0) {
      const divisor = particle.density * 0.9 + 0.1;
      particle.velocity.addScaled(particle.force, 1 / divisor);
    }
    particle.position.add(particle.velocity);
    if (particle.position.x < 10)
      particle.velocity.x +=
        (10 - particle.position.x) * 0.5 - particle.velocity.x * 0.5;
    if (particle.position.x > 600)
      particle.velocity.x +=
        (600 - particle.position.x) * 0.5 - particle.velocity.x * 0.5;
    if (particle.position.y < 10)
      particle.velocity.y +=
        (10 - particle.position.y) * 0.5 - particle.velocity.y * 0.5;
  }

  private applyInteraction(): void {
    if (!this.interactionEnabled) return;
    for (const particle of this.particles) {
      const unit = safeUnit(
        this.interaction.x - particle.position.x,
        this.interaction.y - particle.position.y,
      );
      if (unit.length <= PHYSICS_EPSILON || unit.length >= 100) continue;
      const strength = (50 / unit.length) * (unit.length < 30 ? 0.1 : 1);
      particle.velocity.addScaled(unit, strength);
    }
  }
}

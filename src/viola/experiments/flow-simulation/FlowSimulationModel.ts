import type { Random } from '../../core/Random';
import { Vector2, clamp, safeUnit } from '../../core/Vector2';
import { UniformGrid } from '../../physics/spatial/UniformGrid';

export interface FlowParticle {
  position: Vector2;
  velocity: Vector2;
  force: Vector2;
  density: number;
  nearDensity: number;
  radius: number;
  color: number;
}

interface FlowConnection {
  left: number;
  right: number;
  normalX: number;
  normalY: number;
  weight: number;
}

export class FlowSimulationModel {
  public readonly particles: FlowParticle[];
  private readonly positions: Vector2[];
  private readonly grid = new UniformGrid(700, 700, 10);
  private readonly connections: FlowConnection[] = [];
  private forceField: Readonly<Vector2> | null = null;

  public constructor(random: Random, count = 300) {
    this.particles = Array.from({ length: count }, () => ({
      position: new Vector2(random.integer(50, 450), random.integer(50, 400)),
      velocity: new Vector2(),
      force: new Vector2(),
      density: 0,
      nearDensity: 0,
      radius: 5,
      color: 0xff3232,
    }));
    this.positions = this.particles.map((particle) => particle.position);
  }

  public setForceField(point: Readonly<Vector2> | null): void {
    this.forceField = point;
  }

  public step(): void {
    this.prepareConnections();
    this.applyPressureAndViscosity();
    this.integrate();
    this.applyForceField();
  }

  private prepareConnections(): void {
    this.connections.length = 0;
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
      if (unit.length <= 0 || unit.length >= 16) return;
      const weight = 1 - unit.length / 16;
      const density = weight * weight;
      left.density += density;
      right.density += density;
      const nearDensity = density * weight;
      left.nearDensity += nearDensity;
      right.nearDensity += nearDensity;
      this.connections.push({
        left: leftIndex,
        right: rightIndex,
        normalX: unit.x,
        normalY: unit.y,
        weight,
      });
    });
  }

  private applyPressureAndViscosity(): void {
    for (const connection of this.connections) {
      const left = this.particles[connection.left];
      const right = this.particles[connection.right];
      if (!left || !right) continue;
      const pressure = left.density + right.density - 5;
      const nearPressure = left.nearDensity + right.nearDensity;
      const pressureWeight =
        connection.weight * (pressure + connection.weight * nearPressure);
      const viscosityWeight = connection.weight * 0.2;
      const forceX =
        connection.normalX * pressureWeight +
        (right.velocity.x - left.velocity.x) * viscosityWeight;
      const forceY =
        connection.normalY * pressureWeight +
        (right.velocity.y - left.velocity.y) * viscosityWeight;
      left.force.x += forceX;
      left.force.y += forceY;
      right.force.x -= forceX;
      right.force.y -= forceY;
    }
  }

  private integrate(): void {
    for (const particle of this.particles) {
      const heat =
        Math.abs(
          Math.trunc(
            particle.force.x +
              particle.force.y +
              particle.velocity.x +
              particle.velocity.y,
          ),
        ) * 50;
      const red = clamp(heat, 0, 255);
      particle.color = (Math.round(red) << 16) | 0x3232;

      particle.velocity.y += 0.1;
      if (particle.density > 0)
        particle.velocity.addScaled(particle.force, 1 / particle.density);
      particle.position.add(particle.velocity);
      this.constrain(particle);
    }
  }

  private constrain(particle: FlowParticle): void {
    if (particle.position.x <= 0)
      particle.velocity.x += -particle.position.x * 0.5 - particle.velocity.x * 0.5;
    if (particle.position.x >= 700)
      particle.velocity.x +=
        (700 - particle.position.x) * 0.5 - particle.velocity.x * 0.5;
    if (particle.position.y <= 0)
      particle.velocity.y += -particle.position.y * 0.5 - particle.velocity.y * 0.5;
    if (particle.position.y >= 700)
      particle.velocity.y +=
        (700 - particle.position.y) * 0.5 - particle.velocity.y * 0.5;
  }

  private applyForceField(): void {
    if (!this.forceField) return;
    for (const particle of this.particles) {
      const unit = safeUnit(
        this.forceField.x - particle.position.x,
        this.forceField.y - particle.position.y,
      );
      if (unit.length > 0 && unit.length < 100) particle.velocity.addScaled(unit, 1);
    }
  }
}

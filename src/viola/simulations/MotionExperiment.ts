import { Graphics } from 'pixi.js';
import type { Experiment, ExperimentContext, Viewport } from '../core/Experiment';
import { Random } from '../core/Random';
import { Vector2, clamp, closestPointOnSegment, safeUnit } from '../core/Vector2';

interface TrailPoint {
  position: Vector2;
  alpha: number;
}

export class MotionExperiment implements Experiment {
  public readonly context: ExperimentContext;
  private readonly graphics = new Graphics();
  private readonly random: Random;
  private time = 0;
  private phase = 0;
  private direction = 1;
  private angle = 0;
  private angularVelocity = 0;
  private velocity = new Vector2(2.4, 0);
  private point = new Vector2(80, 120);
  private previousPointer = new Vector2();
  private dragging = false;
  private readonly trail: TrailPoint[] = [];
  private readonly gasket: Vector2[] = [];
  private gasketCursor = new Vector2();
  private readonly chain: Vector2[] = [];
  private readonly terrain: Vector2[] = [];
  private readonly car = [new Vector2(), new Vector2()];
  private readonly carPrevious = [new Vector2(), new Vector2()];
  private readonly keys = new Set<string>();

  public constructor(context: ExperimentContext) {
    this.context = context;
    this.random = new Random(context.definition.seed);
    context.root.addChild(this.graphics);
    this.reset();
  }

  private reset(): void {
    const { width, height } = this.context.viewport;
    this.point.set(width * 0.2, height * 0.4);
    this.velocity.set(2.4, 0);
    this.angle = 0;
    this.angularVelocity = 0;
    this.phase = 0;
    this.direction = 1;
    this.gasket.length = 0;
    this.chain.length = 0;
    this.terrain.length = 0;
    const vertices = [
      new Vector2(width * 0.5, height * 0.12),
      new Vector2(width * 0.12, height * 0.82),
      new Vector2(width * 0.88, height * 0.82),
    ];
    this.gasketCursor.copy(vertices[0] ?? new Vector2());
    for (let index = 0; index < 9; index += 1)
      this.chain.push(new Vector2(width * 0.18 + index * 34, height * 0.55));
    for (let index = 0; index <= 24; index += 1) {
      const x = (width * index) / 24;
      const y = height * 0.72 + Math.sin(index * 0.72) * height * 0.07;
      this.terrain.push(new Vector2(x, y));
    }
    this.car[0]?.set(width * 0.22, height * 0.55);
    this.car[1]?.set(width * 0.22 + 54, height * 0.55);
    this.carPrevious[0]?.copy(this.car[0] ?? new Vector2());
    this.carPrevious[1]?.copy(this.car[1] ?? new Vector2());
    this.previousPointer.copy(this.context.pointer.position);
  }

  public update(stepScale: number): void {
    this.time += stepScale;
    switch (this.context.definition.id) {
      case 'time-scaling':
        this.point.addScaled(this.velocity, stepScale);
        if (this.point.x > this.context.viewport.width - 24) this.point.x = 24;
        break;
      case 'gasket':
        this.updateGasket();
        break;
      case 'kinetic':
        this.updateChain();
        break;
      case 'car':
        this.updateCar(stepScale);
        break;
      case 'box-throwing':
        this.updateBox(stepScale);
        break;
      case 'torque':
        this.updateTorque(stepScale);
        break;
      case 'gear':
        this.angularVelocity +=
          ((this.context.pointer.position.x / this.context.viewport.width - 0.5) *
            0.012 -
            this.angularVelocity * 0.025) *
          stepScale;
        this.angle += this.angularVelocity * stepScale;
        break;
      case 'curve-move':
        this.phase += 1.6 * this.direction * stepScale;
        if (this.phase > 500 || this.phase < 0) {
          this.direction *= -1;
          this.phase = clamp(this.phase, 0, 500);
        }
        break;
      case 'ball-rolling':
        this.phase += 1.2 * this.direction * stepScale;
        if (this.phase > 1 || this.phase < 0) {
          this.direction *= -1;
          this.phase = clamp(this.phase, 0, 1);
        }
        this.angle += 0.06 * this.direction * stepScale;
        break;
      default:
        break;
    }
    this.trail.push({ position: this.point.clone(), alpha: 1 });
    if (this.trail.length > 42) this.trail.shift();
    for (const trailPoint of this.trail) trailPoint.alpha *= 0.96;
  }

  private updateGasket(): void {
    const { width, height } = this.context.viewport;
    const vertices = [
      new Vector2(width * 0.5, height * 0.12),
      new Vector2(width * 0.12, height * 0.82),
      new Vector2(width * 0.88, height * 0.82),
    ];
    for (let count = 0; count < 18; count += 1) {
      const vertex = vertices[this.random.integer(0, vertices.length)];
      if (!vertex) continue;
      this.gasketCursor.x = (this.gasketCursor.x + vertex.x) * 0.5;
      this.gasketCursor.y = (this.gasketCursor.y + vertex.y) * 0.5;
      this.gasket.push(this.gasketCursor.clone());
    }
    if (this.gasket.length > 12_000) this.gasket.splice(0, 18);
  }

  private updateChain(): void {
    const target = this.context.pointer.position;
    const segmentLength = 34;
    for (let index = this.chain.length - 1; index >= 0; index -= 1) {
      const current = this.chain[index];
      const next = index === this.chain.length - 1 ? target : this.chain[index + 1];
      if (!current || !next) continue;
      const unit = safeUnit(current.x - next.x, current.y - next.y);
      current.set(next.x + unit.x * segmentLength, next.y + unit.y * segmentLength);
    }
    const root = this.chain[0];
    if (root)
      root.set(this.context.viewport.width * 0.16, this.context.viewport.height * 0.58);
    for (let index = 1; index < this.chain.length; index += 1) {
      const previous = this.chain[index - 1];
      const current = this.chain[index];
      if (!previous || !current) continue;
      const unit = safeUnit(current.x - previous.x, current.y - previous.y);
      current.set(
        previous.x + unit.x * segmentLength,
        previous.y + unit.y * segmentLength,
      );
    }
  }

  private updateCar(stepScale: number): void {
    for (let index = 0; index < this.car.length; index += 1) {
      const current = this.car[index];
      const previous = this.carPrevious[index];
      if (!current || !previous) continue;
      const velocity = Vector2.subtract(current, previous).scale(0.992);
      previous.copy(current);
      current.addScaled(velocity, stepScale);
      current.y += 0.34 * stepScale * stepScale;
      const drive =
        (Number(this.keys.has('ArrowRight')) - Number(this.keys.has('ArrowLeft'))) *
        0.24 *
        stepScale;
      current.x += drive;
      this.resolveTerrain(current, previous, 15);
    }
    const left = this.car[0];
    const right = this.car[1];
    if (left && right) {
      const unit = safeUnit(right.x - left.x, right.y - left.y);
      const correction = (unit.length - 54) * 0.5;
      left.addScaled(unit, correction);
      right.addScaled(unit, -correction);
    }
  }

  private resolveTerrain(position: Vector2, previous: Vector2, radius: number): void {
    for (let index = 0; index < this.terrain.length - 1; index += 1) {
      const a = this.terrain[index];
      const b = this.terrain[index + 1];
      if (!a || !b) continue;
      const closest = closestPointOnSegment(position, a, b);
      const unit = safeUnit(position.x - closest.x, position.y - closest.y);
      if (unit.length > 0 && unit.length < radius) {
        position.set(closest.x + unit.x * radius, closest.y + unit.y * radius);
        previous.x = position.x - (position.x - previous.x) * 0.88;
      }
    }
  }

  private updateBox(stepScale: number): void {
    if (this.dragging) {
      const pointer = this.context.pointer.position;
      this.velocity.set(
        pointer.x - this.previousPointer.x,
        pointer.y - this.previousPointer.y,
      );
      this.point.copy(pointer);
      this.previousPointer.copy(pointer);
      return;
    }
    this.velocity.y += 0.34 * stepScale;
    this.point.addScaled(this.velocity, stepScale);
    this.angle += this.angularVelocity * stepScale;
    const { width, height } = this.context.viewport;
    if (this.point.x < 34 || this.point.x > width - 34) {
      this.point.x = clamp(this.point.x, 34, width - 34);
      this.velocity.x *= -0.7;
      this.angularVelocity += this.velocity.y * 0.003;
    }
    if (this.point.y > height - 34) {
      this.point.y = height - 34;
      this.velocity.y *= -0.62;
      this.angularVelocity += this.velocity.x * 0.006;
    }
  }

  private updateTorque(stepScale: number): void {
    const center = new Vector2(
      this.context.viewport.width * 0.5,
      this.context.viewport.height * 0.5,
    );
    const arm = new Vector2(78, 0).rotate(this.angle);
    const endpoint = center.clone().add(arm);
    const force = Vector2.subtract(this.context.pointer.position, endpoint).scale(
      0.0012,
    );
    const torque = arm.cross(force);
    this.angularVelocity = (this.angularVelocity + torque * stepScale) * 0.985;
    this.angle += this.angularVelocity * stepScale;
  }

  public render(): void {
    const graphics = this.graphics.clear();
    const id = this.context.definition.id;
    if (id === 'gasket') return this.renderGasket(graphics);
    if (id === 'kinetic') return this.renderKinetic(graphics);
    if (id === 'car') return this.renderCar(graphics);
    if (id === 'box-throwing') return this.renderBox(graphics);
    if (id === 'torque') return this.renderTorque(graphics);
    if (id === 'gear') return this.renderGear(graphics);
    if (id === 'curve-move') return this.renderCurve(graphics);
    if (id === 'ball-rolling') return this.renderRolling(graphics);
    if (id === 'product-calcu-radians') return this.renderRadians(graphics);
    this.renderTimeScaling(graphics);
  }

  private renderGasket(graphics: Graphics): void {
    for (const point of this.gasket) graphics.rect(point.x, point.y, 1.4, 1.4);
    graphics.fill({ color: 0x91f5cf, alpha: 0.82 });
  }

  private renderKinetic(graphics: Graphics): void {
    for (let index = 0; index < this.chain.length - 1; index += 1) {
      const a = this.chain[index];
      const b = this.chain[index + 1];
      if (a && b) graphics.moveTo(a.x, a.y).lineTo(b.x, b.y);
    }
    graphics.stroke({ color: 0xd8fff1, width: 8 });
    for (const point of this.chain) graphics.circle(point.x, point.y, 6);
    graphics.circle(
      this.context.pointer.position.x,
      this.context.pointer.position.y,
      9,
    );
    graphics.fill({ color: 0x67e8bd });
  }

  private renderCar(graphics: Graphics): void {
    const first = this.terrain[0];
    if (first) graphics.moveTo(first.x, first.y);
    for (const point of this.terrain.slice(1)) graphics.lineTo(point.x, point.y);
    graphics.stroke({ color: 0x48666f, width: 3 });
    const left = this.car[0];
    const right = this.car[1];
    if (!left || !right) return;
    graphics
      .moveTo(left.x, left.y)
      .lineTo(right.x, right.y)
      .stroke({ color: 0x91f5cf, width: 8 });
    graphics
      .circle(left.x, left.y, 15)
      .circle(right.x, right.y, 15)
      .stroke({ color: 0xf2fffb, width: 4 });
  }

  private renderBox(graphics: Graphics): void {
    const corners = [
      new Vector2(-30, -30),
      new Vector2(30, -30),
      new Vector2(30, 30),
      new Vector2(-30, 30),
    ].map((corner) => corner.rotate(this.angle).add(this.point));
    const first = corners[0];
    if (!first) return;
    graphics.moveTo(first.x, first.y);
    for (const corner of corners.slice(1)) graphics.lineTo(corner.x, corner.y);
    graphics
      .closePath()
      .fill({ color: 0x67e8bd, alpha: 0.25 })
      .stroke({ color: 0xcaffed, width: 3 });
    const opposite = corners[2];
    if (opposite)
      graphics
        .moveTo(first.x, first.y)
        .lineTo(opposite.x, opposite.y)
        .stroke({ color: 0x67e8bd, width: 2 });
  }

  private renderTorque(graphics: Graphics): void {
    const center = new Vector2(
      this.context.viewport.width * 0.5,
      this.context.viewport.height * 0.5,
    );
    const endpoint = center.clone().add(new Vector2(78, 0).rotate(this.angle));
    graphics
      .moveTo(center.x, center.y)
      .lineTo(endpoint.x, endpoint.y)
      .stroke({ color: 0xd8fff1, width: 10 });
    graphics
      .moveTo(endpoint.x, endpoint.y)
      .lineTo(this.context.pointer.position.x, this.context.pointer.position.y)
      .stroke({ color: 0xffbd71, width: 3 });
    graphics
      .circle(center.x, center.y, 12)
      .circle(endpoint.x, endpoint.y, 8)
      .fill({ color: 0x67e8bd });
  }

  private renderGear(graphics: Graphics): void {
    const centerA = new Vector2(
      this.context.viewport.width * 0.42,
      this.context.viewport.height * 0.5,
    );
    const centerB = new Vector2(
      this.context.viewport.width * 0.61,
      this.context.viewport.height * 0.5,
    );
    this.drawGear(graphics, centerA, 62, 14, this.angle, 0x67e8bd);
    this.drawGear(graphics, centerB, 46, 10, (-this.angle * 62) / 46, 0xffbd71);
  }

  private drawGear(
    graphics: Graphics,
    center: Vector2,
    radius: number,
    teeth: number,
    angle: number,
    color: number,
  ): void {
    for (let index = 0; index < teeth; index += 1) {
      const theta = angle + (index * Math.PI * 2) / teeth;
      const inner = center
        .clone()
        .add(new Vector2(Math.cos(theta), Math.sin(theta)).scale(radius - 8));
      const outer = center
        .clone()
        .add(new Vector2(Math.cos(theta), Math.sin(theta)).scale(radius + 8));
      graphics.moveTo(inner.x, inner.y).lineTo(outer.x, outer.y);
    }
    graphics.stroke({ color, width: 8 });
    graphics.circle(center.x, center.y, radius).stroke({ color, width: 4 });
  }

  private renderCurve(graphics: Graphics): void {
    const { width, height } = this.context.viewport;
    const curveY = (x: number) =>
      height * 0.5 +
      ((x / width) * 500 * ((x / width) * 500 - 200) * ((x / width) * 500 - 500)) /
        100_000;
    graphics.moveTo(0, curveY(0));
    for (let x = 4; x <= width; x += 4) graphics.lineTo(x, curveY(x));
    graphics.stroke({ color: 0x48666f, width: 3 });
    const x = (this.phase / 500) * width;
    graphics.circle(x, curveY(x), 16).fill({ color: 0x67e8bd });
  }

  private renderRolling(graphics: Graphics): void {
    const { width, height } = this.context.viewport;
    const a = new Vector2(width * 0.16, height * 0.35);
    const b = this.context.pointer.position;
    const center = a.clone().addScaled(Vector2.subtract(b, a), this.phase);
    const tangent = safeUnit(b.x - a.x, b.y - a.y);
    const radius = 20;
    center.add(new Vector2(-tangent.y, tangent.x).scale(-radius));
    graphics.moveTo(a.x, a.y).lineTo(b.x, b.y).stroke({ color: 0x48666f, width: 4 });
    graphics.circle(center.x, center.y, radius).stroke({ color: 0x91f5cf, width: 4 });
    graphics
      .moveTo(center.x, center.y)
      .lineTo(
        center.x + Math.cos(this.angle) * radius,
        center.y + Math.sin(this.angle) * radius,
      )
      .stroke({ color: 0xffbd71, width: 3 });
  }

  private renderRadians(graphics: Graphics): void {
    const center = new Vector2(
      this.context.viewport.width * 0.5,
      this.context.viewport.height * 0.5,
    );
    const vector = Vector2.subtract(this.context.pointer.position, center);
    const angle = Math.atan2(vector.y, vector.x);
    graphics.circle(center.x, center.y, 92).stroke({ color: 0x294049, width: 2 });
    graphics
      .moveTo(center.x, center.y)
      .lineTo(this.context.pointer.position.x, this.context.pointer.position.y)
      .stroke({ color: 0x91f5cf, width: 4 });
    graphics
      .arc(center.x, center.y, 46, 0, angle)
      .stroke({ color: 0xffbd71, width: 5 });
  }

  private renderTimeScaling(graphics: Graphics): void {
    const { height } = this.context.viewport;
    for (const trail of this.trail) graphics.circle(trail.position.x, height * 0.5, 5);
    graphics.fill({ color: 0x67e8bd, alpha: 0.12 });
    graphics.circle(this.point.x, height * 0.5, 18).fill({ color: 0x91f5cf });
  }

  public resize(viewport: Viewport): void {
    this.context.viewport = viewport;
    this.reset();
  }

  public pointerDown(): void {
    if (this.context.definition.id === 'box-throwing') {
      this.dragging = true;
      this.point.copy(this.context.pointer.position);
      this.previousPointer.copy(this.point);
      this.velocity.set(0, 0);
    } else if (this.context.definition.id === 'gasket') {
      this.gasket.length = 0;
    } else if (this.context.definition.id === 'curve-move') {
      this.direction *= -1;
    } else if (this.context.definition.id === 'car') {
      for (let index = 0; index < this.car.length; index += 1) {
        const current = this.car[index];
        const previous = this.carPrevious[index];
        if (current && previous) previous.y = current.y + 8;
      }
    } else {
      this.reset();
    }
  }

  public pointerMove(): void {
    if (this.dragging) this.previousPointer.copy(this.context.pointer.previous);
  }

  public pointerUp(): void {
    if (!this.dragging) return;
    this.dragging = false;
    this.angularVelocity = (this.velocity.x + this.velocity.y) * 0.01;
  }

  public keyDown(code: string): void {
    this.keys.add(code);
    if (code === 'ArrowUp' && this.context.definition.id === 'car') {
      for (let index = 0; index < this.car.length; index += 1) {
        const current = this.car[index];
        const previous = this.carPrevious[index];
        if (current && previous) previous.y = current.y + 9;
      }
    }
    window.setTimeout(() => this.keys.delete(code), 90);
  }

  public destroy(): void {
    this.graphics.destroy();
  }
}

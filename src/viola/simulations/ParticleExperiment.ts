import { Graphics, Particle, ParticleContainer, Texture } from 'pixi.js';
import type { Experiment, ExperimentContext, Viewport } from '../core/Experiment';
import { Random } from '../core/Random';
import { Vector2, clamp, safeUnit } from '../core/Vector2';
import { drawGrid } from './shared';

interface ParticleState {
  position: Vector2;
  previous: Vector2;
  velocity: Vector2;
  life: number;
  size: number;
  hue: number;
}

const particleCounts: Record<string, number> = {
  optimize: 1_500,
  'cell-space-partitioning': 7_000,
  'particle-mouse': 500,
  'area-force': 10,
  'particle-circle': 300,
  'particle-connection': 500,
  'flow-simulation': 300,
  'particle-tail': 36,
  'reality-snow': 420,
  'light-ver-1': 0,
  'light-ver-2': 96,
  'mouse-moving-energy': 10_000,
  'connect-node-set': 18,
  'constraint-list': 4,
  'particle-effect': 8_000,
  particle: 200,
  'g-force': 700,
};

export class ParticleExperiment implements Experiment {
  public readonly context: ExperimentContext;
  private readonly random: Random;
  private readonly particles: ParticleState[] = [];
  private readonly views: Particle[] = [];
  private readonly particleLayer: ParticleContainer<Particle>;
  private readonly texture: Texture;
  private readonly graphics = new Graphics();
  private readonly grid = new Map<string, number[]>();
  private readonly lightning: Vector2[] = [];
  private readonly tailHistory: Vector2[] = [];
  private readonly keys = new Set<string>();
  private field: Vector2[] = [];
  private emitter = new Vector2();
  private time = 0;
  private burstCursor = 0;

  public constructor(context: ExperimentContext) {
    this.context = context;
    this.random = new Random(context.definition.seed);
    this.texture =
      context.definition.id === 'reality-snow'
        ? Texture.from('/projects/viola/assets/snow.png')
        : Texture.WHITE;
    this.particleLayer = new ParticleContainer<Particle>({
      texture: this.texture,
      dynamicProperties: { position: true, color: true, vertex: true },
    });
    context.root.addChild(this.particleLayer, this.graphics);
    this.initialize();
  }

  private initialize(): void {
    const { width, height } = this.context.viewport;
    this.emitter.set(width * 0.5, height * 0.5);
    const count = particleCounts[this.context.definition.id] ?? 300;
    const large = count >= 4_000;
    for (let index = 0; index < count; index += 1) {
      const position = new Vector2(
        this.random.range(0, width),
        this.random.range(0, height),
      );
      const state: ParticleState = {
        position,
        previous: position.clone(),
        velocity: new Vector2(this.random.range(-1, 1), this.random.range(-1, 1)),
        life: this.random.next(),
        size: large ? this.random.range(1, 2.2) : this.random.range(2, 6),
        hue: this.random.next(),
      };
      this.particles.push(state);
      const isSnow = this.context.definition.id === 'reality-snow';
      const view = new Particle({
        texture: this.texture,
        x: position.x,
        y: position.y,
        scaleX: isSnow ? state.size * 0.012 : state.size,
        scaleY: isSnow ? state.size * 0.012 : state.size,
        anchorX: 0.5,
        anchorY: 0.5,
        tint: 0x91f5cf,
        alpha: 0.72,
      });
      this.views.push(view);
      this.particleLayer.addParticle(view);
    }
    this.resetSpecialState();
  }

  private resetSpecialState(): void {
    const { width, height } = this.context.viewport;
    const id = this.context.definition.id;
    if (id === 'area-force') {
      this.field = Array.from({ length: 16 }, () => {
        const angle = this.random.range(0, Math.PI * 2);
        return new Vector2(Math.cos(angle), Math.sin(angle));
      });
    }
    if (id === 'particle-circle' || id === 'particle')
      this.emitBurst(this.emitter, this.particles.length);
    if (id === 'connect-node-set' || id === 'constraint-list') {
      this.particles.forEach((particle, index) => {
        particle.position.set(
          width * 0.24 + index * (id === 'constraint-list' ? 86 : 28),
          height * 0.45,
        );
        particle.previous.copy(particle.position);
      });
    }
    if (id === 'particle-tail') {
      this.emitter.set(width * 0.5, height * 0.5);
      this.tailHistory.length = 0;
    }
    if (id === 'light-ver-1' || id === 'light-ver-2')
      this.buildLightning(
        new Vector2(width * 0.2, height * 0.45),
        new Vector2(width * 0.8, height * 0.55),
      );
  }

  public update(stepScale: number): void {
    this.time += stepScale;
    const id = this.context.definition.id;
    if (id === 'light-ver-1') {
      this.buildLightning(this.emitter, this.context.pointer.position);
      return;
    }
    if (id === 'light-ver-2') this.updateLightningDust(stepScale);
    else if (id === 'area-force') this.updateAreaForce(stepScale);
    else if (id === 'particle-mouse') this.updateMouseParticles(stepScale);
    else if (id === 'particle-circle' || id === 'particle') this.updateBurst(stepScale);
    else if (id === 'particle-connection') this.updateSeparatedVerlet(stepScale);
    else if (id === 'flow-simulation' || id === 'optimize') this.updateFlow(stepScale);
    else if (id === 'cell-space-partitioning') this.updateCellSpace(stepScale);
    else if (id === 'particle-tail') this.updateTail(stepScale);
    else if (id === 'reality-snow') this.updateSnow(stepScale);
    else if (id === 'mouse-moving-energy') this.updateMouseEnergy(stepScale);
    else if (id === 'connect-node-set' || id === 'constraint-list')
      this.updateChain(stepScale);
    else if (id === 'particle-effect') this.updateParticleEffect(stepScale);
    else if (id === 'g-force') this.updateGravityWell(stepScale);
    this.syncViews();
  }

  private updateMouseParticles(stepScale: number): void {
    const pointer = this.context.pointer.position;
    if (this.context.pointer.pressed) {
      for (let count = 0; count < 8; count += 1) {
        const particle = this.particles[this.burstCursor % this.particles.length];
        this.burstCursor += 1;
        if (!particle) continue;
        particle.position.copy(pointer);
        particle.velocity.set(
          this.random.range(-2.6, 2.6),
          this.random.range(-2.6, 2.6),
        );
        particle.life = 1;
      }
    }
    for (const particle of this.particles) {
      particle.velocity.y += 0.035 * stepScale;
      particle.position.addScaled(particle.velocity, stepScale);
      particle.velocity.scale(0.985);
      particle.life = Math.max(0, particle.life - 0.014 * stepScale);
    }
  }

  private updateAreaForce(stepScale: number): void {
    const { width, height } = this.context.viewport;
    for (const particle of this.particles) {
      const column = clamp(Math.floor((particle.position.x / width) * 4), 0, 3);
      const row = clamp(Math.floor((particle.position.y / height) * 4), 0, 3);
      const force = this.field[row * 4 + column];
      if (force) particle.velocity.addScaled(force, 0.045 * stepScale);
      particle.velocity.scale(0.996);
      particle.position.addScaled(particle.velocity, stepScale);
      this.wrap(particle);
    }
  }

  private emitBurst(center: Readonly<Vector2>, count: number): void {
    for (let index = 0; index < count; index += 1) {
      const particle = this.particles[index];
      if (!particle) continue;
      const angle =
        (index / Math.max(count, 1)) * Math.PI * 2 + this.random.range(-0.04, 0.04);
      const speed = this.random.range(
        1.2,
        this.context.definition.id === 'particle' ? 5 : 3.4,
      );
      particle.position.copy(center);
      particle.velocity.set(Math.cos(angle) * speed, Math.sin(angle) * speed);
      particle.life = this.random.range(0.68, 1);
    }
  }

  private updateBurst(stepScale: number): void {
    for (const particle of this.particles) {
      particle.position.addScaled(particle.velocity, stepScale);
      particle.velocity.scale(0.988);
      particle.velocity.y += 0.015 * stepScale;
      particle.life -= 0.006 * stepScale;
      if (particle.life <= 0) {
        const angle = this.random.range(0, Math.PI * 2);
        particle.position.copy(this.emitter);
        particle.velocity
          .set(Math.cos(angle), Math.sin(angle))
          .scale(this.random.range(1, 3));
        particle.life = 1;
      }
    }
  }

  private updateSeparatedVerlet(stepScale: number): void {
    for (const particle of this.particles) {
      const vx = (particle.position.x - particle.previous.x) * 0.99;
      const vy = (particle.position.y - particle.previous.y) * 0.99 + 0.035 * stepScale;
      particle.previous.copy(particle.position);
      particle.position.addScaled(new Vector2(vx, vy), stepScale);
      this.wrap(particle);
    }
    this.buildGrid(14);
    const processedPairs = new Set<string>();
    for (const indexes of this.grid.values())
      this.resolvePairs(indexes, 7, processedPairs);
    if (this.context.pointer.pressed) {
      const pointer = this.context.pointer.position;
      for (const particle of this.particles) {
        const unit = safeUnit(
          particle.position.x - pointer.x,
          particle.position.y - pointer.y,
        );
        if (unit.length < 80 && unit.length > 0)
          particle.position.addScaled(unit, (80 - unit.length) * 0.14);
      }
    }
  }

  private updateFlow(stepScale: number): void {
    const { width, height } = this.context.viewport;
    const count =
      this.context.definition.id === 'optimize' ? 1_500 : this.particles.length;
    this.buildGrid(22, count);
    const pressure = new Float32Array(count);
    const processedPairs = new Set<string>();
    for (const indexes of this.grid.values()) {
      for (let left = 0; left < indexes.length; left += 1) {
        const indexA = indexes[left];
        const a = indexA === undefined ? undefined : this.particles[indexA];
        if (!a || indexA === undefined) continue;
        for (let right = left + 1; right < indexes.length; right += 1) {
          const indexB = indexes[right];
          const b = indexB === undefined ? undefined : this.particles[indexB];
          if (!b || indexB === undefined) continue;
          const pairKey =
            indexA < indexB ? `${indexA}:${indexB}` : `${indexB}:${indexA}`;
          if (processedPairs.has(pairKey)) continue;
          processedPairs.add(pairKey);
          const unit = safeUnit(
            b.position.x - a.position.x,
            b.position.y - a.position.y,
          );
          if (unit.length <= 0 || unit.length >= 22) continue;
          const density = 1 - unit.length / 22;
          pressure[indexA] = (pressure[indexA] ?? 0) + density;
          pressure[indexB] = (pressure[indexB] ?? 0) + density;
          const impulse = density * density * 0.18;
          a.velocity.addScaled(unit, -impulse);
          b.velocity.addScaled(unit, impulse);
          const viscosity = Vector2.subtract(b.velocity, a.velocity).scale(
            0.008 * density,
          );
          a.velocity.add(viscosity);
          b.velocity.subtract(viscosity);
        }
      }
    }
    const pointerDelta = Vector2.subtract(
      this.context.pointer.position,
      this.context.pointer.previous,
    );
    for (let index = 0; index < count; index += 1) {
      const particle = this.particles[index];
      if (!particle) continue;
      particle.velocity.y += 0.045 * stepScale;
      const pointerUnit = safeUnit(
        particle.position.x - this.context.pointer.position.x,
        particle.position.y - this.context.pointer.position.y,
      );
      if (pointerUnit.length > 0 && pointerUnit.length < 90)
        particle.velocity.addScaled(pointerDelta, (1 - pointerUnit.length / 90) * 0.06);
      particle.velocity.scale(0.997);
      particle.position.addScaled(particle.velocity, stepScale);
      if (particle.position.x < 2 || particle.position.x > width - 2)
        particle.velocity.x *= -0.55;
      if (particle.position.y < 2 || particle.position.y > height - 2)
        particle.velocity.y *= -0.55;
      particle.position.x = clamp(particle.position.x, 2, width - 2);
      particle.position.y = clamp(particle.position.y, 2, height - 2);
      particle.hue = clamp((pressure[index] ?? 0) / 8, 0, 1);
    }
  }

  private updateCellSpace(stepScale: number): void {
    const { width, height } = this.context.viewport;
    for (const particle of this.particles) {
      particle.position.addScaled(particle.velocity, stepScale);
      if (particle.position.x < 1 || particle.position.x > width - 1)
        particle.velocity.x *= -1;
      if (particle.position.y < 1 || particle.position.y > height - 1)
        particle.velocity.y *= -1;
      particle.position.x = clamp(particle.position.x, 1, width - 1);
      particle.position.y = clamp(particle.position.y, 1, height - 1);
    }
    this.buildGrid(8);
    const processedPairs = new Set<string>();
    for (const indexes of this.grid.values())
      this.resolvePairs(indexes, 3.2, processedPairs);
    if (this.context.pointer.pressed) {
      for (const particle of this.particles) {
        const unit = safeUnit(
          particle.position.x - this.context.pointer.position.x,
          particle.position.y - this.context.pointer.position.y,
        );
        if (unit.length > 0 && unit.length < 55)
          particle.velocity.addScaled(unit, 0.22);
      }
    }
  }

  private buildGrid(cellSize: number, count = this.particles.length): void {
    this.grid.clear();
    for (let index = 0; index < count; index += 1) {
      const particle = this.particles[index];
      if (!particle) continue;
      const cellX = Math.floor(particle.position.x / cellSize);
      const cellY = Math.floor(particle.position.y / cellSize);
      for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
        for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
          const key = `${cellX + offsetX}:${cellY + offsetY}`;
          const indexes = this.grid.get(key);
          if (indexes) indexes.push(index);
          else this.grid.set(key, [index]);
        }
      }
    }
  }

  private resolvePairs(
    indexes: number[],
    minimumDistance: number,
    processedPairs: Set<string>,
  ): void {
    for (let left = 0; left < indexes.length; left += 1) {
      const indexA = indexes[left];
      const a = indexA === undefined ? undefined : this.particles[indexA];
      if (!a) continue;
      for (let right = left + 1; right < indexes.length; right += 1) {
        const indexB = indexes[right];
        if (indexB === indexA) continue;
        const b = indexB === undefined ? undefined : this.particles[indexB];
        if (!b || indexA === undefined || indexB === undefined) continue;
        const pairKey = indexA < indexB ? `${indexA}:${indexB}` : `${indexB}:${indexA}`;
        if (processedPairs.has(pairKey)) continue;
        processedPairs.add(pairKey);
        const unit = safeUnit(b.position.x - a.position.x, b.position.y - a.position.y);
        if (unit.length <= 0 || unit.length >= minimumDistance) continue;
        const correction = (minimumDistance - unit.length) * 0.5;
        a.position.addScaled(unit, -correction);
        b.position.addScaled(unit, correction);
      }
    }
  }

  private updateTail(stepScale: number): void {
    this.emitter.x +=
      (Number(this.keys.has('ArrowRight')) - Number(this.keys.has('ArrowLeft'))) *
      3 *
      stepScale;
    this.emitter.y +=
      (Number(this.keys.has('ArrowDown')) - Number(this.keys.has('ArrowUp'))) *
      3 *
      stepScale;
    this.emitter.x = clamp(this.emitter.x, 20, this.context.viewport.width - 20);
    this.emitter.y = clamp(this.emitter.y, 20, this.context.viewport.height - 20);
    this.tailHistory.unshift(this.emitter.clone());
    if (this.tailHistory.length > this.particles.length) this.tailHistory.pop();
    this.particles.forEach((particle, index) => {
      const target = this.tailHistory[index];
      if (target) particle.position.copy(target);
      particle.life = 1 - index / this.particles.length;
    });
  }

  private updateSnow(stepScale: number): void {
    const wind =
      (this.context.pointer.position.x / this.context.viewport.width - 0.5) * 0.08;
    for (const particle of this.particles) {
      particle.velocity.x += wind * stepScale;
      particle.velocity.x *= 0.99;
      particle.velocity.y = 0.35 + particle.size * 0.14;
      particle.position.addScaled(particle.velocity, stepScale);
      particle.position.x += Math.sin(this.time * 0.015 + particle.hue * 10) * 0.25;
      this.wrap(particle);
    }
  }

  private buildLightning(start: Readonly<Vector2>, end: Readonly<Vector2>): void {
    this.lightning.length = 0;
    const distance = Vector2.distance(start, end);
    const segments = Math.max(8, Math.floor(distance / 14));
    for (let index = 0; index <= segments; index += 1) {
      const t = index / segments;
      const falloff = Math.sin(t * Math.PI);
      this.lightning.push(
        new Vector2(
          start.x + (end.x - start.x) * t + this.random.range(-18, 18) * falloff,
          start.y + (end.y - start.y) * t + this.random.range(-18, 18) * falloff,
        ),
      );
    }
  }

  private updateLightningDust(stepScale: number): void {
    for (const particle of this.particles) {
      particle.velocity.y += 0.04 * stepScale;
      particle.position.addScaled(particle.velocity, stepScale);
      particle.velocity.scale(0.985);
      particle.life -= 0.018 * stepScale;
    }
    if (this.time % 22 < stepScale)
      this.buildLightning(this.emitter, this.context.pointer.position);
  }

  private updateMouseEnergy(stepScale: number): void {
    const pointerVelocity = Vector2.subtract(
      this.context.pointer.position,
      this.context.pointer.previous,
    );
    const speed = Math.min(pointerVelocity.length(), 45);
    for (const particle of this.particles) {
      const unit = safeUnit(
        particle.position.x - this.context.pointer.position.x,
        particle.position.y - this.context.pointer.position.y,
      );
      if (unit.length > 0 && unit.length < 72) {
        particle.velocity.addScaled(pointerVelocity, (1 - unit.length / 72) * 0.12);
        particle.life = Math.min(1, particle.life + speed * 0.012);
      }
      particle.position.addScaled(particle.velocity, stepScale);
      particle.velocity.scale(0.94);
      particle.life *= 0.985;
      this.wrap(particle);
    }
  }

  private updateChain(stepScale: number): void {
    const isConstraintList = this.context.definition.id === 'constraint-list';
    const targetIndex = this.particles.length - 1;
    if (this.context.pointer.pressed)
      this.particles[targetIndex]?.position.copy(this.context.pointer.position);
    for (const particle of this.particles) {
      const velocity = Vector2.subtract(particle.position, particle.previous).scale(
        0.99,
      );
      particle.previous.copy(particle.position);
      particle.position.addScaled(velocity, stepScale);
      particle.position.y += 0.07 * stepScale * stepScale;
    }
    const rest = isConstraintList ? 86 : 28;
    for (let iteration = 0; iteration < 5; iteration += 1) {
      for (let index = 0; index < this.particles.length - 1; index += 1) {
        const a = this.particles[index];
        const b = this.particles[index + 1];
        if (!a || !b) continue;
        const unit = safeUnit(b.position.x - a.position.x, b.position.y - a.position.y);
        if (unit.length <= 0) continue;
        const correction = (unit.length - rest) * 0.5;
        if (index !== 0) a.position.addScaled(unit, correction);
        b.position.addScaled(unit, -correction);
      }
    }
  }

  private updateParticleEffect(stepScale: number): void {
    const center = this.context.pointer.position;
    const attract = this.context.pointer.pressed ? -1 : 1;
    for (const particle of this.particles) {
      const unit = safeUnit(
        particle.position.x - center.x,
        particle.position.y - center.y,
      );
      if (unit.length > 0 && unit.length < 180)
        particle.velocity.addScaled(
          unit,
          attract * (1 - unit.length / 180) * 0.08 * stepScale,
        );
      particle.velocity.y += 0.004 * stepScale;
      particle.position.addScaled(particle.velocity, stepScale);
      particle.velocity.scale(0.996);
      particle.hue = (particle.hue + 0.002 * stepScale) % 1;
      this.wrap(particle);
    }
  }

  private updateGravityWell(stepScale: number): void {
    const center = this.context.pointer.position;
    for (const particle of this.particles) {
      const toward = safeUnit(
        center.x - particle.position.x,
        center.y - particle.position.y,
      );
      const force =
        toward.length > 3 ? Math.min(0.8, 210 / (toward.length * toward.length)) : 0;
      particle.velocity.addScaled(toward, force * stepScale);
      particle.position.addScaled(particle.velocity, stepScale);
      particle.velocity.scale(0.999);
      this.wrap(particle);
    }
    this.buildGrid(9);
    const processedPairs = new Set<string>();
    for (const indexes of this.grid.values())
      this.resolvePairs(indexes, 4, processedPairs);
  }

  private wrap(particle: ParticleState): void {
    const { width, height } = this.context.viewport;
    if (particle.position.x < 0) particle.position.x += width;
    if (particle.position.x > width) particle.position.x -= width;
    if (particle.position.y < 0) particle.position.y += height;
    if (particle.position.y > height) particle.position.y -= height;
  }

  private syncViews(): void {
    this.views.forEach((view, index) => {
      const state = this.particles[index];
      if (!state) return;
      view.x = state.position.x;
      view.y = state.position.y;
      view.alpha = clamp(state.life, 0.08, 0.9);
      const colorAmount = clamp(state.hue, 0, 1);
      view.tint =
        this.context.definition.id === 'reality-snow'
          ? 0xffffff
          : colorAmount > 0.58
            ? 0xffbd71
            : 0x91f5cf;
    });
  }

  public render(): void {
    const graphics = this.graphics.clear();
    const id = this.context.definition.id;
    if (id === 'area-force') this.renderField(graphics);
    if (id === 'connect-node-set' || id === 'constraint-list')
      this.renderConnections(graphics);
    if (id === 'light-ver-1' || id === 'light-ver-2') this.renderLightning(graphics);
    if (
      id === 'flow-simulation' ||
      id === 'optimize' ||
      id === 'cell-space-partitioning'
    ) {
      drawGrid(
        graphics,
        this.context.viewport.width,
        this.context.viewport.height,
        id === 'cell-space-partitioning' ? 48 : 88,
      );
    }
    if (id === 'g-force')
      graphics
        .circle(this.context.pointer.position.x, this.context.pointer.position.y, 9)
        .fill({ color: 0xffbd71 });
  }

  private renderField(graphics: Graphics): void {
    const cellWidth = this.context.viewport.width / 4;
    const cellHeight = this.context.viewport.height / 4;
    for (let row = 0; row < 4; row += 1) {
      for (let column = 0; column < 4; column += 1) {
        const force = this.field[row * 4 + column];
        if (!force) continue;
        const center = new Vector2(
          (column + 0.5) * cellWidth,
          (row + 0.5) * cellHeight,
        );
        graphics
          .moveTo(center.x, center.y)
          .lineTo(center.x + force.x * 28, center.y + force.y * 28);
      }
    }
    graphics.stroke({ color: 0x48666f, width: 2 });
    drawGrid(
      graphics,
      this.context.viewport.width,
      this.context.viewport.height,
      Math.min(cellWidth, cellHeight),
    );
  }

  private renderConnections(graphics: Graphics): void {
    const first = this.particles[0];
    if (!first) return;
    graphics.moveTo(first.position.x, first.position.y);
    for (const particle of this.particles.slice(1))
      graphics.lineTo(particle.position.x, particle.position.y);
    graphics.stroke({ color: 0x91f5cf, width: 3 });
  }

  private renderLightning(graphics: Graphics): void {
    const first = this.lightning[0];
    if (!first) return;
    graphics.moveTo(first.x, first.y);
    for (const point of this.lightning.slice(1)) graphics.lineTo(point.x, point.y);
    graphics.stroke({ color: 0xe8fffb, width: 6, alpha: 0.18 });
    graphics.moveTo(first.x, first.y);
    for (const point of this.lightning.slice(1)) graphics.lineTo(point.x, point.y);
    graphics.stroke({ color: 0x91f5cf, width: 2 });
  }

  public pointerDown(): void {
    this.emitter.copy(this.context.pointer.position);
    const id = this.context.definition.id;
    if (id === 'particle-circle' || id === 'particle')
      this.emitBurst(this.emitter, this.particles.length);
    if (id === 'area-force') this.resetSpecialState();
    if (id === 'light-ver-2') {
      this.buildLightning(this.emitter, this.context.pointer.position);
      this.emitBurst(this.context.pointer.position, this.particles.length);
    }
  }

  public keyDown(code: string): void {
    this.keys.add(code);
    window.setTimeout(() => this.keys.delete(code), 100);
  }

  public resize(viewport: Viewport): void {
    this.context.viewport = viewport;
    for (const particle of this.particles) this.wrap(particle);
  }

  public destroy(): void {
    this.particleLayer.destroy({ children: true });
    this.graphics.destroy();
  }
}

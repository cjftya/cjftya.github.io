import { Graphics } from 'pixi.js';
import type { Experiment, ExperimentContext, Viewport } from '../core/Experiment';
import { Random } from '../core/Random';
import { Vector2, clamp, safeUnit } from '../core/Vector2';
import {
  type Body,
  type Link,
  constrainBounds,
  createBody,
  integrateVerlet,
  segmentsIntersect,
  solveBodyPair,
  solveLink,
} from './shared';

export class ConstraintExperiment implements Experiment {
  public readonly context: ExperimentContext;
  private readonly graphics = new Graphics();
  private readonly random: Random;
  private readonly bodies: Body[] = [];
  private readonly links: Link[] = [];
  private pointerStart: Vector2 | null = null;
  private grabbed = -1;
  private time = 0;
  private rotation = 0;
  private rotationVelocity = 0;

  public constructor(context: ExperimentContext) {
    this.context = context;
    this.random = new Random(context.definition.seed);
    context.root.addChild(this.graphics);
    this.build();
    if (context.definition.id === 'image-fun') void this.loadOriginalImage();
  }

  private build(): void {
    this.bodies.length = 0;
    this.links.length = 0;
    const id = this.context.definition.id;
    if (id === 'cutting-rope') this.buildRope(40, 15);
    else if (id === 'cloth-destroy') this.buildCloth(22, 13, true);
    else if (id === 'linear-spring-cloth') this.buildCloth(20, 12, false);
    else if (id === 'softbody') this.buildSoftbodies();
    else if (id === 'figure') this.buildFigure();
    else if (id === 'circle-jelly') this.buildJelly();
    else if (id === 'image-fun') this.buildPixelImage();
    else if (id === 'interpolation-trace') this.buildRope(20, 20, false);
    else if (id === 'ease-motion-bug') this.buildWorms();
    else if (id === 'softbody-struct-test') this.buildEditorSeed();
    else this.buildRope(16, 26, false);
  }

  private buildRope(count: number, spacing: number, pinFirst = true): void {
    const startX = this.context.viewport.width * 0.2;
    const startY = this.context.viewport.height * 0.18;
    for (let index = 0; index < count; index += 1) {
      const body = createBody(startX + index * spacing, startY, 4);
      body.pinned = pinFirst && index === 0;
      this.bodies.push(body);
      if (index > 0)
        this.links.push({
          a: index - 1,
          b: index,
          length: spacing,
          stiffness: 1,
          breakAt:
            this.context.definition.id === 'cutting-rope' ? spacing * 2.6 : undefined,
        });
    }
  }

  private buildCloth(columns: number, rows: number, destroyable: boolean): void {
    const spacing = Math.min(23, this.context.viewport.width / (columns + 4));
    const startX = (this.context.viewport.width - spacing * (columns - 1)) * 0.5;
    const startY = 54;
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const index = row * columns + column;
        const body = createBody(startX + column * spacing, startY + row * spacing, 2.5);
        body.pinned = row === 0 && column % 4 === 0;
        this.bodies.push(body);
        if (column > 0)
          this.links.push({
            a: index - 1,
            b: index,
            length: spacing,
            stiffness: 0.92,
            breakAt: destroyable ? spacing * 1.9 : undefined,
          });
        if (row > 0)
          this.links.push({
            a: index - columns,
            b: index,
            length: spacing,
            stiffness: 0.92,
            breakAt: destroyable ? spacing * 1.9 : undefined,
          });
        if (destroyable && row > 0 && column > 0)
          this.links.push({
            a: index - columns - 1,
            b: index,
            length: spacing * Math.SQRT2,
            stiffness: 0.55,
            breakAt: spacing * 2.35,
          });
      }
    }
  }

  private addRing(center: Vector2, radius: number, count: number): number[] {
    const indexes: number[] = [];
    for (let index = 0; index < count; index += 1) {
      const angle = (index / count) * Math.PI * 2;
      indexes.push(this.bodies.length);
      this.bodies.push(
        createBody(
          center.x + Math.cos(angle) * radius,
          center.y + Math.sin(angle) * radius,
          7,
        ),
      );
    }
    for (let index = 0; index < count; index += 1) {
      const current = indexes[index];
      const next = indexes[(index + 1) % count];
      const across = indexes[(index + Math.floor(count / 2)) % count];
      if (current !== undefined && next !== undefined)
        this.links.push({
          a: current,
          b: next,
          length: 2 * radius * Math.sin(Math.PI / count),
          stiffness: 0.8,
        });
      if (current !== undefined && across !== undefined && index < count / 2)
        this.links.push({ a: current, b: across, length: radius * 2, stiffness: 0.16 });
    }
    return indexes;
  }

  private buildSoftbodies(): void {
    const first = this.addRing(
      new Vector2(
        this.context.viewport.width * 0.38,
        this.context.viewport.height * 0.42,
      ),
      62,
      8,
    );
    const second = this.addRing(
      new Vector2(
        this.context.viewport.width * 0.62,
        this.context.viewport.height * 0.42,
      ),
      62,
      8,
    );
    const a = first[2];
    const b = second[6];
    if (a !== undefined && b !== undefined)
      this.links.push({ a, b, length: 72, stiffness: 0.4 });
  }

  private buildFigure(): void {
    const { width, height } = this.context.viewport;
    const points = [
      [0, -110],
      [0, -70],
      [-42, -46],
      [42, -46],
      [-68, 2],
      [68, 2],
      [-28, 0],
      [28, 0],
      [-32, 70],
      [32, 70],
      [-34, 132],
      [34, 132],
    ];
    for (const [offsetX = 0, offsetY = 0] of points)
      this.bodies.push(createBody(width * 0.5 + offsetX, height * 0.42 + offsetY, 7));
    const pairs = [
      [0, 1],
      [1, 2],
      [1, 3],
      [2, 4],
      [3, 5],
      [1, 6],
      [1, 7],
      [6, 7],
      [6, 8],
      [7, 9],
      [8, 10],
      [9, 11],
      [2, 3],
      [0, 2],
      [0, 3],
    ];
    for (const [a = 0, b = 0] of pairs)
      this.links.push({
        a,
        b,
        length: Vector2.distance(
          this.bodies[a]?.position ?? new Vector2(),
          this.bodies[b]?.position ?? new Vector2(),
        ),
        stiffness: 0.96,
      });
  }

  private buildJelly(): void {
    this.addRing(
      new Vector2(
        this.context.viewport.width * 0.5,
        this.context.viewport.height * 0.5,
      ),
      105,
      20,
    );
    const falling = createBody(this.context.viewport.width * 0.5, 40, 24);
    falling.previous.x -= 1.3;
    this.bodies.push(falling);
  }

  private buildPixelImage(): void {
    const pattern = [
      '1000110010001010001',
      '1000110010001010001',
      '1000110010001010001',
      '0101010010001010001',
      '0101010010001010001',
      '0010010010001010001',
      '0010010010001010001',
      '0010010011111011111',
    ];
    const scale = Math.min(10, this.context.viewport.width / 24);
    const startX = (this.context.viewport.width - pattern[0]!.length * scale) * 0.5;
    const startY = this.context.viewport.height * 0.34;
    for (let row = 0; row < pattern.length; row += 1) {
      const line = pattern[row];
      if (!line) continue;
      for (let column = 0; column < line.length; column += 1) {
        if (line[column] !== '1') continue;
        const body = createBody(
          startX + column * scale,
          startY + row * scale,
          scale * 0.38,
        );
        body.acceleration.set(body.position.x, body.position.y);
        body.previous.copy(body.position);
        this.bodies.push(body);
      }
    }
  }

  private async loadOriginalImage(): Promise<void> {
    const image = new Image();
    image.src = '/projects/viola/assets/aa.png';
    try {
      await image.decode();
    } catch {
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const drawing = canvas.getContext('2d', { willReadFrequently: true });
    if (!drawing) return;
    drawing.drawImage(image, 0, 0);
    const pixels = drawing.getImageData(0, 0, canvas.width, canvas.height).data;
    const step = 2;
    const scale = Math.min(
      3.4,
      (this.context.viewport.width * 0.72) / Math.max(canvas.width, 1),
    );
    const startX = (this.context.viewport.width - canvas.width * scale) * 0.5;
    const startY = (this.context.viewport.height - canvas.height * scale) * 0.5;
    this.bodies.length = 0;
    this.links.length = 0;
    for (let y = 0; y < canvas.height; y += step) {
      for (let x = 0; x < canvas.width; x += step) {
        const alpha = pixels[(y * canvas.width + x) * 4 + 3] ?? 0;
        if (alpha < 24) continue;
        const body = createBody(
          startX + x * scale,
          startY + y * scale,
          Math.max(1.2, scale),
        );
        body.acceleration.copy(body.position);
        this.bodies.push(body);
      }
    }
  }

  private buildWorms(): void {
    for (let worm = 0; worm < 5; worm += 1) {
      for (let node = 0; node < 14; node += 1) {
        this.bodies.push(
          createBody(
            this.context.viewport.width * 0.22 + node * 19,
            this.context.viewport.height * (0.26 + worm * 0.12),
            4,
          ),
        );
      }
    }
  }

  private buildEditorSeed(): void {
    const { width, height } = this.context.viewport;
    const positions = [
      [-80, -50],
      [0, -90],
      [80, -50],
      [72, 50],
      [0, 90],
      [-72, 50],
    ];
    for (const [x = 0, y = 0] of positions)
      this.bodies.push(createBody(width * 0.5 + x, height * 0.5 + y, 8));
    for (let index = 0; index < this.bodies.length; index += 1) {
      const next = (index + 1) % this.bodies.length;
      this.links.push({
        a: index,
        b: next,
        length: Vector2.distance(
          this.bodies[index]?.position ?? new Vector2(),
          this.bodies[next]?.position ?? new Vector2(),
        ),
        stiffness: 0.9,
      });
    }
  }

  public update(stepScale: number): void {
    this.time += stepScale;
    const id = this.context.definition.id;
    if (id === 'interpolation-rotate') {
      const center = new Vector2(
        this.context.viewport.width * 0.5,
        this.context.viewport.height * 0.5,
      );
      const target = Math.atan2(
        this.context.pointer.position.y - center.y,
        this.context.pointer.position.x - center.x,
      );
      const difference = Math.atan2(
        Math.sin(target - this.rotation),
        Math.cos(target - this.rotation),
      );
      this.rotationVelocity =
        (this.rotationVelocity + difference * 0.035 * stepScale) * 0.91;
      this.rotation += this.rotationVelocity * stepScale;
      return;
    }
    if (id === 'interpolation-trace') return this.updateTrace(stepScale);
    if (id === 'ease-motion-bug') return this.updateWorms(stepScale);
    if (id === 'image-fun') return this.updateImage(stepScale);
    const gravity = id === 'linear-spring-cloth' ? 0.12 : 0.22;
    for (let index = 0; index < this.bodies.length; index += 1) {
      const body = this.bodies[index];
      if (!body) continue;
      body.acceleration.y += gravity;
      integrateVerlet(body, stepScale, id === 'linear-spring-cloth' ? 0.992 : 0.997);
      constrainBounds(body, this.context.viewport.width, this.context.viewport.height);
    }
    if (this.grabbed >= 0) {
      const body = this.bodies[this.grabbed];
      if (body) body.position.copy(this.context.pointer.position);
    }
    for (let iteration = 0; iteration < 5; iteration += 1) {
      for (let index = this.links.length - 1; index >= 0; index -= 1) {
        const link = this.links[index];
        if (!link) continue;
        const a = this.bodies[link.a];
        const b = this.bodies[link.b];
        if (!a || !b) continue;
        const distance = Vector2.distance(a.position, b.position);
        if (link.breakAt !== undefined && distance > link.breakAt) {
          this.links.splice(index, 1);
          continue;
        }
        solveLink(this.bodies, link);
      }
    }
    if (id === 'softbody' || id === 'circle-jelly') {
      for (let left = 0; left < this.bodies.length; left += 1) {
        const a = this.bodies[left];
        if (!a) continue;
        for (let right = left + 1; right < this.bodies.length; right += 1) {
          const b = this.bodies[right];
          if (b) solveBodyPair(a, b, 1);
        }
      }
    }
  }

  private updateTrace(stepScale: number): void {
    const first = this.bodies[0];
    if (!first) return;
    first.position.x +=
      (this.context.pointer.position.x - first.position.x) * 0.32 * stepScale;
    first.position.y +=
      (this.context.pointer.position.y - first.position.y) * 0.32 * stepScale;
    for (let index = 1; index < this.bodies.length; index += 1) {
      const body = this.bodies[index];
      const previous = this.bodies[index - 1];
      if (!body || !previous) continue;
      body.position.x += (previous.position.x - body.position.x) * 0.28 * stepScale;
      body.position.y += (previous.position.y - body.position.y) * 0.28 * stepScale;
    }
  }

  private updateWorms(stepScale: number): void {
    const wormLength = 14;
    for (let worm = 0; worm < 5; worm += 1) {
      const head = this.bodies[worm * wormLength];
      if (!head) continue;
      const offset = new Vector2(
        Math.cos(this.time * 0.012 + worm) * worm * 16,
        Math.sin(this.time * 0.009 + worm) * worm * 12,
      );
      const target = this.context.pointer.position.clone().add(offset);
      head.position.addScaled(
        Vector2.subtract(target, head.position),
        (0.055 + worm * 0.015) * stepScale,
      );
      for (let node = 1; node < wormLength; node += 1) {
        const previous = this.bodies[worm * wormLength + node - 1];
        const body = this.bodies[worm * wormLength + node];
        if (!previous || !body) continue;
        const unit = safeUnit(
          body.position.x - previous.position.x,
          body.position.y - previous.position.y,
        );
        body.position.set(
          previous.position.x + unit.x * 19,
          previous.position.y + unit.y * 19,
        );
      }
    }
  }

  private updateImage(stepScale: number): void {
    const pointer = this.context.pointer.position;
    for (const body of this.bodies) {
      const home = body.acceleration;
      const toHome = new Vector2(home.x - body.position.x, home.y - body.position.y);
      const velocity = Vector2.subtract(body.position, body.previous).scale(0.91);
      body.previous.copy(body.position);
      body.position.addScaled(velocity, stepScale).addScaled(toHome, 0.035 * stepScale);
      const away = safeUnit(body.position.x - pointer.x, body.position.y - pointer.y);
      if (away.length > 0 && away.length < 90)
        body.position.addScaled(away, (90 - away.length) * 0.13);
    }
  }

  public render(): void {
    const graphics = this.graphics.clear();
    const id = this.context.definition.id;
    if (id === 'interpolation-rotate') return this.renderRotate(graphics);
    if (id === 'ease-motion-bug') return this.renderWorms(graphics);
    for (const link of this.links) {
      const a = this.bodies[link.a];
      const b = this.bodies[link.b];
      if (a && b)
        graphics.moveTo(a.position.x, a.position.y).lineTo(b.position.x, b.position.y);
    }
    graphics.stroke({
      color: id === 'cloth-destroy' ? 0x67e8bd : 0x48666f,
      width: id.includes('cloth') ? 1.3 : 3,
      alpha: 0.9,
    });
    for (const body of this.bodies)
      graphics.circle(body.position.x, body.position.y, body.radius);
    graphics.fill({ color: id === 'image-fun' ? 0xffbd71 : 0x91f5cf, alpha: 0.82 });
    if (this.pointerStart && (id === 'cutting-rope' || id === 'cloth-destroy')) {
      graphics
        .moveTo(this.pointerStart.x, this.pointerStart.y)
        .lineTo(this.context.pointer.position.x, this.context.pointer.position.y)
        .stroke({ color: 0xff8d78, width: 3 });
    }
  }

  private renderRotate(graphics: Graphics): void {
    const center = new Vector2(
      this.context.viewport.width * 0.5,
      this.context.viewport.height * 0.5,
    );
    graphics
      .moveTo(center.x, center.y)
      .lineTo(
        center.x + Math.cos(this.rotation) * 145,
        center.y + Math.sin(this.rotation) * 145,
      )
      .stroke({ color: 0x91f5cf, width: 12 });
    graphics
      .moveTo(center.x, center.y)
      .lineTo(this.context.pointer.position.x, this.context.pointer.position.y)
      .stroke({ color: 0xffbd71, width: 2 });
    graphics.circle(center.x, center.y, 12).fill({ color: 0xe8fffb });
  }

  private renderWorms(graphics: Graphics): void {
    const wormLength = 14;
    for (let worm = 0; worm < 5; worm += 1) {
      const first = this.bodies[worm * wormLength];
      if (!first) continue;
      graphics.moveTo(first.position.x, first.position.y);
      for (let node = 1; node < wormLength; node += 1) {
        const body = this.bodies[worm * wormLength + node];
        if (body) graphics.lineTo(body.position.x, body.position.y);
      }
    }
    graphics.stroke({ color: 0x91f5cf, width: 5, alpha: 0.78 });
  }

  public pointerDown(): void {
    const id = this.context.definition.id;
    this.pointerStart = this.context.pointer.position.clone();
    let nearest = -1;
    let nearestDistance = 28;
    this.bodies.forEach((body, index) => {
      const distance = Vector2.distance(body.position, this.context.pointer.position);
      if (distance < nearestDistance) {
        nearest = index;
        nearestDistance = distance;
      }
    });
    this.grabbed = nearest;
    if (id === 'softbody-struct-test' && nearest < 0) {
      const body = createBody(
        this.context.pointer.position.x,
        this.context.pointer.position.y,
        8,
      );
      this.bodies.push(body);
      let closest = -1;
      let distance = 120;
      for (let index = 0; index < this.bodies.length - 1; index += 1) {
        const candidate = this.bodies[index];
        if (!candidate) continue;
        const candidateDistance = Vector2.distance(candidate.position, body.position);
        if (candidateDistance < distance) {
          closest = index;
          distance = candidateDistance;
        }
      }
      if (closest >= 0)
        this.links.push({
          a: closest,
          b: this.bodies.length - 1,
          length: distance,
          stiffness: 0.9,
        });
    }
    if (id === 'circle-jelly') {
      const ball = this.bodies[this.bodies.length - 1];
      if (ball) {
        ball.position.set(this.context.pointer.position.x, 30);
        ball.previous.set(
          ball.position.x - this.random.range(-2, 2),
          ball.position.y - 2,
        );
      }
    }
  }

  public pointerUp(): void {
    const id = this.context.definition.id;
    if (this.pointerStart && (id === 'cutting-rope' || id === 'cloth-destroy')) {
      const end = this.context.pointer.position;
      for (let index = this.links.length - 1; index >= 0; index -= 1) {
        const link = this.links[index];
        if (!link) continue;
        const a = this.bodies[link.a];
        const b = this.bodies[link.b];
        if (a && b && segmentsIntersect(this.pointerStart, end, a.position, b.position))
          this.links.splice(index, 1);
      }
    }
    this.pointerStart = null;
    this.grabbed = -1;
  }

  public resize(viewport: Viewport): void {
    this.context.viewport = viewport;
    for (const body of this.bodies) {
      body.position.x = clamp(
        body.position.x,
        body.radius,
        viewport.width - body.radius,
      );
      body.position.y = clamp(
        body.position.y,
        body.radius,
        viewport.height - body.radius,
      );
    }
  }

  public destroy(): void {
    this.graphics.destroy();
  }
}

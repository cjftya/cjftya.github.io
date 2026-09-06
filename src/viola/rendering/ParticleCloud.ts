import { Particle, ParticleContainer, Texture } from 'pixi.js';
import type { Container } from 'pixi.js';
import type { VectorLike } from '../core/Vector2';

export interface ParticleCloudItem {
  position: Readonly<VectorLike>;
  radius: number;
  color: number;
  alpha?: number;
  rotation?: number;
}

type ParticleTextureKind = 'disc' | 'wheel';

const textures = new Map<ParticleTextureKind, Texture>();

function particleTexture(kind: ParticleTextureKind): Texture {
  const cached = textures.get(kind);
  if (cached) return cached;
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const drawing = canvas.getContext('2d');
  if (!drawing) return Texture.WHITE;
  drawing.strokeStyle = '#ffffff';
  drawing.fillStyle = '#ffffff';
  drawing.lineWidth = 2;
  if (kind === 'disc') {
    drawing.beginPath();
    drawing.arc(16, 16, 15, 0, Math.PI * 2);
    drawing.fill();
  } else {
    drawing.beginPath();
    drawing.arc(16, 16, 14, 0, Math.PI * 2);
    drawing.moveTo(16, 16);
    drawing.lineTo(30, 16);
    drawing.stroke();
  }
  const texture = Texture.from(canvas);
  textures.set(kind, texture);
  return texture;
}

export class ParticleCloud {
  private readonly texture: Texture;
  private readonly container: ParticleContainer<Particle>;
  private readonly views: Particle[];

  public constructor(
    parent: Container,
    items: ReadonlyArray<ParticleCloudItem>,
    kind: ParticleTextureKind,
  ) {
    this.texture = particleTexture(kind);
    this.container = new ParticleContainer<Particle>({
      texture: this.texture,
      dynamicProperties: {
        position: true,
        color: true,
        vertex: true,
        rotation: kind === 'wheel',
      },
    });
    this.views = items.map(() => {
      const view = new Particle({ texture: this.texture, anchorX: 0.5, anchorY: 0.5 });
      this.container.addParticle(view);
      return view;
    });
    parent.addChild(this.container);
    this.sync(items);
  }

  public sync(items: ReadonlyArray<ParticleCloudItem>): void {
    items.forEach((item, index) => {
      const view = this.views[index];
      if (!view) return;
      const scale = (item.radius * 2) / 32;
      view.x = item.position.x;
      view.y = item.position.y;
      view.scaleX = scale;
      view.scaleY = scale;
      view.tint = item.color;
      view.alpha = item.alpha ?? 1;
      view.rotation = item.rotation ?? 0;
    });
  }
}

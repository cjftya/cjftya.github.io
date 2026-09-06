import { PHYSICS_EPSILON, Vector2 } from '../../core/Vector2';

export interface ImagePixel {
  position: Vector2;
  origin: Vector2;
  velocity: Vector2;
  radius: number;
  color: number;
}

export class ImageFunModel {
  public readonly pixels: ImagePixel[];
  private readonly pointer = new Vector2();
  private forceEnabled = false;

  public constructor() {
    this.pixels = [];
    for (let y = 0; y < 71; y += 1) {
      for (let x = 0; x < 100; x += 1) {
        const position = new Vector2(200 + x * 2, 200 + y * 2);
        this.pixels.push({
          position,
          origin: position.clone(),
          velocity: new Vector2(),
          radius: 2,
          color: imageColor(x, y),
        });
      }
    }
  }

  public step(): void {
    for (const pixel of this.pixels) {
      pixel.velocity.add({
        x: (pixel.origin.x - pixel.position.x) * 0.05,
        y: (pixel.origin.y - pixel.position.y) * 0.05,
      });
      if (this.forceEnabled) {
        const dx = this.pointer.x - pixel.position.x;
        const dy = this.pointer.y - pixel.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > PHYSICS_EPSILON) {
          const force = 20 / distance;
          pixel.velocity.add({
            x: -(dx / distance) * force,
            y: -(dy / distance) * force,
          });
        }
      }
      pixel.velocity.scale(0.95);
      pixel.position.add(pixel.velocity);
    }
  }

  public setForce(point: Readonly<Vector2>, enabled: boolean): void {
    this.pointer.copy(point);
    this.forceEnabled = enabled;
  }

  public setPixelColors(colors: ReadonlyArray<number>): void {
    this.pixels.forEach((pixel, index) => {
      const color = colors[index];
      if (color !== undefined) pixel.color = color;
    });
  }
}

function imageColor(x: number, y: number): number {
  const body = ((x - 50) / 48) ** 2 + ((y - 39) / 34) ** 2 < 1;
  const leftEye = (x - 18) ** 2 + (y - 26) ** 2 < 20;
  const rightEye = (x - 45) ** 2 + (y - 26) ** 2 < 32;
  const cheek = ((x - 64) / 10) ** 2 + ((y - 52) / 9) ** 2 < 1;
  if (leftEye || rightEye) return 0x672729;
  if (cheek) return 0xffb7ba;
  if (body) return 0xffe4dc;
  return 0xf2a8ad;
}

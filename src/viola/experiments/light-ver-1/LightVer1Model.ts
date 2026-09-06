import type { Random } from '../../core/Random';
import { PHYSICS_EPSILON, Vector2 } from '../../core/Vector2';

export class LightVer1Model {
  public readonly points = Array.from({ length: 20 }, () => new Vector2());
  public brightness = 10;
  private readonly originals = Array.from({ length: 20 }, () => new Vector2());

  public constructor(private readonly random: Random) {
    this.points[0]?.set(100, 100);
    this.points.at(-1)?.set(300, 300);
    this.rebuild();
  }

  public step(): void {
    this.brightness = this.random.integer(10, 150);
    for (let index = 1; index < this.points.length - 1; index += 1) {
      const original = this.originals[index];
      this.points[index]?.set(
        (original?.x ?? 0) + this.random.integer(-7, 7),
        (original?.y ?? 0) + this.random.integer(-7, 7),
      );
    }
  }

  public relocate(point: Readonly<Vector2>): void {
    this.points.at(-1)?.copy(point);
    this.rebuild();
  }

  private rebuild(): void {
    const start = this.points[0];
    const end = this.points.at(-1);
    if (!start || !end) return;
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const nx = distance > PHYSICS_EPSILON ? dx / distance : 0;
    const ny = distance > PHYSICS_EPSILON ? dy / distance : 0;
    const spacing = distance / (this.points.length - 1);
    this.originals[0]?.copy(start);
    for (let index = 1; index < this.points.length; index += 1) {
      const x = start.x + nx * spacing * index;
      const y = start.y + ny * spacing * index;
      this.points[index]?.set(x, y);
      this.originals[index]?.set(x, y);
    }
  }
}

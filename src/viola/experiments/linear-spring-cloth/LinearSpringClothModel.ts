import { PHYSICS_EPSILON, Vector2 } from '../../core/Vector2';

export class LinearSpringClothModel {
  public readonly rows = 10;
  public readonly columns = 10;
  public readonly positions: Vector2[];
  public readonly velocities: Vector2[];
  private selectedIndex = -1;

  public constructor() {
    this.positions = Array.from(
      { length: 100 },
      (_, index) =>
        new Vector2(10 + (index % 10) * 50, 200 + Math.floor(index / 10) * 50),
    );
    this.velocities = Array.from({ length: 100 }, () => new Vector2());
  }

  public step(): void {
    for (let row = 0; row < this.rows; row += 1) {
      for (let column = 0; column < this.columns; column += 1) {
        const index = this.index(row, column);
        for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
          for (let columnOffset = -1; columnOffset <= 1; columnOffset += 1) {
            if (rowOffset === 0 && columnOffset === 0) continue;
            const nextRow = row + rowOffset;
            const nextColumn = column + columnOffset;
            if (
              nextRow < 0 ||
              nextRow >= this.rows ||
              nextColumn < 0 ||
              nextColumn >= this.columns
            )
              continue;
            this.applySpring(
              index,
              this.index(nextRow, nextColumn),
              rowOffset !== 0 && columnOffset !== 0 ? Math.SQRT2 * 50 : 50,
            );
          }
        }
      }
    }
    this.positions.forEach((position, index) => {
      if (index === this.selectedIndex) return;
      const velocity = this.velocities[index];
      if (!velocity) return;
      velocity.scale(0.955);
      velocity.y += 0.5;
      position.add(velocity);
    });
    this.positions[this.index(0, 0)]?.set(100, 10);
    this.positions[this.index(0, this.columns - 1)]?.set(550, 10);
  }

  public pick(point: Readonly<Vector2>): void {
    this.selectedIndex = this.positions.findIndex(
      (position) => Vector2.distanceSquared(position, point) < 20 * 20,
    );
  }

  public drag(point: Readonly<Vector2>): void {
    this.positions[this.selectedIndex]?.copy(point);
  }

  public release(): void {
    const velocity = this.velocities[this.selectedIndex];
    if (velocity) velocity.set(0, 0);
    this.selectedIndex = -1;
  }

  public keyDown(code: string): void {
    const velocity = this.velocities[this.index(0, 2)];
    if (!velocity) return;
    if (code === 'KeyW') velocity.y -= 15.2;
    else if (code === 'KeyS') velocity.y += 15.2;
  }

  private applySpring(fromIndex: number, toIndex: number, restLength: number): void {
    const from = this.positions[fromIndex];
    const to = this.positions[toIndex];
    const fromVelocity = this.velocities[fromIndex];
    const toVelocity = this.velocities[toIndex];
    if (!from || !to || !fromVelocity || !toVelocity) return;
    const dx = from.x - to.x;
    const dy = from.y - to.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance <= PHYSICS_EPSILON) return;
    const extension = Math.max(0, distance - restLength);
    const response = 0.4 * extension;
    const fx = (dx / distance) * response * 0.5;
    const fy = (dy / distance) * response * 0.5;
    fromVelocity.add({ x: -fx, y: -fy });
    toVelocity.add({ x: fx, y: fy });
  }

  private index(row: number, column: number): number {
    return row * this.columns + column;
  }
}

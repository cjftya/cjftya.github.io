import type { VectorLike } from '../../core/Vector2';

export class UniformGrid {
  private readonly cells = new Map<number, number[]>();
  private readonly columns: number;
  private readonly rows: number;

  public constructor(
    width: number,
    height: number,
    private readonly cellSize: number,
  ) {
    this.columns = Math.max(1, Math.ceil(width / cellSize));
    this.rows = Math.max(1, Math.ceil(height / cellSize));
  }

  public rebuild(points: ReadonlyArray<Readonly<VectorLike>>): void {
    this.cells.clear();
    points.forEach((point, index) => {
      const x = this.cellCoordinate(point.x, this.columns);
      const y = this.cellCoordinate(point.y, this.rows);
      const key = y * this.columns + x;
      const cell = this.cells.get(key);
      if (cell) cell.push(index);
      else this.cells.set(key, [index]);
    });
  }

  public forEachNeighborPair(
    visit: (leftIndex: number, rightIndex: number) => void,
  ): void {
    const forwardNeighbors = [
      [1, 0],
      [-1, 1],
      [0, 1],
      [1, 1],
    ] as const;
    for (const [key, indexes] of this.cells) {
      const cellX = key % this.columns;
      const cellY = Math.floor(key / this.columns);

      for (let left = 0; left < indexes.length; left += 1) {
        const leftIndex = indexes[left];
        if (leftIndex === undefined) continue;
        for (let right = left + 1; right < indexes.length; right += 1) {
          const rightIndex = indexes[right];
          if (rightIndex !== undefined) visit(leftIndex, rightIndex);
        }
      }

      for (const [offsetX, offsetY] of forwardNeighbors) {
        const otherX = cellX + offsetX;
        const otherY = cellY + offsetY;
        if (otherX < 0 || otherX >= this.columns || otherY < 0 || otherY >= this.rows)
          continue;
        const others = this.cells.get(otherY * this.columns + otherX);
        if (!others) continue;
        for (const leftIndex of indexes)
          for (const rightIndex of others) visit(leftIndex, rightIndex);
      }
    }
  }

  private cellCoordinate(value: number, count: number): number {
    return Math.max(0, Math.min(count - 1, Math.floor(value / this.cellSize)));
  }
}

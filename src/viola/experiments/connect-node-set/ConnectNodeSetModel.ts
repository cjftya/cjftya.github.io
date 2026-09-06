import { PHYSICS_EPSILON, Vector2 } from '../../core/Vector2';

export class ConnectNodeSetModel {
  public readonly positions = Array.from(
    { length: 10 },
    (_, index) => new Vector2(300 + index * 30, 300),
  );
  public readonly velocities = Array.from({ length: 10 }, () => new Vector2());
  public readonly length = 30;
  public readonly radius = 10;
  private selectedIndex = 0;
  private selected = false;

  public step(): void {
    this.solveFromSelection();
    for (let index = 0; index < this.positions.length; index += 1) {
      const position = this.positions[index];
      const velocity = this.velocities[index];
      if (!position || !velocity) continue;
      velocity.scale(0.995);
      position.add(velocity);
    }
    this.resolveNodeCollisions();
  }

  public pick(point: Readonly<Vector2>): void {
    const index = this.positions.findIndex(
      (position) => Vector2.distanceSquared(position, point) < this.radius ** 2,
    );
    if (index >= 0) {
      this.selectedIndex = index;
      this.selected = true;
    }
  }

  public drag(point: Readonly<Vector2>): void {
    if (this.selected) this.positions[this.selectedIndex]?.copy(point);
  }

  public release(): void {
    this.selected = false;
  }

  public kickFourth(): void {
    const velocity = this.velocities[3];
    if (velocity) velocity.x += 10;
  }

  private solveFromSelection(): void {
    this.setDistance(this.selectedIndex, this.selectedIndex + 1);
    this.setDistance(this.selectedIndex, this.selectedIndex - 1);
    for (
      let index = this.selectedIndex + 1;
      index < this.positions.length - 1;
      index += 1
    )
      this.setDistance(index, index + 1);
    for (let index = this.selectedIndex - 1; index >= 1; index -= 1)
      this.setDistance(index, index - 1);
  }

  private setDistance(anchorIndex: number, movingIndex: number): void {
    const anchor = this.positions[anchorIndex];
    const moving = this.positions[movingIndex];
    if (!anchor || !moving) return;
    const dx = moving.x - anchor.x;
    const dy = moving.y - anchor.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance <= PHYSICS_EPSILON) return;
    moving.set(
      anchor.x + (dx / distance) * this.length,
      anchor.y + (dy / distance) * this.length,
    );
  }

  private resolveNodeCollisions(): void {
    for (let leftIndex = 0; leftIndex < this.positions.length; leftIndex += 1) {
      const left = this.positions[leftIndex];
      if (!left) continue;
      for (let rightIndex = 0; rightIndex < this.positions.length; rightIndex += 1) {
        if (leftIndex === rightIndex) continue;
        const right = this.positions[rightIndex];
        if (!right) continue;
        const dx = right.x - left.x;
        const dy = right.y - left.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance >= this.radius * 2 || distance <= PHYSICS_EPSILON) continue;
        const depth = (this.radius * 2 - distance) * 0.5;
        const fx = (dx / distance) * depth;
        const fy = (dy / distance) * depth;
        left.x -= fx;
        left.y -= fy;
        right.x += fx;
        right.y += fy;
      }
    }
  }
}

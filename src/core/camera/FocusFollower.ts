import { Vector3 } from 'three';

export class FocusFollower {
  private readonly previousTarget = new Vector3();
  private active = false;

  begin(target: Vector3): void {
    this.previousTarget.copy(target);
    this.active = true;
  }

  update(target: Vector3, movement: Vector3): boolean {
    if (!this.active) {
      return false;
    }

    movement.subVectors(target, this.previousTarget);
    this.previousTarget.copy(target);
    return movement.lengthSq() > 0;
  }

  clear(): void {
    this.active = false;
  }
}

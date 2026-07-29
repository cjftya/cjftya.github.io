import { AmbientLight, Color, Scene } from 'three';
import { SpaceBackdrop } from './SpaceBackdrop';

export class SceneManager {
  readonly scene = new Scene();

  private readonly backdrop = new SpaceBackdrop();

  constructor() {
    this.scene.background = new Color('#050711');
    this.scene.add(new AmbientLight('#7180a8', 0.45), this.backdrop.object);
  }

  update(deltaSeconds: number): void {
    this.backdrop.update(deltaSeconds);
  }

  dispose(): void {
    this.scene.remove(this.backdrop.object);
    this.backdrop.dispose();
  }
}

import { AmbientLight, Color, HemisphereLight, Scene } from 'three';
import { SpaceBackdrop } from './SpaceBackdrop';

export class SceneManager {
  readonly scene = new Scene();

  private readonly backdrop = new SpaceBackdrop();
  private readonly backgroundColor = new Color('#050711');

  constructor() {
    this.scene.background = new Color('#050711');
    this.scene.add(
      new AmbientLight('#7180a8', 0.3),
      new HemisphereLight('#91a8d7', '#17111f', 0.7),
      this.backdrop.object,
    );
  }

  update(deltaSeconds: number): void {
    this.backdrop.update(deltaSeconds);
  }

  setGalaxyColor(color: string): void {
    this.backgroundColor.set('#050711').lerp(new Color(color), 0.075);
    this.scene.background = this.backgroundColor;
  }

  dispose(): void {
    this.scene.remove(this.backdrop.object);
    this.backdrop.dispose();
  }
}

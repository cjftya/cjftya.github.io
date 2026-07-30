import { AmbientLight, Color, HemisphereLight, Scene } from 'three';
import type { Galaxy } from '../../data/Project';
import { SpaceBackdrop } from './SpaceBackdrop';

export class SceneManager {
  readonly scene = new Scene();

  private readonly backdrop = new SpaceBackdrop();
  private readonly backgroundColor = new Color('#050711');
  private readonly targetBackgroundColor = new Color('#050711');

  constructor() {
    this.scene.background = this.backgroundColor;
    this.scene.add(
      new AmbientLight('#7180a8', 0.3),
      new HemisphereLight('#91a8d7', '#17111f', 0.7),
      this.backdrop.object,
    );
  }

  update(deltaSeconds: number): void {
    this.backgroundColor.lerp(
      this.targetBackgroundColor,
      1 - Math.exp(-deltaSeconds * 3.2),
    );
    this.backdrop.update(deltaSeconds);
  }

  setGalaxy(galaxy: Galaxy): void {
    this.targetBackgroundColor
      .set(galaxy.atmosphere.backgroundColor)
      .lerp(new Color(galaxy.color), 0.035);
    this.backdrop.setAtmosphere(galaxy.atmosphere);
  }

  dispose(): void {
    this.scene.remove(this.backdrop.object);
    this.backdrop.dispose();
  }
}

import { AmbientLight, Color, Scene } from 'three';

export class SceneManager {
  readonly scene = new Scene();

  constructor() {
    this.scene.background = new Color('#050711');
    this.scene.add(new AmbientLight('#7180a8', 0.45));
  }
}

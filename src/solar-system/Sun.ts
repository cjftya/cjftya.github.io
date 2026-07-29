import { Mesh, MeshBasicMaterial, PointLight, SphereGeometry, Group } from 'three';

export class Sun {
  readonly object = new Group();

  private readonly geometry = new SphereGeometry(1.15, 32, 24);
  private readonly material = new MeshBasicMaterial({ color: '#ffd28a' });

  constructor() {
    const mesh = new Mesh(this.geometry, this.material);
    const light = new PointLight('#ffe3ba', 90, 80, 1.4);
    this.object.add(mesh, light);
  }

  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}

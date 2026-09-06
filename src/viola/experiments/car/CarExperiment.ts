import { Graphics } from 'pixi.js';
import type { ExperimentContext } from '../../core/Experiment';
import { ReferenceExperiment } from '../common/ReferenceExperiment';
import { CarModel } from './CarModel';

export class CarExperiment extends ReferenceExperiment {
  private readonly graphics = new Graphics();
  private readonly model = new CarModel();

  public constructor(context: ExperimentContext) {
    super(context, { width: 1_000, height: 750 });
    this.scene.addChild(this.graphics);
    context.setHint('A/D로 주행하고 W로 오른쪽 바퀴를 들어 올리세요.');
  }

  protected step(): void {
    this.model.step();
  }

  public render(): void {
    this.graphics.clear();
    for (const link of this.model.links) {
      if (!link.visible) continue;
      const left = this.model.nodes[link.left];
      const right = this.model.nodes[link.right];
      if (left && right)
        this.graphics
          .moveTo(left.position.x, left.position.y)
          .lineTo(right.position.x, right.position.y);
    }
    this.graphics.stroke({ color: 0xe8fffb, width: 2 });
    for (const [index, wheel] of this.model.wheels) {
      const node = this.model.nodes[index];
      if (!node) continue;
      const cosine = Math.cos(wheel.angle) * wheel.radius;
      const sine = Math.sin(wheel.angle) * wheel.radius;
      this.graphics
        .circle(node.position.x, node.position.y, wheel.radius)
        .stroke({ color: 0xe8fffb, width: 2 })
        .moveTo(node.position.x - cosine, node.position.y - sine)
        .lineTo(node.position.x + cosine, node.position.y + sine)
        .stroke({ color: 0x67e8bd, width: 2 });
    }
    const marker = this.model.nodes[3];
    if (marker)
      this.graphics
        .circle(marker.position.x, marker.position.y, 10)
        .fill({ color: 0xffa234 });
    for (const [start, end] of this.model.terrain)
      this.graphics
        .moveTo(start.x, start.y)
        .lineTo(end.x, end.y)
        .stroke({ color: 0xe8fffb, width: 1 });
    this.graphics.moveTo(0, 600).lineTo(1_000, 600).stroke({ color: 0x7c8b92 });
  }

  public keyDown(code: string): void {
    if (code === 'KeyA') this.model.drive(-1);
    else if (code === 'KeyD') this.model.drive(1);
    else if (code === 'KeyW') this.model.jump();
  }
}

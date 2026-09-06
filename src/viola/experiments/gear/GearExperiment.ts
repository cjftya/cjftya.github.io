import { Graphics } from 'pixi.js';
import type { ExperimentContext } from '../../core/Experiment';
import { ReferenceExperiment } from '../common/ReferenceExperiment';
import { GearModel } from './GearModel';

export class GearExperiment extends ReferenceExperiment {
  private readonly graphics = new Graphics();
  private readonly model = new GearModel();

  public constructor(context: ExperimentContext) {
    super(context, { width: 1_000, height: 600 }, 1000 / 30);
    this.scene.addChild(this.graphics);
    context.setHint(
      '포인터로 두 번째 사각형을 옮겨 회전하는 꼭짓점 충돌을 시험하세요.',
    );
  }

  protected step(): void {
    this.model.setPointer(this.pointerInReference());
    this.model.step();
  }

  public render(): void {
    this.graphics.clear();
    for (const body of this.model.bodies) {
      const corners = this.model.corners(body);
      this.graphics.poly(corners).stroke({ color: 0xe8fffb, width: 2 });
      for (const corner of corners)
        this.graphics
          .circle(corner.x, corner.y, this.model.collisionRadius)
          .stroke({ color: 0x67e8bd, width: 1 });
    }
    this.graphics.moveTo(0, 500).lineTo(1_000, 500).stroke({ color: 0x7c8b92 });
  }
}

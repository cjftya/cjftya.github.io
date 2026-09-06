import { Graphics } from 'pixi.js';
import type { ExperimentContext } from '../../core/Experiment';
import { ReferenceExperiment } from '../common/ReferenceExperiment';
import { ClosestPointModel } from './ClosestPointModel';

export class ClosestPointExperiment extends ReferenceExperiment {
  private readonly graphics = new Graphics();
  private readonly model = new ClosestPointModel();

  public constructor(context: ExperimentContext) {
    super(context, { width: 1_000, height: 700 });
    this.scene.addChild(this.graphics);
    context.setHint('포인터를 움직여 고정 선분 위의 최근접점을 확인하세요.');
  }

  protected step(): void {
    this.model.setQuery(this.pointerInReference());
    this.model.step();
  }

  public render(): void {
    this.graphics
      .clear()
      .moveTo(this.model.start.x, this.model.start.y)
      .lineTo(this.model.end.x, this.model.end.y)
      .stroke({ color: 0xe8fffb, width: 2 })
      .moveTo(this.model.query.x, this.model.query.y)
      .lineTo(this.model.closest.x, this.model.closest.y)
      .stroke({ color: 0x4c78ff, width: 1 })
      .circle(this.model.closest.x, this.model.closest.y, 5)
      .stroke({ color: 0xe8fffb, width: 2 });
  }
}

import { Graphics } from 'pixi.js';
import type { ExperimentContext } from '../../core/Experiment';
import { ReferenceExperiment } from '../common/ReferenceExperiment';
import { SatModel } from './SatModel';

export class SatExperiment extends ReferenceExperiment {
  private readonly graphics = new Graphics();
  private readonly model = new SatModel();

  public constructor(context: ExperimentContext) {
    super(context, { width: 1_000, height: 700 });
    this.scene.addChild(this.graphics);
    context.setHint('포인터로 두 번째 오각형을 옮기고 클릭해 회전 속도를 더하세요.');
  }

  protected step(): void {
    this.model.moveSecond(this.pointerInReference());
    this.model.step();
  }

  public render(): void {
    const color = this.model.intersect ? 0xff665e : 0xe8fffb;
    this.graphics
      .clear()
      .poly(this.model.vertices(this.model.first))
      .closePath()
      .stroke({ color, width: 2 })
      .poly(this.model.vertices(this.model.second))
      .closePath()
      .stroke({ color, width: 2 });
  }

  public pointerDown(): void {
    this.model.spinSecond();
  }
}

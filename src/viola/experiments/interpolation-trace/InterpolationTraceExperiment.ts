import { Graphics } from 'pixi.js';
import type { ExperimentContext } from '../../core/Experiment';
import { ReferenceExperiment } from '../common/ReferenceExperiment';
import { InterpolationTraceModel } from './InterpolationTraceModel';

export class InterpolationTraceExperiment extends ReferenceExperiment {
  private readonly graphics = new Graphics();
  private readonly model = new InterpolationTraceModel();

  public constructor(context: ExperimentContext) {
    super(context, { width: 1_000, height: 700 }, 1_000 / 30);
    this.scene.addChild(this.graphics);
    context.setHint('포인터를 움직이면 20개 노드가 앞 노드 위치의 90%를 따라갑니다.');
  }

  protected step(): void {
    this.model.step();
  }

  public render(): void {
    const first = this.model.positions[0];
    this.graphics.clear();
    if (first) this.graphics.moveTo(first.x, first.y);
    for (const point of this.model.positions.slice(1))
      this.graphics.lineTo(point.x, point.y);
    this.graphics.stroke({ color: 0xff5757, width: 2 });
  }

  public pointerMove(): void {
    this.model.attach(this.pointerInReference());
  }
}

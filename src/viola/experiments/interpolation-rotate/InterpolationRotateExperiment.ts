import { Graphics } from 'pixi.js';
import type { ExperimentContext } from '../../core/Experiment';
import { ReferenceExperiment } from '../common/ReferenceExperiment';
import { InterpolationRotateModel } from './InterpolationRotateModel';

export class InterpolationRotateExperiment extends ReferenceExperiment {
  private readonly graphics = new Graphics();
  private readonly model = new InterpolationRotateModel();

  public constructor(context: ExperimentContext) {
    super(context, { width: 800, height: 700 }, 1_000 / 30);
    this.scene.addChild(this.graphics);
    context.setHint(
      '사각형을 잡아 끌면 이동 속도와 함께 각도가 0.75rad로 스프링 보간됩니다.',
    );
  }

  protected step(): void {
    this.model.step();
  }

  public render(): void {
    const corners = this.model.corners();
    const first = corners[0];
    this.graphics.clear();
    if (first) this.graphics.moveTo(first.x, first.y);
    for (const corner of corners.slice(1)) this.graphics.lineTo(corner.x, corner.y);
    if (first) this.graphics.lineTo(first.x, first.y);
    this.graphics.fill({ color: 0xff5757 });
  }

  public pointerDown(): void {
    this.model.pick(this.pointerInReference());
  }

  public pointerMove(): void {
    if (this.context.pointer.pressed) this.model.drag(this.pointerInReference());
  }

  public pointerUp(): void {
    this.model.release();
  }
}

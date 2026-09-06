import { Graphics } from 'pixi.js';
import type { ExperimentContext } from '../../core/Experiment';
import { ReferenceExperiment } from '../common/ReferenceExperiment';
import { BoxThrowingModel } from './BoxThrowingModel';

export class BoxThrowingExperiment extends ReferenceExperiment {
  private readonly graphics = new Graphics();
  private readonly model = new BoxThrowingModel();

  public constructor(context: ExperimentContext) {
    super(context, { width: 1_000, height: 700 }, 1000 / 30);
    this.scene.addChild(this.graphics);
    context.setHint('상자 중심을 잡고 드래그해 이동·회전 속도를 더한 뒤 놓으세요.');
  }

  protected step(): void {
    this.model.step();
  }

  public render(): void {
    this.graphics.clear().poly(this.model.corners()).fill({ color: 0xff4b4b });
  }

  public pointerDown(): void {
    this.model.pick(this.pointerInReference());
  }

  public pointerMove(): void {
    this.model.drag(this.pointerInReference());
  }

  public pointerUp(): void {
    this.model.release();
  }
}

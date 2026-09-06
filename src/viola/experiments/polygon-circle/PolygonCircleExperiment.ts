import { Graphics } from 'pixi.js';
import type { ExperimentContext } from '../../core/Experiment';
import { ReferenceExperiment } from '../common/ReferenceExperiment';
import { PolygonCircleModel } from './PolygonCircleModel';

export class PolygonCircleExperiment extends ReferenceExperiment {
  private readonly graphics = new Graphics();
  private readonly model = new PolygonCircleModel();

  public constructor(context: ExperimentContext) {
    super(context, { width: 1_000, height: 750 });
    this.scene.addChild(this.graphics);
    context.setHint('원을 드래그해 회전 사각형의 면과 꼭짓점 접촉을 시험하세요.');
  }

  protected step(): void {
    this.model.step();
  }

  public render(): void {
    this.graphics
      .clear()
      .poly(this.model.vertices())
      .closePath()
      .stroke({ color: 0xe8fffb, width: 2 })
      .circle(
        this.model.circlePosition.x,
        this.model.circlePosition.y,
        this.model.circleRadius,
      )
      .stroke({ color: 0x67e8bd, width: 2 })
      .circle(this.model.contact.x, this.model.contact.y, 3)
      .fill({ color: 0xff4b4b });
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

  public keyDown(code: string): void {
    this.model.keyDown(code);
  }
}

import { Graphics } from 'pixi.js';
import type { ExperimentContext } from '../../core/Experiment';
import { ReferenceExperiment } from '../common/ReferenceExperiment';
import { FigureModel } from './FigureModel';

export class FigureExperiment extends ReferenceExperiment {
  private readonly graphics = new Graphics();
  private readonly model = new FigureModel();

  public constructor(context: ExperimentContext) {
    super(context, { width: 1_000, height: 750 });
    this.scene.addChild(this.graphics);
    context.setHint('11개 관절 중 하나를 드래그해 래그돌의 거리 제약을 변형하세요.');
  }

  protected step(): void {
    this.model.step();
  }

  public render(): void {
    this.graphics.clear();
    for (const link of this.model.links) {
      if (!link.alive) continue;
      const from = this.model.nodes[link.from];
      const to = this.model.nodes[link.to];
      if (from && to)
        this.graphics
          .moveTo(from.position.x, from.position.y)
          .lineTo(to.position.x, to.position.y);
    }
    this.graphics.stroke({ color: 0xe8fffb, width: 3 });
    const head = this.model.nodes[0];
    if (head)
      this.graphics
        .circle(head.position.x, head.position.y, this.model.headRadius)
        .fill({ color: 0xe8fffb });
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

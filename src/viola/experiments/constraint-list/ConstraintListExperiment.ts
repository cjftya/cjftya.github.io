import { Graphics } from 'pixi.js';
import type { ExperimentContext } from '../../core/Experiment';
import { Random } from '../../core/Random';
import { ReferenceExperiment } from '../common/ReferenceExperiment';
import { ConstraintListModel } from './ConstraintListModel';

export class ConstraintListExperiment extends ReferenceExperiment {
  private readonly graphics = new Graphics();
  private readonly model: ConstraintListModel;

  public constructor(context: ExperimentContext) {
    super(context, { width: 1_000, height: 650 });
    this.model = new ConstraintListModel(new Random(context.definition.seed));
    this.scene.addChild(this.graphics);
    context.setHint('노드를 드래그해 150px 거리 제약과 0.5rad 각도 제약을 확인하세요.');
  }

  protected step(): void {
    this.model.step();
  }

  public render(): void {
    this.graphics.clear();
    for (const link of this.model.links) {
      const from = this.model.nodes[link.from];
      const to = this.model.nodes[link.to];
      if (from && to)
        this.graphics
          .moveTo(from.position.x, from.position.y)
          .lineTo(to.position.x, to.position.y);
    }
    this.graphics.stroke({ color: 0xe8fffb, width: 2 });
    for (const node of this.model.nodes)
      this.graphics
        .circle(node.position.x, node.position.y, 5)
        .fill({ color: node.fixed ? 0xff6868 : 0xffffff });
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

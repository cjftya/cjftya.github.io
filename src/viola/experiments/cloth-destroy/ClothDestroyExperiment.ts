import { Graphics } from 'pixi.js';
import type { ExperimentContext } from '../../core/Experiment';
import { ReferenceExperiment } from '../common/ReferenceExperiment';
import { ClothDestroyModel } from './ClothDestroyModel';

export class ClothDestroyExperiment extends ReferenceExperiment {
  private readonly graphics = new Graphics();
  private readonly model = new ClothDestroyModel();

  public constructor(context: ExperimentContext) {
    super(context, { width: 800, height: 650 });
    this.scene.addChild(this.graphics);
    context.setHint(
      '5×5 천의 노드를 잡아당기세요. 연결은 원래 길이보다 80px 늘어나면 찢어집니다.',
    );
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
    this.graphics.stroke({ color: 0xe8fffb, width: 1 });
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

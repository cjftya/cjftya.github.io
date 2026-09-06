import { Graphics } from 'pixi.js';
import type { ExperimentContext } from '../../core/Experiment';
import { ReferenceExperiment } from '../common/ReferenceExperiment';
import { CuttingRopeModel } from './CuttingRopeModel';

export class CuttingRopeExperiment extends ReferenceExperiment {
  private readonly graphics = new Graphics();
  private readonly model = new CuttingRopeModel();

  public constructor(context: ExperimentContext) {
    super(context, { width: 1_000, height: 750 });
    this.scene.addChild(this.graphics);
    context.setHint(
      '로프 노드를 잡아 35px 이상 늘리면 잡은 노드 앞의 연결이 끊어집니다.',
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
    this.graphics.stroke({ color: 0xe8fffb, width: 3 });
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

import { Graphics } from 'pixi.js';
import type { ExperimentContext } from '../../core/Experiment';
import { ReferenceExperiment } from '../common/ReferenceExperiment';
import { SoftbodyModel } from './SoftbodyModel';

export class SoftbodyExperiment extends ReferenceExperiment {
  private readonly graphics = new Graphics();
  private readonly model = new SoftbodyModel();

  public constructor(context: ExperimentContext) {
    super(context, { width: 1_300, height: 750 });
    this.scene.addChild(this.graphics);
    context.setHint('빨간 노드를 눌러 드래그하며 거리 제약의 움직임을 확인하세요.');
  }

  protected step(): void {
    this.model.step();
  }

  public render(): void {
    this.graphics.clear().rect(0, 0, 1_300, 750).stroke({ color: 0x31434b, width: 2 });
    for (const link of this.model.links) {
      const left = this.model.nodes[link.left];
      const right = this.model.nodes[link.right];
      if (!left || !right) continue;
      this.graphics
        .moveTo(left.position.x, left.position.y)
        .lineTo(right.position.x, right.position.y);
    }
    this.graphics.stroke({ color: 0xe8fffb, width: 3 });
    for (const node of this.model.nodes)
      this.graphics
        .circle(node.position.x, node.position.y, 5)
        .fill({ color: 0xff665e });
  }

  public pointerDown(): void {
    this.model.pick(this.pointerInReference());
  }

  public pointerMove(): void {
    if (this.context.pointer.pressed)
      this.model.moveSelected(this.pointerInReference());
  }

  public pointerUp(): void {
    this.model.release();
  }
}

import { Graphics } from 'pixi.js';
import type { ExperimentContext } from '../../core/Experiment';
import { ReferenceExperiment } from '../common/ReferenceExperiment';
import { CircleJellyModel } from './CircleJellyModel';

export class CircleJellyExperiment extends ReferenceExperiment {
  private readonly graphics = new Graphics();
  private readonly model = new CircleJellyModel();

  public constructor(context: ExperimentContext) {
    super(context, { width: 700, height: 600 }, 1_000 / 30);
    this.scene.addChild(this.graphics);
    context.setHint('링 노드를 드래그하거나 방향키로 전체 링과 앵커에 충격을 주세요.');
  }

  protected step(): void {
    this.model.step();
  }

  public render(): void {
    this.graphics.clear();
    for (let index = 0; index < this.model.nodes.length; index += 1) {
      const node = this.model.nodes[index];
      const next = this.model.nodes[(index + 1) % this.model.nodes.length];
      if (node && next)
        this.graphics
          .moveTo(node.position.x, node.position.y)
          .lineTo(next.position.x, next.position.y);
    }
    this.graphics.stroke({ color: 0xe8fffb, width: 1 });
    for (const node of this.model.nodes)
      this.graphics
        .circle(node.position.x, node.position.y, node.radius)
        .stroke({ color: 0xe8fffb, width: 1 });
    this.graphics
      .circle(
        this.model.collider.position.x,
        this.model.collider.position.y,
        this.model.collider.radius,
      )
      .stroke({ color: 0xff746c, width: 2 });
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

  public keyDown(code: string): void {
    this.model.keyDown(code);
  }
}

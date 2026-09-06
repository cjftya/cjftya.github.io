import { Graphics } from 'pixi.js';
import type { ExperimentContext } from '../../core/Experiment';
import { ReferenceExperiment } from '../common/ReferenceExperiment';
import { SoftbodyStructTestModel } from './SoftbodyStructTestModel';

export class SoftbodyStructTestExperiment extends ReferenceExperiment {
  private readonly graphics = new Graphics();
  private readonly model = new SoftbodyStructTestModel();

  public constructor(context: ExperimentContext) {
    super(context, { width: 1_440, height: 750 });
    this.scene.addChild(this.graphics);
    context.setHint(
      '1: 점 추가 · F: 고정점 편집 · 2: 연결 · 3: 시뮬레이션/드래그 · C: 절단 · G: 중력 · R: 초기화',
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
    if (this.model.pointsVisible) {
      for (const node of this.model.nodes)
        this.graphics
          .circle(node.position.x, node.position.y, 5)
          .fill({ color: node.fixed ? 0xffdf57 : 0xff5757 });
    }
    this.graphics
      .moveTo(0, 750)
      .lineTo(1_440, 750)
      .lineTo(1_440, 0)
      .stroke({ color: 0xe8fffb, width: 1 });
  }

  public pointerDown(): void {
    this.model.pointerDown(this.pointerInReference());
  }

  public pointerMove(): void {
    if (this.context.pointer.pressed) this.model.drag(this.pointerInReference());
  }

  public pointerUp(): void {
    this.model.pointerUp(this.pointerInReference());
  }

  public keyDown(code: string): void {
    this.model.keyDown(code);
  }
}

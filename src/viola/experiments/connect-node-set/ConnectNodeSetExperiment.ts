import { Graphics } from 'pixi.js';
import type { ExperimentContext } from '../../core/Experiment';
import { ReferenceExperiment } from '../common/ReferenceExperiment';
import { ConnectNodeSetModel } from './ConnectNodeSetModel';

export class ConnectNodeSetExperiment extends ReferenceExperiment {
  private readonly graphics = new Graphics();
  private readonly model = new ConnectNodeSetModel();

  public constructor(context: ExperimentContext) {
    super(context, { width: 1_000, height: 700 }, 1000 / 30);
    this.scene.addChild(this.graphics);
    context.setHint(
      '노드를 드래그해 30px 체인을 움직이고 A로 네 번째 노드를 밀어보세요.',
    );
  }

  protected step(): void {
    this.model.step();
  }

  public render(): void {
    this.graphics.clear();
    for (let index = 0; index < this.model.positions.length - 1; index += 1) {
      const left = this.model.positions[index];
      const right = this.model.positions[index + 1];
      if (left && right) this.graphics.moveTo(left.x, left.y).lineTo(right.x, right.y);
    }
    this.graphics.stroke({ color: 0xe8fffb, width: 3 });
    for (const position of this.model.positions)
      this.graphics
        .circle(position.x, position.y, this.model.radius)
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
    if (code === 'KeyA') this.model.kickFourth();
  }
}

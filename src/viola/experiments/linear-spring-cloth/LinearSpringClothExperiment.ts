import { Graphics } from 'pixi.js';
import type { ExperimentContext } from '../../core/Experiment';
import { ReferenceExperiment } from '../common/ReferenceExperiment';
import { LinearSpringClothModel } from './LinearSpringClothModel';

export class LinearSpringClothExperiment extends ReferenceExperiment {
  private readonly graphics = new Graphics();
  private readonly model = new LinearSpringClothModel();

  public constructor(context: ExperimentContext) {
    super(context, { width: 700, height: 750 });
    this.scene.addChild(this.graphics);
    context.setHint(
      '10×10 질점 하나를 드래그하거나 W/S로 윗줄 세 번째 점에 충격을 주세요.',
    );
  }

  protected step(): void {
    this.model.step();
  }

  public render(): void {
    this.graphics.clear();
    for (let row = 0; row < this.model.rows; row += 1) {
      for (let column = 0; column < this.model.columns - 1; column += 1) {
        const from = this.model.positions[row * this.model.columns + column];
        const to = this.model.positions[row * this.model.columns + column + 1];
        if (from && to) this.graphics.moveTo(from.x, from.y).lineTo(to.x, to.y);
      }
    }
    for (let row = 0; row < this.model.rows - 1; row += 1) {
      for (let column = 0; column < this.model.columns; column += 1) {
        const from = this.model.positions[row * this.model.columns + column];
        const to = this.model.positions[(row + 1) * this.model.columns + column];
        if (from && to) this.graphics.moveTo(from.x, from.y).lineTo(to.x, to.y);
      }
    }
    this.graphics.stroke({ color: 0xe8fffb, width: 2 });
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

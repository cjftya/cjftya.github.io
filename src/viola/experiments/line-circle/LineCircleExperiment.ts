import { Graphics } from 'pixi.js';
import type { ExperimentContext } from '../../core/Experiment';
import { ReferenceExperiment } from '../common/ReferenceExperiment';
import { LineCircleModel } from './LineCircleModel';

export class LineCircleExperiment extends ReferenceExperiment {
  private readonly graphics = new Graphics();
  private readonly model = new LineCircleModel();

  public constructor(context: ExperimentContext) {
    super(context, { width: 1_000, height: 820 });
    this.scene.addChild(this.graphics);
    context.setHint('클릭해 공을 옮기고 WASD로 가속하며 Q/E로 dt를 바꾸세요.');
  }

  protected step(): void {
    this.model.step();
  }

  public render(): void {
    this.graphics.clear();
    for (const line of this.model.lines)
      this.graphics.moveTo(line.start.x, line.start.y).lineTo(line.end.x, line.end.y);
    this.graphics
      .stroke({ color: 0xe8fffb, width: 1 })
      .circle(this.model.position.x, this.model.position.y, this.model.radius)
      .fill({ color: 0xff4b4b });
  }

  public pointerDown(): void {
    this.model.reset(this.pointerInReference());
  }

  public keyDown(code: string): void {
    this.model.keyDown(code);
  }
}

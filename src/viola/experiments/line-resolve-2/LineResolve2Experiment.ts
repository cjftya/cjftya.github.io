import { Graphics } from 'pixi.js';
import type { ExperimentContext } from '../../core/Experiment';
import { ReferenceExperiment } from '../common/ReferenceExperiment';
import { LineResolve2Model } from './LineResolve2Model';

export class LineResolve2Experiment extends ReferenceExperiment {
  private readonly graphics = new Graphics();
  private readonly model = new LineResolve2Model();

  public constructor(context: ExperimentContext) {
    super(context, { width: 1_000, height: 1_000 });
    this.scene.addChild(this.graphics);
    context.setHint('클릭해 공을 재배치하고 WASD로 선분을 통과시켜 보세요.');
  }

  protected step(): void {
    this.model.step();
  }

  public render(): void {
    this.graphics
      .clear()
      .moveTo(this.model.start.x, this.model.start.y)
      .lineTo(this.model.end.x, this.model.end.y)
      .stroke({ color: 0x4c78ff, width: 2 })
      .circle(this.model.position.x, this.model.position.y, this.model.radius)
      .stroke({ color: 0x4c78ff, width: 2 })
      .circle(this.model.closest.x, this.model.closest.y, 10)
      .fill({ color: 0xff4b4b });
  }

  public pointerDown(): void {
    this.model.reset(this.pointerInReference());
  }

  public keyDown(code: string): void {
    this.model.keyDown(code);
  }
}

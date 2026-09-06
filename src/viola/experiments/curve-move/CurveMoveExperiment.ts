import { Graphics } from 'pixi.js';
import type { ExperimentContext } from '../../core/Experiment';
import { ReferenceExperiment } from '../common/ReferenceExperiment';
import { CurveMoveModel } from './CurveMoveModel';

export class CurveMoveExperiment extends ReferenceExperiment {
  private readonly graphics = new Graphics();
  private readonly model = new CurveMoveModel();

  public constructor(context: ExperimentContext) {
    super(context, { width: 600, height: 600 }, 1_000 / 30);
    this.scene.addChild(this.graphics);
    context.setHint(
      'A/D로 곡선 위를 이동하고 W로 점프하세요. 키를 놓으면 수평 속도가 멈춥니다.',
    );
  }

  protected step(): void {
    this.model.step();
  }

  public render(): void {
    this.graphics.clear().moveTo(0, this.model.curve[0] ?? 0);
    for (let x = 1; x < this.model.curve.length; x += 1)
      this.graphics.lineTo(x, this.model.curve[x] ?? 0);
    this.graphics
      .stroke({ color: 0xe8fffb, width: 1 })
      .rect(this.model.position.x - 10, this.model.position.y - 10, 20, 20)
      .stroke({ color: 0xff7a6f, width: 2 });
  }

  public keyDown(code: string): void {
    this.model.keyDown(code);
  }

  public keyUp(): void {
    this.model.keyUp();
  }
}

import { Graphics } from 'pixi.js';
import type { ExperimentContext } from '../../core/Experiment';
import { ReferenceExperiment } from '../common/ReferenceExperiment';
import { TimeScalingModel } from './TimeScalingModel';

export class TimeScalingExperiment extends ReferenceExperiment {
  private readonly graphics = new Graphics();
  private readonly model = new TimeScalingModel();

  public constructor(context: ExperimentContext) {
    super(context, { width: 1_000, height: 700 });
    this.scene.addChild(this.graphics);
    context.setHint('클릭하면 오른쪽 속도를 더하고, A/S로 시간 배율을 바꿉니다.');
  }

  protected step(): void {
    this.model.step();
  }

  public render(): void {
    this.graphics
      .clear()
      .rect(0, 0, 1_000, 700)
      .stroke({ color: 0x31434b, width: 2 })
      .circle(this.model.position.x, this.model.position.y, this.model.radius)
      .fill({ color: 0xff4b4b });
  }

  public pointerDown(): void {
    this.model.addHorizontalImpulse();
  }

  public keyDown(code: string): void {
    if (code === 'KeyA') this.model.changeTimeScale(0.01);
    else if (code === 'KeyS') this.model.changeTimeScale(-0.01);
  }
}

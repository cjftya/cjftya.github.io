import { Graphics } from 'pixi.js';
import type { ExperimentContext } from '../../core/Experiment';
import { Random } from '../../core/Random';
import { ReferenceExperiment } from '../common/ReferenceExperiment';
import { EaseMotionBugModel } from './EaseMotionBugModel';

export class EaseMotionBugExperiment extends ReferenceExperiment {
  private readonly graphics = new Graphics();
  private readonly model: EaseMotionBugModel;

  public constructor(context: ExperimentContext) {
    super(context, { width: 1_000, height: 700 }, 1_000 / 30);
    this.model = new EaseMotionBugModel(new Random(context.definition.seed));
    this.scene.addChild(this.graphics);
    context.setHint(
      '원본 입력값을 대표하는 8마리·18절점 추종 체인의 이징 오차를 관찰하세요.',
    );
  }

  protected step(): void {
    this.model.step();
  }

  public render(): void {
    this.graphics.clear();
    for (const bug of this.model.bugs) {
      const first = bug.positions[0];
      if (first) this.graphics.moveTo(first.x, first.y);
      for (const point of bug.positions.slice(1))
        this.graphics.lineTo(point.x, point.y);
      this.graphics.stroke({ color: bug.color, width: 4 });
      for (const point of bug.positions)
        this.graphics.circle(point.x, point.y, 5).fill({ color: bug.color });
    }
  }
}

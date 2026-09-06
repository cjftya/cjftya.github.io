import { Graphics } from 'pixi.js';
import type { ExperimentContext } from '../../core/Experiment';
import { ReferenceExperiment } from '../common/ReferenceExperiment';
import { GasketModel } from './GasketModel';

export class GasketExperiment extends ReferenceExperiment {
  private readonly graphics = new Graphics();
  private readonly model = new GasketModel();

  public constructor(context: ExperimentContext) {
    super(context, { width: 1_000, height: 720 });
    this.scene.addChild(this.graphics);
    context.setHint('깊이 5의 재귀 삼각형 분할을 그대로 표시합니다.');
  }

  protected step(): void {
    this.model.step();
  }

  public render(): void {
    this.graphics.clear();
    for (const triangle of this.model.triangles) {
      this.graphics
        .moveTo(triangle.a.x, triangle.a.y)
        .lineTo(triangle.b.x, triangle.b.y)
        .lineTo(triangle.c.x, triangle.c.y)
        .closePath();
    }
    this.graphics.stroke({ color: 0xe8fffb, width: 1 });
  }
}

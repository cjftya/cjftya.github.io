import { Graphics } from 'pixi.js';
import type { ExperimentContext } from '../../core/Experiment';
import { ReferenceExperiment } from '../common/ReferenceExperiment';
import { VectorRadiansModel } from './VectorRadiansModel';

export class VectorRadiansExperiment extends ReferenceExperiment {
  private readonly graphics = new Graphics();
  private readonly model = new VectorRadiansModel();

  public constructor(context: ExperimentContext) {
    super(context, { width: 1_000, height: 700 });
    this.scene.addChild(this.graphics);
    context.setHint('클릭해 목표를 정하고 A/D로 도형을 1도씩 회전하세요.');
  }

  protected step(): void {
    this.model.step();
  }

  public render(): void {
    const points = this.model.vertices.map((point) => ({ x: point.x, y: point.y }));
    this.graphics
      .clear()
      .poly(points)
      .fill({ color: 0xff4b4b })
      .circle(this.model.position.x, this.model.position.y, 3)
      .fill({ color: 0xffe45c })
      .circle(this.model.target.x, this.model.target.y, 5)
      .fill({ color: 0x4c78ff });
  }

  public pointerDown(): void {
    this.model.setTarget(this.pointerInReference());
  }

  public keyDown(code: string): void {
    if (code === 'KeyA') this.model.rotateDegrees(-1);
    else if (code === 'KeyD') this.model.rotateDegrees(1);
  }
}

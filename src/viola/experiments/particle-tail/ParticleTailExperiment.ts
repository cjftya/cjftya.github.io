import { Graphics } from 'pixi.js';
import type { ExperimentContext } from '../../core/Experiment';
import { ReferenceExperiment } from '../common/ReferenceExperiment';
import { ParticleTailModel } from './ParticleTailModel';

export class ParticleTailExperiment extends ReferenceExperiment {
  private readonly graphics = new Graphics();
  private readonly model = new ParticleTailModel();

  public constructor(context: ExperimentContext) {
    super(context, { width: 900, height: 700 });
    this.scene.addChild(this.graphics);
    context.setHint('WASD로 4px 공에 속도를 더해 짧은 이동 궤적을 확인하세요.');
  }

  protected step(): void {
    this.model.step();
  }

  public render(): void {
    this.graphics
      .clear()
      .moveTo(this.model.previous.x, this.model.previous.y)
      .lineTo(this.model.position.x, this.model.position.y)
      .stroke({ color: 0xff4b4b, width: this.model.radius })
      .circle(this.model.position.x, this.model.position.y, this.model.radius)
      .fill({ color: 0xff4b4b });
  }

  public keyDown(code: string): void {
    this.model.keyDown(code);
  }
}

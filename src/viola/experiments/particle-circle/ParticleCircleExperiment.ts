import type { ExperimentContext } from '../../core/Experiment';
import { Random } from '../../core/Random';
import { ParticleCloud } from '../../rendering/ParticleCloud';
import { ReferenceExperiment } from '../common/ReferenceExperiment';
import { ParticleCircleModel } from './ParticleCircleModel';

export class ParticleCircleExperiment extends ReferenceExperiment {
  private readonly model: ParticleCircleModel;
  private readonly cloud: ParticleCloud;

  public constructor(context: ExperimentContext) {
    super(context, { width: 1_000, height: 700 });
    this.model = new ParticleCircleModel(new Random(context.definition.seed));
    this.cloud = new ParticleCloud(this.scene, this.model.particles, 'disc');
    context.setHint('누른 지점 주위로 입자가 모이고, 놓으면 바깥 고리로 흩어집니다.');
  }

  protected step(): void {
    this.model.step();
  }

  public render(): void {
    this.cloud.sync(this.model.particles);
  }

  public pointerDown(): void {
    this.model.press(this.pointerInReference());
  }

  public pointerUp(): void {
    this.model.release();
  }
}

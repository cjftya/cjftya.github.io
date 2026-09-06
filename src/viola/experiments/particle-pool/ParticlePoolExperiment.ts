import type { ExperimentContext } from '../../core/Experiment';
import { Random } from '../../core/Random';
import { ParticleCloud } from '../../rendering/ParticleCloud';
import { ReferenceExperiment } from '../common/ReferenceExperiment';
import { ParticlePoolModel } from './ParticlePoolModel';

export class ParticlePoolExperiment extends ReferenceExperiment {
  private readonly model: ParticlePoolModel;
  private readonly cloud: ParticleCloud;

  public constructor(context: ExperimentContext) {
    super(context, { width: 1_000, height: 700 }, 1000 / 30);
    this.model = new ParticlePoolModel(new Random(context.definition.seed));
    this.cloud = new ParticleCloud(this.scene, this.model.particles, 'disc');
    context.setHint('클릭할 때마다 200개 풀에서 20개 입자를 재사용해 폭발시킵니다.');
  }

  protected step(): void {
    this.model.step();
  }

  public render(): void {
    this.cloud.sync(this.model.particles);
  }

  public pointerDown(): void {
    this.model.burst(this.pointerInReference());
  }
}

import type { ExperimentContext } from '../../core/Experiment';
import { Random } from '../../core/Random';
import { ParticleCloud } from '../../rendering/ParticleCloud';
import { ReferenceExperiment } from '../common/ReferenceExperiment';
import { RealitySnowModel } from './RealitySnowModel';

export class RealitySnowExperiment extends ReferenceExperiment {
  private readonly model: RealitySnowModel;
  private readonly cloud: ParticleCloud;

  public constructor(context: ExperimentContext) {
    super(context, { width: 1_200, height: 800 });
    this.model = new RealitySnowModel(new Random(context.definition.seed));
    this.cloud = new ParticleCloud(this.scene, this.model.snow, 'disc');
    context.setHint('A/D로 전체 눈송이에 적용되는 바람을 0.1씩 바꾸세요.');
  }

  protected step(): void {
    this.model.step();
  }

  public render(): void {
    this.cloud.sync(this.model.snow);
  }

  public keyDown(code: string): void {
    this.model.keyDown(code);
  }
}

import type { ExperimentContext } from '../../core/Experiment';
import { Random } from '../../core/Random';
import { ParticleCloud } from '../../rendering/ParticleCloud';
import { ReferenceExperiment } from '../common/ReferenceExperiment';
import { ParticleMouseModel } from './ParticleMouseModel';

export class ParticleMouseExperiment extends ReferenceExperiment {
  private readonly model: ParticleMouseModel;
  private readonly cloud: ParticleCloud;

  public constructor(context: ExperimentContext) {
    super(context, { width: 1_000, height: 700 });
    this.model = new ParticleMouseModel(new Random(context.definition.seed));
    this.cloud = new ParticleCloud(this.scene, this.model.particles, 'disc');
    context.setHint(
      '포인터를 누른 채 움직이면 이벤트마다 풀의 입자 하나가 생성됩니다.',
    );
  }

  protected step(): void {
    this.model.step();
  }

  public render(): void {
    this.cloud.sync(this.model.particles);
  }

  public pointerMove(): void {
    if (this.context.pointer.pressed) this.model.emit(this.pointerInReference());
  }
}

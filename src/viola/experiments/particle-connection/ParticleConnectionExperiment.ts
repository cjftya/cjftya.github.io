import type { ExperimentContext } from '../../core/Experiment';
import { Random } from '../../core/Random';
import { ParticleCloud } from '../../rendering/ParticleCloud';
import { ReferenceExperiment } from '../common/ReferenceExperiment';
import { ParticleConnectionModel } from './ParticleConnectionModel';

export class ParticleConnectionExperiment extends ReferenceExperiment {
  private readonly model: ParticleConnectionModel;
  private readonly cloud: ParticleCloud;

  public constructor(context: ExperimentContext) {
    super(context, { width: 700, height: 700 });
    this.model = new ParticleConnectionModel(new Random(context.definition.seed));
    this.cloud = new ParticleCloud(this.scene, this.model.particles, 'disc');
    context.setHint('누른 뒤 포인터를 움직여 반경 20px의 Verlet 입자들을 흔드세요.');
  }

  protected step(): void {
    this.model.step();
  }

  public render(): void {
    this.cloud.sync(this.model.particles);
  }

  public pointerDown(): void {
    this.model.beginGesture(this.pointerInReference());
  }

  public pointerMove(): void {
    if (this.context.pointer.pressed) this.model.gesture(this.pointerInReference());
  }
}

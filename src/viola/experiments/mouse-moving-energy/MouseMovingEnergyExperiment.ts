import type { ExperimentContext } from '../../core/Experiment';
import { Random } from '../../core/Random';
import { ParticleCloud } from '../../rendering/ParticleCloud';
import { ReferenceExperiment } from '../common/ReferenceExperiment';
import { MouseMovingEnergyModel } from './MouseMovingEnergyModel';

export class MouseMovingEnergyExperiment extends ReferenceExperiment {
  private readonly model: MouseMovingEnergyModel;
  private readonly cloud: ParticleCloud;

  public constructor(context: ExperimentContext) {
    super(context, { width: 1_000, height: 700 }, 1_000 / 30);
    this.model = new MouseMovingEnergyModel(new Random(context.definition.seed));
    this.cloud = new ParticleCloud(this.scene, this.model.particles, 'disc');
    context.setHint(
      '포인터를 누르고 빠르게 움직여 반경 100px 안의 점에 속도를 전달하세요.',
    );
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
    this.model.gesture(this.pointerInReference());
  }
}

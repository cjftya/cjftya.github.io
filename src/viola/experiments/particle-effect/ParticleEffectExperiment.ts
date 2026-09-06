import type { ExperimentContext } from '../../core/Experiment';
import { Random } from '../../core/Random';
import { ParticleCloud } from '../../rendering/ParticleCloud';
import { ReferenceExperiment } from '../common/ReferenceExperiment';
import { ParticleEffectModel } from './ParticleEffectModel';

export class ParticleEffectExperiment extends ReferenceExperiment {
  private readonly model: ParticleEffectModel;
  private readonly cloud: ParticleCloud;

  public constructor(context: ExperimentContext) {
    super(context, { width: 900, height: 600 }, 1_000 / 30);
    this.model = new ParticleEffectModel(new Random(context.definition.seed));
    this.cloud = new ParticleCloud(this.scene, this.model.particles, 'disc');
    context.setHint(
      '누르면 방사형 힘. W 방향, Q/A 세기, G 중력, F 복원력, Space 회전을 전환합니다.',
    );
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

  public pointerMove(): void {
    this.model.movePointer(this.pointerInReference());
  }

  public pointerUp(): void {
    this.model.release();
  }

  public keyDown(code: string): void {
    this.model.keyDown(code);
  }

  public keyUp(): void {
    this.model.keyUp();
  }
}

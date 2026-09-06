import { Graphics } from 'pixi.js';
import type { ExperimentContext } from '../../core/Experiment';
import { Random } from '../../core/Random';
import { ParticleCloud } from '../../rendering/ParticleCloud';
import { ReferenceExperiment } from '../common/ReferenceExperiment';
import { FlowSimulationModel } from './FlowSimulationModel';

export class FlowSimulationExperiment extends ReferenceExperiment {
  private readonly frame = new Graphics();
  private readonly model: FlowSimulationModel;
  private readonly cloud: ParticleCloud;

  public constructor(context: ExperimentContext) {
    super(context, { width: 700, height: 700 });
    this.model = new FlowSimulationModel(new Random(context.definition.seed));
    this.scene.addChild(this.frame);
    this.cloud = new ParticleCloud(this.scene, this.model.particles, 'disc');
    context.setHint('포인터를 누른 채 움직여 유체 입자를 끌어당겨보세요.');
  }

  protected step(): void {
    this.model.setForceField(
      this.context.pointer.pressed ? this.pointerInReference() : null,
    );
    this.model.step();
  }

  public render(): void {
    this.frame.clear().rect(0, 0, 700, 700).stroke({ color: 0x31434b, width: 2 });
    this.cloud.sync(this.model.particles);
  }
}

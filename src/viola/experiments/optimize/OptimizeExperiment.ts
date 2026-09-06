import { Container, Graphics } from 'pixi.js';
import type { ExperimentContext } from '../../core/Experiment';
import { Random } from '../../core/Random';
import { ParticleCloud } from '../../rendering/ParticleCloud';
import { ReferenceExperiment } from '../common/ReferenceExperiment';
import { OptimizeModel } from './OptimizeModel';

export class OptimizeExperiment extends ReferenceExperiment {
  private readonly frame = new Graphics();
  private readonly world = new Container();
  private readonly model: OptimizeModel;
  private readonly cloud: ParticleCloud;

  public constructor(context: ExperimentContext) {
    super(context, { width: 1_000, height: 700 }, 100);
    this.model = new OptimizeModel(new Random(context.definition.seed));
    this.world.position.y = 700;
    this.world.scale.y = -1;
    this.scene.addChild(this.frame, this.world);
    this.cloud = new ParticleCloud(this.world, this.model.particles, 'disc');
    context.setHint('포인터를 누르면 1,500개 유체 입자에 역거리 인력이 작용합니다.');
  }

  protected step(): void {
    const pointer = this.pointerInReference();
    pointer.y = 700 - pointer.y;
    this.model.setInteraction(pointer, this.context.pointer.pressed);
    this.model.step();
  }

  public render(): void {
    this.frame.clear().rect(0, 0, 600, 700).stroke({ color: 0x31434b, width: 2 });
    this.cloud.sync(this.model.particles);
  }
}

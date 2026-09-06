import { Graphics } from 'pixi.js';
import type { ExperimentContext } from '../../core/Experiment';
import { Random } from '../../core/Random';
import { ParticleCloud } from '../../rendering/ParticleCloud';
import { ReferenceExperiment } from '../common/ReferenceExperiment';
import { GForceModel } from './GForceModel';

export class GForceExperiment extends ReferenceExperiment {
  private readonly model: GForceModel;
  private readonly cloud: ParticleCloud;
  private readonly graphics = new Graphics();

  public constructor(context: ExperimentContext) {
    super(context, { width: 1_000, height: 700 });
    this.model = new GForceModel(new Random(context.definition.seed));
    this.cloud = new ParticleCloud(this.scene, this.model.particles, 'disc');
    this.scene.addChild(this.graphics);
    context.setHint('포인터를 움직여 두 번째 질량 100의 역제곱 중력장을 이동하세요.');
  }

  protected step(): void {
    this.model.step();
  }

  public render(): void {
    this.cloud.sync(this.model.particles);
    this.graphics.clear();
    for (const well of this.model.wells)
      this.graphics
        .circle(well.position.x, well.position.y, well.mass)
        .fill({ color: 0x4fd477, alpha: 0.22 });
  }

  public pointerMove(): void {
    this.model.movePointerWell(this.pointerInReference());
  }
}

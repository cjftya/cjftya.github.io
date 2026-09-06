import { Graphics } from 'pixi.js';
import type { ExperimentContext } from '../../core/Experiment';
import { Random } from '../../core/Random';
import { ParticleCloud } from '../../rendering/ParticleCloud';
import { ReferenceExperiment } from '../common/ReferenceExperiment';
import { CellSpaceModel } from './CellSpaceModel';

export class CellSpaceExperiment extends ReferenceExperiment {
  private readonly frame = new Graphics();
  private readonly model: CellSpaceModel;
  private readonly cloud: ParticleCloud;

  public constructor(context: ExperimentContext) {
    super(context, { width: 1_000, height: 700 });
    this.model = new CellSpaceModel(new Random(context.definition.seed));
    this.scene.addChild(this.frame);
    this.cloud = new ParticleCloud(this.scene, this.model.bodies, 'disc');
    context.setHint('작은 원 하나를 눌러 드래그하며 주변 충돌을 확인하세요.');
  }

  protected step(): void {
    this.model.step();
  }

  public render(): void {
    this.frame.clear().rect(0, 0, 1_000, 700).stroke({ color: 0x31434b, width: 2 });
    this.cloud.sync(this.model.bodies);
  }

  public pointerDown(): void {
    this.model.pick(this.pointerInReference());
  }

  public pointerMove(): void {
    if (this.context.pointer.pressed)
      this.model.moveSelected(this.pointerInReference());
  }

  public pointerUp(): void {
    this.model.release();
  }
}

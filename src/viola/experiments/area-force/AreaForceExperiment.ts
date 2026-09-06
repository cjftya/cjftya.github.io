import { Graphics } from 'pixi.js';
import type { ExperimentContext } from '../../core/Experiment';
import { Random } from '../../core/Random';
import { ParticleCloud } from '../../rendering/ParticleCloud';
import { ReferenceExperiment } from '../common/ReferenceExperiment';
import { AreaForceModel } from './AreaForceModel';

export class AreaForceExperiment extends ReferenceExperiment {
  private readonly model: AreaForceModel;
  private readonly cloud: ParticleCloud;
  private readonly graphics = new Graphics();

  public constructor(context: ExperimentContext) {
    super(context, { width: 1_000, height: 700 });
    this.model = new AreaForceModel(new Random(context.definition.seed));
    this.scene.addChild(this.graphics);
    this.cloud = new ParticleCloud(this.scene, this.model.particles, 'disc');
    context.setHint(
      '방향장 중심은 드래그하고, 중심의 작은 핸들을 좌우로 끌어 회전하세요.',
    );
  }

  protected step(): void {
    this.model.step();
  }

  public render(): void {
    this.graphics.clear();
    for (const field of this.model.fields) {
      const tipX = field.position.x + field.direction.x * 28;
      const tipY = field.position.y + field.direction.y * 28;
      this.graphics
        .rect(
          field.position.x - field.radius,
          field.position.y - field.radius,
          field.radius * 2,
          field.radius * 2,
        )
        .stroke({ color: 0x93bdb4, width: 1 })
        .moveTo(
          field.position.x - field.direction.y * 12,
          field.position.y + field.direction.x * 12,
        )
        .lineTo(tipX, tipY)
        .lineTo(
          field.position.x + field.direction.y * 12,
          field.position.y - field.direction.x * 12,
        )
        .closePath()
        .stroke({ color: 0xe8fffb, width: 1 });
    }
    this.cloud.sync(this.model.particles);
  }

  public pointerDown(): void {
    this.model.pick(this.pointerInReference());
  }

  public pointerMove(): void {
    if (this.context.pointer.pressed) this.model.drag(this.pointerInReference());
  }

  public pointerUp(): void {
    this.model.release();
  }
}

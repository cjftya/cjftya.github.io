import { Graphics } from 'pixi.js';
import type { ExperimentContext } from '../../core/Experiment';
import { Random } from '../../core/Random';
import { ParticleCloud } from '../../rendering/ParticleCloud';
import { ReferenceExperiment } from '../common/ReferenceExperiment';
import { CircleCollisionModel } from './CircleCollisionModel';

export class CircleCollisionExperiment extends ReferenceExperiment {
  private readonly frame = new Graphics();
  private readonly model: CircleCollisionModel;
  private readonly cloud: ParticleCloud;

  public constructor(context: ExperimentContext) {
    super(context, { width: 1_000, height: 700 });
    this.model = new CircleCollisionModel(new Random(context.definition.seed));
    this.scene.addChild(this.frame);
    this.cloud = new ParticleCloud(this.scene, this.model.circles, 'wheel');
    context.setHint('원을 드래그하거나 WASD로 첫 원을 움직여 충돌을 확인하세요.');
  }

  protected step(): void {
    this.model.step();
  }

  public render(): void {
    this.frame.clear().rect(0, 0, 1_000, 700).stroke({ color: 0x31434b, width: 2 });
    this.cloud.sync(this.model.circles);
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

  public keyDown(code: string): void {
    if (code === 'KeyA') this.model.accelerateFirst(-1, 0);
    else if (code === 'KeyD') this.model.accelerateFirst(1, 0);
    else if (code === 'KeyW') this.model.accelerateFirst(0, -1);
    else if (code === 'KeyS') this.model.accelerateFirst(0, 1);
  }
}

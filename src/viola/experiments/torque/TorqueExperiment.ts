import { Graphics } from 'pixi.js';
import type { ExperimentContext } from '../../core/Experiment';
import { ReferenceExperiment } from '../common/ReferenceExperiment';
import { TorqueModel } from './TorqueModel';

export class TorqueExperiment extends ReferenceExperiment {
  private readonly graphics = new Graphics();
  private readonly model = new TorqueModel();

  public constructor(context: ExperimentContext) {
    super(context, { width: 1_000, height: 700 }, 1000 / 30);
    this.scene.addChild(this.graphics);
    context.setHint('WASD를 누르는 동안 왼쪽 아래 꼭짓점에 힘을 가합니다.');
  }

  protected step(): void {
    this.model.step();
  }

  public render(): void {
    const corners = this.model.corners();
    this.graphics
      .clear()
      .poly(corners)
      .stroke({ color: 0xe8fffb, width: 2 })
      .rect(350, 175, 200, 50)
      .stroke({ color: 0x7c8b92, width: 2 });
    const contact = corners[3];
    if (contact)
      this.graphics
        .circle(contact.x, contact.y, 10)
        .stroke({ color: 0xff665e, width: 2 })
        .moveTo(contact.x, contact.y)
        .lineTo(
          contact.x + this.model.force.x * 800,
          contact.y + this.model.force.y * 800,
        )
        .stroke({ color: 0x67e8bd, width: 2 });
  }

  public keyDown(code: string): void {
    this.model.keyDown(code);
  }

  public keyUp(): void {
    this.model.releaseForce();
  }
}

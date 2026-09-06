import { Graphics } from 'pixi.js';
import type { ExperimentContext } from '../../core/Experiment';
import { ReferenceExperiment } from '../common/ReferenceExperiment';
import { BallRollingModel } from './BallRollingModel';

export class BallRollingExperiment extends ReferenceExperiment {
  private readonly graphics = new Graphics();
  private readonly model = new BallRollingModel();

  public constructor(context: ExperimentContext) {
    super(context, { width: 1_000, height: 700 });
    this.scene.addChild(this.graphics);
    context.setHint('WASD로 공에 속도를 더해 벽 충돌과 회전을 확인하세요.');
  }

  protected step(): void {
    this.model.step();
  }

  public render(): void {
    const { position, radius, angle } = this.model;
    const cosine = Math.cos(angle) * radius;
    const sine = Math.sin(angle) * radius;
    this.graphics
      .clear()
      .rect(0, 0, 1_000, 700)
      .stroke({ color: 0x31434b, width: 2 })
      .circle(position.x, position.y, radius)
      .stroke({ color: 0xe8fffb, width: 2.5 })
      .moveTo(position.x - cosine, position.y - sine)
      .lineTo(position.x + cosine, position.y + sine)
      .moveTo(position.x + sine, position.y - cosine)
      .lineTo(position.x - sine, position.y + cosine)
      .stroke({ color: 0x67e8bd, width: 2 });
  }

  public keyDown(code: string): void {
    if (code === 'KeyA') this.model.accelerate(-5, 0);
    else if (code === 'KeyD') this.model.accelerate(5, 0);
    else if (code === 'KeyW') this.model.accelerate(0, -5);
    else if (code === 'KeyS') this.model.accelerate(0, 5);
  }
}

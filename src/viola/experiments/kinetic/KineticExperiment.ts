import { Graphics } from 'pixi.js';
import type { ExperimentContext } from '../../core/Experiment';
import { ReferenceExperiment } from '../common/ReferenceExperiment';
import { KineticModel } from './KineticModel';

export class KineticExperiment extends ReferenceExperiment {
  private readonly graphics = new Graphics();
  private readonly model = new KineticModel();

  public constructor(context: ExperimentContext) {
    super(context, { width: 1_000, height: 700 });
    this.scene.addChild(this.graphics);
    context.setHint('포인터를 움직여 15개 관절의 역기구학 목표를 바꾸세요.');
  }

  protected step(): void {
    this.model.setFocus(this.pointerInReference());
    this.model.step();
  }

  public render(): void {
    this.graphics.clear();
    for (const segment of this.model.segments) {
      const nx = -Math.sin(segment.angle) * this.model.height * 0.5;
      const ny = Math.cos(segment.angle) * this.model.height * 0.5;
      this.graphics
        .poly([
          { x: segment.start.x + nx, y: segment.start.y + ny },
          { x: segment.end.x + nx, y: segment.end.y + ny },
          { x: segment.end.x - nx, y: segment.end.y - ny },
          { x: segment.start.x - nx, y: segment.start.y - ny },
        ])
        .fill({ color: 0x8d969a })
        .circle(segment.start.x, segment.start.y, this.model.height * 0.5)
        .fill({ color: 0xff4b4b })
        .circle(segment.end.x, segment.end.y, this.model.height * 0.5)
        .fill({ color: 0xffa234 });
    }
  }
}

import { Graphics } from 'pixi.js';
import type { ExperimentContext } from '../../core/Experiment';
import { ReferenceExperiment } from '../common/ReferenceExperiment';
import { LineDrawingModel } from './LineDrawingModel';

export class LineDrawingExperiment extends ReferenceExperiment {
  private readonly graphics = new Graphics();
  private readonly model = new LineDrawingModel();

  public constructor(context: ExperimentContext) {
    super(context, { width: 1_200, height: 700 });
    this.scene.addChild(this.graphics);
    context.setHint(
      '40px 간격으로 선을 그리고 WASD로 공을 움직이며 Q로 선을 지우세요.',
    );
  }

  protected step(): void {
    this.model.step();
  }

  public render(): void {
    this.graphics.clear();
    for (const line of this.model.lines)
      this.graphics.moveTo(line.start.x, line.start.y).lineTo(line.end.x, line.end.y);
    this.graphics.stroke({ color: 0xe8fffb, width: 1 });
    for (let index = 0; index < this.model.pending.length - 1; index += 1) {
      const start = this.model.pending[index];
      const end = this.model.pending[index + 1];
      if (start && end) this.graphics.moveTo(start.x, start.y).lineTo(end.x, end.y);
    }
    this.graphics.stroke({ color: 0xffe45c, width: 1 });
    const cosine = Math.cos(this.model.angle) * this.model.radius;
    const sine = Math.sin(this.model.angle) * this.model.radius;
    this.graphics
      .circle(this.model.position.x, this.model.position.y, this.model.radius)
      .stroke({ color: 0xe8fffb, width: 2 })
      .moveTo(this.model.position.x - cosine, this.model.position.y - sine)
      .lineTo(this.model.position.x + cosine, this.model.position.y + sine)
      .stroke({ color: 0x67e8bd, width: 2 });
  }

  public pointerDown(): void {
    this.model.beginLine(this.pointerInReference());
  }

  public pointerMove(): void {
    if (this.context.pointer.pressed) this.model.extendLine(this.pointerInReference());
  }

  public pointerUp(): void {
    this.model.endLine();
  }

  public keyDown(code: string): void {
    this.model.keyDown(code);
  }
}

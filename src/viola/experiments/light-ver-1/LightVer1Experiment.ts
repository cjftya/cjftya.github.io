import { Graphics } from 'pixi.js';
import type { ExperimentContext } from '../../core/Experiment';
import { Random } from '../../core/Random';
import { ReferenceExperiment } from '../common/ReferenceExperiment';
import { LightVer1Model } from './LightVer1Model';

export class LightVer1Experiment extends ReferenceExperiment {
  private readonly graphics = new Graphics();
  private readonly model: LightVer1Model;

  public constructor(context: ExperimentContext) {
    super(context, { width: 900, height: 650 }, 1_000 / 30);
    this.model = new LightVer1Model(new Random(context.definition.seed));
    this.scene.addChild(this.graphics);
    context.setHint('클릭한 지점으로 20개 절점의 번개 끝점을 옮기세요.');
  }

  protected step(): void {
    this.model.step();
  }

  public render(): void {
    const color =
      (50 + this.model.brightness) * 0x010000 +
      (50 + this.model.brightness) * 0x0100 +
      100 +
      this.model.brightness;
    this.graphics
      .clear()
      .moveTo(this.model.points[0]?.x ?? 0, this.model.points[0]?.y ?? 0);
    for (const point of this.model.points.slice(1))
      this.graphics.lineTo(point.x, point.y);
    this.graphics.stroke({ color, width: 2 });
  }

  public pointerDown(): void {
    this.model.relocate(this.pointerInReference());
  }
}

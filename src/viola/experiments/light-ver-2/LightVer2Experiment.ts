import { Graphics } from 'pixi.js';
import type { ExperimentContext } from '../../core/Experiment';
import { Random } from '../../core/Random';
import { ParticleCloud } from '../../rendering/ParticleCloud';
import { ReferenceExperiment } from '../common/ReferenceExperiment';
import { LightVer2Model } from './LightVer2Model';

export class LightVer2Experiment extends ReferenceExperiment {
  private readonly graphics = new Graphics();
  private readonly model: LightVer2Model;
  private readonly dust: ParticleCloud;

  public constructor(context: ExperimentContext) {
    super(context, { width: 900, height: 650 });
    this.model = new LightVer2Model(new Random(context.definition.seed));
    this.scene.addChild(this.graphics);
    this.dust = new ParticleCloud(this.scene, this.model.dust, 'disc');
    context.setHint('클릭하면 절점을 따라 번개가 진행하고 끝점에서 먼지가 폭발합니다.');
  }

  protected step(): void {
    this.model.step();
  }

  public render(): void {
    const channel = 50 + this.model.lightColor;
    const color = channel * 0x010000 + channel * 0x0100 + 100 + this.model.lightColor;
    this.graphics
      .clear()
      .circle(this.model.points[0]?.x ?? 0, this.model.points[0]?.y ?? 0, 10)
      .fill({ color });
    const first = this.model.points[0];
    if (first) this.graphics.moveTo(first.x, first.y);
    for (let index = 1; index <= this.model.drawnSegments; index += 1) {
      const point = this.model.points[index];
      if (point) this.graphics.lineTo(point.x, point.y);
    }
    this.graphics.stroke({
      color,
      width: this.model.lightWidth,
      alpha: this.model.lightAlpha,
    });
    this.dust.sync(this.model.dust);
  }

  public pointerDown(): void {
    this.model.fire(this.pointerInReference());
  }
}

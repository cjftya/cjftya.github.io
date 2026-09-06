import type { ExperimentContext } from '../../core/Experiment';
import { ParticleCloud } from '../../rendering/ParticleCloud';
import { ReferenceExperiment } from '../common/ReferenceExperiment';
import { IMAGE_FUN_SOURCE } from './ImageFunAsset';
import { ImageFunModel } from './ImageFunModel';

export class ImageFunExperiment extends ReferenceExperiment {
  private readonly model = new ImageFunModel();
  private readonly cloud: ParticleCloud;

  public constructor(context: ExperimentContext) {
    super(context, { width: 700, height: 550 });
    this.cloud = new ParticleCloud(this.scene, this.model.pixels, 'disc');
    this.loadOriginalPixels();
    context.setHint(
      '이미지의 100×71 픽셀 입자를 누른 포인터로 밀면 각 픽셀이 원래 자리로 복원됩니다.',
    );
  }

  protected step(): void {
    this.model.step();
  }

  public render(): void {
    this.cloud.sync(this.model.pixels);
  }

  public pointerDown(): void {
    this.model.setForce(this.pointerInReference(), true);
  }

  public pointerMove(): void {
    if (this.context.pointer.pressed)
      this.model.setForce(this.pointerInReference(), true);
  }

  public pointerUp(): void {
    this.model.setForce(this.pointerInReference(), false);
  }

  private loadOriginalPixels(): void {
    const image = new Image();
    image.addEventListener('load', () => {
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 71;
      const drawing = canvas.getContext('2d');
      if (!drawing) return;
      drawing.drawImage(image, 0, 0);
      const source = drawing.getImageData(0, 0, 100, 71).data;
      const colors = Array.from({ length: 7_100 }, (_, index) => {
        const offset = index * 4;
        return (
          ((source[offset] ?? 0) << 16) |
          ((source[offset + 1] ?? 0) << 8) |
          (source[offset + 2] ?? 0)
        );
      });
      this.model.setPixelColors(colors);
    });
    image.src = IMAGE_FUN_SOURCE;
  }
}

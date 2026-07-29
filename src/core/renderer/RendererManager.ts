import { ACESFilmicToneMapping, SRGBColorSpace, WebGLRenderer } from 'three';

const DEFAULT_MAX_PIXEL_RATIO = 1.5;
const REDUCED_MAX_PIXEL_RATIO = 1.2;

export class RendererManager {
  readonly renderer: WebGLRenderer;

  private width = 0;
  private height = 0;
  private pixelRatio = 0;
  private readonly maxPixelRatio =
    (navigator.hardwareConcurrency ?? 8) <= 4
      ? REDUCED_MAX_PIXEL_RATIO
      : DEFAULT_MAX_PIXEL_RATIO;

  constructor(canvas: HTMLCanvasElement) {
    const devicePixelRatio = Math.max(window.devicePixelRatio, 1);

    this.renderer = new WebGLRenderer({
      canvas,
      antialias: devicePixelRatio <= 1,
      alpha: false,
      powerPreference: 'high-performance',
      stencil: false,
    });
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
  }

  resize(width: number, height: number): void {
    const pixelRatio = Math.min(
      Math.max(window.devicePixelRatio, 1),
      this.maxPixelRatio,
    );

    if (
      this.width === width &&
      this.height === height &&
      this.pixelRatio === pixelRatio
    ) {
      return;
    }

    this.width = width;
    this.height = height;
    this.pixelRatio = pixelRatio;
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(width, height, false);
  }

  dispose(): void {
    this.renderer.setAnimationLoop(null);
    this.renderer.dispose();
  }
}

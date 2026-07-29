import { ACESFilmicToneMapping, SRGBColorSpace, WebGLRenderer } from 'three';

const MAX_PIXEL_RATIO = 1.5;

export class RendererManager {
  readonly renderer: WebGLRenderer;

  private width = 0;
  private height = 0;
  private pixelRatio = 0;

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
    const pixelRatio = Math.min(Math.max(window.devicePixelRatio, 1), MAX_PIXEL_RATIO);

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

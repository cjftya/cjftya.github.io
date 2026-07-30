import { ACESFilmicToneMapping, SRGBColorSpace, WebGLRenderer } from 'three';

const DEFAULT_MAX_PIXEL_RATIO = 1.5;
const REDUCED_MAX_PIXEL_RATIO = 1.2;
const DEFAULT_RENDER_PIXEL_BUDGET = 5_000_000;
const MIN_RENDER_PIXEL_RATIO = 0.75;

export function calculateRenderPixelRatio(
  width: number,
  height: number,
  devicePixelRatio: number,
  maxPixelRatio: number,
  pixelBudget = DEFAULT_RENDER_PIXEL_BUDGET,
): number {
  const cssPixelCount = Math.max(width * height, 1);
  const requestedPixelRatio = Math.min(Math.max(devicePixelRatio, 1), maxPixelRatio);
  const budgetPixelRatio = Math.sqrt(pixelBudget / cssPixelCount);

  return Math.min(
    requestedPixelRatio,
    Math.max(MIN_RENDER_PIXEL_RATIO, budgetPixelRatio),
  );
}

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
    const pixelRatio = calculateRenderPixelRatio(
      width,
      height,
      window.devicePixelRatio,
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

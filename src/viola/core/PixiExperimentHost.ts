import { Application, Container, type Ticker } from 'pixi.js';
import type {
  Experiment,
  ExperimentContext,
  PointerSample,
  Viewport,
} from './Experiment';
import { FixedStepClock } from './FixedStepClock';
import { Vector2 } from './Vector2';
import type { ExperimentDefinition } from '../data/experiments';
import { createExperiment } from '../simulations/createExperiment';

export class PixiExperimentHost {
  private readonly app = new Application();
  private readonly clock = new FixedStepClock();
  private readonly root = new Container();
  private readonly pointer: PointerSample = {
    position: new Vector2(),
    previous: new Vector2(),
    pressed: false,
  };
  private experiment: Experiment | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private readonly onKeyDown = (event: KeyboardEvent) => {
    if (event.code.startsWith('Arrow')) event.preventDefault();
    this.experiment?.keyDown?.(event.code);
  };

  public constructor(
    private readonly mount: HTMLElement,
    private readonly setHint: (message: string) => void,
  ) {}

  public async start(definition: ExperimentDefinition): Promise<void> {
    await this.app.init({
      resizeTo: this.mount,
      backgroundAlpha: 0,
      antialias: true,
      autoDensity: true,
      resolution: Math.min(window.devicePixelRatio, 2),
      preference: 'webgl',
      hello: false,
    });
    this.mount.append(this.app.canvas);
    this.app.stage.addChild(this.root);
    const viewport = this.readViewport();
    this.pointer.position.set(viewport.width * 0.5, viewport.height * 0.5);
    this.pointer.previous.copy(this.pointer.position);
    const context: ExperimentContext = {
      definition,
      root: this.root,
      viewport,
      pointer: this.pointer,
      setHint: this.setHint,
    };
    this.experiment = createExperiment(context);
    this.experiment.render();
    this.bindEvents();
    this.app.ticker.add(this.tick);
    window.addEventListener('keydown', this.onKeyDown, { passive: false });
    this.resizeObserver = new ResizeObserver(() => {
      const next = this.readViewport();
      this.experiment?.resize(next);
      this.experiment?.render();
    });
    this.resizeObserver.observe(this.mount);
  }

  private readonly tick = (ticker: Ticker): void => {
    this.clock.consume(ticker.deltaMS / 1000, (stepScale) =>
      this.experiment?.update(stepScale),
    );
    this.experiment?.render();
  };

  private bindEvents(): void {
    const canvas = this.app.canvas;
    canvas.addEventListener('pointerdown', this.onPointerDown);
    canvas.addEventListener('pointermove', this.onPointerMove);
    canvas.addEventListener('pointerup', this.onPointerUp);
    canvas.addEventListener('pointercancel', this.onPointerUp);
    canvas.addEventListener('contextmenu', (event) => event.preventDefault());
  }

  private updatePointer(event: PointerEvent): void {
    const bounds = this.app.canvas.getBoundingClientRect();
    this.pointer.previous.copy(this.pointer.position);
    this.pointer.position.set(
      ((event.clientX - bounds.left) / Math.max(bounds.width, 1)) *
        this.app.screen.width,
      ((event.clientY - bounds.top) / Math.max(bounds.height, 1)) *
        this.app.screen.height,
    );
  }

  private readonly onPointerDown = (event: PointerEvent): void => {
    this.updatePointer(event);
    this.pointer.pressed = true;
    this.app.canvas.setPointerCapture(event.pointerId);
    this.experiment?.pointerDown?.();
  };

  private readonly onPointerMove = (event: PointerEvent): void => {
    this.updatePointer(event);
    this.experiment?.pointerMove?.();
  };

  private readonly onPointerUp = (event: PointerEvent): void => {
    this.updatePointer(event);
    this.pointer.pressed = false;
    if (this.app.canvas.hasPointerCapture(event.pointerId))
      this.app.canvas.releasePointerCapture(event.pointerId);
    this.experiment?.pointerUp?.();
  };

  private readViewport(): Viewport {
    return {
      width: Math.max(this.mount.clientWidth, 320),
      height: Math.max(this.mount.clientHeight, 320),
    };
  }

  public destroy(): void {
    this.resizeObserver?.disconnect();
    window.removeEventListener('keydown', this.onKeyDown);
    this.app.ticker.remove(this.tick);
    const canvas = this.app.canvas;
    canvas.removeEventListener('pointerdown', this.onPointerDown);
    canvas.removeEventListener('pointermove', this.onPointerMove);
    canvas.removeEventListener('pointerup', this.onPointerUp);
    canvas.removeEventListener('pointercancel', this.onPointerUp);
    this.experiment?.destroy();
    this.experiment = null;
    this.app.destroy({ removeView: true }, { children: true });
  }
}

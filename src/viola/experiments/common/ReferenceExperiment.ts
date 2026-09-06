import { Container } from 'pixi.js';
import type { Experiment, ExperimentContext, Viewport } from '../../core/Experiment';
import { FixedRateStepper } from '../../core/FixedRateStepper';
import { ReferenceViewport, type ReferenceSize } from '../../core/ReferenceViewport';
import { Vector2 } from '../../core/Vector2';

export abstract class ReferenceExperiment implements Experiment {
  public readonly context: ExperimentContext;
  protected readonly scene = new Container();
  private readonly pointer = new Vector2();
  private readonly viewport: ReferenceViewport;
  private readonly stepper: FixedRateStepper;

  protected constructor(
    context: ExperimentContext,
    referenceSize: ReferenceSize,
    simulationHz = 60,
  ) {
    this.context = context;
    this.viewport = new ReferenceViewport(referenceSize);
    this.stepper = new FixedRateStepper(1 / simulationHz);
    context.root.addChild(this.scene);
    this.viewport.fit(context.viewport, this.scene);
  }

  public update(elapsedSeconds: number): void {
    this.stepper.consume(elapsedSeconds, () => this.step());
  }

  protected abstract step(): void;

  protected pointerInReference(): Vector2 {
    return this.viewport.toReference(this.context.pointer.position, this.pointer);
  }

  public abstract render(): void;

  public resize(viewport: Viewport): void {
    this.context.viewport = viewport;
    this.viewport.fit(viewport, this.scene);
  }

  public destroy(): void {
    this.context.root.removeChild(this.scene);
    this.scene.destroy({ children: true });
  }
}

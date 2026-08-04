import type { Container } from 'pixi.js';
import type { ExperimentDefinition } from '../data/experiments';
import type { Vector2 } from './Vector2';

export interface Viewport {
  width: number;
  height: number;
}

export interface PointerSample {
  position: Vector2;
  previous: Vector2;
  pressed: boolean;
}

export interface ExperimentContext {
  definition: ExperimentDefinition;
  root: Container;
  viewport: Viewport;
  pointer: PointerSample;
  setHint(message: string): void;
}

export interface Experiment {
  readonly context: ExperimentContext;
  update(stepScale: number): void;
  render(): void;
  resize(viewport: Viewport): void;
  pointerDown?(): void;
  pointerMove?(): void;
  pointerUp?(): void;
  keyDown?(code: string): void;
  destroy(): void;
}

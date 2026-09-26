import { PerspectiveCamera } from 'three';
import { describe, expect, it } from 'vitest';
import { PlanetPicker } from '../src/core/interaction/PlanetPicker';
import type { SolarSystem } from '../src/solar-system/SolarSystem';

function pointer(canvas: EventTarget, type: string, id: number, x = 50): void {
  const event = new Event(type);
  Object.assign(event, {
    pointerId: id,
    clientX: x,
    clientY: 50,
    pointerType: 'touch',
  });
  canvas.dispatchEvent(event);
}

describe('planet picker gestures', () => {
  it('treats a single tap as a selection but ignores both releases after a pinch', () => {
    const canvas = new EventTarget() as HTMLCanvasElement;
    canvas.getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: 100, height: 100 }) as DOMRect;
    const solarSystem = {
      getSelectableMeshes: () => [],
    } as unknown as SolarSystem;
    const selections: unknown[] = [];
    const picker = new PlanetPicker(
      canvas,
      new PerspectiveCamera(),
      solarSystem,
      (project) => selections.push(project),
      () => {},
    );

    pointer(canvas, 'pointerdown', 1);
    pointer(canvas, 'pointerdown', 2);
    pointer(canvas, 'pointerup', 2);
    pointer(canvas, 'pointerup', 1);
    expect(selections).toEqual([]);

    pointer(canvas, 'pointerdown', 3);
    pointer(canvas, 'pointerup', 3);
    expect(selections).toEqual([null]);
    picker.dispose();
  });
});

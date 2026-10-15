import { describe, expect, it, vi } from 'vitest';
import { Group, Mesh, Points } from 'three';
import { createFantasySanctuary } from '../src/jelly-oasis/landmark/createFantasySanctuary';
const pond = {
  positions: [
    [-9, 0, 0],
    [9, 0, 0],
    [9, 0, 16],
    [-9, 0, 16],
  ],
  indices: [
    [0, 1, 2],
    [0, 2, 3],
  ],
};
const ground = (x: number, z: number) => Math.sin(x * 0.03) + Math.cos(z * 0.02);
describe('fantasy sanctuary lifecycle and animation', () => {
  it('rebuilds on sampled terrain without accumulating geometry or transforms', () => {
    const content = new Group();
    const effect = createFantasySanctuary(content, pond);
    effect.place(ground, 0);
    const first = effect.snapshot(),
      childCount = effect.group.children.length;
    const geometry = (effect.group.getObjectByName('CrystalColonies_0') as Mesh)
      .geometry;
    geometry.computeBoundingBox();
    expect(geometry.attributes.position!.count).toBeGreaterThan(100);
    expect(geometry.boundingBox!.max.y).toBeGreaterThan(7.5);
    const dispose = vi.spyOn(geometry, 'dispose');
    effect.place((x, z) => ground(x, z) + 3, 3);
    expect(dispose).toHaveBeenCalledOnce();
    effect
      .snapshot()
      .colonies.forEach((c, i) => expect(c.y).toBeCloseTo(first.colonies[i]!.y + 3));
    effect.place(ground, 0);
    expect(effect.snapshot().colonies).toEqual(first.colonies);
    expect(effect.group.children).toHaveLength(childCount);
    effect.group.traverse((o) => {
      if (o instanceof Mesh || o instanceof Points)
        expect(
          Array.from(o.geometry.getAttribute('position').array).every(Number.isFinite),
        ).toBe(true);
    });
    effect.dispose();
    effect.dispose();
    expect(content.children).toHaveLength(0);
  });
  it('keeps reduced-motion frames static but responds to time-of-day changes', () => {
    const effect = createFantasySanctuary(new Group(), pond);
    effect.place(ground, 0);
    expect(effect.update(0.1, 12, true, 800)).toBe(true);
    expect(effect.update(0.1, 12, true, 800)).toBe(false);
    expect(effect.snapshot().elapsed).toBe(0);
    expect(effect.night).toBe(0);
    expect(effect.update(0.1, 0, true, 800)).toBe(true);
    expect(effect.night).toBe(1);
    effect.update(0.1, 0, false, 800);
    expect(effect.snapshot().elapsed).toBeCloseTo(0.1);
    effect.dispose();
    expect(effect.update(0.1, 0, false, 800)).toBe(false);
  });
  it('reduces mobile particles while retaining all landmark crystals', () => {
    const desktop = createFantasySanctuary(new Group(), pond);
    const mobile = createFantasySanctuary(new Group(), pond, true);
    desktop.place(ground, 0);
    mobile.place(ground, 0);
    expect(mobile.snapshot().shards).toBe(desktop.snapshot().shards);
    expect(mobile.snapshot().particles).toBe(desktop.snapshot().particles / 2);
    desktop.dispose();
    mobile.dispose();
  });
});

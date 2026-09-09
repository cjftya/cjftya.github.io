import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  computeNmPerPixel,
  layoutComparisonViewports,
  normalizedSpecimenScale,
  physicalSpecimenScale,
  projectedLengthPixels,
  scaleBarForNmPerPixel,
  type ViewportRect,
} from '../../src/virus-sim/comparison/scaling';
import { ObservationStore } from '../../src/virus-sim/observation/ObservationStore';
import { SpecimenView } from '../../src/virus-sim/rendering/SpecimenView';
import { normalizedSlabRange } from '../../src/virus-sim/scanner/math';
import type { PhysicalDimensions } from '../../src/virus-sim/catalog/types';
import {
  loadFavorites,
  loadFontScale,
  loadVirusSimPreferences,
  saveVirusSimPreferences,
} from '../../src/virus-sim/ui/preferences';

const dimension = (representativeNm: number): PhysicalDimensions => ({
  metric: 'diameter',
  representativeNm,
  particleState: 'fixture',
  includesProjections: false,
  sourceIds: ['fixture'],
});

describe('Virus Sim v3.5 manual observation contracts', () => {
  it('does not change specimen pose or observation state while idle', () => {
    const store = new ObservationStore(false, 't4');
    const before = store.getSnapshot();
    for (let index = 0; index < 10_000; index += 1) store.step(1 / 60);
    expect(store.getSnapshot()).toEqual(before);
  });

  it('preserves inspection state on species change and drops unavailable selection', () => {
    const store = new ObservationStore(false, 't4');
    store.setView('section');
    store.setSectionOffset(0.37);
    store.setGenomeVisible(true);
    store.selectPart('tail-fiber');
    store.setPreset('hiv-1');
    const specimen = store.getSnapshot().slots.a;
    expect(specimen.view).toBe('section');
    expect(specimen.sectionOffset).toBeCloseTo(0.37);
    expect(specimen.genomeVisible).toBe(true);
    expect(specimen.selectedPartId).toBeNull();
  });

  it('reassembles to exact original structural values', () => {
    const store = new ObservationStore(false, 't4');
    store.startStructuralReveal('exploded');
    for (let index = 0; index < 80; index += 1) store.step(1 / 60);
    expect(store.getSnapshot().slots.a.explosion).toBeCloseTo(74);
    store.reassemble();
    for (let index = 0; index < 80; index += 1) store.step(1 / 60);
    const rebuilt = store.getSnapshot().slots.a;
    expect(rebuilt.view).toBe('surface');
    expect(rebuilt.explosion).toBe(0);
    expect(rebuilt.sectionOffset).toBe(0);
  });

  it('restores exploded inspection after scanner exit', () => {
    const store = new ObservationStore(false, 't4');
    store.setExplosion(68);
    store.setScannerEnabled(true);
    expect(store.getSnapshot().slots.a.explosion).toBe(0);
    expect(store.getSnapshot().slots.a.view).toBe('surface');
    store.setScannerEnabled(false);
    expect(store.getSnapshot().slots.a.explosion).toBe(68);
    expect(store.getSnapshot().slots.a.view).toBe('exploded');
  });

  it('keeps scanner views assembled and preserves restore values across a swap', () => {
    const store = new ObservationStore(false, 't4');
    store.setExplosion(71);
    store.addComparison('hiv-1');
    store.setComparisonLinked(false);
    store.setExplosion(32);
    store.setActiveSlot('a');
    store.setScannerEnabled(true);
    store.setExplosion(94);
    store.startStructuralReveal('exploded');
    expect(store.getSnapshot().slots.a.explosion).toBe(0);
    store.swapComparison();
    store.setScannerEnabled(false);
    expect(store.getSnapshot().slots.b?.presetId).toBe('t4');
    expect(store.getSnapshot().slots.b?.explosion).toBe(71);
    expect(store.getSnapshot().slots.b?.view).toBe('exploded');
    expect(store.getSnapshot().slots.a.explosion).toBe(32);
  });

  it('links inspection state without aliasing slot objects', () => {
    const store = new ObservationStore(false, 'hiv-1');
    store.addComparison('sars-cov-2');
    store.setView('transparent');
    const snapshot = store.getSnapshot();
    expect(snapshot.slots.a.view).toBe('transparent');
    expect(snapshot.slots.b?.view).toBe('transparent');
    expect(snapshot.slots.a).not.toBe(snapshot.slots.b);
    expect(snapshot.slots.a.layerVisibility).not.toBe(
      snapshot.slots.b?.layerVisibility,
    );
  });

  it('links scanner probes by default and isolates them after unlinking', () => {
    const store = new ObservationStore(false, 'hiv-1');
    store.addComparison('sars-cov-2');
    store.setScannerAxis('x');
    store.setScannerPosition(0.72);
    let scanner = store.getSnapshot().scanner;
    expect(scanner.probes.a).toEqual(scanner.probes.b);

    store.setScannerLinked(false);
    store.setActiveSlot('a');
    store.setScannerAxis('y');
    store.setScannerPosition(0.18);
    scanner = store.getSnapshot().scanner;
    expect(scanner.probes.a.axis).toBe('y');
    expect(scanner.probes.a.position).toBeCloseTo(0.18);
    expect(scanner.probes.b.axis).toBe('x');
    expect(scanner.probes.b.position).toBeCloseTo(0.72);
  });

  it('projects physical 100/200 nm fixtures at a 1:2 ratio and normalizes equally', () => {
    const viewports = layoutComparisonViewports(1000, 600, true).filter(
      (viewport): viewport is ViewportRect => Boolean(viewport),
    );
    const first = dimension(100);
    const second = dimension(200);
    const nmPerPixel = computeNmPerPixel([first, second], viewports)!;
    expect(
      projectedLengthPixels(second, nmPerPixel) /
        projectedLengthPixels(first, nmPerPixel),
    ).toBeCloseTo(2);
    expect(normalizedSpecimenScale(4)).toBeCloseTo(normalizedSpecimenScale(8) * 2);
    expect(physicalSpecimenScale(4, first)).toBeCloseTo(
      physicalSpecimenScale(8, second),
    );
  });

  it('uses one nm-per-pixel value even when viewport heights differ', () => {
    const viewports = [
      { x: 0, y: 0, width: 500, height: 600 },
      { x: 500, y: 0, width: 500, height: 300 },
    ];
    const value = computeNmPerPixel([dimension(100), dimension(200)], viewports)!;
    expect(projectedLengthPixels(dimension(100), value)).toBeCloseTo(
      projectedLengthPixels(dimension(200), value) / 2,
    );
  });

  it('keeps the visible physical scale bar mathematically tied to nm-per-pixel', () => {
    const bar = scaleBarForNmPerPixel(2.5, 80)!;
    expect(bar.nanometers / bar.pixels).toBeCloseTo(2.5);
    expect([1, 2, 5]).toContain(
      bar.nanometers / 10 ** Math.floor(Math.log10(bar.nanometers)),
    );
  });

  it('maps a normalized scanner position to the requested slab in transformed bounds', () => {
    const slab = normalizedSlabRange(-4, 6, 0.25, 0.08);
    expect(slab.center).toBeCloseTo(-1.5);
    expect(slab.halfThickness).toBeCloseTo(0.4);
  });

  it('orients scanner fixtures along a transformed specimen local axis', () => {
    const scene = new THREE.Scene();
    const parent = new THREE.Group();
    parent.rotation.set(0.18, -0.42, 0.11);
    parent.scale.set(1.4, 0.8, 1.1);
    scene.add(parent);
    const view = new SpecimenView(scene, 'hiv-1', 'performance');
    scene.remove(view.root);
    view.root.rotation.set(-0.23, 0.37, 0.08);
    view.root.scale.setScalar(1.3);
    parent.add(view.root);
    view.root.updateWorldMatrix(true, true);

    const slice = view.prepareScannerClipping('x', 0.4, 0.08);
    const expectedDirection = new THREE.Vector3(1, 0, 0)
      .applyQuaternion(view.root.getWorldQuaternion(new THREE.Quaternion()))
      .normalize();
    expect(slice.direction.angleTo(expectedDirection)).toBeLessThan(1e-6);
    expect(slice.width).toBeGreaterThan(0);
    expect(slice.height).toBeGreaterThan(0);
    expect(slice.center.toArray().every(Number.isFinite)).toBe(true);
    slice.restore();
    parent.remove(view.root);
    view.dispose();
  });

  it('keeps durable catalog preferences without reviving old automatic settings', () => {
    const storage = memoryStorage();
    storage.setItem(
      'virus-sim-v2.5-favorites',
      JSON.stringify(['t4', 'hiv-1', 'missing']),
    );
    storage.setItem('virus-sim-v2.5-font-scale', '130');
    storage.setItem(
      'virus-sim-v3-settings',
      JSON.stringify({ autoDocumentary: true, motion: 'active', follow: true }),
    );
    expect([...loadFavorites(storage)]).toEqual(['t4', 'hiv-1']);
    expect(loadFontScale(storage)).toBe('130');
    expect(loadVirusSimPreferences(storage, false)).toEqual({
      version: 1,
      decorationLevel: 'subtle',
      decorationPaused: false,
    });

    saveVirusSimPreferences(storage, {
      version: 1,
      decorationLevel: 'rich',
      decorationPaused: true,
    });
    const saved = JSON.parse(storage.getItem('virus-sim-v3.5-settings') ?? '{}');
    expect(saved).toEqual({
      version: 1,
      decorationLevel: 'rich',
      decorationPaused: true,
    });
  });
});

function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => [...data.keys()][index] ?? null,
    removeItem: (key) => data.delete(key),
    setItem: (key, value) => data.set(key, value),
  };
}

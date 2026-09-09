import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { ObservationStore } from '../../src/virus-sim/observation/ObservationStore';
import { SpecimenView } from '../../src/virus-sim/rendering/SpecimenView';
import { normalizedSlabRange } from '../../src/virus-sim/scanner/math';
import {
  loadFavorites,
  loadFontScale,
  loadVirusSimPreferences,
  saveVirusSimPreferences,
} from '../../src/virus-sim/ui/preferences';

describe('Virus Sim manual observation contracts', () => {
  it('does not change specimen pose or observation state while idle', () => {
    const store = new ObservationStore(false, 't4');
    const before = store.getSnapshot();
    for (let index = 0; index < 10_000; index += 1) store.step(1 / 60);
    expect(store.getSnapshot()).toEqual(before);
  });

  it('starts every selected species in a complete visible state', () => {
    const store = new ObservationStore(false, 't4');
    store.setView('section');
    store.setSectionOffset(0.37);
    store.setGenomeVisible(true);
    store.setLayerVisible('envelope', false);
    store.selectPart('tail-fiber');

    store.setPreset('hiv-1');

    const specimen = store.getSnapshot().specimen;
    expect(specimen.presetId).toBe('hiv-1');
    expect(specimen.view).toBe('surface');
    expect(specimen.explosion).toBe(0);
    expect(specimen.sectionOffset).toBe(0);
    expect(specimen.genomeVisible).toBe(false);
    expect(specimen.selectedPartId).toBeNull();
    expect(specimen.layerVisibility.envelope).toBe(true);
  });

  it('reassembles to exact original structural values', () => {
    const store = new ObservationStore(false, 't4');
    store.startStructuralReveal('exploded');
    for (let index = 0; index < 80; index += 1) store.step(1 / 60);
    expect(store.getSnapshot().specimen.explosion).toBeCloseTo(74);
    store.reassemble();
    for (let index = 0; index < 80; index += 1) store.step(1 / 60);
    const rebuilt = store.getSnapshot().specimen;
    expect(rebuilt.view).toBe('surface');
    expect(rebuilt.explosion).toBe(0);
    expect(rebuilt.sectionOffset).toBe(0);
  });

  it('restores exploded inspection after scanner exit', () => {
    const store = new ObservationStore(false, 't4');
    store.setExplosion(68);
    store.setScannerEnabled(true);
    expect(store.getSnapshot().specimen.explosion).toBe(0);
    expect(store.getSnapshot().specimen.view).toBe('surface');
    store.setScannerEnabled(false);
    expect(store.getSnapshot().specimen.explosion).toBe(68);
    expect(store.getSnapshot().specimen.view).toBe('exploded');
  });

  it('keeps a single normalized scanner probe', () => {
    const store = new ObservationStore(false, 'hiv-1');
    store.setScannerAxis('y');
    store.setScannerPosition(0.18);
    store.setScannerThickness(0.12);
    expect(store.getSnapshot().scanner.probe).toEqual({
      axis: 'y',
      position: 0.18,
      thickness: 0.12,
    });
  });

  it('maps a normalized scanner position to the requested slab', () => {
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

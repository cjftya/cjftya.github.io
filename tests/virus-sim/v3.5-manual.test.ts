import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { ObservationStore } from '../../src/virus-sim/observation/ObservationStore';
import { ManualCamera } from '../../src/virus-sim/rendering/ManualCamera';
import { SpecimenView } from '../../src/virus-sim/rendering/SpecimenView';
import {
  loadFontScale,
  loadVirusSimPreferences,
  removeLegacyVirusSimStorage,
  saveVirusSimPreferences,
} from '../../src/virus-sim/ui/preferences';

describe('Virus Sim manual observation contracts', () => {
  it('keeps observation state stable between user actions', () => {
    const store = new ObservationStore(false, 't4');
    const before = store.getSnapshot();
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

  it('keeps display preferences while removing retired collection data', () => {
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
    expect(loadFontScale(storage)).toBe('130');
    expect(loadVirusSimPreferences(storage, false)).toEqual({
      version: 1,
      decorationLevel: 'subtle',
      decorationPaused: false,
    });

    saveVirusSimPreferences(storage, {
      version: 1,
      decorationLevel: 'subtle',
      decorationPaused: true,
    });
    const saved = JSON.parse(storage.getItem('virus-sim-v3.5-settings') ?? '{}');
    expect(saved).toEqual({
      version: 1,
      decorationLevel: 'subtle',
      decorationPaused: true,
    });
    storage.setItem('virus-sim:lab-config:v1', '{}');
    storage.setItem('virus-sim-v2.5-recent', '["t4"]');
    removeLegacyVirusSimStorage(storage);
    expect(storage.getItem('virus-sim:lab-config:v1')).toBeNull();
    expect(storage.getItem('virus-sim-v2.5-favorites')).toBeNull();
    expect(storage.getItem('virus-sim-v2.5-recent')).toBeNull();
  });

  it('frames an off-center specimen around its geometric center on mobile aspect', () => {
    const camera = new ManualCamera();
    camera.setViewport(360, 380);
    const specimen = new THREE.Group();
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 6, 2));
    mesh.position.set(1.5, -2.25, 0.4);
    specimen.add(mesh);
    camera.frameObject(specimen);
    const pose = camera.getPose();
    expect(pose.target.x).toBeCloseTo(1.5);
    expect(pose.target.y).toBeCloseTo(-2.25);
    expect(pose.target.z).toBeCloseTo(0.4);
    expect(pose.distance).toBeGreaterThan(6 / 2);
    mesh.geometry.dispose();
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

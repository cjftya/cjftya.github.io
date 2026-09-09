import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import {
  VIRUS_HISTORY,
  getMissingHistoryIds,
  getVirusHistory,
} from '../../src/virus-sim/catalog/history/registry';
import {
  getHistorySource,
  HISTORY_SOURCES,
} from '../../src/virus-sim/catalog/history/sources';
import { VIRUS_CATALOG } from '../../src/virus-sim/catalog/registry';
import { getStructureSource } from '../../src/virus-sim/catalog/sources';
import { STRUCTURAL_SIGNATURES } from '../../src/virus-sim/catalog/structuralSignatures';
import { ObservationStore } from '../../src/virus-sim/observation/ObservationStore';
import { SpecimenView } from '../../src/virus-sim/rendering/SpecimenView';
import { createObservationModel } from '../../src/virus-sim/rendering/models/createObservationModel';
import { renderAppLayout } from '../../src/virus-sim/ui/layout';

const REPRESENTATIVE_IDS = [
  'sars-cov-2',
  'influenza-a',
  'hiv-1',
  'ebola-virus',
  'adenovirus-5',
  'rotavirus-rrv',
  't4',
  'tmv',
] as const;

describe('Virus Sim v4.3 context and structural fidelity foundation', () => {
  it('covers every catalog entry with sourced History & Impact data', () => {
    expect(VIRUS_HISTORY).toHaveLength(VIRUS_CATALOG.length);
    expect(new Set(VIRUS_HISTORY.map((entry) => entry.virusId)).size).toBe(
      VIRUS_CATALOG.length,
    );
    expect(getMissingHistoryIds()).toEqual([]);
    expect(new Set(HISTORY_SOURCES.map((source) => source.id)).size).toBe(
      HISTORY_SOURCES.length,
    );

    for (const history of VIRUS_HISTORY) {
      expect(history.impactSummary.trim().length, history.virusId).toBeGreaterThan(20);
      expect(history.discovery?.context.trim().length, history.virusId).toBeGreaterThan(
        10,
      );
      expect(history.hostContext?.sourceIds.length, history.virusId).toBeGreaterThan(0);
      expect(history.verifiedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      for (const sourceId of history.sourceIds) {
        expect(
          getHistorySource(sourceId),
          `${history.virusId}: ${sourceId}`,
        ).toBeDefined();
      }
      for (const event of history.events) {
        expect(event.summary.trim().length).toBeGreaterThan(10);
        for (const sourceId of event.sourceIds) {
          expect(getHistorySource(sourceId)).toBeDefined();
        }
      }
    }
  });

  it('keeps uncertain origin claims explicit for high-impact emerging viruses', () => {
    expect(getVirusHistory('sars-cov-2').uncertainty?.length).toBeGreaterThan(0);
    expect(getVirusHistory('ebola-virus').uncertainty?.length).toBeGreaterThan(0);
    expect(getVirusHistory('hiv-1').uncertainty?.length).toBeGreaterThan(0);
  });

  it('defines sourced and referentially valid signatures for all eight models', () => {
    expect(STRUCTURAL_SIGNATURES.map((entry) => entry.virusId)).toEqual(
      expect.arrayContaining([...REPRESENTATIVE_IDS]),
    );
    expect(new Set(STRUCTURAL_SIGNATURES.map((entry) => entry.id)).size).toBe(
      STRUCTURAL_SIGNATURES.length,
    );

    for (const signature of STRUCTURAL_SIGNATURES) {
      const definition = VIRUS_CATALOG.find((entry) => entry.id === signature.virusId);
      expect(definition).toBeDefined();
      expect(signature.builder).toBe(definition?.modelBuilder);
      expect(signature.layers.length).toBeGreaterThan(0);
      expect(signature.specialStructures.length).toBeGreaterThan(0);
      for (const component of signature.surfaceComponents) {
        expect(definition?.parts).toContain(component.partId);
        expect(definition?.layers.map((layer) => layer.id)).toContain(
          component.layerId,
        );
      }
      for (const evidence of signature.evidence) {
        expect(evidence.sourceIds.length).toBeGreaterThan(0);
        for (const sourceId of evidence.sourceIds) {
          expect(
            getStructureSource(sourceId),
            `${signature.id}: ${sourceId}`,
          ).toBeDefined();
        }
      }
    }
  });

  it('builds finite high and low models for every representative signature', () => {
    for (const virusId of REPRESENTATIVE_IDS) {
      for (const quality of ['high', 'low'] as const) {
        const model = createObservationModel(virusId, quality);
        model.root.updateMatrixWorld(true);
        const bounds = new THREE.Box3().setFromObject(model.root);
        const size = bounds.getSize(new THREE.Vector3());
        expect(
          bounds.min.toArray().every(Number.isFinite),
          `${virusId} ${quality}`,
        ).toBe(true);
        expect(
          bounds.max.toArray().every(Number.isFinite),
          `${virusId} ${quality}`,
        ).toBe(true);
        expect(size.length(), `${virusId} ${quality}`).toBeGreaterThan(0.5);
        expect(model.root.userData.structuralSignatureId).toBeTruthy();
        expect(
          model.objectExplosions.length + model.instanceExplosions.length,
        ).toBeGreaterThan(0);
        disposeObject(model.root);
      }
    }
  });

  it('keeps representative section, transparent, exploded and scanner flows valid', () => {
    for (const virusId of REPRESENTATIVE_IDS) {
      const scene = new THREE.Scene();
      const store = new ObservationStore(false, virusId);
      const view = new SpecimenView(scene, virusId, 'performance');
      for (const mode of ['surface', 'transparent', 'section', 'exploded'] as const) {
        store.setView(mode);
        if (mode === 'section') store.setSectionOffset(0.2);
        if (mode === 'exploded') store.setExplosion(64);
        store.setGenomeVisible(true);
        view.update(store.getSnapshot().specimen);
        expect(view.getBounds().isEmpty(), `${virusId} ${mode}`).toBe(false);
      }
      const slice = view.prepareScannerClipping('z', 0.5, 0.08);
      expect([slice.width, slice.height, slice.depth].every(Number.isFinite)).toBe(
        true,
      );
      expect(slice.width).toBeGreaterThan(0);
      slice.restore();
      view.dispose();
    }
  });

  it('gives the three enveloped representatives different surface signatures', () => {
    const expectedInstanceCounts = {
      'sars-cov-2': [64, 28, 10],
      'influenza-a': [52, 13, 7],
      'hiv-1': [22],
    } as const;
    for (const [virusId, expected] of Object.entries(expectedInstanceCounts)) {
      const model = createObservationModel(virusId, 'high');
      const counts = (model.layers.get('surface-protein') ?? [])
        .filter(
          (object): object is THREE.InstancedMesh =>
            object instanceof THREE.InstancedMesh,
        )
        .map((object) => object.count)
        .sort((left, right) => right - left);
      expect(counts).toEqual([...expected].sort((left, right) => right - left));
      disposeObject(model.root);
    }
  });

  it('places one compact History & Impact section after structure controls', () => {
    const root = { innerHTML: '' } as HTMLElement;
    renderAppLayout(root);
    expect(root.innerHTML.match(/id="history-impact"/g)).toHaveLength(1);
    expect(root.innerHTML).toContain('<small>CONTEXT</small>역사와 실제 영향');
    expect(root.innerHTML.indexOf('id="viewport"')).toBeLessThan(
      root.innerHTML.indexOf('id="history-impact"'),
    );
  });
});

function disposeObject(root: THREE.Object3D): void {
  root.traverse((object) => {
    if ('geometry' in object) {
      (object as THREE.Mesh).geometry.dispose();
    }
    if (!('material' in object)) return;
    const material = (object as THREE.Mesh).material;
    if (Array.isArray(material)) material.forEach((item) => item.dispose());
    else material.dispose();
  });
}

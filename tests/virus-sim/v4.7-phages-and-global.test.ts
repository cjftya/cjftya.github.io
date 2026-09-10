import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import {
  GEOMETRY_PROFILES,
  getGeometryProfile,
} from '../../src/virus-sim/catalog/geometryProfiles';
import {
  getMissingHistoryIds,
  getVirusHistory,
} from '../../src/virus-sim/catalog/history/registry';
import {
  PHAGE_SIGNATURE_PROFILES,
  getPhageSignatureProfile,
} from '../../src/virus-sim/catalog/phageProfiles';
import { VIRUS_CATALOG } from '../../src/virus-sim/catalog/registry';
import { getStructureSource } from '../../src/virus-sim/catalog/sources';
import {
  STRUCTURAL_SIGNATURES,
  getStructuralSignature,
} from '../../src/virus-sim/catalog/structuralSignatures';
import { ObservationStore } from '../../src/virus-sim/observation/ObservationStore';
import { SpecimenView } from '../../src/virus-sim/rendering/SpecimenView';
import { calculatePhageAxis } from '../../src/virus-sim/rendering/models/phageComponents';
import { createObservationModel } from '../../src/virus-sim/rendering/models/createObservationModel';

const STRUCTURAL_PHAGE_IDS = PHAGE_SIGNATURE_PROFILES.flatMap(
  (profile) => profile.virusIds,
);
const PHAGE_ENTRIES = VIRUS_CATALOG.filter((entry) =>
  entry.morphologyTags.includes('phage'),
);
const VIEW_REPRESENTATIVES = ['t4', 'lambda', 't7', 'p22', 't5'] as const;

describe('Virus Sim v4.7 phage rollout and global cleanup', () => {
  it('discovers every phage and preserves unusual specialized families', () => {
    expect(PHAGE_ENTRIES).toHaveLength(16);
    expect(new Set(PHAGE_ENTRIES.map((entry) => entry.id)).size).toBe(16);
    expect(STRUCTURAL_PHAGE_IDS).toHaveLength(8);
    expect(new Set(STRUCTURAL_PHAGE_IDS).size).toBe(8);
    expect(STRUCTURAL_PHAGE_IDS).toEqual(
      expect.arrayContaining([
        't4',
        'lambda',
        't7',
        'phi29',
        'p22',
        'hk97',
        't5',
        't1',
      ]),
    );

    for (const id of [
      'ms2',
      'm13',
      'phix174',
      'qbeta',
      'prd1',
      'phi6',
      'pm2',
      'ap205',
    ]) {
      expect(STRUCTURAL_PHAGE_IDS, id).not.toContain(id);
      expect(
        PHAGE_ENTRIES.find((entry) => entry.id === id),
        id,
      ).toBeDefined();
    }
  });

  it('uses sourced phage signatures and no generic builder IDs', () => {
    expect(
      VIRUS_CATALOG.filter((entry) =>
        String(entry.modelBuilder).startsWith('generic-'),
      ),
    ).toEqual([]);

    for (const id of STRUCTURAL_PHAGE_IDS) {
      const entry = PHAGE_ENTRIES.find((item) => item.id === id);
      const profile = getPhageSignatureProfile(id);
      const signature = getStructuralSignature(id);
      expect(entry, id).toBeDefined();
      expect(profile, id).toBeDefined();
      expect(signature?.phage, id).toBeDefined();
      expect(signature?.profileId, id).toBe(profile?.id);
      expect(signature?.builder, id).toBe(entry?.modelBuilder);
      for (const item of signature?.evidence ?? []) {
        expect(item.sourceIds.length, `${id}: ${item.componentId}`).toBeGreaterThan(0);
        for (const sourceId of item.sourceIds) {
          expect(getStructureSource(sourceId), `${id}: ${sourceId}`).toBeDefined();
        }
      }
    }
  });

  it('keeps phage structural values finite and biologically restrained', () => {
    for (const profile of PHAGE_SIGNATURE_PROFILES) {
      const phage = profile.signature;
      expect(phage.head.radius, profile.id).toBeGreaterThan(0);
      expect(Number.isFinite(phage.head.elongation), profile.id).toBe(true);
      expect(phage.head.elongation, profile.id).toBeGreaterThanOrEqual(0.8);
      expect(phage.head.elongation, profile.id).toBeLessThanOrEqual(1.5);
      expect(Number.isFinite(phage.tail.length), profile.id).toBe(true);
      expect(phage.tail.length, profile.id).toBeGreaterThan(0);
      expect(phage.tail.length, profile.id).toBeLessThanOrEqual(5);
      if (phage.distal?.receptor) {
        expect(Number.isInteger(phage.distal.receptor.count), profile.id).toBe(true);
        expect(phage.distal.receptor.count, profile.id).toBeGreaterThan(0);
        expect(phage.distal.receptor.count, profile.id).toBeLessThanOrEqual(12);
        expect(phage.distal.receptor.reach, profile.id).toBeGreaterThan(0);
      }
    }
  });

  it('builds every structural phage in both qualities with complete contracts', () => {
    for (const id of STRUCTURAL_PHAGE_IDS) {
      const entry = PHAGE_ENTRIES.find((item) => item.id === id)!;
      for (const quality of ['high', 'low'] as const) {
        const model = createObservationModel(id, quality);
        const bounds = new THREE.Box3().setFromObject(model.root);
        const size = bounds.getSize(new THREE.Vector3());
        expect(bounds.min.toArray().every(Number.isFinite), `${id} ${quality}`).toBe(
          true,
        );
        expect(bounds.max.toArray().every(Number.isFinite), `${id} ${quality}`).toBe(
          true,
        );
        expect(size.length(), `${id} ${quality}`).toBeGreaterThan(0.5);
        expect(Math.max(...size.toArray()), `${id} ${quality}`).toBeLessThan(16);
        for (const partId of entry.parts) {
          expect(
            model.parts.get(partId)?.length ?? 0,
            `${id}: ${partId}`,
          ).toBeGreaterThan(0);
        }
        for (const layer of entry.layers) {
          expect(
            model.layers.get(layer.id)?.length ?? 0,
            `${id}: ${layer.id}`,
          ).toBeGreaterThan(0);
        }
        const budget = renderBudget(model.root);
        expect(budget.calls, `${id} ${quality} calls`).toBeLessThanOrEqual(48);
        expect(budget.triangles, `${id} ${quality} triangles`).toBeLessThanOrEqual(
          250_000,
        );
        disposeObject(model.root);
      }
    }
  });

  it('retains distinct head, tail, baseplate and receptor identity markers', () => {
    for (const quality of ['high', 'low'] as const) {
      const t4 = createObservationModel('t4', quality);
      expect(
        t4.root.getObjectByName('phage-head-prolate-prolate-lattice'),
      ).toBeDefined();
      expect(t4.root.getObjectByName('phage-contractile-stacked-sheath')).toBeDefined();
      expect(t4.root.getObjectByName('phage-contractile-inner-tube')).toBeDefined();
      expect(
        t4.root.getObjectByName('phage-baseplate-contractile-complex'),
      ).toBeDefined();
      expect(t4.root.getObjectByName('phage-thin-segmented-tail-fibers')).toBeDefined();

      const lambda = createObservationModel('lambda', quality);
      expect(
        lambda.root.getObjectByName('phage-long-noncontractile-tail'),
      ).toBeDefined();
      expect(
        lambda.root.getObjectByName('phage-contractile-stacked-sheath'),
      ).toBeUndefined();

      const t7 = createObservationModel('t7', quality);
      expect(t7.root.getObjectByName('phage-head-tail-portal')).toBeDefined();
      expect(t7.root.getObjectByName('phage-compact-short-tail-nozzle')).toBeDefined();
      expect(t7.root.getObjectByName('phage-long-noncontractile-tail')).toBeUndefined();

      const p22 = createObservationModel('p22', quality);
      expect(p22.root.getObjectByName('phage-short-thick-tailspikes')).toBeDefined();
      const hk97 = createObservationModel('hk97', quality);
      expect(
        hk97.root.getObjectByName('phage-capsomers-crosslinked-thin'),
      ).toBeDefined();
      expect(
        hk97.root.getObjectByName('phage-capsid-focused-minimal-tail'),
      ).toBeDefined();

      const phi29 = createObservationModel('phi29', quality);
      expect(phi29.root.userData.phageHeadShape).toBe('elongated');
      const t5 = createObservationModel('t5', quality);
      const t1 = createObservationModel('t1', quality);
      expect(t5.root.userData.phageProfileId).not.toBe(t1.root.userData.phageProfileId);

      for (const model of [t4, lambda, t7, p22, hk97, phi29, t5, t1]) {
        disposeObject(model.root);
      }
    }
  });

  it('places each portal against its head-tail connector', () => {
    for (const profile of PHAGE_SIGNATURE_PROFILES) {
      if (!profile.signature.portal?.present) continue;
      const id = profile.virusIds[0]!;
      const model = createObservationModel(id, 'low');
      const portal = model.root.getObjectByName('phage-head-tail-portal');
      const axis = calculatePhageAxis(profile.signature);
      expect(portal, id).toBeDefined();
      expect(
        Math.abs((portal?.position.y ?? Infinity) - axis.connectorY),
        id,
      ).toBeLessThan(0.3);
      disposeObject(model.root);
    }
  });

  it('sweeps all 71 entries through build, bounds, contracts, sources and disposal', () => {
    expect(VIRUS_CATALOG).toHaveLength(71);
    expect(STRUCTURAL_SIGNATURES).toHaveLength(71);
    expect(getMissingHistoryIds()).toEqual([]);
    expect(new Set(VIRUS_CATALOG.map((entry) => entry.id)).size).toBe(71);

    for (const entry of VIRUS_CATALOG) {
      expect(getStructuralSignature(entry.id), entry.id).toBeDefined();
      expect(getVirusHistory(entry.id).virusId, entry.id).toBe(entry.id);
      expect(getGeometryProfile(entry.geometryProfileId), entry.id).toBeDefined();
      for (const sourceId of entry.sourceIds) {
        expect(getStructureSource(sourceId), `${entry.id}: ${sourceId}`).toBeDefined();
      }
      for (const quality of ['high', 'low'] as const) {
        const model = createObservationModel(entry.id, quality);
        const bounds = new THREE.Box3().setFromObject(model.root);
        const size = bounds.getSize(new THREE.Vector3());
        expect(bounds.isEmpty(), `${entry.id} ${quality}`).toBe(false);
        expect(
          [...bounds.min.toArray(), ...bounds.max.toArray()].every(Number.isFinite),
        ).toBe(true);
        expect(size.length(), `${entry.id} ${quality}`).toBeGreaterThan(0.5);
        expect(Math.max(...size.toArray()), `${entry.id} ${quality}`).toBeLessThan(24);
        for (const partId of entry.parts) {
          expect(
            model.parts.get(partId)?.length ?? 0,
            `${entry.id}: ${partId}`,
          ).toBeGreaterThan(0);
        }
        for (const partId of model.parts.keys()) {
          expect(entry.parts, `${entry.id}: orphan ${partId}`).toContain(partId);
        }
        for (const layer of entry.layers) {
          expect(
            model.layers.get(layer.id)?.length ?? 0,
            `${entry.id}: ${layer.id}`,
          ).toBeGreaterThan(0);
        }
        for (const layerId of model.layers.keys()) {
          expect(
            entry.layers.map((layer) => layer.id),
            `${entry.id}: orphan ${layerId}`,
          ).toContain(layerId);
        }
        disposeObject(model.root);
      }

      const rebuilt = createObservationModel(entry.id, 'low');
      expect(new THREE.Box3().setFromObject(rebuilt.root).isEmpty(), entry.id).toBe(
        false,
      );
      disposeObject(rebuilt.root);
    }

    expect(new Set(VIRUS_CATALOG.map((entry) => entry.geometryProfileId))).toEqual(
      new Set(Object.keys(GEOMETRY_PROFILES)),
    );
  });

  it('keeps phage view, explosion and scanner flows finite at v4.7', () => {
    for (const id of VIEW_REPRESENTATIVES) {
      const scene = new THREE.Scene();
      const store = new ObservationStore(false, id);
      expect(store.getSnapshot().version).toBe('virus-observation-v4.7');
      const view = new SpecimenView(scene, id, 'performance');
      for (const mode of ['surface', 'transparent', 'section', 'exploded'] as const) {
        store.setView(mode);
        if (mode === 'section') store.setSectionOffset(0.18);
        if (mode === 'exploded') store.setExplosion(68);
        store.setGenomeVisible(true);
        view.update(store.getSnapshot().specimen);
        const bounds = view.getBounds().getSize(new THREE.Vector3());
        expect(bounds.toArray().every(Number.isFinite), `${id}: ${mode}`).toBe(true);
        expect(bounds.length(), `${id}: ${mode}`).toBeGreaterThan(0.5);
      }
      const slice = view.prepareScannerClipping('z', 0.5, 0.08);
      expect([slice.width, slice.height, slice.depth].every(Number.isFinite), id).toBe(
        true,
      );
      expect(slice.width, id).toBeGreaterThan(0);
      slice.restore();
      view.dispose();
    }
  });
});

function renderBudget(root: THREE.Object3D): { calls: number; triangles: number } {
  let calls = 0;
  let triangles = 0;
  root.traverse((object) => {
    if (!('geometry' in object)) return;
    const mesh = object as THREE.Mesh;
    calls += Array.isArray(mesh.material) ? mesh.material.length : 1;
    const baseTriangles =
      (mesh.geometry.index?.count ??
        mesh.geometry.getAttribute('position')?.count ??
        0) / 3;
    triangles += baseTriangles * (mesh instanceof THREE.InstancedMesh ? mesh.count : 1);
  });
  return { calls, triangles };
}

function disposeObject(root: THREE.Object3D): void {
  root.traverse((object) => {
    if ('geometry' in object) (object as THREE.Mesh).geometry.dispose();
    if (!('material' in object)) return;
    const material = (object as THREE.Mesh).material;
    if (Array.isArray(material)) material.forEach((item) => item.dispose());
    else material.dispose();
  });
}

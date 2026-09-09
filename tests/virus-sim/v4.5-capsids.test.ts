import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import {
  CAPSID_SIGNATURE_PROFILES,
  getCapsidSignatureProfile,
} from '../../src/virus-sim/catalog/capsidProfiles';
import { getGeometryProfile } from '../../src/virus-sim/catalog/geometryProfiles';
import { getVirusHistory } from '../../src/virus-sim/catalog/history/registry';
import { VIRUS_CATALOG } from '../../src/virus-sim/catalog/registry';
import { getStructureSource } from '../../src/virus-sim/catalog/sources';
import { getStructuralSignature } from '../../src/virus-sim/catalog/structuralSignatures';
import { ObservationStore } from '../../src/virus-sim/observation/ObservationStore';
import { SpecimenView } from '../../src/virus-sim/rendering/SpecimenView';
import {
  getIcosahedralDirections,
  getIcosahedronVertices,
} from '../../src/virus-sim/rendering/models/capsidComponents';
import { createObservationModel } from '../../src/virus-sim/rendering/models/createObservationModel';

const ROLLOUT_ENTRIES = VIRUS_CATALOG.filter((entry) => {
  const family = getGeometryProfile(entry.geometryProfileId).family;
  return (
    (family === 'icosahedral' || family === 'layered') && entry.id !== 'vaccinia-mv'
  );
});

const VIEW_REPRESENTATIVES = [
  'adenovirus-5',
  'aav2',
  'hpv16',
  'norwalk',
  'rotavirus-rrv',
  'reovirus-t3d',
  'prd1',
  'stiv',
] as const;

describe('Virus Sim v4.5 icosahedral and layered structural fidelity rollout', () => {
  it('covers all 30 rollout entries with explicit sourced capsid profiles', () => {
    expect(ROLLOUT_ENTRIES).toHaveLength(30);
    expect(
      CAPSID_SIGNATURE_PROFILES.flatMap((profile) => profile.virusIds),
    ).toHaveLength(30);

    for (const entry of ROLLOUT_ENTRIES) {
      const profile = getCapsidSignatureProfile(entry.id);
      const signature = getStructuralSignature(entry.id);
      expect(profile, entry.id).toBeDefined();
      expect(signature?.profileId, entry.id).toBe(profile?.id);
      expect(signature?.builder, entry.id).toBe(entry.modelBuilder);
      expect(
        signature?.icosahedral ?? signature?.layeredCapsid,
        entry.id,
      ).toBeDefined();
      expect(getVirusHistory(entry.id).virusId).toBe(entry.id);

      for (const component of signature?.surfaceComponents ?? []) {
        expect(entry.parts, `${entry.id}: ${component.partId}`).toContain(
          component.partId,
        );
        expect(
          entry.layers.map((item) => item.id),
          `${entry.id}: ${component.layerId}`,
        ).toContain(component.layerId);
      }
      for (const item of signature?.evidence ?? []) {
        expect(item.sourceIds.length, entry.id).toBeGreaterThan(0);
        for (const sourceId of item.sourceIds) {
          expect(
            getStructureSource(sourceId),
            `${entry.id}: ${sourceId}`,
          ).toBeDefined();
        }
      }
      for (const layer of signature?.layeredCapsid?.layers ?? []) {
        expect(
          entry.layers.map((item) => item.id),
          `${entry.id}: ${layer.role}`,
        ).toContain(layer.role);
      }
    }
  });

  it('removes both generic capsid builders from the active catalog', () => {
    expect(
      VIRUS_CATALOG.filter((entry) => entry.modelBuilder === 'generic-icosahedral'),
    ).toEqual([]);
    expect(
      VIRUS_CATALOG.filter((entry) => entry.modelBuilder === 'generic-layered'),
    ).toEqual([]);
    expect(
      ROLLOUT_ENTRIES.filter((entry) => entry.modelBuilder === 'icosahedral-capsid'),
    ).toHaveLength(21);
    expect(
      ROLLOUT_ENTRIES.filter((entry) => entry.modelBuilder === 'layered-capsid'),
    ).toHaveLength(6);
  });

  it('uses deterministic subdivision-derived directions and exact vertices', () => {
    const highA = getIcosahedralDirections('high', 86).map((item) => item.toArray());
    const highB = getIcosahedralDirections('high', 86).map((item) => item.toArray());
    const low = getIcosahedralDirections('low', 42);
    const vertices = getIcosahedronVertices();

    expect(highA).toEqual(highB);
    expect(new Set(highA.map((item) => item.join(':'))).size).toBe(86);
    expect(low).toHaveLength(42);
    expect(vertices).toHaveLength(12);
    for (const direction of [...low, ...vertices]) {
      expect(direction.length()).toBeCloseTo(1, 6);
      expect(direction.toArray().every(Number.isFinite)).toBe(true);
    }
  });

  it('builds every rollout entry in high and low quality with complete contracts', () => {
    for (const entry of ROLLOUT_ENTRIES) {
      for (const quality of ['high', 'low'] as const) {
        const model = createObservationModel(entry.id, quality);
        model.root.updateMatrixWorld(true);
        const bounds = new THREE.Box3().setFromObject(model.root);
        const size = bounds.getSize(new THREE.Vector3());
        expect(
          bounds.min.toArray().every(Number.isFinite),
          `${entry.id} ${quality}`,
        ).toBe(true);
        expect(
          bounds.max.toArray().every(Number.isFinite),
          `${entry.id} ${quality}`,
        ).toBe(true);
        expect(size.length(), `${entry.id} ${quality}`).toBeGreaterThan(0.5);
        expect(model.root.userData.structuralSignatureId, entry.id).toBeTruthy();
        expect(model.root.userData.capsidProfileId, entry.id).toBeTruthy();
        for (const partId of entry.parts) {
          expect(
            model.parts.get(partId)?.length ?? 0,
            `${entry.id}: ${partId}`,
          ).toBeGreaterThan(0);
        }
        for (const layer of entry.layers) {
          expect(
            model.layers.get(layer.id)?.length ?? 0,
            `${entry.id}: ${layer.id}`,
          ).toBeGreaterThan(0);
        }
        const budget = renderBudget(model.root);
        expect(budget.calls, `${entry.id} ${quality} calls`).toBeLessThanOrEqual(48);
        expect(
          budget.triangles,
          `${entry.id} ${quality} triangles`,
        ).toBeLessThanOrEqual(150_000);
        disposeObject(model.root);
      }
    }
  });

  it('preserves high and low structural identity markers', () => {
    for (const quality of ['high', 'low'] as const) {
      const adenovirus = createObservationModel('adenovirus-5', quality);
      expect(
        adenovirus.root.getObjectByName('adenovirus-vertex-pentons'),
      ).toBeDefined();
      expect(
        adenovirus.root.getObjectByName('adenovirus-fiber-shafts-and-knobs'),
      ).toBeDefined();

      const aav = createObservationModel('aav2', quality);
      expect(aav.root.getObjectByName('dimple-rings')).toBeDefined();

      const papilloma = createObservationModel('hpv16', quality);
      expect(
        papilloma.root.getObjectByName('ordered-surface-pentameric'),
      ).toBeDefined();

      const calici = createObservationModel('norwalk', quality);
      expect(
        calici.root.getObjectByName('ordered-surface-protruding-domain'),
      ).toBeDefined();

      const rotavirus = createObservationModel('rotavirus-rrv', quality);
      expect(rotavirus.root.userData.layerRoles).toEqual([
        'outer-capsid',
        'middle-capsid',
        'core-capsid',
      ]);
      expect(
        rotavirus.root.getObjectByName('layered-11-genome-segments')?.children,
      ).toHaveLength(11);

      const reovirus = createObservationModel('reovirus-t3d', quality);
      expect(
        reovirus.root.getObjectByName('reovirus-channelled-turrets'),
      ).toBeDefined();

      const prd1 = createObservationModel('prd1', quality);
      expect(prd1.root.getObjectByName('layer-inner-membrane-membrane')).toBeDefined();

      const stiv = createObservationModel('stiv', quality);
      expect(stiv.root.getObjectByName('stiv-wide-vertex-turrets')).toBeDefined();
      expect(stiv.root.getObjectByName('layer-inner-membrane-membrane')).toBeDefined();

      for (const model of [
        adenovirus,
        aav,
        papilloma,
        calici,
        rotavirus,
        reovirus,
        prd1,
        stiv,
      ]) {
        disposeObject(model.root);
      }
    }
  });

  it('keeps the named structural groups distinguishable without relying on color', () => {
    const ids = [
      'ms2',
      'adenovirus-5',
      'aav2',
      'hpv16',
      'norwalk',
      'astrovirus-1',
    ] as const;
    const patterns = ids.map((id) => {
      const model = createObservationModel(id, 'low');
      const value = `${model.root.userData.surfacePattern}:${model.root.children
        .map((item) => item.name)
        .filter(Boolean)
        .join('|')}`;
      disposeObject(model.root);
      return value;
    });
    expect(new Set(patterns).size).toBe(patterns.length);

    const layeredIds = [
      'rotavirus-rrv',
      'reovirus-t3d',
      'bluetongue',
      'ibdv',
      'prd1',
      'pm2',
      'stiv',
    ] as const;
    const layeredStructures = layeredIds.map((id) => {
      const model = createObservationModel(id, 'low');
      const value = `${model.root.userData.layerRoles.join(':')}:${model.root.children
        .map((item) => item.name)
        .filter(Boolean)
        .join('|')}`;
      disposeObject(model.root);
      return value;
    });
    expect(new Set(layeredStructures).size).toBe(layeredStructures.length);
  });

  it('keeps surface, transparent, section, exploded and scanner flows finite', () => {
    for (const virusId of VIEW_REPRESENTATIVES) {
      const scene = new THREE.Scene();
      const store = new ObservationStore(false, virusId);
      const view = new SpecimenView(scene, virusId, 'performance');
      for (const mode of ['surface', 'transparent', 'section', 'exploded'] as const) {
        store.setView(mode);
        if (mode === 'section') store.setSectionOffset(0.18);
        if (mode === 'exploded') store.setExplosion(70);
        store.setGenomeVisible(true);
        view.update(store.getSnapshot().specimen);
        const bounds = view.getBounds();
        expect(bounds.isEmpty(), `${virusId} ${mode}`).toBe(false);
        expect(
          bounds.getSize(new THREE.Vector3()).toArray().every(Number.isFinite),
        ).toBe(true);
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

  it('protects v4.4 representative models and History & Impact mappings', () => {
    for (const virusId of [
      'sars-cov-2',
      'influenza-a',
      'hiv-1',
      'hsv1',
      'vsv-indiana',
    ] as const) {
      const model = createObservationModel(virusId, 'low');
      expect(new THREE.Box3().setFromObject(model.root).isEmpty(), virusId).toBe(false);
      expect(getVirusHistory(virusId).virusId).toBe(virusId);
      disposeObject(model.root);
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

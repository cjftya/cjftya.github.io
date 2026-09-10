import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { getGeometryProfile } from '../../src/virus-sim/catalog/geometryProfiles';
import { getVirusHistory } from '../../src/virus-sim/catalog/history/registry';
import { VIRUS_CATALOG } from '../../src/virus-sim/catalog/registry';
import {
  SPECIAL_GEOMETRY_SIGNATURE_PROFILES,
  getSpecialGeometrySignatureProfile,
} from '../../src/virus-sim/catalog/specialGeometryProfiles';
import { getStructureSource } from '../../src/virus-sim/catalog/sources';
import { getStructuralSignature } from '../../src/virus-sim/catalog/structuralSignatures';
import { ObservationStore } from '../../src/virus-sim/observation/ObservationStore';
import { SpecimenView } from '../../src/virus-sim/rendering/SpecimenView';
import {
  createBodyCenterline,
  sampleCenterlineFrames,
} from '../../src/virus-sim/rendering/models/filamentComponents';
import { createObservationModel } from '../../src/virus-sim/rendering/models/createObservationModel';

const TARGET_BUILDERS = new Set([
  'tmv',
  'm13',
  'filovirus',
  'vaccinia',
  'plant-filament',
  'archaeal-rod',
  'spindle-virus',
  'geminate-capsid',
]);

const TARGET_ENTRIES = VIRUS_CATALOG.filter((entry) => {
  const family = getGeometryProfile(entry.geometryProfileId).family;
  return (
    ['filament', 'rod', 'spindle', 'geminate'].includes(family) ||
    TARGET_BUILDERS.has(entry.modelBuilder)
  );
});

const VIEW_REPRESENTATIVES = [
  'tmv',
  'm13',
  'ebola-virus',
  'pvx',
  'sirv2',
  'ssv1',
  'maize-streak',
  'vaccinia-mv',
] as const;

describe('Virus Sim v4.6 filament, helical and special geometry rollout', () => {
  it('discovers all 17 targets with explicit sourced structural profiles', () => {
    expect(TARGET_ENTRIES).toHaveLength(17);
    expect(
      SPECIAL_GEOMETRY_SIGNATURE_PROFILES.flatMap((profile) => profile.virusIds),
    ).toHaveLength(17);

    for (const entry of TARGET_ENTRIES) {
      const profile = getSpecialGeometrySignatureProfile(entry.id);
      const signature = getStructuralSignature(entry.id);
      expect(profile, entry.id).toBeDefined();
      expect(signature?.profileId, entry.id).toBe(profile?.id);
      expect(signature?.builder, entry.id).toBe(entry.modelBuilder);
      expect(signature?.helical ?? signature?.specialGeometry, entry.id).toBeDefined();
      expect(getGeometryProfile(entry.geometryProfileId)).toBeDefined();
      expect(getVirusHistory(entry.id).virusId).toBe(entry.id);
      for (const item of signature?.evidence ?? []) {
        expect(item.sourceIds.length, entry.id).toBeGreaterThan(0);
        for (const sourceId of item.sourceIds) {
          expect(
            getStructureSource(sourceId),
            `${entry.id}: ${sourceId}`,
          ).toBeDefined();
        }
      }
    }
  });

  it('removes active generic filament, rod, spindle and geminate dependencies', () => {
    for (const builder of [
      'generic-filament',
      'generic-rod',
      'generic-spindle',
      'generic-geminate',
    ] as const) {
      expect(
        VIRUS_CATALOG.filter((entry) => String(entry.modelBuilder) === builder),
      ).toEqual([]);
    }
    expect(
      TARGET_ENTRIES.filter((entry) => entry.modelBuilder === 'plant-filament'),
    ).toHaveLength(3);
    expect(
      TARGET_ENTRIES.filter((entry) => entry.modelBuilder === 'filovirus'),
    ).toHaveLength(6);
    expect(
      TARGET_ENTRIES.filter((entry) => entry.modelBuilder === 'spindle-virus'),
    ).toHaveLength(2);
  });

  it('generates deterministic finite centerlines and parallel-transport frames', () => {
    for (const archetype of ['straight', 'gentle-bend', 'flexible-s'] as const) {
      const first = createBodyCenterline(archetype, 8.2, 'high');
      const second = createBodyCenterline(archetype, 8.2, 'high');
      expect(first.points.map((point) => point.toArray())).toEqual(
        second.points.map((point) => point.toArray()),
      );
      expect(
        first.points.every((point) => point.toArray().every(Number.isFinite)),
      ).toBe(true);
      for (let index = 1; index < first.points.length; index += 1) {
        expect(
          first.points[index]!.distanceTo(first.points[index - 1]!),
        ).toBeGreaterThan(0.01);
      }
      const frames = sampleCenterlineFrames(first.curve, 40);
      for (const frame of frames) {
        expect(
          [
            ...frame.point.toArray(),
            ...frame.tangent.toArray(),
            ...frame.normal.toArray(),
            ...frame.binormal.toArray(),
          ].every(Number.isFinite),
        ).toBe(true);
        expect(Math.abs(frame.tangent.dot(frame.normal))).toBeLessThan(1e-5);
        expect(Math.abs(frame.tangent.dot(frame.binormal))).toBeLessThan(1e-5);
      }
    }
  });

  it('builds every target in high and low quality with complete contracts', () => {
    for (const entry of TARGET_ENTRIES) {
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
        ).toBeLessThanOrEqual(250_000);
        disposeObject(model.root);
      }
    }
  });

  it('preserves the required low-quality structural identity markers', () => {
    for (const quality of ['high', 'low'] as const) {
      const tmv = createObservationModel('tmv', quality);
      expect(tmv.root.getObjectByName('tmv-ordered-helical-coat')).toBeDefined();
      expect(tmv.root.getObjectByName('tmv-open-central-channel')).toBeDefined();
      expect(tmv.root.getObjectByName('tmv-coat-bound-rna-helix')).toBeDefined();

      const m13 = createObservationModel('m13', quality);
      expect(
        m13.root.getObjectByName('m13-asymmetric-terminal-proteins')?.children,
      ).toHaveLength(2);

      const filovirus = createObservationModel('ebola-virus', quality);
      expect(
        filovirus.root.getObjectByName('filovirus-tubular-envelope'),
      ).toBeDefined();
      expect(filovirus.root.getObjectByName('filovirus-tubular-matrix')).toBeDefined();
      expect(filovirus.root.getObjectByName('filovirus-helical-rnp')).toBeDefined();

      const sirv2 = createObservationModel('sirv2', quality);
      expect(
        sirv2.root.getObjectByName('sirv2-three-fibers-each-end')?.children,
      ).toHaveLength(6);

      const ssv1 = createObservationModel('ssv1', quality);
      expect(
        ssv1.root.getObjectByName('ssv1-one-polar-fiber-crown')?.children,
      ).toHaveLength(6);
      const atv = createObservationModel('atv', quality);
      expect(
        atv.root.getObjectByName('atv-two-opposed-terminal-tails')?.children,
      ).toHaveLength(2);

      const geminate = createObservationModel('maize-streak', quality);
      expect(
        geminate.root.getObjectByName('maize-streak-faceted-twin-lobes')?.children,
      ).toHaveLength(2);
      expect(geminate.root.getObjectByName('geminate-shared-interface')).toBeDefined();

      const vaccinia = createObservationModel('vaccinia-mv', quality);
      expect(
        vaccinia.root.getObjectByName('vaccinia-layered-rounded-brick'),
      ).toBeDefined();
      expect(
        vaccinia.root.getObjectByName('vaccinia-dumbbell-core-wall'),
      ).toBeDefined();
      expect(
        vaccinia.root.getObjectByName('vaccinia-paired-lateral-bodies')?.children,
      ).toHaveLength(2);

      for (const model of [tmv, m13, filovirus, sirv2, ssv1, atv, geminate, vaccinia]) {
        disposeObject(model.root);
      }
    }
  });

  it('keeps elongated and special families distinguishable without color', () => {
    const structures = VIEW_REPRESENTATIVES.map((id) => {
      const model = createObservationModel(id, 'low');
      const bounds = new THREE.Box3()
        .setFromObject(model.root)
        .getSize(new THREE.Vector3());
      const value = `${model.root.userData.rigidity ?? model.root.userData.specialGeometryKind ?? model.root.userData.envelopedFamily}:${bounds
        .toArray()
        .map((item) => item.toFixed(2))
        .join(':')}:${model.root.children
        .map((item) => item.name)
        .filter(Boolean)
        .join('|')}`;
      disposeObject(model.root);
      return value;
    });
    expect(new Set(structures).size).toBe(structures.length);
  });

  it('aligns terminal structures with finite endpoint tangents', () => {
    for (const id of ['m13', 'pvy', 'sirv2', 'ssv1', 'atv'] as const) {
      const model = createObservationModel(id, 'low');
      const terminals: THREE.Object3D[] = [];
      model.root.traverse((object) => {
        if (object.userData.endpointTangent) terminals.push(object);
      });
      expect(terminals.length, id).toBeGreaterThan(0);
      for (const object of terminals) {
        const tangent = object.userData.endpointTangent as number[];
        expect(tangent.every(Number.isFinite), id).toBe(true);
        expect(new THREE.Vector3().fromArray(tangent).length()).toBeCloseTo(1, 5);
      }
      disposeObject(model.root);
    }
  });

  it('keeps surface, transparent, section, exploded and scanner flows finite', () => {
    for (const virusId of VIEW_REPRESENTATIVES) {
      const scene = new THREE.Scene();
      const store = new ObservationStore(false, virusId);
      expect(store.getSnapshot().version).toBe('virus-observation-v4.7');
      const view = new SpecimenView(scene, virusId, 'performance');
      for (const mode of ['surface', 'transparent', 'section', 'exploded'] as const) {
        store.setView(mode);
        if (mode === 'section') store.setSectionOffset(0.18);
        if (mode === 'exploded') store.setExplosion(68);
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

  it('protects v4.4 and v4.5 representative models', () => {
    for (const virusId of [
      'sars-cov-2',
      'influenza-a',
      'hiv-1',
      'adenovirus-5',
      'rotavirus-rrv',
      'stiv',
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

import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import {
  CORONAVIRUS_RENDER_PROFILES,
  ENVELOPED_SIGNATURE_PROFILES,
  getEnvelopedSignatureProfile,
} from '../../src/virus-sim/catalog/envelopedProfiles';
import { getGeometryProfile } from '../../src/virus-sim/catalog/geometryProfiles';
import { getVirusHistory } from '../../src/virus-sim/catalog/history/registry';
import { VIRUS_CATALOG } from '../../src/virus-sim/catalog/registry';
import { getStructureSource } from '../../src/virus-sim/catalog/sources';
import { getStructuralSignature } from '../../src/virus-sim/catalog/structuralSignatures';
import { ObservationStore } from '../../src/virus-sim/observation/ObservationStore';
import { SpecimenView } from '../../src/virus-sim/rendering/SpecimenView';
import { createObservationModel } from '../../src/virus-sim/rendering/models/createObservationModel';

const ENVELOPED_BUILDERS = new Set([
  'coronavirus',
  'lentivirus',
  'influenza',
  'hsv',
  'vsv',
  'filovirus',
  'generic-enveloped',
]);

const V44_CATALOG = VIRUS_CATALOG.slice(0, 71);
const ENVELOPED_ENTRIES = V44_CATALOG.filter(
  (entry) =>
    entry.morphologyTags.includes('enveloped') ||
    ENVELOPED_BUILDERS.has(entry.modelBuilder),
);

const VIEW_REPRESENTATIVES = [
  'sars-cov-2',
  'influenza-a',
  'hiv-1',
  'hsv1',
  'vsv-indiana',
  'hbv',
  'sindbis',
  'phi6',
] as const;

describe('Virus Sim v4.4 enveloped structural fidelity rollout', () => {
  it('tracks all 23 enveloped entries with explicit sourced profiles', () => {
    expect(ENVELOPED_ENTRIES).toHaveLength(23);
    expect(
      ENVELOPED_SIGNATURE_PROFILES.flatMap((profile) => profile.virusIds).filter((id) =>
        V44_CATALOG.some((entry) => entry.id === id),
      ),
    ).toHaveLength(23);

    for (const entry of ENVELOPED_ENTRIES) {
      const profile = getEnvelopedSignatureProfile(entry.id);
      const signature = getStructuralSignature(entry.id);
      expect(profile, entry.id).toBeDefined();
      expect(signature?.profileId, entry.id).toBe(profile?.id);
      expect(signature?.builder, entry.id).toBe(entry.modelBuilder);
      expect(signature?.layers.length, entry.id).toBeGreaterThan(0);
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

  it('removes generic-enveloped from the active catalog', () => {
    expect(
      ENVELOPED_ENTRIES.filter(
        (entry) => String(entry.modelBuilder) === 'generic-enveloped',
      ),
    ).toEqual([]);
    expect(V44_CATALOG.filter((entry) => entry.modelBuilder === 'hbv')).toHaveLength(1);
    expect(
      V44_CATALOG.filter((entry) => entry.modelBuilder === 'alphavirus'),
    ).toHaveLength(2);
    expect(
      V44_CATALOG.filter((entry) => entry.modelBuilder === 'cystovirus'),
    ).toHaveLength(1);
  });

  it('uses four coronavirus subgroup profiles without per-entry geometry forks', () => {
    expect(CORONAVIRUS_RENDER_PROFILES).toHaveLength(4);
    expect(
      CORONAVIRUS_RENDER_PROFILES.flatMap((profile) => profile.virusIds),
    ).toHaveLength(7);
    expect(getEnvelopedSignatureProfile('hcov-229e')?.id).toBe(
      getEnvelopedSignatureProfile('hcov-nl63')?.id,
    );
    expect(getEnvelopedSignatureProfile('hcov-oc43')?.id).toBe(
      getEnvelopedSignatureProfile('hcov-hku1')?.id,
    );
    expect(getEnvelopedSignatureProfile('sars-cov')?.id).toBe(
      getEnvelopedSignatureProfile('sars-cov-2')?.id,
    );

    const embeco = createObservationModel('hcov-oc43', 'high');
    expect(surfaceInstances(embeco.root)).toHaveLength(4);
    expect(embeco.root.userData.envelopedProfileId).toBe('coronavirus-beta-embeco');
    disposeObject(embeco.root);
  });

  it('builds every enveloped entry in high and low quality with complete contracts', () => {
    for (const entry of ENVELOPED_ENTRIES) {
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

  it('keeps family identity invariants visible in model structure', () => {
    const influenza = createObservationModel('influenza-a', 'high');
    expect(
      influenza.root.getObjectByName('influenza-eight-rnp-segments')?.children,
    ).toHaveLength(8);
    expect(surfaceInstances(influenza.root)).toHaveLength(3);

    const hiv = createObservationModel('hiv-1', 'high');
    expect(hiv.root.getObjectByName('lentivirus-conical-core')).toBeDefined();
    expect(hiv.root.getObjectByName('lentivirus-paired-rna')?.children).toHaveLength(2);

    const hsv = createObservationModel('hsv1', 'high');
    expect(hsv.root.getObjectByName('hsv-tegument-cloud')).toBeDefined();
    expect(hsv.root.getObjectByName('hsv-icosahedral-capsid')).toBeDefined();
    expect(surfaceInstances(hsv.root)).toHaveLength(2);

    const vsv = createObservationModel('vsv-indiana', 'high');
    const vsvSize = new THREE.Box3()
      .setFromObject(vsv.root)
      .getSize(new THREE.Vector3());
    expect(vsv.root.getObjectByName('vsv-bullet-envelope')).toBeDefined();
    expect(vsv.root.getObjectByName('vsv-directional-helical-rnp')).toBeDefined();
    expect(vsvSize.y / vsvSize.x).toBeGreaterThan(1.25);

    const hbv = createObservationModel('hbv', 'high');
    expect(hbv.root.getObjectByName('hbv-icosahedral-core')).toBeDefined();
    expect(hbv.root.getObjectByName('partial-double-stranded-dna')).toBeDefined();

    const alphavirus = createObservationModel('sindbis', 'high');
    expect(
      alphavirus.root.getObjectByName('alphavirus-icosahedral-nucleocapsid'),
    ).toBeDefined();
    expect(alphavirus.root.getObjectByName('surface-e1-e2-trimer')).toBeDefined();

    const phi6 = createObservationModel('phi6', 'high');
    expect(phi6.root.getObjectByName('phi6-outer-core')).toBeDefined();
    expect(phi6.root.getObjectByName('phi6-inner-core')).toBeDefined();
    expect(
      phi6.root.getObjectByName('phi6-three-dsrna-segments')?.children,
    ).toHaveLength(3);

    for (const model of [influenza, hiv, hsv, vsv, hbv, alphavirus, phi6]) {
      disposeObject(model.root);
    }
  });

  it('keeps section, transparent, exploded and scanner flows valid', () => {
    for (const virusId of VIEW_REPRESENTATIVES) {
      const scene = new THREE.Scene();
      const store = new ObservationStore(false, virusId);
      const view = new SpecimenView(scene, virusId, 'performance');
      for (const mode of ['surface', 'transparent', 'section', 'exploded'] as const) {
        store.setView(mode);
        if (mode === 'section') store.setSectionOffset(0.2);
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

  it('keeps unsupported species differences at a shared family level', () => {
    const filovirusProfiles = [
      'ebola-virus',
      'sudan-virus',
      'bundibugyo-virus',
      'tai-forest-virus',
      'reston-virus',
      'bombali-virus',
    ].map((id) => getStructuralSignature(id)?.profileId);
    expect(new Set(filovirusProfiles)).toEqual(new Set(['filovirus-family']));

    const first = createObservationModel('ebola-virus', 'low');
    const second = createObservationModel('sudan-virus', 'low');
    const firstSize = new THREE.Box3()
      .setFromObject(first.root)
      .getSize(new THREE.Vector3());
    const secondSize = new THREE.Box3()
      .setFromObject(second.root)
      .getSize(new THREE.Vector3());
    expect(firstSize.toArray()).toEqual(secondSize.toArray());
    expect(first.root.userData.familyModel).toBe(true);
    expect(second.root.userData.familyModel).toBe(true);
    disposeObject(first.root);
    disposeObject(second.root);
  });
});

function surfaceInstances(root: THREE.Object3D): THREE.InstancedMesh[] {
  const meshes: THREE.InstancedMesh[] = [];
  root.traverse((object) => {
    if (object instanceof THREE.InstancedMesh && object.name.startsWith('surface-')) {
      meshes.push(object);
    }
  });
  return meshes;
}

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

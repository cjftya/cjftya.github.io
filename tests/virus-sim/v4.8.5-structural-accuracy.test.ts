import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { PHYSICAL_DIMENSIONS } from '../../src/virus-sim/catalog/dimensions';
import { auditStructureExplanations } from '../../src/virus-sim/catalog/explanations/audit';
import { getStructureExplanation } from '../../src/virus-sim/catalog/explanations/registry';
import {
  getHumanRnpEvidence,
  getHumanRnpProfile,
} from '../../src/virus-sim/catalog/humanExpansionProfiles';
import { getVirusHistory } from '../../src/virus-sim/catalog/history/registry';
import { VIRUS_CATALOG } from '../../src/virus-sim/catalog/registry';
import { getStructureSource } from '../../src/virus-sim/catalog/sources';
import { getStructuralSignature } from '../../src/virus-sim/catalog/structuralSignatures';
import { createObservationModel } from '../../src/virus-sim/rendering/models/createObservationModel';

const ORTHOFLAVIVIRUS_IDS = [
  'dengue-virus',
  'zika-virus',
  'yellow-fever-virus',
  'west-nile-virus',
] as const;

const INTENTIONALLY_SHARED_GROUPS = [
  ['sars-cov', 'sars-cov-2'],
  ['influenza-a-h1n1pdm09', 'influenza-a-h5n1'],
  ['hiv-1', 'hiv-2'],
  ['varicella-zoster-virus', 'epstein-barr-virus'],
  [
    'ebola-virus',
    'sudan-virus',
    'bundibugyo-virus',
    'tai-forest-virus',
    'reston-virus',
    'bombali-virus',
  ],
  ['hcov-229e', 'hcov-nl63'],
  ['hcov-oc43', 'hcov-hku1'],
] as const;

describe('Virus Sim v4.8.5 structural accuracy corrections', () => {
  it('keeps the exact 95-entry catalog and complete metadata coverage', () => {
    expect(VIRUS_CATALOG).toHaveLength(95);
    expect(new Set(VIRUS_CATALOG.map(({ id }) => id)).size).toBe(95);
    expect(new Set(Object.keys(PHYSICAL_DIMENSIONS))).toEqual(
      new Set(VIRUS_CATALOG.map(({ id }) => id)),
    );

    for (const definition of VIRUS_CATALOG) {
      expect(
        getStructuralSignature(definition.id),
        `${definition.id}:signature`,
      ).toBeDefined();
      expect(
        getVirusHistory(definition.id).impactSummary,
        `${definition.id}:history`,
      ).not.toBe('');
      expect(definition.sourceIds.length, `${definition.id}:sources`).toBeGreaterThan(
        0,
      );
      for (const sourceId of definition.sourceIds) {
        expect(
          getStructureSource(sourceId),
          `${definition.id}:${sourceId}`,
        ).toBeDefined();
      }
    }
    expect(auditStructureExplanations().issues).toEqual([]);
  });

  it('removes the false Rubella icosahedral core and preserves rows in high and low quality', () => {
    const profile = getHumanRnpProfile('rubella-virus');
    expect(profile.core).toBe('grid-like-rnp');
    expect(profile.surfaceOrganization).toBe('helical-rows');

    for (const quality of ['high', 'low'] as const) {
      const model = createObservationModel('rubella-virus', quality);
      const names = objectNames(model.root);
      expect(names).toContain('surface-row-e1-e2');
      expect(names.some((name) => name.includes('grid-like-rnp'))).toBe(true);
      expect(names.some((name) => name.includes('icosahedral'))).toBe(false);
      expect(model.parts.get('nucleocapsid')?.length).toBeGreaterThan(0);
      expect(model.parts.get('genome')?.length).toBeGreaterThan(0);
      disposeObject(model.root);
    }
  });

  it('separates the Orthoflavivirus E/M shell from a non-icosahedral inner region', () => {
    for (const id of ORTHOFLAVIVIRUS_IDS) {
      const profile = getHumanRnpProfile(id);
      expect(profile.surfaceOrganization, id).toBe('icosahedral-raft');
      expect(profile.core, id).toBe('irregular-rnp');
      const evidence = getHumanRnpEvidence(profile, id);
      expect(
        evidence.some(({ componentId }) => componentId === 'surface-shell'),
        id,
      ).toBe(true);
      expect(
        evidence.find(({ componentId }) => componentId === 'inner-core')?.level,
        id,
      ).toBe('conceptual');

      for (const quality of ['high', 'low'] as const) {
        const model = createObservationModel(id, quality);
        const names = objectNames(model.root);
        expect(names).toContain('surface-raft-e-m-raft');
        expect(names.some((name) => name.includes('irregular-rnp'))).toBe(true);
        expect(names.some((name) => name.includes('icosahedral'))).toBe(false);
        disposeObject(model.root);
      }
    }
  });

  it('renders HCV as a heterogeneous lipoviroparticle concept without an icosahedral core', () => {
    const profile = getHumanRnpProfile('hepatitis-c-virus');
    expect(profile.core).toBe('irregular-rnp');
    expect(profile.surfaceOrganization).toBe('irregular-patches');
    expect(profile.envelopeDeformation).toBeGreaterThan(0);

    for (const quality of ['high', 'low'] as const) {
      const model = createObservationModel('hepatitis-c-virus', quality);
      const names = objectNames(model.root);
      expect(names).toContain('lipoprotein-associated-patches');
      expect(names).toContain('surface-patch-e1-e2');
      expect(names.some((name) => name.includes('irregular-rnp'))).toBe(true);
      expect(names.some((name) => name.includes('icosahedral'))).toBe(false);
      disposeObject(model.root);
    }
  });

  it('limits PDB 6IW4 to its actual Yellow fever E-protein scope', () => {
    const source = getStructureSource('pdb-6iw4');
    expect(source?.scope).toContain('soluble envelope E protein');
    expect(source?.scope).toContain('X-ray');
    expect(source?.scope).toContain('전체 입자 구조가 아님');
    expect(source?.scope).not.toContain('cryo-EM 기반 구조');

    const dengue = getHumanRnpEvidence(
      getHumanRnpProfile('dengue-virus'),
      'dengue-virus',
    );
    const yellowFever = getHumanRnpEvidence(
      getHumanRnpProfile('yellow-fever-virus'),
      'yellow-fever-virus',
    );
    expect(
      dengue.find(({ componentId }) => componentId === 'surface-shell')?.level,
    ).toBe('observed');
    expect(
      yellowFever.find(({ componentId }) => componentId === 'surface-shell')?.level,
    ).toBe('family-supported');
  });

  it('uses exact G, H and HN attachment-protein identities', () => {
    const expected = {
      'nipah-virus': 'attachment-g',
      'measles-virus': 'attachment-h',
      'mumps-virus': 'attachment-hn',
    } as const;
    for (const [id, attachmentId] of Object.entries(expected)) {
      const profile = getHumanRnpProfile(id);
      expect(
        profile.surfaces.map(({ id: componentId }) => componentId),
        id,
      ).toContain(attachmentId);
      expect(
        profile.surfaces.map(({ id: componentId }) => componentId),
        id,
      ).toContain('fusion-f');
      expect(
        getStructureExplanation(id, { kind: 'part', id: 'spike' })?.actualName,
        id,
      ).toContain(profile.surfaces[0]!.label);
    }
  });

  it('separates CCHF and Hantaan evidence while conservatively sharing geometry', () => {
    const cchf = getHumanRnpProfile('cchf-virus');
    const hantaan = getHumanRnpProfile('hantaan-virus');
    expect(cchf.id).toBe('nairovirus-cchf-trisegmented');
    expect(hantaan.id).toBe('hantavirus-hantaan-trisegmented');
    expect(cchf.id).not.toBe(hantaan.id);
    expect(cchf.envelopeRadius).toBe(hantaan.envelopeRadius);
    expect(cchf.envelopeScale).toEqual(hantaan.envelopeScale);
    expect(cchf.core).toBe('segmented');
    expect(hantaan.core).toBe('segmented');
    expect(cchf.sourceIds).toEqual(['ictv-nairoviridae']);
    expect(hantaan.sourceIds).toContain('hantaan-cryo-et');
  });

  it('documents every intentionally shared species group without inventing geometry', () => {
    const catalogIds = new Set(VIRUS_CATALOG.map(({ id }) => id));
    for (const group of INTENTIONALLY_SHARED_GROUPS) {
      expect(group.length).toBeGreaterThan(1);
      for (const id of group) expect(catalogIds.has(id), id).toBe(true);
    }
  });

  it('builds all 95 entries in both qualities with finite part and layer contracts', () => {
    for (const definition of VIRUS_CATALOG) {
      for (const quality of ['high', 'low'] as const) {
        const model = createObservationModel(definition.id, quality);
        model.root.updateMatrixWorld(true);
        const bounds = new THREE.Box3().setFromObject(model.root);
        expect(bounds.isEmpty(), `${definition.id}:${quality}:bounds`).toBe(false);
        expect(
          [...bounds.min.toArray(), ...bounds.max.toArray()].every(Number.isFinite),
          `${definition.id}:${quality}:finite`,
        ).toBe(true);
        expect(
          new Set(model.parts.keys()),
          `${definition.id}:${quality}:parts`,
        ).toEqual(new Set(definition.parts));
        expect(
          new Set(model.layers.keys()),
          `${definition.id}:${quality}:layers`,
        ).toEqual(new Set(definition.layers.map(({ id }) => id)));
        disposeObject(model.root);
      }
    }
  });
});

function objectNames(root: THREE.Object3D): string[] {
  const names: string[] = [];
  root.traverse((object) => {
    if (object.name) names.push(object.name);
  });
  return names;
}

function disposeObject(root: THREE.Object3D): void {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  root.traverse((object) => {
    if (!('geometry' in object)) return;
    const renderable = object as THREE.Mesh | THREE.Line;
    geometries.add(renderable.geometry);
    const objectMaterials = Array.isArray(renderable.material)
      ? renderable.material
      : [renderable.material];
    objectMaterials.forEach((material) => materials.add(material));
  });
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
}

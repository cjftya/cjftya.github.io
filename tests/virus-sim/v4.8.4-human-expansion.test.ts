import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { PHYSICAL_DIMENSIONS } from '../../src/virus-sim/catalog/dimensions';
import { HUMAN_EXPANSION_IDS } from '../../src/virus-sim/catalog/definitions/humanExpansion';
import { auditStructureExplanations } from '../../src/virus-sim/catalog/explanations/audit';
import { getStructureExplanation } from '../../src/virus-sim/catalog/explanations/registry';
import { getVirusHistory } from '../../src/virus-sim/catalog/history/registry';
import { getHistorySource } from '../../src/virus-sim/catalog/history/sources';
import { VIRUS_CATALOG } from '../../src/virus-sim/catalog/registry';
import { getStructureSource } from '../../src/virus-sim/catalog/sources';
import {
  STRUCTURAL_SIGNATURES,
  getStructuralSignature,
} from '../../src/virus-sim/catalog/structuralSignatures';
import type { ObservationDefinition } from '../../src/virus-sim/catalog/types';
import { createObservationModel } from '../../src/virus-sim/rendering/models/createObservationModel';
import { renderAppLayout } from '../../src/virus-sim/ui/layout';

const EXPECTED_NEW_IDS = [
  'marburg-virus',
  'rabies-virus',
  'dengue-virus',
  'zika-virus',
  'yellow-fever-virus',
  'west-nile-virus',
  'nipah-virus',
  'lassa-virus',
  'cchf-virus',
  'measles-virus',
  'rsv',
  'poliovirus-1',
  'mpox-virus',
  'variola-virus',
  'hepatitis-c-virus',
  'hantaan-virus',
  'varicella-zoster-virus',
  'epstein-barr-virus',
  'influenza-a-h1n1pdm09',
  'influenza-a-h5n1',
  'mumps-virus',
  'rubella-virus',
  'chikungunya-virus',
  'hepatitis-a-virus',
] as const;

describe('Virus Sim v4.8.4 human-virus catalog expansion', () => {
  it('preserves the prior 71 entries and appends the exact 24-entry release set', () => {
    expect(VIRUS_CATALOG).toHaveLength(95);
    expect(new Set(VIRUS_CATALOG.map(({ id }) => id)).size).toBe(95);
    expect(HUMAN_EXPANSION_IDS).toEqual(EXPECTED_NEW_IDS);
    expect(VIRUS_CATALOG.slice(71).map(({ id }) => id)).toEqual(EXPECTED_NEW_IDS);
    expect(new Set(VIRUS_CATALOG.map(({ identityKey }) => identityKey)).size).toBe(95);
  });

  it('has exact dimensions, signatures, histories and resolvable sources', () => {
    expect(STRUCTURAL_SIGNATURES).toHaveLength(95);
    expect(new Set(Object.keys(PHYSICAL_DIMENSIONS))).toEqual(
      new Set(VIRUS_CATALOG.map(({ id }) => id)),
    );

    for (const id of EXPECTED_NEW_IDS) {
      const definition = VIRUS_CATALOG.find((entry) => entry.id === id)!;
      const dimensions = PHYSICAL_DIMENSIONS[id];
      const signature = getStructuralSignature(id);
      const history = getVirusHistory(id);

      expect(definition, id).toBeDefined();
      expect(dimensions, id).toBeDefined();
      expect(signature, id).toBeDefined();
      expect(history.virusId, id).toBe(id);
      expect(history.impactSummary.trim(), id).not.toBe('');
      expect(history.currentStatus?.trim(), id).not.toBe('');

      for (const sourceId of [
        ...definition.sourceIds,
        ...(dimensions?.sourceIds ?? []),
        ...(signature?.evidence.flatMap(({ sourceIds }) => sourceIds) ?? []),
      ]) {
        expect(
          getStructureSource(sourceId),
          `${id}: structure:${sourceId}`,
        ).toBeDefined();
      }
      for (const sourceId of history.sourceIds) {
        expect(getHistorySource(sourceId), `${id}: history:${sourceId}`).toBeDefined();
      }
    }
  });

  it('passes the complete 95-virus explanation audit without fallback or review', () => {
    const report = auditStructureExplanations();
    expect(report.totals).toEqual({
      viruses: 95,
      targets: 784,
      entry: 560,
      family: 224,
      generic: 0,
      errors: 0,
      warnings: 0,
    });
    expect(report.rows.every(({ status }) => status === 'PASS')).toBe(true);
    expect(report.issues).toEqual([]);

    for (const definition of VIRUS_CATALOG.slice(71)) {
      for (const target of targetsFor(definition)) {
        expect(getStructureExplanation(definition.id, target)?.scope).toBe('entry');
      }
    }
  });

  it('builds all 95 entries in both qualities with finite exact contracts', () => {
    for (const definition of VIRUS_CATALOG) {
      for (const quality of ['high', 'low'] as const) {
        const model = createObservationModel(definition.id, quality);
        model.root.updateMatrixWorld(true);
        const bounds = new THREE.Box3().setFromObject(model.root);
        expect(bounds.isEmpty(), `${definition.id}:${quality}:bounds`).toBe(false);
        expect(
          [...bounds.min.toArray(), ...bounds.max.toArray()].every(Number.isFinite),
          `${definition.id}:${quality}:bounds-finite`,
        ).toBe(true);
        expect(new Set(model.parts.keys())).toEqual(new Set(definition.parts));
        expect(new Set(model.layers.keys())).toEqual(
          new Set(definition.layers.map(({ id }) => id)),
        );
        model.root.traverse((object) => {
          if (!('geometry' in object)) return;
          const position = (object as THREE.Mesh).geometry.getAttribute('position');
          if (!position) return;
          expect(
            Array.from(position.array).every(Number.isFinite),
            `${definition.id}:${quality}:${object.name}:position`,
          ).toBe(true);
        });
        disposeObject(model.root);
      }
    }
  });

  it('renders one compact 95-option native select with every new ID', () => {
    const root = { innerHTML: '' } as HTMLElement;
    renderAppLayout(root);
    expect(root.innerHTML).toContain('<span class="eyebrow">v4.8.5</span>');
    expect(root.innerHTML.match(/<select id="virus-select">/g)).toHaveLength(1);
    const virusSelect =
      root.innerHTML.match(/<select id="virus-select">([\s\S]*?)<\/select>/)?.[1] ?? '';
    const options = [
      ...virusSelect.matchAll(/<option value="([^"]+)"(?: selected)?>/g),
    ].map((match) => match[1]);
    expect(options).toHaveLength(95);
    expect(new Set(options)).toEqual(new Set(VIRUS_CATALOG.map(({ id }) => id)));
    for (const id of EXPECTED_NEW_IDS) expect(options).toContain(id);
  });
});

function targetsFor(definition: ObservationDefinition) {
  return [
    ...definition.parts.map((id) => ({ kind: 'part' as const, id })),
    ...definition.layers.map(({ id }) => ({ kind: 'layer' as const, id })),
  ];
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

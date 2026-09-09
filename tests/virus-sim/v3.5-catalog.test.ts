import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { PHYSICAL_DIMENSIONS } from '../../src/virus-sim/catalog/dimensions';
import { VIRUS_CATALOG } from '../../src/virus-sim/catalog/registry';
import { getStructureSource } from '../../src/virus-sim/catalog/sources';
import {
  SPECIMEN_VARIANTS,
  STRUCTURE_CHANGES,
} from '../../src/virus-sim/catalog/variants/registry';
import { createObservationModel } from '../../src/virus-sim/rendering/models/createObservationModel';
import { renderAppLayout } from '../../src/virus-sim/ui/layout';

const ORIGINAL_IDS = [
  't4',
  'lambda',
  't7',
  'ms2',
  'tmv',
  'm13',
  'adenovirus-5',
  'rotavirus-rrv',
  'hsv1',
  'influenza-a',
  'vsv-indiana',
  'vaccinia-mv',
  'phix174',
  'qbeta',
  'phi29',
  'p22',
  'hk97',
  't5',
  't1',
  'prd1',
  'phi6',
  'pm2',
  'ap205',
  'ccmv',
  'bmv',
  'cpmv',
  'tbsv',
  'stmv',
  'cmv-fny',
  'tymv',
  'pvx',
  'papmv',
  'pvy',
  'camv',
  'maize-streak',
  'tylcv',
  'aav2',
  'canine-parvovirus',
  'pcv2',
  'hpv16',
  'sv40',
  'murine-polyomavirus',
  'norwalk',
  'rhdv',
  'astrovirus-1',
  'hbv',
  'sindbis',
  'semliki-forest',
  'flock-house',
  'ibdv',
  'bluetongue',
  'reovirus-t3d',
  'ssv1',
  'sirv2',
  'stiv',
  'atv',
] as const;

const NEW_IDS = [
  'ebola-virus',
  'sudan-virus',
  'bundibugyo-virus',
  'tai-forest-virus',
  'reston-virus',
  'bombali-virus',
  'hiv-1',
  'hiv-2',
  'hcov-229e',
  'hcov-nl63',
  'hcov-oc43',
  'hcov-hku1',
  'sars-cov',
  'mers-cov',
  'sars-cov-2',
] as const;

describe('Virus Sim v3.5 catalog contracts', () => {
  it('preserves 56 identities and adds 15 basic entries without counting variants', () => {
    expect(VIRUS_CATALOG).toHaveLength(71);
    const ids = VIRUS_CATALOG.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(71);
    expect(ids).toEqual(expect.arrayContaining([...ORIGINAL_IDS, ...NEW_IDS]));
    expect(SPECIMEN_VARIANTS.length).toBeGreaterThanOrEqual(16);
  });

  it('gives every entry explicit evidence, dimensions and valid sources', () => {
    for (const entry of VIRUS_CATALOG) {
      expect(['observed', 'conceptual', 'unavailable']).toContain(entry.evidenceStatus);
      expect(PHYSICAL_DIMENSIONS[entry.id]).toBeDefined();
      expect(entry.parts.length).toBeGreaterThan(1);
      expect(entry.layers.length).toBeGreaterThan(0);
      for (const sourceId of entry.sourceIds)
        expect(getStructureSource(sourceId)).toBeDefined();
      for (const sourceId of PHYSICAL_DIMENSIONS[entry.id]!.sourceIds)
        expect(getStructureSource(sourceId)).toBeDefined();
    }
  });

  it('keeps variant parents, sources and comparison changes referentially valid', () => {
    const virusIds = new Set(VIRUS_CATALOG.map((entry) => entry.id));
    const variantIds = new Set(SPECIMEN_VARIANTS.map((variant) => variant.id));
    const changeIds = new Set(STRUCTURE_CHANGES.map((change) => change.id));
    for (const variant of SPECIMEN_VARIANTS) {
      expect(virusIds.has(variant.parentVirusId)).toBe(true);
      for (const sourceId of variant.sourceIds)
        expect(getStructureSource(sourceId)).toBeDefined();
      for (const changeId of variant.changeIds)
        expect(changeIds.has(changeId)).toBe(true);
    }
    for (const change of STRUCTURE_CHANGES) {
      const [first, second] = change.comparisonPairId.split('::');
      expect(variantIds.has(first!)).toBe(true);
      expect(variantIds.has(second!)).toBe(true);
      for (const sourceId of change.sourceIds)
        expect(getStructureSource(sourceId)).toBeDefined();
    }
  });

  it('builds the three new morphology families with selectable parts and layers', () => {
    for (const id of ['ebola-virus', 'hiv-1', 'sars-cov-2']) {
      const model = createObservationModel(id, 'low');
      expect(model.root.children.length).toBeGreaterThan(2);
      expect(model.selectables.length).toBeGreaterThan(2);
      expect(model.layers.size).toBeGreaterThan(2);
    }
  });

  it('builds all 71 entries with complete parts, layers and bounded render cost', () => {
    for (const definition of VIRUS_CATALOG) {
      const model = createObservationModel(definition.id, 'high');
      for (const partId of definition.parts) {
        expect(
          model.parts.get(partId)?.length ?? 0,
          `${definition.id} is missing part ${partId}`,
        ).toBeGreaterThan(0);
      }
      for (const layer of definition.layers) {
        expect(
          model.layers.get(layer.id)?.length ?? 0,
          `${definition.id} is missing layer ${layer.id}`,
        ).toBeGreaterThan(0);
      }
      let calls = 0;
      let triangles = 0;
      model.root.traverse((object) => {
        if (!isWorldVisible(object) || !('geometry' in object)) return;
        const renderable = object as THREE.Mesh | THREE.Line;
        calls += Array.isArray(renderable.material) ? renderable.material.length : 1;
        if (!(object instanceof THREE.Mesh)) return;
        const geometry = object.geometry;
        const baseTriangles =
          (geometry.index?.count ?? geometry.getAttribute('position')?.count ?? 0) / 3;
        triangles +=
          baseTriangles * (object instanceof THREE.InstancedMesh ? object.count : 1);
      });
      expect(calls, `${definition.id} draw objects`).toBeLessThanOrEqual(150);
      expect(triangles, `${definition.id} triangles`).toBeLessThanOrEqual(250_000);
    }
  });

  it('keeps every declared part and layer in the low-quality models', () => {
    for (const definition of VIRUS_CATALOG) {
      const model = createObservationModel(definition.id, 'low');
      for (const partId of definition.parts) {
        expect(
          model.parts.get(partId)?.length ?? 0,
          `${definition.id} low quality is missing part ${partId}`,
        ).toBeGreaterThan(0);
      }
      for (const layer of definition.layers) {
        expect(
          model.layers.get(layer.id)?.length ?? 0,
          `${definition.id} low quality is missing layer ${layer.id}`,
        ).toBeGreaterThan(0);
      }
    }
  });

  it('renders 71 catalog controls without removed automatic experience UI', () => {
    const root = { innerHTML: '' } as HTMLElement;
    renderAppLayout(root);
    expect([
      ...root.innerHTML.matchAll(/data-observation-preset="([^"]+)"/g),
    ]).toHaveLength(71);
    for (const removedCopy of [
      '자동 다큐',
      'FOLLOW',
      'APPROACH',
      'INTERIOR',
      'Time Lens',
      'Hero Virus',
    ]) {
      expect(root.innerHTML).not.toContain(removedCopy);
    }
    expect(root.innerHTML).not.toContain('data-workspace-tab="comparison"');
    expect(root.innerHTML).not.toContain('comparison-add');
    expect(root.innerHTML).not.toContain('variant-a');
  });
});

function isWorldVisible(object: THREE.Object3D): boolean {
  let candidate: THREE.Object3D | null = object;
  while (candidate) {
    if (!candidate.visible) return false;
    candidate = candidate.parent;
  }
  return true;
}

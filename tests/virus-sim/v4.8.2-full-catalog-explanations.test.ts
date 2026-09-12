import { describe, expect, it } from 'vitest';
import {
  FULL_CATALOG_PROFILE_IDS,
  STRUCTURE_EXPLANATION_ENTRY_IDS,
  STRUCTURE_EXPLANATION_KEYS,
  getStructureExplanation,
  type StructureExplanationTarget,
} from '../../src/virus-sim/catalog/explanations/registry';
import { VIRUS_CATALOG, getCatalogEntry } from '../../src/virus-sim/catalog/registry';
import { getStructureSource } from '../../src/virus-sim/catalog/sources';
import { renderAppLayout } from '../../src/virus-sim/ui/layout';

describe('Virus Sim v4.8.2 full-catalog structure explanations', () => {
  it('covers all 71 entries without falling back to generic text', () => {
    expect(VIRUS_CATALOG).toHaveLength(71);

    for (const definition of VIRUS_CATALOG) {
      for (const target of targetsFor(definition)) {
        const explanation = getStructureExplanation(definition.id, target);
        expect(
          explanation,
          `${definition.id}: ${target.kind}:${target.id}`,
        ).not.toBeNull();
        expect(
          explanation?.scope,
          `${definition.id}: ${target.kind}:${target.id}`,
        ).not.toBe('generic');
      }
    }
  });

  it('provides complete names, model mappings, evidence and resolvable sources', () => {
    for (const definition of VIRUS_CATALOG) {
      for (const target of targetsFor(definition)) {
        const explanation = getStructureExplanation(definition.id, target)!;
        expect(explanation.actualName.trim()).not.toBe('');
        expect(explanation.genericSummary.trim()).not.toBe('');
        expect(explanation.role.trim()).not.toBe('');
        expect(explanation.location?.trim()).not.toBe('');
        expect(explanation.relationships?.length).toBeGreaterThan(0);
        expect(explanation.modelRepresentation.trim()).not.toBe('');
        expect(explanation.simplification?.trim()).not.toBe('');
        expect(['observed', 'family-supported', 'conceptual']).toContain(
          explanation.evidence,
        );
        expect(explanation.sourceIds.length).toBeGreaterThan(0);
        for (const sourceId of explanation.sourceIds) {
          expect(
            getStructureSource(sourceId),
            `${definition.id}: unresolved ${sourceId}`,
          ).toBeDefined();
        }
      }
    }
  });

  it('uses entry profiles where one renderer spans biologically different families', () => {
    const broadBuilderIds = VIRUS_CATALOG.filter((definition) =>
      [
        'icosahedral-capsid',
        'layered-capsid',
        'phage-family',
        'plant-filament',
        'spindle-virus',
      ].includes(definition.modelBuilder),
    ).map((definition) => definition.id);

    expect(new Set(FULL_CATALOG_PROFILE_IDS)).toEqual(new Set(broadBuilderIds));
    for (const virusId of broadBuilderIds) {
      const definition = getCatalogEntry(virusId);
      for (const target of targetsFor(definition)) {
        expect(getStructureExplanation(virusId, target)?.scope).toBe('entry');
      }
    }

    expect(getStructureExplanation('hcov-229e', part('spike'))?.scope).toBe('family');
    expect(getStructureExplanation('sudan-virus', part('matrix'))?.scope).toBe(
      'family',
    );
  });

  it('keeps supported subgroup and species differences explicit', () => {
    const hiv2Capsid = getStructureExplanation('hiv-2', part('capsid'));
    expect(hiv2Capsid?.scope).toBe('entry');
    expect(hiv2Capsid?.actualName).toContain('p26');
    expect(hiv2Capsid?.evidence).toBe('family-supported');

    for (const virusId of ['hcov-oc43', 'hcov-hku1']) {
      const surface = getStructureExplanation(virusId, part('spike'));
      expect(surface?.scope).toBe('entry');
      expect(surface?.actualName).toContain('hemagglutinin-esterase (HE)');
      expect(surface?.modelRepresentation).toContain('독립된 형상으로 구분하지 않아요');
    }

    expect(getStructureExplanation('stiv', part('turret'))?.actualName).toContain(
      'C381',
    );
  });

  it('keeps registration keys and entry ids unique and rejects unavailable targets', () => {
    expect(new Set(STRUCTURE_EXPLANATION_KEYS).size).toBe(
      STRUCTURE_EXPLANATION_KEYS.length,
    );
    expect(new Set(STRUCTURE_EXPLANATION_ENTRY_IDS).size).toBe(
      STRUCTURE_EXPLANATION_ENTRY_IDS.length,
    );
    expect(
      getStructureExplanation('t4', { kind: 'part', id: 'terminal-protein' }),
    ).toBeNull();
    expect(
      getStructureExplanation('missing-virus', { kind: 'part', id: 'capsid' }),
    ).toBeNull();
  });

  it('shows the v4.8.2 label while retaining the compact explanation surface', () => {
    const root = { innerHTML: '' } as HTMLElement;
    renderAppLayout(root);
    expect(root.innerHTML).toContain('<span class="eyebrow">v4.8.2</span>');
    expect(root.innerHTML).toContain('id="selection-details" hidden');
    expect(root.innerHTML).toContain('관계·단순화·근거');
  });
});

function targetsFor(
  definition: (typeof VIRUS_CATALOG)[number],
): StructureExplanationTarget[] {
  return [
    ...definition.parts.map((id) => ({ kind: 'part' as const, id })),
    ...definition.layers.map(({ id }) => ({ kind: 'layer' as const, id })),
  ];
}

function part(id: Extract<StructureExplanationTarget, { kind: 'part' }>['id']) {
  return { kind: 'part' as const, id };
}

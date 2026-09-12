import { describe, expect, it } from 'vitest';
import {
  REPRESENTATIVE_VIRUS_IDS,
  STRUCTURE_EXPLANATION_KEYS,
  getStructureExplanation,
  type StructureExplanationTarget,
} from '../../src/virus-sim/catalog/explanations/registry';
import { VIRUS_CATALOG, getCatalogEntry } from '../../src/virus-sim/catalog/registry';
import { getStructureSource } from '../../src/virus-sim/catalog/sources';
import { renderAppLayout } from '../../src/virus-sim/ui/layout';

describe('Virus Sim v4.8.1 virus-specific structure explanations', () => {
  it('covers every declared part and layer of the eight representative viruses', () => {
    expect(REPRESENTATIVE_VIRUS_IDS).toHaveLength(8);

    for (const virusId of REPRESENTATIVE_VIRUS_IDS) {
      const definition = getCatalogEntry(virusId);
      const targets: StructureExplanationTarget[] = [
        ...definition.parts.map((id) => ({ kind: 'part' as const, id })),
        ...definition.layers.map(({ id }) => ({ kind: 'layer' as const, id })),
      ];

      for (const target of targets) {
        const explanation = getStructureExplanation(virusId, target);
        expect(explanation, `${virusId}: ${target.kind}:${target.id}`).not.toBeNull();
        expect(explanation?.scope, `${virusId}: ${target.kind}:${target.id}`).toBe(
          'entry',
        );
        expect(explanation?.genericSummary.trim()).not.toBe('');
        expect(explanation?.actualName.trim()).not.toBe('');
        expect(explanation?.role.trim()).not.toBe('');
        expect(explanation?.modelRepresentation.trim()).not.toBe('');
        expect(explanation?.sourceIds.length).toBeGreaterThan(0);
        for (const sourceId of explanation?.sourceIds ?? []) {
          expect(
            getStructureSource(sourceId),
            `${virusId}: unresolved ${sourceId}`,
          ).toBeDefined();
        }
      }
    }
  });

  it('keeps every catalog target safe through entry, family or generic fallback', () => {
    for (const definition of VIRUS_CATALOG) {
      for (const partId of definition.parts) {
        expect(
          getStructureExplanation(definition.id, { kind: 'part', id: partId }),
          `${definition.id}: part:${partId}`,
        ).not.toBeNull();
      }
      for (const layer of definition.layers) {
        expect(
          getStructureExplanation(definition.id, { kind: 'layer', id: layer.id }),
          `${definition.id}: layer:${layer.id}`,
        ).not.toBeNull();
      }
    }

    expect(
      getStructureExplanation('sars-cov', { kind: 'part', id: 'spike' })?.scope,
    ).toBe('family');
    expect(getStructureExplanation('t7', { kind: 'part', id: 'capsid' })?.scope).toBe(
      'family',
    );
  });

  it('rejects unknown viruses and targets without exposing raw identifiers', () => {
    expect(
      getStructureExplanation('missing-virus', { kind: 'part', id: 'capsid' }),
    ).toBeNull();
    expect(
      getStructureExplanation('sars-cov-2', {
        kind: 'part',
        id: 'tail-fiber',
      }),
    ).toBeNull();
    expect(new Set(STRUCTURE_EXPLANATION_KEYS).size).toBe(
      STRUCTURE_EXPLANATION_KEYS.length,
    );
  });

  it('renders the compact expandable explanation surface in the existing panel', () => {
    const root = { innerHTML: '' } as HTMLElement;
    renderAppLayout(root);
    expect(root.innerHTML).toContain('<span class="eyebrow">v4.8.4</span>');
    expect(root.innerHTML).toContain('id="selection-details" hidden');
    expect(root.innerHTML).toContain('id="selection-model"');
    expect(root.innerHTML).toContain('관계·단순화·근거');
    expect(root.innerHTML).not.toContain('undefined');
  });
});

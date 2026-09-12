import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { auditStructureExplanations } from '../../src/virus-sim/catalog/explanations/audit';
import { getStructureExplanation } from '../../src/virus-sim/catalog/explanations/registry';
import { VIRUS_CATALOG } from '../../src/virus-sim/catalog/registry';
import { STRUCTURE_SOURCES } from '../../src/virus-sim/catalog/sources';
import { getStructuralSignature } from '../../src/virus-sim/catalog/structuralSignatures';
import type { ObservationPartId } from '../../src/virus-sim/catalog/types';
import { createObservationModel } from '../../src/virus-sim/rendering/models/createObservationModel';
import { renderAppLayout } from '../../src/virus-sim/ui/layout';

describe('Virus Sim v4.8.3 consistency audit', () => {
  it('passes the 71-entry, 569-target explanation matrix without review items', () => {
    const report = auditStructureExplanations();

    expect(report.totals).toEqual({
      viruses: 71,
      targets: 569,
      entry: 345,
      family: 224,
      generic: 0,
      errors: 0,
      warnings: 0,
    });
    expect(report.rows.every(({ status }) => status === 'PASS')).toBe(true);
    expect(report.issues).toEqual([]);
  });

  it('keeps every catalog part and layer aligned with the actual model maps', () => {
    for (const definition of VIRUS_CATALOG) {
      const model = createObservationModel(definition.id, 'low');
      const partIds = new Set(definition.parts);
      const layerIds = new Set(definition.layers.map(({ id }) => id));

      expect(getStructuralSignature(definition.id), definition.id).toBeDefined();
      expect([...model.parts.keys()].every((id) => partIds.has(id))).toBe(true);
      expect([...model.layers.keys()].every((id) => layerIds.has(id))).toBe(true);
      for (const partId of definition.parts) {
        expect(
          model.parts.get(partId)?.length,
          `${definition.id}:part:${partId}`,
        ).toBeGreaterThan(0);
      }
      for (const { id: layerId } of definition.layers) {
        expect(
          model.layers.get(layerId)?.length,
          `${definition.id}:layer:${layerId}`,
        ).toBeGreaterThan(0);
      }
    }
  });

  it('documents the surface components that the coronavirus renderer actually draws', () => {
    const sars = createObservationModel('sars-cov-2', 'low');
    expect(sars.parts.get('spike')?.map(({ name }) => name)).toEqual([
      'surface-spike-s',
      'surface-membrane-m',
      'surface-envelope-e',
    ]);
    expect(getStructureExplanation('sars-cov-2', part('spike'))).toMatchObject({
      evidence: 'family-supported',
      actualName: 'S, M, and E envelope proteins',
    });

    for (const virusId of ['hcov-oc43', 'hcov-hku1']) {
      const model = createObservationModel(virusId, 'low');
      expect(model.parts.get('spike')?.map(({ name }) => name)).toEqual([
        'surface-spike-s',
        'surface-hemagglutinin-esterase',
        'surface-membrane-m',
        'surface-envelope-e',
      ]);
      expect(
        getStructureExplanation(virusId, part('spike'))?.modelRepresentation,
      ).toContain('HE는 더 짧은 club형');
    }
  });

  it('describes procedural geometry without implying unsupported molecular detail', () => {
    const alphavirus = createObservationModel('sindbis', 'low');
    expect(alphavirus.root.getObjectByName('alphavirus-envelope')).toMatchObject({
      type: 'Mesh',
    });
    expect(
      getStructureExplanation('sindbis', part('envelope'))?.modelRepresentation,
    ).toContain('매끈한 반투명 구형 막');
    expect(
      getStructureExplanation('sindbis', part('spike'))?.modelRepresentation,
    ).toContain('원뿔형 절차적 돌기');

    expect(getStructureExplanation('hiv-2', part('capsid'))).toMatchObject({
      evidence: 'family-supported',
      sourceIds: ['ictv-retroviridae', 'emd-hiv2-capsid'],
    });
    expect(
      getStructureExplanation('ibdv', part('core-capsid'))?.simplification,
    ).toContain('닫힌 VP3 capsid가 관찰됐다는 뜻이 아닌');
  });

  it('keeps source IDs unique and emits valid HTTPS links', () => {
    expect(new Set(STRUCTURE_SOURCES.map(({ id }) => id)).size).toBe(
      STRUCTURE_SOURCES.length,
    );
    for (const source of STRUCTURE_SOURCES) {
      expect(source.url, source.id).toMatch(/^https:\/\//);
      expect(source.url, source.id).not.toContain('undefined');
    }
  });

  it('retains compact mobile and accessible explanation surfaces', () => {
    const root = { innerHTML: '' } as HTMLElement;
    renderAppLayout(root);
    expect(root.innerHTML).toContain('<span class="eyebrow">v4.8.3</span>');
    expect(root.innerHTML).toContain('aria-live="polite"');
    expect(root.innerHTML).toContain('<details class="selection-more">');
    expect(root.innerHTML).toContain('rel="noopener noreferrer"');

    const styles = readFileSync('src/virus-sim/styles.css', 'utf8');
    expect(styles).toContain('@media (max-width: 430px)');
    expect(styles).toContain('height: clamp(310px, 47svh, 430px)');
    for (const width of [360, 390, 412, 430]) expect(width).toBeLessThanOrEqual(430);
  });
});

const part = (id: ObservationPartId) => ({ kind: 'part' as const, id });

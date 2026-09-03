import { describe, expect, it } from 'vitest';
import { AdvancedRepresentationRegistry } from '../../src/uriel/analysis/v3/advanced';
import type { CombinationRepresentation } from '../../src/uriel/analysis/v3/representations';

const graphRepresentation: CombinationRepresentation = {
  id: 'graph',
  extract() {
    return {
      representation: 'graph',
      names: ['spectralEntropy'],
      values: [0.5],
    };
  },
};

describe('Uriel v3 advanced representation lab', () => {
  it('keeps graph and topology plugins out of the core menu until explicitly registered', () => {
    const registry = new AdvancedRepresentationRegistry();
    expect(registry.list()).toEqual([]);
    registry.register('graph', graphRepresentation);
    expect(registry.get('graph')).toBe(graphRepresentation);
    expect(registry.list()).toEqual([graphRepresentation]);
    expect(() => registry.register('graph', graphRepresentation)).toThrow('이미 등록');
  });

  it('rejects a representation placed in the wrong experimental slot', () => {
    const registry = new AdvancedRepresentationRegistry();
    expect(() => registry.register('topology', graphRepresentation)).toThrow(
      '일치하지 않아요',
    );
  });
});

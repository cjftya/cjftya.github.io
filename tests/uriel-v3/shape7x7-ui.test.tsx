import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CandidateResearchPanels } from '../../src/uriel/components/CandidateResearchPanels';
import { useV3Prediction } from '../../src/uriel/hooks/useV3Prediction';
import { predictNextCandidates } from '../../src/uriel/analysis/v3/prediction';
import { sampleCombinations } from '../../src/uriel/analysis/v3/random';
import type { GameCount } from '../../src/uriel/analysis/v3/types';

vi.mock('../../src/uriel/hooks/useV3Prediction', () => ({ useV3Prediction: vi.fn() }));
const draws = sampleCombinations(80, 19).map((numbers, i) => ({
  numbers,
  round: i + 1,
  date: '',
}));
const prediction = predictNextCandidates(draws, 79, 'shape-7x7', {
  sampleSize: 1_000,
  topFraction: 0.25,
});

describe('Shape menu and game UI rendering', () => {
  beforeEach(() => {
    vi.mocked(useV3Prediction).mockReturnValue({ prediction, error: null });
  });
  it.each([5, 10, 30] as GameCount[])(
    'preserves %i six-number rows and collapsed diagnostics',
    (gameCount) => {
      const noop = () => {};
      const html = renderToStaticMarkup(
        <CandidateResearchPanels
          draws={draws}
          index={79}
          layout="circle"
          algorithmId="shape-7x7"
          gameCount={gameCount}
          sampleSize={100_000}
          topFraction={0.05}
          seed={1}
          isPlaying={false}
          onAlgorithmChange={noop}
          onGameCountChange={noop}
          onSampleSizeChange={noop}
          onTopFractionChange={noop}
          onSeedChange={noop}
        />,
      );
      expect(html.match(/class="candidate-game-row"/g)).toHaveLength(gameCount);
      expect(html.match(/<i>/g)).toHaveLength(gameCount * 6);
      expect(html).toContain('7×7 Topological Shape');
      expect(html).toContain('Random Baseline');
      expect(html).toContain('NO SIGNAL · 예측력 미검증 실험');
      expect(html).toContain('<details class="analysis-card v3-diagnostics-card">');
      expect(html).not.toContain('무신호 · Random 동률');
    },
  );
});

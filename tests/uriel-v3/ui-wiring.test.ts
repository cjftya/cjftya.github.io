import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

describe('Uriel v3 UI wiring', () => {
  it('shows every required candidate size, score and contrastive diagnostic', async () => {
    const source = await readFile(
      new URL(
        '../../src/uriel/components/CandidateResearchPanels.tsx',
        import.meta.url,
      ),
      'utf8',
    );
    expect(source).toContain('Candidate@{candidateSet.size}');
    expect(source).toContain('번호별 Candidate Score');
    expect(source).toContain('Winning vs Synthetic Random');
    expect(source).toContain('Discovery d');
    expect(source).toContain('Holdout d');
  });

  it('reports Hit@K, random lift, percentile and confidence intervals', async () => {
    const source = await readFile(
      new URL('../../src/uriel/components/V3BacktestReport.tsx', import.meta.url),
      'utf8',
    );
    expect(source).toContain('Mean Hit');
    expect(source).toContain('Random');
    expect(source).toContain('Lift');
    expect(source).toContain('백분위');
    expect(source).toContain('95% CI');
    expect(source).toContain('hitAtLeast4Rate');
    expect(source).toContain('hitAtLeast5Rate');
    expect(source).toContain('hit6Rate');
  });

  it('runs prediction and walk-forward work outside the UI thread', async () => {
    const predictionHook = await readFile(
      new URL('../../src/uriel/hooks/useV3Prediction.ts', import.meta.url),
      'utf8',
    );
    const backtestPanel = await readFile(
      new URL('../../src/uriel/components/V3BacktestPanel.tsx', import.meta.url),
      'utf8',
    );
    expect(predictionHook).toContain('new Worker(');
    expect(predictionHook).toContain('v3-prediction.worker.ts');
    expect(backtestPanel).toContain('v3-backtest.worker.ts');
  });
});

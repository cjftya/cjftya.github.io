import { readFile } from 'node:fs/promises';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  resolveBacktestRoundRange,
  runWalkForwardBacktest,
} from '../src/uriel/analysis/backtest';
import { parseDrawCsv } from '../src/uriel/data';
import type { LottoDraw } from '../src/uriel/types';

const holdoutFull = process.env.URIEL_HOLDOUT_FULL === '1';

describe('Uriel Walk-forward validation ranges', () => {
  let draws: LottoDraw[];

  beforeAll(async () => {
    const fileUrl = new URL('../public/projects/uriel/data/draws.csv', import.meta.url);
    draws = parseDrawCsv(await readFile(fileUrl, 'utf8'));
  });

  it.each([
    [96, 1140, 1235],
    [192, 1044, 1235],
  ])('resolves the latest %i rounds', (rounds, startRound, endRound) => {
    const range = resolveBacktestRoundRange(draws, {
      rangeMode: 'recent',
      rounds,
    });

    expect(range).toMatchObject({ startRound, endRound, evaluatedRounds: rounds });
    expect(draws[range.startHistoryIndex]?.round).toBe(startRound - 1);
    expect(draws[range.endHistoryIndex + 1]?.round).toBe(endRound);
  });

  it('resolves the 192 rounds immediately before the latest 192 rounds', () => {
    const range = resolveBacktestRoundRange(draws, {
      rangeMode: 'previous-192',
    });

    expect(range).toMatchObject({
      startRound: 852,
      endRound: 1043,
      evaluatedRounds: 192,
    });
    expect(draws[range.startHistoryIndex]?.round).toBe(851);
    expect(draws[range.endHistoryIndex + 1]?.round).toBe(1043);
  });

  it('resolves an explicit custom range without using future draws', () => {
    const range = resolveBacktestRoundRange(draws, {
      rangeMode: 'custom',
      startRound: 852,
      endRound: 1043,
    });

    expect(range).toMatchObject({
      startRound: 852,
      endRound: 1043,
      evaluatedRounds: 192,
    });
    for (
      let historyIndex = range.startHistoryIndex;
      historyIndex <= range.endHistoryIndex;
      historyIndex += 1
    ) {
      expect(draws[historyIndex]?.round).toBeLessThan(
        draws[historyIndex + 1]?.round ?? 0,
      );
    }
  });

  it('rejects invalid or under-trained custom ranges', () => {
    expect(() =>
      resolveBacktestRoundRange(draws, {
        rangeMode: 'custom',
        startRound: 1043,
        endRound: 852,
      }),
    ).toThrow('시작 회차는 종료 회차보다 클 수 없어요.');
    expect(() =>
      resolveBacktestRoundRange(draws, {
        rangeMode: 'custom',
        startRound: 50,
        endRound: 60,
      }),
    ).toThrow('앞선 96회 이상의 학습 데이터');
    expect(() =>
      resolveBacktestRoundRange(draws, {
        rangeMode: 'custom',
        startRound: 852,
        endRound: 1236,
      }),
    ).toThrow('데이터가 없어요.');
  });
});

describe.skipIf(!holdoutFull)('Uriel historical holdout validation', () => {
  it('runs 852–1043 with the frozen Phase 1 settings', async () => {
    const fileUrl = new URL('../public/projects/uriel/data/draws.csv', import.meta.url);
    const draws = parseDrawCsv(await readFile(fileUrl, 'utf8'));
    const result = runWalkForwardBacktest(draws, {
      rangeMode: 'custom',
      startRound: 852,
      endRound: 1043,
      rounds: 192,
      poolSize: 20,
      generationMode: 'full-enumeration',
      seed: 20260807,
      monteCarloRuns: 32,
      includeAblation: true,
      includeRankingDiagnostics: true,
    });
    const transition = result.strategies.find(
      ({ strategy }) => strategy === 'transition',
    );
    const random = result.strategies.find(({ strategy }) => strategy === 'random');
    const compact = {
      startRound: result.startRound,
      endRound: result.endRound,
      evaluatedRounds: result.evaluatedRounds,
      options: result.options,
      recall: result.recall.find(({ poolSize }) => poolSize === 20),
      transition,
      transitionTailCoverage: result.portfolioExperiment,
      random,
      fiveHitOpportunities: result.fiveHitOpportunities.map((opportunity) => ({
        round: opportunity.round,
        candidateRecall: opportunity.candidateRecall,
        candidateMatches: opportunity.candidateMatches,
        generationMaxHit: opportunity.generationMaxHit,
        transition: opportunity.strategies.transition,
      })),
      bestStrategy: result.bestStrategy,
      bestCombinationStrategy: result.bestCombinationStrategy,
      rankingDiagnosticRounds: result.rankingDiagnostics?.analyzedRounds ?? 0,
    };

    console.log(`URIEL_HOLDOUT_FULL_RESULT=${JSON.stringify(compact)}`);
    expect(result).toMatchObject({
      startRound: 852,
      endRound: 1043,
      evaluatedRounds: 192,
    });
    expect(result.options).toMatchObject({
      poolSize: 20,
      generationMode: 'full-enumeration',
      seed: 20260807,
      monteCarloRuns: 32,
      includeAblation: true,
    });
    expect(compact.recall).toMatchObject({
      distribution: [9, 25, 59, 55, 36, 8, 0],
      average: 2.5625,
      atLeastFourRate: 44 / 192,
      atLeastFiveRate: 8 / 192,
      allSixRate: 0,
    });
    expect(transition?.pipeline).toMatchObject({
      fourPlus: {
        candidateOpportunities: 44,
        generationSuccesses: 44,
        top100Successes: 8,
        top10Successes: 1,
      },
      fivePlus: {
        candidateOpportunities: 8,
        generationSuccesses: 8,
        top100Successes: 0,
        top10Successes: 0,
      },
      six: {
        candidateOpportunities: 0,
        generationSuccesses: 0,
        top100Successes: 0,
        top10Successes: 0,
      },
    });
    expect(result.portfolioExperiment.before).toMatchObject({
      threePlusRate: 26 / 192,
      fourPlusRate: 1 / 192,
      fivePlusRate: 0,
    });
    expect(result.portfolioExperiment.after).toMatchObject({
      threePlusRate: 35 / 192,
      fourPlusRate: 1 / 192,
      fivePlusRate: 0,
    });
  }, 1_800_000);
});

import { readFile } from 'node:fs/promises';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  resolveBacktestRoundRange,
  runWalkForwardBacktest,
} from '../src/uriel/analysis/backtest';
import { parseDrawCsv } from '../src/uriel/data';
import type { LottoDraw } from '../src/uriel/types';

describe('Uriel 기본 알고리즘 Walk-forward 구간', () => {
  let draws: LottoDraw[];

  beforeAll(async () => {
    draws = parseDrawCsv(
      await readFile(
        new URL('../public/projects/uriel/data/draws.csv', import.meta.url),
        'utf8',
      ),
    );
  });

  it.each([96, 192])('resolves the latest %i rounds', (rounds) => {
    const endRound = draws.at(-1)!.round;
    const startRound = endRound - rounds + 1;
    const range = resolveBacktestRoundRange(draws, {
      rangeMode: 'recent',
      rounds,
    });
    expect(range).toMatchObject({ startRound, endRound, evaluatedRounds: rounds });
    expect(draws[range.startHistoryIndex]?.round).toBe(startRound - 1);
    expect(draws[range.endHistoryIndex + 1]?.round).toBe(endRound);
  });

  it('resolves the previous 192-round window', () => {
    const endRound = draws.at(-1)!.round - 192;
    const startRound = endRound - 191;
    expect(
      resolveBacktestRoundRange(draws, { rangeMode: 'previous-192', rounds: 192 }),
    ).toMatchObject({ startRound, endRound, evaluatedRounds: 192 });
  });

  it('rejects invalid, missing and under-trained custom ranges', () => {
    expect(() =>
      resolveBacktestRoundRange(draws, {
        rangeMode: 'custom',
        startRound: 100,
        endRound: 90,
      }),
    ).toThrow('시작 회차는 종료 회차보다 클 수 없어요.');
    expect(() =>
      resolveBacktestRoundRange(draws, {
        rangeMode: 'custom',
        startRound: 10,
        endRound: 20,
      }),
    ).toThrow('24회 이상의 학습 데이터');
    expect(() =>
      resolveBacktestRoundRange(draws, {
        rangeMode: 'custom',
        startRound: 1238,
        endRound: 2000,
      }),
    ).toThrow('데이터가 없어요.');
  });

  it('evaluates only the selected baseline method', () => {
    const result = runWalkForwardBacktest(draws, {
      algorithmId: 'baseline',
      layout: 'circle',
      rangeMode: 'custom',
      startRound: 1235,
      endRound: 1239,
    });
    expect(result).toMatchObject({
      metricSchemaVersion: 1,
      startRound: 1235,
      endRound: 1239,
      evaluatedRounds: 5,
      options: { algorithmId: 'baseline', layout: 'circle' },
    });
    expect(result.candidates.map(({ candidateCount }) => candidateCount)).toEqual([
      6, 12, 24, 50, 100,
    ]);
    expect(result.purchase.distribution).toHaveLength(7);
    expect(result.rounds).toHaveLength(5);
    expect(
      result.rounds.every((round) =>
        Object.values(round.candidateMaxHits).every((hits) => hits >= 0 && hits <= 6),
      ),
    ).toBe(true);
  }, 30_000);

  it('does not use rows after the selected validation range', () => {
    const changedFuture = draws.map((draw) =>
      draw.round > 1237 ? { ...draw, numbers: [1, 2, 3, 4, 5, 6] } : draw,
    );
    const options = {
      algorithmId: 'baseline' as const,
      layout: 'board' as const,
      rangeMode: 'custom' as const,
      startRound: 1235,
      endRound: 1237,
    };
    const first = runWalkForwardBacktest(draws, options);
    const second = runWalkForwardBacktest(changedFuture, options);
    expect(second.rounds).toEqual(first.rounds);
    expect(second.candidates).toEqual(first.candidates);
    expect(second.purchase).toEqual(first.purchase);
  }, 30_000);
});

import type {
  Candidate,
  LayoutMode,
  PurchaseCandidate,
  PurchasePortfolio,
} from '../types';
import { metricsForNumbers } from './geometry';

const PURCHASE_GAME_COUNT = 10;
const PRIORITY_NUMBER_COUNT = 18;
const CORE_NUMBER_COUNT = 8;

interface RankedCandidate {
  candidate: Candidate;
  rank: number;
}

export interface PoolCapture {
  size: number;
  matches: readonly number[];
}

export interface PurchaseDiagnostics {
  priorityMatches: readonly number[];
  poolCaptures: readonly PoolCapture[];
  reachableBestMatch: number;
  researchBestMatch: number;
  purchaseBestMatch: number;
  researchEfficiency: number;
  compressionEfficiency: number;
  bottleneck: 'number-pool' | 'combination' | 'compression' | 'success';
  message: string;
}

/**
 * Keeps the selected research model's ten strongest distinct combinations.
 * Walk-forward validation showed that scenario-wheel recombination diluted the
 * model signal, so the purchase layer no longer rewrites proven research ranks.
 */
export function buildPurchasePortfolio(
  researchCandidates: readonly Candidate[],
  layout: LayoutMode,
  userAnchor?: Candidate | null,
): PurchasePortfolio {
  const pool = uniqueCandidates(researchCandidates).map((candidate, index) => ({
    candidate,
    rank: index + 1,
  }));
  if (pool.length < PURCHASE_GAME_COUNT) {
    throw new Error('구매 후보를 만들려면 서로 다른 연구 후보가 10개 이상 필요해요.');
  }

  const numberRanking = rankNumbers(pool);
  const priorityNumbers = numberRanking.slice(0, PRIORITY_NUMBER_COUNT);
  const coreNumbers = numberRanking.slice(0, CORE_NUMBER_COUNT);
  const anchor = resolveAnchor(pool, layout, userAnchor);
  const selected = rankedPortfolio(pool, anchor);
  const userAnchorUsed = userAnchor !== undefined && userAnchor !== null;
  const games = assignRoles(selected, anchor, coreNumbers, userAnchorUsed);
  const topTen = new Set(
    pool.slice(0, PURCHASE_GAME_COUNT).map(({ candidate }) => candidateKey(candidate)),
  );

  return {
    games,
    priorityNumbers,
    coreNumbers,
    userAnchorUsed,
    researchPoolSize: pool.length,
    optimizedScenarioCount: 0,
    topTenRetained: games.filter((game) => topTen.has(candidateKey(game))).length,
  };
}

function rankedPortfolio(
  pool: readonly RankedCandidate[],
  anchor: RankedCandidate,
): RankedCandidate[] {
  const anchorKey = candidateKey(anchor.candidate);
  return [
    ...pool
      .filter(({ candidate }) => candidateKey(candidate) !== anchorKey)
      .slice(0, 9),
    anchor,
  ];
}

export function diagnosePurchasePortfolio(
  portfolio: PurchasePortfolio,
  researchCandidates: readonly Candidate[],
  actualNumbers: readonly number[],
): PurchaseDiagnostics {
  const priorityMatches = actualNumbers.filter((number) =>
    portfolio.priorityNumbers.includes(number),
  );
  const poolCaptures = [10, 12, 14, 16, 18].map((size) => ({
    size,
    matches: actualNumbers.filter((number) =>
      portfolio.priorityNumbers.slice(0, size).includes(number),
    ),
  }));
  const reachableBestMatch =
    poolCaptures.find(({ size }) => size === 14)?.matches.length ?? 0;
  const researchBestMatch = maximumMatch(researchCandidates, actualNumbers);
  const purchaseBestMatch = maximumMatch(portfolio.games, actualNumbers);
  const researchEfficiency = ratio(researchBestMatch, reachableBestMatch);
  const compressionEfficiency = ratio(purchaseBestMatch, researchBestMatch);
  const common = {
    priorityMatches,
    poolCaptures,
    reachableBestMatch,
    researchBestMatch,
    purchaseBestMatch,
    researchEfficiency,
    compressionEfficiency,
  };

  if (purchaseBestMatch >= 4) {
    return {
      ...common,
      bottleneck: 'success',
      message: `구매용 10게임에서 ${purchaseBestMatch}개 적중에 도달했어요. 같은 방식의 반복성을 확인해야 해요.`,
    };
  }
  if (reachableBestMatch < 4) {
    return {
      ...common,
      bottleneck: 'number-pool',
      message: `상위 14개 번호군이 실제 번호를 ${reachableBestMatch}개만 포착해, 조합 단계에서 4개 적중은 불가능했어요.`,
    };
  }
  if (researchBestMatch < 4) {
    return {
      ...common,
      bottleneck: 'combination',
      message: `상위 14개에는 실제 번호가 ${reachableBestMatch}개 있었지만 연구 100개가 한 조합에 4개를 모으지 못했어요.`,
    };
  }
  return {
    ...common,
    bottleneck: 'compression',
    message: `연구 100개에는 ${researchBestMatch}개 적중 조합이 있었지만 구매용 10게임에서 ${purchaseBestMatch}개로 낮아졌어요.`,
  };
}

function assignRoles(
  selected: readonly RankedCandidate[],
  anchor: RankedCandidate,
  coreNumbers: readonly number[],
  userAnchorUsed: boolean,
): PurchaseCandidate[] {
  const anchorKey = candidateKey(anchor.candidate);
  const remaining = selected.filter(
    ({ candidate }) => candidateKey(candidate) !== anchorKey,
  );
  const focusEntries = [...remaining]
    .sort(
      (left, right) =>
        countMatches(right.candidate.numbers, coreNumbers) -
          countMatches(left.candidate.numbers, coreNumbers) || left.rank - right.rank,
    )
    .slice(0, 4);
  const focusKeys = new Set(
    focusEntries.map(({ candidate }) => candidateKey(candidate)),
  );
  const afterFocus = remaining.filter(
    ({ candidate }) => !focusKeys.has(candidateKey(candidate)),
  );
  const hypothesisEntries = afterFocus.slice(0, 3);
  const hypothesisKeys = new Set(
    hypothesisEntries.map(({ candidate }) => candidateKey(candidate)),
  );
  const coverageEntries = afterFocus
    .filter(({ candidate }) => !hypothesisKeys.has(candidateKey(candidate)))
    .slice(0, 2);

  return [
    ...focusEntries.map((entry) =>
      toPurchaseCandidate(
        entry,
        'focus',
        `연구 상위 순위를 보존하고 핵심 번호 ${countMatches(entry.candidate.numbers, coreNumbers)}개 포함`,
      ),
    ),
    ...hypothesisEntries.map((entry) =>
      toPurchaseCandidate(
        entry,
        'hypothesis',
        `선택 모델의 연구 ${entry.rank}위 가설을 순서 변경 없이 보존`,
      ),
    ),
    ...coverageEntries.map((entry) =>
      toPurchaseCandidate(
        entry,
        'coverage',
        `선택 모델의 연구 ${entry.rank}위를 재정렬 없이 보존`,
      ),
    ),
    toPurchaseCandidate(
      anchor,
      'anchor',
      userAnchorUsed
        ? '연구 후보에서 직접 선택한 형태를 열 번째 게임으로 유지'
        : '선택 모델의 최상위 후보를 완결 게임으로 유지',
      userAnchorUsed,
    ),
  ];
}

function rankNumbers(pool: readonly RankedCandidate[]): number[] {
  const support = Array(46).fill(0) as number[];
  pool.forEach(({ candidate, rank }) => {
    const tierWeight =
      candidate.tier === 'confidence' ? 1.25 : candidate.tier === 'focus' ? 1.12 : 1;
    const rankWeight = 1 / (1 + (rank - 1) / 22);
    candidate.numbers.forEach((number) => {
      support[number] = support[number]! + tierWeight * rankWeight;
    });
  });
  return Array.from({ length: 45 }, (_, index) => index + 1).sort(
    (left, right) => support[right]! - support[left]! || left - right,
  );
}

function resolveAnchor(
  pool: readonly RankedCandidate[],
  layout: LayoutMode,
  userAnchor?: Candidate | null,
): RankedCandidate {
  if (userAnchor !== undefined && userAnchor !== null) {
    const matched = pool.find(
      ({ candidate }) => candidateKey(candidate) === candidateKey(userAnchor),
    );
    return (
      matched ?? {
        rank: pool.length + 1,
        candidate: {
          ...userAnchor,
          metrics: metricsForNumbers(userAnchor.numbers, layout),
        },
      }
    );
  }
  return pool.find(({ candidate }) => candidate.tier === 'confidence') ?? pool[0]!;
}

function toPurchaseCandidate(
  entry: RankedCandidate,
  purchaseRole: PurchaseCandidate['purchaseRole'],
  reason: string,
  isUserAnchor = false,
): PurchaseCandidate {
  return {
    ...entry.candidate,
    purchaseRole,
    reason,
    researchRank: entry.rank,
    isUserAnchor,
  };
}

function maximumMatch(
  candidates: readonly Candidate[],
  actualNumbers: readonly number[],
): number {
  return candidates.reduce(
    (maximum, candidate) =>
      Math.max(maximum, countMatches(candidate.numbers, actualNumbers)),
    0,
  );
}

function countMatches(left: readonly number[], right: readonly number[]): number {
  return left.filter((number) => right.includes(number)).length;
}

function uniqueCandidates(candidates: readonly Candidate[]): Candidate[] {
  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    const key = candidateKey(candidate);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function candidateKey(candidate: Pick<Candidate, 'numbers'>): string {
  return [...candidate.numbers].sort((left, right) => left - right).join('-');
}

function ratio(numerator: number, denominator: number): number {
  if (denominator === 0) return numerator === 0 ? 1 : 0;
  return Math.min(numerator / denominator, 1);
}

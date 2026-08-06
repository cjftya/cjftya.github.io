import type {
  Candidate,
  CandidateHypothesis,
  LayoutMode,
  PurchaseCandidate,
  PurchasePortfolio,
} from '../types';
import { metricsForNumbers } from './geometry';

const PURCHASE_GAME_COUNT = 10;
const PRIORITY_NUMBER_COUNT = 18;
const CORE_NUMBER_COUNT = 8;
const HYPOTHESES: readonly CandidateHypothesis[] = ['baseline', 'transition', 'ridge'];

interface RankedCandidate {
  candidate: Candidate;
  rank: number;
}

export interface PurchaseDiagnostics {
  priorityMatches: readonly number[];
  researchBestMatch: number;
  purchaseBestMatch: number;
  bottleneck: 'number-pool' | 'combination' | 'compression' | 'success';
  message: string;
}

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
  const rankedTopTen = pool.slice(0, PURCHASE_GAME_COUNT);
  const used = new Set<string>();
  const anchor = resolveAnchor(rankedTopTen, pool, layout, userAnchor);
  used.add(candidateKey(anchor.candidate));

  const focus = selectFocus(rankedTopTen, 4, used, coreNumbers);
  const hypothesis = selectHypotheses(rankedTopTen, used);
  const coverage = selectCoverage(rankedTopTen, 2, used);
  const anchorGame = toPurchaseCandidate(
    anchor,
    'anchor',
    userAnchor === undefined || userAnchor === null
      ? '가장 강한 고확신 도형을 한 게임에 온전히 유지'
      : '후보 목록에서 직접 선택한 형태를 한 게임에 온전히 유지',
    userAnchor !== undefined && userAnchor !== null,
  );
  const games = [...focus, ...hypothesis, ...coverage, anchorGame];

  return {
    games,
    priorityNumbers,
    coreNumbers,
    userAnchorUsed: anchorGame.isUserAnchor === true,
    researchPoolSize: pool.length,
  };
}

export function diagnosePurchasePortfolio(
  portfolio: PurchasePortfolio,
  researchCandidates: readonly Candidate[],
  actualNumbers: readonly number[],
): PurchaseDiagnostics {
  const priorityMatches = actualNumbers.filter((number) =>
    portfolio.priorityNumbers.includes(number),
  );
  const researchBestMatch = maximumMatch(researchCandidates, actualNumbers);
  const purchaseBestMatch = maximumMatch(portfolio.games, actualNumbers);

  if (purchaseBestMatch === 6) {
    return {
      priorityMatches,
      researchBestMatch,
      purchaseBestMatch,
      bottleneck: 'success',
      message: '구매용 10게임 안에 실제 6개 조합이 포함됐어요.',
    };
  }
  if (priorityMatches.length < 6) {
    return {
      priorityMatches,
      researchBestMatch,
      purchaseBestMatch,
      bottleneck: 'number-pool',
      message: `우선 번호 18개에서 실제 번호 ${6 - priorityMatches.length}개가 빠졌어요.`,
    };
  }
  if (researchBestMatch < 6) {
    return {
      priorityMatches,
      researchBestMatch,
      purchaseBestMatch,
      bottleneck: 'combination',
      message: '번호 풀에는 6개가 있었지만 연구 후보에서 완성 조합을 만들지 못했어요.',
    };
  }
  return {
    priorityMatches,
    researchBestMatch,
    purchaseBestMatch,
    bottleneck: 'compression',
    message: '정답은 연구 후보 100개에 있었지만 구매용 10게임으로 압축할 때 빠졌어요.',
  };
}

function selectFocus(
  pool: readonly RankedCandidate[],
  count: number,
  used: Set<string>,
  coreNumbers: readonly number[],
): PurchaseCandidate[] {
  const preferred = pool.filter(({ candidate }) => candidate.tier === 'focus');
  return takeInResearchOrder([...preferred, ...pool], count, used, (entry) =>
    toPurchaseCandidate(
      entry,
      'focus',
      `상위 도형 순위를 보존하고 공통 핵심 번호 ${countMatches(entry.candidate.numbers, coreNumbers)}개에 집중`,
    ),
  );
}

function selectHypotheses(
  pool: readonly RankedCandidate[],
  used: Set<string>,
): PurchaseCandidate[] {
  const selected: PurchaseCandidate[] = [];
  HYPOTHESES.forEach((hypothesis) => {
    const exact = pool.find(
      ({ candidate }) =>
        candidate.hypothesis === hypothesis && !used.has(candidateKey(candidate)),
    );
    const fallback = pool.find(({ candidate }) => !used.has(candidateKey(candidate)));
    const entry = exact ?? fallback;
    if (entry === undefined) return;
    used.add(candidateKey(entry.candidate));
    selected.push(
      toPurchaseCandidate(
        entry,
        'hypothesis',
        `${hypothesisLabel(entry.candidate.hypothesis ?? hypothesis)} 가설을 상위 10게임 안에서 보존`,
      ),
    );
  });
  return selected;
}

function selectCoverage(
  pool: readonly RankedCandidate[],
  count: number,
  used: Set<string>,
): PurchaseCandidate[] {
  return takeInResearchOrder(pool, count, used, (entry) =>
    toPurchaseCandidate(
      entry,
      'coverage',
      '연구 단계에서 중복을 줄인 상위 탐색 후보로 방어 범위를 유지',
    ),
  );
}

function takeInResearchOrder(
  source: readonly RankedCandidate[],
  count: number,
  used: Set<string>,
  transform: (entry: RankedCandidate) => PurchaseCandidate,
): PurchaseCandidate[] {
  const selected: PurchaseCandidate[] = [];
  source.forEach((entry) => {
    if (selected.length >= count || used.has(candidateKey(entry.candidate))) return;
    used.add(candidateKey(entry.candidate));
    selected.push(transform(entry));
  });
  return selected;
}

function resolveAnchor(
  rankedTopTen: readonly RankedCandidate[],
  fullPool: readonly RankedCandidate[],
  layout: LayoutMode,
  userAnchor?: Candidate | null,
): RankedCandidate {
  if (userAnchor !== undefined && userAnchor !== null) {
    const matched = fullPool.find(
      ({ candidate }) => candidateKey(candidate) === candidateKey(userAnchor),
    );
    return (
      matched ?? {
        rank: fullPool.length + 1,
        candidate: {
          ...userAnchor,
          metrics: metricsForNumbers(userAnchor.numbers, layout),
        },
      }
    );
  }
  return (
    rankedTopTen.find(({ candidate }) => candidate.tier === 'confidence') ??
    rankedTopTen.at(-1)!
  );
}

function rankNumbers(pool: readonly RankedCandidate[]): number[] {
  const support = Array(46).fill(0) as number[];
  pool.forEach(({ candidate, rank }) => {
    const tierWeight =
      candidate.tier === 'confidence' ? 1.35 : candidate.tier === 'focus' ? 1.15 : 0.75;
    const rankWeight = 1 / (1 + (rank - 1) / 24);
    candidate.numbers.forEach((number) => {
      support[number] = support[number]! + tierWeight * rankWeight;
    });
  });
  return Array.from({ length: 45 }, (_, index) => index + 1).sort(
    (left, right) => support[right]! - support[left]! || left - right,
  );
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

function hypothesisLabel(hypothesis: CandidateHypothesis): string {
  if (hypothesis === 'baseline') return '최근 수치 흐름';
  if (hypothesis === 'transition') return '과거 유사 전이';
  if (hypothesis === 'ridge') return 'Ridge 도형 전이';
  return '모델 합의';
}

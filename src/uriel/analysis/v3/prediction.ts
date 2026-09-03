import type { LottoDraw } from '../../types';
import { candidateAlgorithm } from './catalog';
import { mixSeed } from './random';
import { projectCandidateScores } from './projection';
import type {
  CandidatePrediction,
  PredictionMetadata,
  ResearchAlgorithmId,
  ResearchConfig,
} from './types';
import { CANDIDATE_SIZES, sanitizeResearchConfig } from './types';

export function predictNextCandidates(
  draws: readonly LottoDraw[],
  historyIndex: number,
  algorithmId: ResearchAlgorithmId,
  requestedConfig: Partial<ResearchConfig> = {},
): CandidatePrediction {
  if (!Number.isInteger(historyIndex) || historyIndex < 0 || !draws[historyIndex]) {
    throw new Error('분석할 기준 회차가 없어요.');
  }
  const history = draws.slice(0, historyIndex + 1);
  const config = sanitizeResearchConfig(requestedConfig);
  const model = candidateAlgorithm(algorithmId).fit(history, config);
  const projection = projectCandidateScores(
    model,
    config,
    mixSeed(config.seed, history.at(-1)!.round, algorithmSeed(algorithmId)),
  );
  const metadata: PredictionMetadata = {
    algorithm: algorithmId,
    parameters: config,
    dataStartRound: history[0]!.round,
    dataEndRound: history.at(-1)!.round,
    candidateSizes: CANDIDATE_SIZES,
    randomSeed: config.seed,
    sampleSize: config.sampleSize,
    retainedCombinations: projection.retainedCombinations,
    executionDate: new Date().toISOString(),
    gitCommit: null,
  };
  return {
    algorithmId,
    candidateSets: projection.candidateSets,
    numberScores: projection.numberScores,
    diagnostics: model.diagnostics,
    metadata,
  };
}

function algorithmSeed(id: ResearchAlgorithmId): number {
  if (id === 'random-baseline') return 1;
  if (id === 'distance') return 2;
  if (id === 'distribution') return 3;
  if (id === 'geometry') return 4;
  return 5;
}

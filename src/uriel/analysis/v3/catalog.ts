import type {
  CandidateAlgorithm,
  FittedCombinationModel,
  ModelDiagnostics,
  ResearchAlgorithmId,
} from './types';
import type { LottoDraw } from '../../types';

export interface ResearchAlgorithmDefinition {
  id: ResearchAlgorithmId;
  label: string;
  description: string;
}

export const researchAlgorithmDefinitions: readonly ResearchAlgorithmDefinition[] = [
  {
    id: 'random-baseline',
    label: 'Random Baseline',
    description: '구조 점수를 쓰지 않는 재현 가능한 무작위 기준선이에요.',
  },
  {
    id: 'distance',
    label: 'Distance Model',
    description: '인접 간격과 모든 번호쌍의 거리 구조를 대조해요.',
  },
  {
    id: 'distribution',
    label: 'Distribution Model',
    description: '조합 전체의 위치·분산·밀도 구조를 대조해요.',
  },
  {
    id: 'geometry',
    label: 'Geometry Model',
    description: '좌표 공간에 투영한 도형의 형태와 공간 분산을 대조해요.',
  },
  {
    id: 'contrastive-ensemble',
    label: 'Contrastive Ensemble',
    description: 'Distance·Distribution·Geometry의 독립 구조 점수를 합쳐요.',
  },
];

export const DEFAULT_RESEARCH_ALGORITHM_ID: ResearchAlgorithmId =
  'random-baseline';

const EMPTY_DIAGNOSTICS: ModelDiagnostics = {
  features: [],
  selectedFeatureCount: 0,
  partitions: { discovery: 0, validation: 0, holdout: 0 },
  winningSamples: 0,
  randomSamples: 0,
};

export const randomBaselineAlgorithm: CandidateAlgorithm = {
  id: 'random-baseline',
  fit(history: readonly LottoDraw[]): FittedCombinationModel {
    return {
      id: 'random-baseline',
      diagnostics: {
        ...EMPTY_DIAGNOSTICS,
        partitions: { discovery: history.length, validation: 0, holdout: 0 },
        winningSamples: history.length,
      },
      scoreCombination: () => 0.5,
    };
  },
};

export function researchAlgorithmDefinition(
  id: ResearchAlgorithmId,
): ResearchAlgorithmDefinition {
  const definition = researchAlgorithmDefinitions.find((item) => item.id === id);
  if (definition === undefined) throw new Error(`알 수 없는 v3 알고리즘: ${id}`);
  return definition;
}

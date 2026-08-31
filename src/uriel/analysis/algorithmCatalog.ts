import type { AlgorithmId, LayoutMode } from '../types';

export interface AlgorithmDefinition {
  id: AlgorithmId;
  label: string;
  description: string;
  fixedLayout: LayoutMode | null;
  purchasePolicy: 'standard' | 'tail-coverage';
}

export const algorithmDefinitions: readonly AlgorithmDefinition[] = [
  {
    id: 'baseline',
    label: '기본 방식',
    description:
      '8·24·72회 흐름과 과거 유사 상태의 다음 이동을 결합해 고정 조합 공간을 탐색해요.',
    fixedLayout: null,
    purchasePolicy: 'standard',
  },
  {
    id: 'transition-tail',
    label: '형태 전이 + Tail Coverage',
    description:
      '후보 15개 조합을 7×7 형태 전이로 평가하고, 상위권 7게임과 저중복 3게임을 묶어요.',
    fixedLayout: 'board',
    purchasePolicy: 'tail-coverage',
  },
];

export const DEFAULT_ALGORITHM_ID: AlgorithmId = 'baseline';

export function algorithmDefinition(id: AlgorithmId): AlgorithmDefinition {
  return algorithmDefinitions.find((definition) => definition.id === id)!;
}

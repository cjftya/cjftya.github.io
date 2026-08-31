import type { AlgorithmId } from '../types';

export interface AlgorithmDefinition {
  id: AlgorithmId;
  label: string;
  description: string;
}

export const algorithmDefinitions: readonly AlgorithmDefinition[] = [
  {
    id: 'baseline',
    label: '기본 방식',
    description:
      '8·24·72회 흐름과 과거 유사 상태의 다음 이동을 결합해 고정 조합 공간을 탐색해요.',
  },
];

export const DEFAULT_ALGORITHM_ID: AlgorithmId = 'baseline';

export function algorithmDefinition(id: AlgorithmId): AlgorithmDefinition {
  return algorithmDefinitions.find((definition) => definition.id === id)!;
}

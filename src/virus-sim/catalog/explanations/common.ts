import { OBSERVATION_PARTS } from '../../model/observationPresets';
import type { ObservationDefinition } from '../types';
import type {
  StructureExplanation,
  StructureExplanationEvidence,
  StructureExplanationTarget,
} from './types';

const LAYER_SUMMARIES: Readonly<
  Record<ObservationDefinition['layers'][number]['id'], string>
> = {
  envelope: '바이러스 입자의 가장 바깥쪽 지질막이에요.',
  'surface-protein': '입자 표면에서 숙주와 상호작용하는 단백질 그룹이에요.',
  tegument: '외피와 캡시드 사이의 단백질성 중간 영역이에요.',
  capsid: '유전체를 둘러싸는 단백질 껍질이에요.',
  tail: '숙주 인식과 유전체 전달에 관여하는 파지 꼬리 장치예요.',
  'outer-capsid': '다층 입자의 가장 바깥쪽 단백질 껍질이에요.',
  'middle-capsid': '바깥 껍질과 코어 사이에 놓인 중간 단백질층이에요.',
  'core-capsid': '유전체와 전사 장치를 감싸는 안쪽 단백질 껍질이에요.',
  'inner-membrane': '단백질 캡시드 안쪽에 놓인 바이러스 막이에요.',
  matrix: '외피 안쪽에서 입자 형태와 조립을 지지하는 단백질층이에요.',
  nucleocapsid: '유전체와 결합 단백질이 이루는 내부 복합체예요.',
  membrane: '복합 바이러스 입자를 둘러싸는 막 구조예요.',
  'core-wall': '복합 바이러스의 유전체 코어를 둘러싼 구조예요.',
  'lateral-body': '폭스바이러스 코어 양옆에 놓이는 내부 구조예요.',
  genome: '바이러스의 유전정보를 담는 핵산이에요.',
};

export function createGenericExplanation(
  definition: ObservationDefinition,
  target: StructureExplanationTarget,
): StructureExplanation | null {
  if (target.kind === 'part') {
    if (!definition.parts.includes(target.id)) return null;
    const part = OBSERVATION_PARTS[target.id];
    return {
      genericSummary: part.summary,
      actualName: part.name,
      role: part.detail,
      modelRepresentation: `현재 모델에서 ${part.name}에 해당하는 선택 가능한 기하로 묶어 표시해요.`,
      simplification: definition.simplifications[0],
      evidence: evidenceFor(definition),
      sourceIds: definition.sourceIds,
      scope: 'generic',
    };
  }

  const layer = definition.layers.find((candidate) => candidate.id === target.id);
  if (!layer) return null;
  return {
    genericSummary: LAYER_SUMMARIES[target.id],
    actualName: layer.name,
    role: layer.note ?? LAYER_SUMMARIES[target.id],
    modelRepresentation: `현재 모델에서 ${layer.name}에 해당하는 표시 레이어로 묶어 보여줘요.`,
    simplification: definition.simplifications[0],
    evidence: evidenceFor(definition),
    sourceIds: definition.sourceIds,
    scope: 'generic',
  };
}

function evidenceFor(definition: ObservationDefinition): StructureExplanationEvidence {
  if (definition.evidenceStatus === 'observed') return 'observed';
  if (definition.evidenceStatus === 'conceptual') return 'family-supported';
  return 'conceptual';
}

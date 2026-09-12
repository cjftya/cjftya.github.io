import { HUMAN_EXPANSION_CATALOG } from '../definitions/humanExpansion';
import type { ObservationLayerId, ObservationPartId, VirusId } from '../types';
import {
  layerTarget,
  partTarget,
  type EntryExplanationRegistration,
  type StructureExplanationContent,
  type StructureExplanationTarget,
} from './types';

interface Copy {
  readonly name: string;
  readonly summary: string;
  readonly role: string;
  readonly location: string;
}

const PART_COPY: Readonly<Partial<Record<ObservationPartId, Copy>>> = {
  envelope: {
    name: '바이러스 지질 외피',
    summary: '숙주 유래 지질막과 바이러스 막단백질이 이루는 입자 외곽이에요.',
    role: '표면 단백질을 지지하고 내부 구조를 외부 환경과 분리해요.',
    location: '입자의 가장 바깥쪽',
  },
  spike: {
    name: '표면 당단백질',
    summary: '숙주 인식과 세포 진입에 관여하는 바이러스 표면 단백질이에요.',
    role: '수용체 결합 또는 막 융합의 초기 단계를 담당해요.',
    location: '외피 또는 capsid 표면',
  },
  matrix: {
    name: 'Matrix 단백질층',
    summary: '외피 안쪽에서 입자 조립과 형태를 지지하는 단백질층이에요.',
    role: '외피와 내부 nucleocapsid의 조립 관계를 조직해요.',
    location: '지질 외피 바로 안쪽',
  },
  nucleocapsid: {
    name: 'Nucleocapsid',
    summary: '바이러스 핵산과 결합 단백질이 이루는 내부 복합체예요.',
    role: '유전체를 보호하고 입자 내부에 정렬해요.',
    location: '외피·matrix 또는 capsid 안쪽',
  },
  rnp: {
    name: '바이러스 RNP',
    summary: 'RNA와 nucleoprotein·polymerase가 이루는 기능성 복합체예요.',
    role: 'RNA를 보호하고 전사·복제 가능한 형태로 유지해요.',
    location: 'matrix 또는 외피 안쪽',
  },
  genome: {
    name: '바이러스 유전체',
    summary: '다음 감염 주기로 전달되는 바이러스 핵산이에요.',
    role: '바이러스 단백질 발현과 유전체 복제 정보를 담아요.',
    location: '입자의 가장 안쪽 core 또는 RNP 내부',
  },
  capsid: {
    name: 'Capsid shell',
    summary: '유전체를 둘러싸는 바이러스 단백질 shell이에요.',
    role: '유전체를 보호하고 입자의 조립 틀을 만들어요.',
    location: '유전체 바깥쪽',
  },
  capsomer: {
    name: 'Capsomer 단위',
    summary: 'capsid 표면을 조립하는 반복 단백질 단위예요.',
    role: '반복 배열로 안정한 capsid shell을 만들어요.',
    location: 'capsid 표면',
  },
  'surface-domain': {
    name: 'Capsid 표면 도메인',
    summary: 'capsid protein의 바깥쪽 표면 특징을 나타내는 영역이에요.',
    role: '입자의 표면 형태와 항원성 경계를 만들어요.',
    location: 'capsid shell 바깥 표면',
  },
  tegument: {
    name: 'Herpesvirus tegument',
    summary: 'herpesvirus 외피와 capsid 사이의 비균일 단백질 영역이에요.',
    role: '감염 초기에 필요한 단백질을 운반하고 조립을 연결해요.',
    location: '지질 외피와 capsid 사이',
  },
  'core-wall': {
    name: 'Poxvirus core wall',
    summary: 'poxvirus 유전체 core를 둘러싸는 단백질성 벽이에요.',
    role: '유전체와 입자 내 효소를 보호해요.',
    location: '벽돌형 입자의 중앙',
  },
  'lateral-body': {
    name: 'Poxvirus lateral body',
    summary: 'poxvirus core 양옆에 놓이는 단백질성 내부 구조예요.',
    role: '감염 초기에 전달되는 단백질을 포함해요.',
    location: '중앙 core의 양옆',
  },
};

const LAYER_COPY: Readonly<Partial<Record<ObservationLayerId, Copy>>> = {
  envelope: PART_COPY.envelope,
  'surface-protein': PART_COPY.spike,
  matrix: PART_COPY.matrix,
  nucleocapsid: PART_COPY.nucleocapsid,
  genome: PART_COPY.genome,
  capsid: PART_COPY.capsid,
  tegument: PART_COPY.tegument,
  membrane: {
    name: '성숙 poxvirus 입자막',
    summary: '성숙 poxvirus 입자를 둘러싸는 막 구조예요.',
    role: '복합 입자의 외곽을 이루고 내부 구조를 감싸요.',
    location: '벽돌형 입자의 가장 바깥쪽',
  },
  'core-wall': PART_COPY['core-wall'],
  'lateral-body': PART_COPY['lateral-body'],
};

function targetsFor(
  definition: (typeof HUMAN_EXPANSION_CATALOG)[number],
): readonly StructureExplanationTarget[] {
  return [
    ...definition.parts.map((id) => partTarget(id)),
    ...definition.layers.map(({ id }) => layerTarget(id)),
  ];
}

function copyFor(target: StructureExplanationTarget): Copy {
  const copy = target.kind === 'part' ? PART_COPY[target.id] : LAYER_COPY[target.id];
  if (!copy)
    throw new Error(`Missing v4.8.4 explanation copy: ${target.kind}:${target.id}`);
  return copy;
}

function renderDescription(
  builder: (typeof HUMAN_EXPANSION_CATALOG)[number]['modelBuilder'],
  target: StructureExplanationTarget,
): string {
  const id = target.id;
  if (builder === 'filovirus')
    return `${id}를 굽은 필라멘트 중심선을 따르는 관형 기하로 표시해요.`;
  if (builder === 'vsv')
    return `${id}를 총알형 외피 축에 맞춘 shell·나선 기하로 표시해요.`;
  if (builder === 'vaccinia')
    return `${id}를 둥근 벽돌형 입자의 막·core·lateral body 기하로 표시해요.`;
  if (builder === 'hsv')
    return `${id}를 외피·tegument·정이십면체 capsid의 겹친 기하로 표시해요.`;
  if (builder === 'influenza')
    return `${id}를 외피 안쪽 8개 RNP가 구분되는 절차 기하로 표시해요.`;
  if (builder === 'alphavirus')
    return `${id}를 방사형 spike와 정이십면체 core의 대응 기하로 표시해요.`;
  if (builder === 'icosahedral-capsid')
    return `${id}를 조밀한 정이십면체 shell과 내부 RNA 기하로 표시해요.`;
  return `${id}를 profile에 정의된 외피·표면·RNP 절차 기하로 표시해요.`;
}

function explanationFor(
  definition: (typeof HUMAN_EXPANSION_CATALOG)[number],
  target: StructureExplanationTarget,
): StructureExplanationContent {
  const copy = copyFor(target);
  return {
    genericSummary: copy.summary,
    actualName: copy.name,
    role: copy.role,
    location: copy.location,
    relationships: ['바깥 구조와 안쪽 유전체 사이의 실제 층 관계를 따라 배치돼요.'],
    modelRepresentation: renderDescription(definition.modelBuilder, target),
    simplification:
      '원자 배열과 실제 단백질 수는 생략하고 관찰 가능한 층 관계만 나타내요.',
    evidence: 'family-supported',
    sourceIds: definition.sourceIds,
  };
}

export const HUMAN_EXPANSION_EXPLANATION_IDS = HUMAN_EXPANSION_CATALOG.map(
  ({ id }) => id,
) as readonly VirusId[];

export const HUMAN_EXPANSION_STRUCTURE_EXPLANATIONS: readonly EntryExplanationRegistration[] =
  HUMAN_EXPANSION_CATALOG.flatMap((definition) =>
    targetsFor(definition).map((target) => ({
      virusId: definition.id as VirusId,
      targets: [target],
      explanation: explanationFor(definition, target),
    })),
  );

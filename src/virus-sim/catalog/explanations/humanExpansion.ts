import { HUMAN_EXPANSION_CATALOG } from '../definitions/humanExpansion';
import { getHumanRnpEvidence, getHumanRnpProfile } from '../humanExpansionProfiles';
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
    throw new Error(`Missing v4.8.5 explanation copy: ${target.kind}:${target.id}`);
  return copy;
}

function renderDescription(
  definition: (typeof HUMAN_EXPANSION_CATALOG)[number],
  target: StructureExplanationTarget,
): string {
  const builder = definition.modelBuilder;
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
  if (builder === 'human-rnp') return renderHumanRnpDescription(definition.id, target);
  return `${id}를 profile에 정의된 외피·표면·RNP 절차 기하로 표시해요.`;
}

function explanationFor(
  definition: (typeof HUMAN_EXPANSION_CATALOG)[number],
  target: StructureExplanationTarget,
): StructureExplanationContent {
  const copy = humanRnpCopy(definition, target) ?? copyFor(target);
  const componentEvidence = humanRnpComponentEvidence(definition, target);
  return {
    genericSummary: copy.summary,
    actualName: copy.name,
    role: copy.role,
    location: copy.location,
    relationships: ['바깥 구조와 안쪽 유전체 사이의 실제 층 관계를 따라 배치돼요.'],
    modelRepresentation: renderDescription(definition, target),
    simplification:
      '원자 배열은 생략하며 화면 반복 수는 실제 화학량론이 아니에요. 확인되지 않은 내부 구조는 개념 표현으로 제한해요.',
    evidence: componentEvidence?.level ?? 'family-supported',
    sourceIds: componentEvidence?.sourceIds ?? definition.sourceIds,
  };
}

function renderHumanRnpDescription(
  virusId: string,
  target: StructureExplanationTarget,
): string {
  const profile = getHumanRnpProfile(virusId);
  const prefix =
    getHumanRnpEvidence(profile, virusId).find(
      ({ componentId }) => componentId === 'particle',
    )?.level === 'observed'
      ? '관측 구조 기반 절차 모델'
      : '계열 공통 절차 모델';
  const isSurface = target.id === 'spike' || target.id === 'surface-protein';
  const isInner = target.id === 'nucleocapsid' || target.id === 'genome';

  if (virusId === 'rubella-virus') {
    if (isSurface) return `${prefix}에서 E1/E2를 연속적인 표면 row·band로 배치해요.`;
    if (isInner)
      return `${prefix}에서 정이십면체 shell 대신 grid-like capsid–RNA 조직으로 표시해요.`;
    return `${prefix}에서 약한 비대칭의 다형성 외피를 표시해요.`;
  }
  if (
    ['dengue-virus', 'zika-virus', 'yellow-fever-virus', 'west-nile-virus'].includes(
      virusId,
    )
  ) {
    if (isSurface)
      return `${prefix}에서 정렬된 E/M raft shell을 내부 capsid–RNA 영역과 분리해요.`;
    if (isInner)
      return `${prefix}에서 내부 구조는 정이십면체 capsid로 단정하지 않는 불규칙 RNP 개념 표현이에요.`;
    if (virusId === 'yellow-fever-virus')
      return `${prefix}이며 PDB 6IW4는 부분 E 단백질 구조만 참고해요.`;
  }
  if (virusId === 'hepatitis-c-virus') {
    if (isSurface)
      return `${prefix}에서 sparse E1/E2와 lipoprotein-associated patch를 불규칙하게 표시해요.`;
    if (isInner)
      return `${prefix}에서 내부 capsid–RNA는 정이십면체 shell이 아닌 개념 수준의 불규칙 RNP예요.`;
    return `${prefix}에서 크기·형태가 이질적인 lipoviroparticle 대표 표본을 표시해요.`;
  }
  return `${prefix}에서 ${target.id}를 profile의 외피·표면·RNP 층 관계에 맞춰 표시해요.`;
}

function humanRnpCopy(
  definition: (typeof HUMAN_EXPANSION_CATALOG)[number],
  target: StructureExplanationTarget,
): Copy | undefined {
  if (definition.modelBuilder !== 'human-rnp') return undefined;
  const profile = getHumanRnpProfile(definition.id);
  const isSurface = target.id === 'spike' || target.id === 'surface-protein';
  if (isSurface) {
    const labels = profile.surfaces.map(({ label }) => label).join(' · ');
    return {
      name: labels,
      summary: `${labels}을 profile의 실제 단백질 정체성과 표면 조직에 맞춰 구분해요.`,
      role: '수용체 결합 또는 막 융합의 초기 단계를 담당해요.',
      location: '지질 외피의 바깥 표면',
    };
  }
  if (
    (target.id === 'nucleocapsid' || target.id === 'genome') &&
    profile.core === 'grid-like-rnp'
  ) {
    return {
      name:
        target.id === 'genome'
          ? 'Rubella ssRNA(+) 유전체'
          : '비정이십면체 capsid–RNA 조직',
      summary:
        'Capsid와 RNA가 정이십면체 shell을 만들지 않는 grid-like 내부 조직이에요.',
      role:
        target.id === 'genome'
          ? '바이러스 유전 정보를 전달해요.'
          : 'RNA를 외피 안쪽에 조직해요.',
      location: '다형성 외피 바로 안쪽',
    };
  }
  if (
    (target.id === 'nucleocapsid' || target.id === 'genome') &&
    profile.core === 'irregular-rnp'
  ) {
    return {
      name: target.id === 'genome' ? 'ssRNA(+) 유전체' : '불규칙 capsid–RNA 영역',
      summary:
        '관측 한계를 넘는 정이십면체 대칭을 가정하지 않은 내부 RNP 개념 영역이에요.',
      role:
        target.id === 'genome'
          ? '바이러스 유전 정보를 전달해요.'
          : 'RNA와 capsid 단백질의 내부 관계를 나타내요.',
      location: '지질 외피 안쪽',
    };
  }
  return undefined;
}

function humanRnpComponentEvidence(
  definition: (typeof HUMAN_EXPANSION_CATALOG)[number],
  target: StructureExplanationTarget,
) {
  if (definition.modelBuilder !== 'human-rnp') return undefined;
  const profile = getHumanRnpProfile(definition.id);
  const componentId =
    target.id === 'spike' || target.id === 'surface-protein'
      ? 'surface-shell'
      : target.id === 'nucleocapsid' || target.id === 'genome'
        ? 'inner-core'
        : 'particle';
  const evidence = getHumanRnpEvidence(profile, definition.id);
  return (
    evidence.find((entry) => entry.componentId === componentId) ??
    evidence.find((entry) => entry.componentId === 'particle')
  );
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

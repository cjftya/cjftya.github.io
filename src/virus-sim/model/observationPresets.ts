import type { ObservationPartId, ObservationPresetId } from '../observation/types';

export interface ObservationPartDefinition {
  readonly id: ObservationPartId;
  readonly name: string;
  readonly summary: string;
  readonly detail: string;
}

export interface ObservationPreset {
  readonly id: ObservationPresetId;
  readonly name: string;
  readonly shortName: string;
  readonly category: string;
  readonly genomeLabel: string;
  readonly description: string;
  readonly silhouette: 'polyhedron' | 'phage' | 'filament' | 'envelope';
  readonly parts: readonly ObservationPartId[];
  readonly supportsDeliveryDemo: boolean;
}

export const OBSERVATION_PARTS: Readonly<
  Record<ObservationPartId, ObservationPartDefinition>
> = {
  capsid: {
    id: 'capsid',
    name: '캡시드',
    summary: '유전체를 감싸는 단백질 껍질',
    detail:
      '반복되는 단백질 단위가 모여 내부 유전체를 보호해요. 화면의 패널 수는 실제 분자 수나 T-number를 뜻하지 않아요.',
  },
  capsomer: {
    id: 'capsomer',
    name: '표면 단위 배열',
    summary: '껍질 표면의 반복 조형',
    detail:
      '단백질 단위가 반복돼 껍질의 방향성과 틈을 만든다는 점을 보여주는 설명용 배열이에요.',
  },
  genome: {
    id: 'genome',
    name: '유전체',
    summary: '내부에 포장된 유전정보',
    detail:
      '종류와 내부 배치를 구분하기 위한 개념 곡선이에요. 실제 서열이나 원자 수준 패킹 좌표는 아니에요.',
  },
  neck: {
    id: 'neck',
    name: '목 연결부',
    summary: '머리와 꼬리를 잇는 접속 구조',
    detail: '캡시드와 꼬리 장치를 기계적으로 연결하고 전달 통로가 이어지는 부위예요.',
  },
  sheath: {
    id: 'sheath',
    name: '수축형 꼬리집',
    summary: '반복 링으로 둘러싼 가동 구조',
    detail:
      '일부 꼬리형 파지에서 수축하며 내부 관의 이동을 돕는 구조예요. 모든 파지가 이 장치를 갖는 것은 아니에요.',
  },
  'inner-tube': {
    id: 'inner-tube',
    name: '내부 관',
    summary: '유전체 전달 경로',
    detail: '꼬리집 안쪽에서 숙주 표면 방향으로 이어지는 관을 구분해 표현했어요.',
  },
  baseplate: {
    id: 'baseplate',
    name: '기저판',
    summary: '꼬리 끝의 부착 플랫폼',
    detail: '꼬리섬유와 내부 관을 연결하며 숙주 표면에 자세를 잡는 부위예요.',
  },
  'tail-fiber': {
    id: 'tail-fiber',
    name: '꼬리섬유',
    summary: '분절된 표면 인식 부품',
    detail: '숙주 표면 조건과 접촉하는 부품을 꺾인 여러 분절로 표현했어요.',
  },
  envelope: {
    id: 'envelope',
    name: '지질 외피',
    summary: '캡시드 바깥의 별도 층',
    detail: '일부 바이러스가 갖는 바깥 막이에요. 단백질 캡시드와는 서로 다른 층이에요.',
  },
  spike: {
    id: 'spike',
    name: '표면 돌기',
    summary: '외피 표면의 반복 돌기',
    detail: '세포 표면과 상호작용하는 돌기가 외피 바깥에 배열된 모습을 일반화했어요.',
  },
};

export const OBSERVATION_PRESETS: readonly ObservationPreset[] = [
  {
    id: 'tailed-phage',
    name: '수축형 꼬리 DNA 파지',
    shortName: '꼬리형 파지',
    category: '수축형 꼬리 구조 예시',
    genomeLabel: 'dsDNA 개념 곡선',
    description:
      '길쭉한 머리, 목, 반복 꼬리집, 내부 관과 분절된 꼬리섬유를 하나씩 살펴봐요.',
    silhouette: 'phage',
    parts: [
      'capsid',
      'capsomer',
      'genome',
      'neck',
      'sheath',
      'inner-tube',
      'baseplate',
      'tail-fiber',
    ],
    supportsDeliveryDemo: true,
  },
  {
    id: 'icosahedral',
    name: '정이십면체형 입자',
    shortName: '정이십면체형',
    category: '다면체 캡시드 예시',
    genomeLabel: 'DNA 개념 곡선',
    description:
      '각진 전체 윤곽과 표면 단위의 반복 배열, 닫힌 내부 공간을 함께 관찰해요.',
    silhouette: 'polyhedron',
    parts: ['capsid', 'capsomer', 'genome'],
    supportsDeliveryDemo: false,
  },
  {
    id: 'filamentous',
    name: '필라멘트형 입자',
    shortName: '필라멘트형',
    category: '나선형 피복 예시',
    genomeLabel: 'RNA 개념 곡선',
    description:
      '길고 가는 중심을 여러 나선 줄의 단백질 단위가 연속적으로 감싸는 형태예요.',
    silhouette: 'filament',
    parts: ['capsid', 'capsomer', 'genome'],
    supportsDeliveryDemo: false,
  },
  {
    id: 'enveloped',
    name: '외피 보유형 입자',
    shortName: '외피 보유형',
    category: '외피와 내부 캡시드 예시',
    genomeLabel: 'DNA 개념 곡선',
    description:
      '바깥 지질 외피와 돌기, 그 안쪽의 다면체 캡시드와 유전체를 층별로 분리해 봐요.',
    silhouette: 'envelope',
    parts: ['envelope', 'spike', 'capsid', 'capsomer', 'genome'],
    supportsDeliveryDemo: false,
  },
];

export function getObservationPreset(id: ObservationPresetId): ObservationPreset {
  return (
    OBSERVATION_PRESETS.find((preset) => preset.id === id) ?? OBSERVATION_PRESETS[0]!
  );
}

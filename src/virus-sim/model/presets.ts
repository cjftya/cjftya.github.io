import type { ReceptorDensity, SimulationConfig } from './types';

export const FIXED_DT = 1 / 60;
export const MODEL_VERSION = 'virus-sim-v1.0.0';

export const WORLD = {
  halfExtent: 8,
  bacteriumHalfLength: 2.35,
  bacteriumRadius: 1.25,
  phageCollisionRadius: 0.13,
} as const;

export const MODEL_RATES = {
  diffusion: 0.64,
  contactSettleDuration: 0.08,
  contactTimeout: 0.72,
  attachmentRate: {
    sparse: 2.2,
    default: 4.6,
    dense: 8.2,
  } satisfies Record<ReceptorDensity, number>,
  detachmentRate: 0.28,
  attachmentStableDuration: 0.42,
  deliveryDuration: 1.4,
  productionDuration: 5.2,
  genomeRate: 2.8,
  componentRate: 3.1,
  resourcePerGenome: 1.1,
  resourcePerComponent: 0.85,
  assemblyDuration: 3.1,
  assemblyInterval: 0.24,
  lysisDuration: 1.25,
  initialResource: 42,
  maxCompletedPhages: 14,
} as const;

export const DEFAULT_CONFIG: SimulationConfig = {
  initialPhageCount: 24,
  recognition: 'match',
  receptorDensity: 'default',
  placement: 'guided',
};

export type StructurePresetId = 'icosahedral' | 'tailed-phage' | 'filamentous';

export interface StructurePreset {
  readonly id: StructurePresetId;
  readonly name: string;
  readonly shortName: string;
  readonly description: string;
}

export const STRUCTURE_PRESETS: readonly StructurePreset[] = [
  {
    id: 'icosahedral',
    name: '정이십면체형 캡시드',
    shortName: '정이십면체형',
    description:
      '대칭적인 단백질 껍질을 기하학적으로 단순화한 형태예요. 면은 실제 캡소머 개수를 뜻하지 않아요.',
  },
  {
    id: 'tailed-phage',
    name: '꼬리 달린 DNA 파지',
    shortName: '꼬리형 파지',
    description:
      '길게 늘어난 머리와 수축형 꼬리, 표면 인식 부품을 가진 일반화된 파지 모형이에요.',
  },
  {
    id: 'filamentous',
    name: '필라멘트형 입자',
    shortName: '필라멘트형',
    description:
      '나선 배열의 단백질 단위가 유전체를 감싸는 가늘고 긴 바이러스 입자 모형이에요.',
  },
];

export const PART_DESCRIPTIONS = {
  capsid: {
    name: '캡시드 (capsid)',
    role: '유전체를 감싸는 단백질 껍질이에요. 지질로 된 외피와는 구별해요.',
  },
  genome: {
    name: '유전체 (genome)',
    role: '감염 뒤 숙주 안으로 전달되는 유전정보를 설명용 곡선으로 표현했어요.',
  },
  tail: {
    name: '꼬리 장치 (tail apparatus)',
    role: '숙주 표면에 접근하고 유전체가 이동할 통로를 형성하는 구조예요.',
  },
  receptor: {
    name: '표면 인식 부품',
    role: '숙주 표면의 조건을 인식하는 부품이에요. 머리 외형만으로 숙주를 정하지 않아요.',
  },
} as const;

export type PartId = keyof typeof PART_DESCRIPTIONS;

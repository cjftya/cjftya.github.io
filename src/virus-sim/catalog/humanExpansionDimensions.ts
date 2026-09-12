import type { PhysicalDimensions } from './types';

type DimensionInput = Omit<
  PhysicalDimensions,
  'particleState' | 'includesProjections'
> & {
  readonly particleState?: string;
  readonly includesProjections?: boolean;
};

const d = (input: DimensionInput): PhysicalDimensions => ({
  particleState: '대표 성숙 입자',
  includesProjections: false,
  ...input,
});

export const HUMAN_EXPANSION_DIMENSIONS: Readonly<Record<string, PhysicalDimensions>> =
  {
    'marburg-virus': d({
      metric: 'width',
      representativeNm: 90,
      rangeNm: [80, 100],
      includesProjections: true,
      sourceIds: ['ictv-filoviridae-structure'],
      note: '길이가 다양한 필라멘트형 입자의 대표 폭',
    }),
    'rabies-virus': d({
      metric: 'axial-length',
      representativeNm: 180,
      rangeNm: [150, 200],
      includesProjections: true,
      sourceIds: ['ictv-rhabdoviridae'],
    }),
    'dengue-virus': d({
      metric: 'diameter',
      representativeNm: 50,
      rangeNm: [40, 60],
      sourceIds: ['pdb-3j27', 'ictv-flaviviridae'],
    }),
    'zika-virus': d({
      metric: 'diameter',
      representativeNm: 50,
      rangeNm: [40, 60],
      sourceIds: ['pdb-5ire', 'ictv-flaviviridae'],
    }),
    'yellow-fever-virus': d({
      metric: 'diameter',
      representativeNm: 50,
      rangeNm: [40, 60],
      sourceIds: ['pdb-6iw4', 'ictv-flaviviridae'],
    }),
    'west-nile-virus': d({
      metric: 'diameter',
      representativeNm: 50,
      rangeNm: [40, 60],
      sourceIds: ['ictv-flaviviridae'],
      particleState: 'Flaviviridae 계열 범위',
    }),
    'nipah-virus': d({
      metric: 'diameter',
      representativeNm: 200,
      rangeNm: [100, 500],
      includesProjections: true,
      sourceIds: ['ictv-paramyxoviridae'],
      note: '다형성 입자의 구형 환산 대표값',
    }),
    'lassa-virus': d({
      metric: 'diameter',
      representativeNm: 120,
      rangeNm: [80, 150],
      includesProjections: true,
      sourceIds: ['ictv-arenaviridae'],
    }),
    'cchf-virus': d({
      metric: 'diameter',
      representativeNm: 100,
      rangeNm: [80, 120],
      includesProjections: true,
      sourceIds: ['ictv-nairoviridae'],
    }),
    'measles-virus': d({
      metric: 'diameter',
      representativeNm: 200,
      rangeNm: [100, 300],
      includesProjections: true,
      sourceIds: ['ictv-paramyxoviridae'],
      note: '다형성 입자의 구형 환산 대표값',
    }),
    rsv: d({
      metric: 'diameter',
      representativeNm: 180,
      rangeNm: [120, 300],
      includesProjections: true,
      sourceIds: ['ictv-pneumoviridae'],
      note: '구형·필라멘트형이 공존하는 다형성 입자의 대표값',
    }),
    'poliovirus-1': d({
      metric: 'diameter',
      representativeNm: 30,
      rangeNm: [27, 30],
      sourceIds: ['pdb-1hxs', 'ictv-picornaviridae'],
    }),
    'mpox-virus': d({
      metric: 'axial-length',
      representativeNm: 300,
      rangeNm: [200, 350],
      sourceIds: ['ictv-pox'],
      particleState: '성숙 입자(MV) 계열 범위',
    }),
    'variola-virus': d({
      metric: 'axial-length',
      representativeNm: 300,
      rangeNm: [200, 350],
      sourceIds: ['ictv-pox'],
      particleState: '성숙 입자(MV) 계열 범위',
    }),
    'hepatitis-c-virus': d({
      metric: 'diameter',
      representativeNm: 60,
      rangeNm: [50, 80],
      includesProjections: true,
      sourceIds: ['hcv-particle-review', 'ictv-flaviviridae'],
      particleState: '이질적 lipoviroparticle 개념 범위',
    }),
    'hantaan-virus': d({
      metric: 'diameter',
      representativeNm: 100,
      rangeNm: [80, 120],
      includesProjections: true,
      sourceIds: ['ictv-hantaviridae'],
    }),
    'varicella-zoster-virus': d({
      metric: 'diameter',
      representativeNm: 180,
      rangeNm: [150, 200],
      includesProjections: true,
      sourceIds: ['ictv-herpes'],
    }),
    'epstein-barr-virus': d({
      metric: 'diameter',
      representativeNm: 180,
      rangeNm: [150, 200],
      includesProjections: true,
      sourceIds: ['ictv-herpes'],
    }),
    'influenza-a-h1n1pdm09': d({
      metric: 'diameter',
      representativeNm: 100,
      rangeNm: [80, 120],
      includesProjections: true,
      sourceIds: ['ictv-influenza', 'influenza-quant'],
      note: '다형성 중 구형 입자 기준',
    }),
    'influenza-a-h5n1': d({
      metric: 'diameter',
      representativeNm: 100,
      rangeNm: [80, 120],
      includesProjections: true,
      sourceIds: ['ictv-influenza', 'influenza-quant'],
      note: '다형성 중 구형 입자 기준',
    }),
    'mumps-virus': d({
      metric: 'diameter',
      representativeNm: 200,
      rangeNm: [100, 300],
      includesProjections: true,
      sourceIds: ['ictv-paramyxoviridae'],
      note: '다형성 입자의 구형 환산 대표값',
    }),
    'rubella-virus': d({
      metric: 'diameter',
      representativeNm: 70,
      rangeNm: [60, 80],
      includesProjections: true,
      sourceIds: ['ictv-matonaviridae'],
    }),
    'chikungunya-virus': d({
      metric: 'diameter',
      representativeNm: 70,
      rangeNm: [65, 70],
      includesProjections: true,
      sourceIds: ['pdb-6nk5', 'ictv-togaviridae'],
    }),
    'hepatitis-a-virus': d({
      metric: 'diameter',
      representativeNm: 30,
      rangeNm: [27, 32],
      sourceIds: ['pdb-4qpi', 'ictv-picornaviridae'],
    }),
  };

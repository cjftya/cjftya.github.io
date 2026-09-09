import type { PhysicalDimensions } from './types';

type DimensionInput = Omit<
  PhysicalDimensions,
  'particleState' | 'includesProjections'
> & {
  readonly particleState?: string;
  readonly includesProjections?: boolean;
};

function d(input: DimensionInput): PhysicalDimensions {
  return {
    particleState: '대표 성숙 입자',
    includesProjections: false,
    ...input,
  };
}

// 대표값은 화면 환산에만 사용해요. 범위·상태·측정 축을 함께 보여주며
// displayLength를 나노미터로 재해석하지 않아요.
export const PHYSICAL_DIMENSIONS: Readonly<Record<string, PhysicalDimensions>> = {
  t4: d({
    metric: 'axial-length',
    representativeNm: 200,
    rangeNm: [190, 210],
    includesProjections: true,
    sourceIds: ['pdb-7vs5'],
    note: '머리부터 꼬리 장치 끝까지의 대표 길이',
  }),
  lambda: d({
    metric: 'axial-length',
    representativeNm: 190,
    rangeNm: [180, 200],
    includesProjections: true,
    sourceIds: ['pdb-8iyd'],
  }),
  t7: d({
    metric: 'axial-length',
    representativeNm: 60,
    rangeNm: [55, 65],
    includesProjections: true,
    sourceIds: ['pdb-3j7v'],
  }),
  ms2: d({
    metric: 'diameter',
    representativeNm: 27,
    rangeNm: [26, 28],
    sourceIds: ['pdb-5tc1'],
  }),
  tmv: d({
    metric: 'axial-length',
    representativeNm: 300,
    rangeNm: [295, 305],
    sourceIds: ['pdb-2tmv'],
  }),
  m13: d({
    metric: 'contour-length',
    representativeNm: 880,
    rangeNm: [850, 900],
    sourceIds: ['pdb-2mjz'],
    note: '굽은 경우 끝점 거리가 아닌 윤곽 길이',
  }),
  'adenovirus-5': d({
    metric: 'diameter',
    representativeNm: 90,
    rangeNm: [80, 100],
    includesProjections: true,
    sourceIds: ['pdb-4v4u'],
  }),
  'rotavirus-rrv': d({
    metric: 'diameter',
    representativeNm: 100,
    rangeNm: [95, 105],
    includesProjections: true,
    sourceIds: ['pdb-4v7q'],
  }),
  hsv1: d({
    metric: 'diameter',
    representativeNm: 186,
    rangeNm: [155, 225],
    includesProjections: true,
    sourceIds: ['ictv-herpes'],
  }),
  'influenza-a': d({
    metric: 'diameter',
    representativeNm: 100,
    rangeNm: [80, 120],
    includesProjections: true,
    sourceIds: ['influenza-quant'],
    note: '다형성 중 구형 입자 기준',
  }),
  'vsv-indiana': d({
    metric: 'axial-length',
    representativeNm: 180,
    rangeNm: [170, 200],
    includesProjections: true,
    sourceIds: ['emd-26603'],
  }),
  'vaccinia-mv': d({
    metric: 'axial-length',
    representativeNm: 300,
    rangeNm: [250, 350],
    sourceIds: ['ictv-pox'],
    particleState: '성숙 입자(MV)',
  }),
  phix174: d({
    metric: 'diameter',
    representativeNm: 33,
    rangeNm: [30, 35],
    includesProjections: true,
    sourceIds: ['pdb-2bpa'],
  }),
  qbeta: d({
    metric: 'diameter',
    representativeNm: 28,
    rangeNm: [27, 30],
    sourceIds: ['pdb-1qbe'],
  }),
  phi29: d({
    metric: 'axial-length',
    representativeNm: 54,
    rangeNm: [50, 60],
    includesProjections: true,
    sourceIds: ['pdb-6qvk'],
  }),
  p22: d({
    metric: 'axial-length',
    representativeNm: 85,
    rangeNm: [75, 95],
    includesProjections: true,
    sourceIds: ['pdb-8tvr'],
  }),
  hk97: d({
    metric: 'diameter',
    representativeNm: 66,
    rangeNm: [62, 70],
    sourceIds: ['pdb-2ft1'],
  }),
  t5: d({
    metric: 'axial-length',
    representativeNm: 160,
    rangeNm: [150, 170],
    includesProjections: true,
    sourceIds: ['pdb-8zvi'],
  }),
  t1: d({
    metric: 'axial-length',
    representativeNm: 200,
    rangeNm: [185, 215],
    includesProjections: true,
    sourceIds: ['pdb-9l01'],
  }),
  prd1: d({
    metric: 'diameter',
    representativeNm: 66,
    rangeNm: [60, 70],
    sourceIds: ['pdb-1w8x'],
  }),
  phi6: d({
    metric: 'diameter',
    representativeNm: 85,
    rangeNm: [75, 90],
    includesProjections: true,
    sourceIds: ['ictv-cystoviridae'],
  }),
  pm2: d({
    metric: 'diameter',
    representativeNm: 60,
    rangeNm: [55, 65],
    sourceIds: ['ictv-corticoviridae'],
  }),
  ap205: d({
    metric: 'diameter',
    representativeNm: 29,
    rangeNm: [27, 31],
    sourceIds: ['pdb-5jzr'],
  }),
  ccmv: d({
    metric: 'diameter',
    representativeNm: 28,
    rangeNm: [26, 30],
    sourceIds: ['pdb-1cwp'],
  }),
  bmv: d({
    metric: 'diameter',
    representativeNm: 28,
    rangeNm: [26, 30],
    sourceIds: ['pdb-1js9'],
  }),
  cpmv: d({
    metric: 'diameter',
    representativeNm: 30,
    rangeNm: [28, 31],
    sourceIds: ['pdb-1ny7'],
  }),
  tbsv: d({
    metric: 'diameter',
    representativeNm: 33,
    rangeNm: [30, 35],
    sourceIds: ['pdb-2tbv'],
  }),
  stmv: d({
    metric: 'diameter',
    representativeNm: 18,
    rangeNm: [17, 19],
    sourceIds: ['pdb-1a34'],
  }),
  'cmv-fny': d({
    metric: 'diameter',
    representativeNm: 29,
    rangeNm: [28, 30],
    sourceIds: ['pdb-1f15'],
  }),
  tymv: d({
    metric: 'diameter',
    representativeNm: 30,
    rangeNm: [28, 30],
    sourceIds: ['pdb-1auy'],
  }),
  pvx: d({
    metric: 'contour-length',
    representativeNm: 515,
    rangeNm: [470, 580],
    sourceIds: ['emd-pvx'],
  }),
  papmv: d({
    metric: 'contour-length',
    representativeNm: 500,
    rangeNm: [450, 550],
    sourceIds: ['pdb-4dox'],
  }),
  pvy: d({
    metric: 'contour-length',
    representativeNm: 730,
    rangeNm: [680, 780],
    sourceIds: ['pdb-6hxx'],
  }),
  camv: d({
    metric: 'diameter',
    representativeNm: 50,
    rangeNm: [45, 52],
    sourceIds: ['ictv-caulimoviridae'],
  }),
  'maize-streak': d({
    metric: 'axial-length',
    representativeNm: 30,
    rangeNm: [28, 32],
    sourceIds: ['ictv-geminiviridae'],
  }),
  tylcv: d({
    metric: 'axial-length',
    representativeNm: 30,
    rangeNm: [28, 32],
    sourceIds: ['ictv-geminiviridae'],
  }),
  aav2: d({
    metric: 'diameter',
    representativeNm: 25,
    rangeNm: [23, 26],
    sourceIds: ['pdb-1lp3'],
  }),
  'canine-parvovirus': d({
    metric: 'diameter',
    representativeNm: 26,
    rangeNm: [24, 28],
    sourceIds: ['pdb-2cas'],
  }),
  pcv2: d({
    metric: 'diameter',
    representativeNm: 20,
    rangeNm: [17, 22],
    sourceIds: ['pdb-3jci'],
  }),
  hpv16: d({
    metric: 'diameter',
    representativeNm: 55,
    rangeNm: [50, 60],
    sourceIds: ['pdb-7kzf'],
  }),
  sv40: d({
    metric: 'diameter',
    representativeNm: 50,
    rangeNm: [45, 55],
    sourceIds: ['pdb-1sva'],
  }),
  'murine-polyomavirus': d({
    metric: 'diameter',
    representativeNm: 50,
    rangeNm: [45, 55],
    sourceIds: ['pdb-1sie'],
  }),
  norwalk: d({
    metric: 'diameter',
    representativeNm: 38,
    rangeNm: [35, 40],
    sourceIds: ['pdb-1ihm'],
  }),
  rhdv: d({
    metric: 'diameter',
    representativeNm: 40,
    rangeNm: [35, 40],
    sourceIds: ['pdb-3j1p'],
  }),
  'astrovirus-1': d({
    metric: 'diameter',
    representativeNm: 33,
    rangeNm: [28, 35],
    includesProjections: true,
    sourceIds: ['pdb-5ewn'],
  }),
  hbv: d({
    metric: 'diameter',
    representativeNm: 42,
    rangeNm: [40, 48],
    includesProjections: true,
    sourceIds: ['ictv-hepadnaviridae'],
    particleState: 'Dane particle',
  }),
  sindbis: d({
    metric: 'diameter',
    representativeNm: 70,
    rangeNm: [65, 75],
    includesProjections: true,
    sourceIds: ['pdb-6imm'],
  }),
  'semliki-forest': d({
    metric: 'diameter',
    representativeNm: 70,
    rangeNm: [65, 75],
    includesProjections: true,
    sourceIds: ['emd-sfv'],
  }),
  'flock-house': d({
    metric: 'diameter',
    representativeNm: 30,
    rangeNm: [28, 32],
    sourceIds: ['pdb-4ftb'],
  }),
  ibdv: d({
    metric: 'diameter',
    representativeNm: 60,
    rangeNm: [55, 65],
    sourceIds: ['pdb-2df7'],
  }),
  bluetongue: d({
    metric: 'diameter',
    representativeNm: 86,
    rangeNm: [80, 90],
    sourceIds: ['pdb-2btv'],
  }),
  'reovirus-t3d': d({
    metric: 'diameter',
    representativeNm: 85,
    rangeNm: [80, 90],
    includesProjections: true,
    sourceIds: ['pdb-1ej6'],
  }),
  ssv1: d({
    metric: 'axial-length',
    representativeNm: 100,
    rangeNm: [90, 110],
    includesProjections: true,
    sourceIds: ['ictv-fuselloviridae'],
  }),
  sirv2: d({
    metric: 'axial-length',
    representativeNm: 900,
    rangeNm: [830, 900],
    includesProjections: true,
    sourceIds: ['ictv-rudiviridae'],
  }),
  stiv: d({
    metric: 'diameter',
    representativeNm: 75,
    rangeNm: [70, 80],
    includesProjections: true,
    sourceIds: ['pdb-3j31'],
  }),
  atv: d({
    metric: 'axial-length',
    representativeNm: 200,
    rangeNm: [180, 220],
    includesProjections: true,
    sourceIds: ['ictv-bicaudaviridae'],
  }),
  'ebola-virus': d({
    metric: 'contour-length',
    representativeNm: 805,
    rangeNm: [805, 20000],
    includesProjections: true,
    sourceIds: ['ictv-orthoebolavirus'],
    note: '폭은 96–98 nm. 길이는 매우 다양하고 805 nm는 감염성과 연관된 대표값',
  }),
  'sudan-virus': d({
    metric: 'width',
    representativeNm: 97,
    rangeNm: [96, 98],
    includesProjections: true,
    sourceIds: ['ictv-orthoebolavirus'],
    particleState: '계열 공통 폭',
  }),
  'bundibugyo-virus': d({
    metric: 'width',
    representativeNm: 97,
    rangeNm: [96, 98],
    includesProjections: true,
    sourceIds: ['ictv-orthoebolavirus'],
    particleState: '계열 공통 폭',
  }),
  'tai-forest-virus': d({
    metric: 'width',
    representativeNm: 97,
    rangeNm: [96, 98],
    includesProjections: true,
    sourceIds: ['ictv-orthoebolavirus'],
    particleState: '계열 공통 폭',
  }),
  'reston-virus': d({
    metric: 'width',
    representativeNm: 97,
    rangeNm: [96, 98],
    includesProjections: true,
    sourceIds: ['ictv-orthoebolavirus'],
    particleState: '계열 공통 폭',
  }),
  'bombali-virus': d({
    metric: 'width',
    representativeNm: 97,
    rangeNm: [96, 98],
    includesProjections: true,
    sourceIds: ['ictv-orthoebolavirus'],
    particleState: '계열 공통 폭',
  }),
  'hiv-1': d({
    metric: 'diameter',
    representativeNm: 100,
    rangeNm: [80, 120],
    includesProjections: true,
    sourceIds: ['ictv-retroviridae', 'hiv-particle-review'],
  }),
  'hiv-2': d({
    metric: 'diameter',
    representativeNm: 90,
    rangeNm: [80, 100],
    includesProjections: true,
    sourceIds: ['ictv-retroviridae'],
    particleState: 'Retroviridae 계열 범위',
  }),
  'hcov-229e': d({
    metric: 'diameter',
    representativeNm: 100,
    rangeNm: [80, 120],
    includesProjections: true,
    sourceIds: ['ictv-coronaviridae'],
    particleState: '계열 공통 대표 범위',
  }),
  'hcov-nl63': d({
    metric: 'diameter',
    representativeNm: 100,
    rangeNm: [80, 120],
    includesProjections: true,
    sourceIds: ['ictv-coronaviridae'],
    particleState: '계열 공통 대표 범위',
  }),
  'hcov-oc43': d({
    metric: 'diameter',
    representativeNm: 100,
    rangeNm: [80, 120],
    includesProjections: true,
    sourceIds: ['ictv-coronaviridae'],
    particleState: '계열 공통 대표 범위',
  }),
  'hcov-hku1': d({
    metric: 'diameter',
    representativeNm: 100,
    rangeNm: [80, 120],
    includesProjections: true,
    sourceIds: ['ictv-coronaviridae'],
    particleState: '계열 공통 대표 범위',
  }),
  'sars-cov': d({
    metric: 'diameter',
    representativeNm: 100,
    rangeNm: [80, 120],
    includesProjections: true,
    sourceIds: ['ictv-coronaviridae'],
  }),
  'mers-cov': d({
    metric: 'diameter',
    representativeNm: 100,
    rangeNm: [80, 120],
    includesProjections: true,
    sourceIds: ['ictv-coronaviridae'],
  }),
  'sars-cov-2': d({
    metric: 'diameter',
    representativeNm: 100,
    rangeNm: [80, 120],
    includesProjections: true,
    sourceIds: ['ictv-coronaviridae'],
  }),
};

export function getPhysicalDimensions(virusId: string): PhysicalDimensions | undefined {
  return PHYSICAL_DIMENSIONS[virusId];
}

export function physicalScaleFactor(
  displayLength: number,
  dimensions: PhysicalDimensions,
  worldUnitsPerNm = 0.02,
): number {
  return (
    (dimensions.representativeNm * worldUnitsPerNm) / Math.max(0.001, displayLength)
  );
}

export function normalizedScaleFactor(
  displayLength: number,
  targetLength = 4.8,
): number {
  return targetLength / Math.max(0.001, displayLength);
}

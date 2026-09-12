import type { ModelBuilderId } from './types';
import type {
  GenomeOrganization,
  StructuralComponentEvidence,
  StructuralSignature,
  SurfaceComponentShape,
  SurfaceComponentSignature,
} from './structuralTypes';

export type EnvelopedFamily =
  | 'coronavirus'
  | 'orthomyxovirus'
  | 'lentivirus'
  | 'herpesvirus'
  | 'rhabdovirus'
  | 'hepadnavirus'
  | 'alphavirus'
  | 'cystovirus'
  | 'filovirus'
  | 'poxvirus';

export interface EnvelopedSignatureProfile {
  readonly id: string;
  readonly family: EnvelopedFamily;
  readonly virusIds: readonly string[];
  readonly builder: ModelBuilderId;
  readonly envelopeShape: NonNullable<StructuralSignature['envelopeShape']>;
  readonly surfaceComponents: readonly SurfaceComponentSignature[];
  readonly layers: readonly string[];
  readonly genomeOrganization: GenomeOrganization;
  readonly specialStructures: readonly string[];
  readonly evidence: readonly StructuralComponentEvidence[];
}

export interface CoronavirusSurfaceRenderProfile {
  readonly id: string;
  readonly shape: SurfaceComponentShape;
  readonly highCount: number;
  readonly lowCount: number;
  readonly radius: number;
  readonly color: number;
}

export interface CoronavirusRenderProfile {
  readonly id: string;
  readonly virusIds: readonly string[];
  readonly envelopeRadius: number;
  readonly envelopeScale: readonly [number, number, number];
  readonly matrixRadius: number;
  readonly rnpStrands: number;
  readonly surface: readonly CoronavirusSurfaceRenderProfile[];
}

const surface = (
  id: string,
  label: string,
  shape: SurfaceComponentShape,
  relativeAbundance: SurfaceComponentSignature['relativeAbundance'],
): SurfaceComponentSignature => ({
  id,
  label,
  shape,
  relativeAbundance,
  partId: 'spike',
  layerId: 'surface-protein',
});

const evidence = (
  level: StructuralComponentEvidence['level'],
  sourceIds: readonly string[],
): readonly StructuralComponentEvidence[] => [
  { componentId: 'particle', level, sourceIds },
];

const coronaBase = [
  surface('spike-s', 'S 삼량체', 'crown', 'dominant'),
  surface('membrane-m', 'M 단백질', 'knob', 'minor'),
  surface('envelope-e', 'E 채널', 'channel', 'sparse'),
] as const;

export const ENVELOPED_SIGNATURE_PROFILES: readonly EnvelopedSignatureProfile[] = [
  {
    id: 'coronavirus-alpha-human',
    family: 'coronavirus',
    virusIds: ['hcov-229e', 'hcov-nl63'],
    builder: 'coronavirus',
    envelopeShape: 'pleomorphic',
    surfaceComponents: coronaBase,
    layers: ['지질 외피', 'M 단백질층', '나선형 N-RNA 복합체'],
    genomeOrganization: 'helical-rnp',
    specialStructures: ['알파코로나바이러스 계열 공통 corona 돌기'],
    evidence: evidence('family-supported', [
      'ictv-coronaviridae',
      'pdb-5n11',
      'hku1-he-cryoem',
    ]),
  },
  {
    id: 'coronavirus-beta-embeco',
    family: 'coronavirus',
    virusIds: ['hcov-oc43', 'hcov-hku1'],
    builder: 'coronavirus',
    envelopeShape: 'pleomorphic',
    surfaceComponents: [
      coronaBase[0],
      surface('hemagglutinin-esterase', 'HE 단백질', 'club', 'minor'),
      coronaBase[1],
      coronaBase[2],
    ],
    layers: ['지질 외피', 'M 단백질층', '나선형 N-RNA 복합체'],
    genomeOrganization: 'helical-rnp',
    specialStructures: ['Embecovirus 계열 HE-like 보조 표면 성분'],
    evidence: evidence('family-supported', ['ictv-coronaviridae']),
  },
  {
    id: 'coronavirus-beta-sarbeco',
    family: 'coronavirus',
    virusIds: ['sars-cov', 'sars-cov-2'],
    builder: 'coronavirus',
    envelopeShape: 'pleomorphic',
    surfaceComponents: coronaBase,
    layers: ['지질 외피', 'M 단백질층', '나선형 N-RNA 복합체'],
    genomeOrganization: 'helical-rnp',
    specialStructures: ['Sarbecovirus 계열의 긴 S 돌기'],
    evidence: evidence('family-supported', ['ictv-coronaviridae']),
  },
  {
    id: 'coronavirus-beta-merbeco',
    family: 'coronavirus',
    virusIds: ['mers-cov'],
    builder: 'coronavirus',
    envelopeShape: 'pleomorphic',
    surfaceComponents: coronaBase,
    layers: ['지질 외피', 'M 단백질층', '나선형 N-RNA 복합체'],
    genomeOrganization: 'helical-rnp',
    specialStructures: ['Merbecovirus 계열 공통 입자 표현'],
    evidence: evidence('family-supported', ['ictv-coronaviridae']),
  },
  {
    id: 'influenza-a',
    family: 'orthomyxovirus',
    virusIds: ['influenza-a'],
    builder: 'influenza',
    envelopeShape: 'pleomorphic',
    surfaceComponents: [
      surface('ha', 'HA', 'cone', 'dominant'),
      surface('na', 'NA', 'knob', 'minor'),
      surface('m2', 'M2 채널', 'channel', 'sparse'),
    ],
    layers: ['지질 외피', 'M1 matrix', '8개 RNP'],
    genomeOrganization: 'segmented-rnp',
    specialStructures: ['서로 다른 HA·NA 돌기'],
    evidence: evidence('observed', ['ictv-influenza', 'influenza-quant']),
  },
  {
    id: 'influenza-a-human-expansion',
    family: 'orthomyxovirus',
    virusIds: ['influenza-a-h1n1pdm09', 'influenza-a-h5n1'],
    builder: 'influenza',
    envelopeShape: 'pleomorphic',
    surfaceComponents: [
      surface('ha', 'HA', 'cone', 'dominant'),
      surface('na', 'NA', 'knob', 'minor'),
      surface('m2', 'M2 채널', 'channel', 'sparse'),
    ],
    layers: ['지질 외피', 'M1 matrix', '8개 RNP'],
    genomeOrganization: 'segmented-rnp',
    specialStructures: ['아형 표기를 유지한 8분절 influenza A 계열 표본'],
    evidence: evidence('family-supported', ['ictv-influenza', 'influenza-quant']),
  },
  {
    id: 'lentivirus-hiv1',
    family: 'lentivirus',
    virusIds: ['hiv-1'],
    builder: 'lentivirus',
    envelopeShape: 'spherical',
    surfaceComponents: [surface('env', 'Env 삼량체', 'club', 'sparse')],
    layers: ['지질 외피', 'matrix', '원뿔형 capsid'],
    genomeOrganization: 'paired-rna-in-core',
    specialStructures: ['비대칭 원뿔형 성숙 core'],
    evidence: evidence('observed', [
      'hiv-particle-review',
      'pdb-3j3q',
      'ictv-retroviridae',
      'hiv-env-diversity',
    ]),
  },
  {
    id: 'lentivirus-hiv2-family',
    family: 'lentivirus',
    virusIds: ['hiv-2'],
    builder: 'lentivirus',
    envelopeShape: 'spherical',
    surfaceComponents: [surface('env', 'Env 삼량체', 'club', 'sparse')],
    layers: ['지질 외피', 'matrix', '성숙 capsid 개념'],
    genomeOrganization: 'paired-rna-in-core',
    specialStructures: ['HIV 계열 성숙 core'],
    evidence: evidence('family-supported', ['ictv-retroviridae', 'emd-hiv2-capsid']),
  },
  {
    id: 'herpesvirus-hsv1',
    family: 'herpesvirus',
    virusIds: ['hsv1'],
    builder: 'hsv',
    envelopeShape: 'spherical',
    surfaceComponents: [
      surface('glycoprotein-long', '긴 당단백질', 'crown', 'dominant'),
      surface('glycoprotein-short', '짧은 당단백질', 'knob', 'minor'),
    ],
    layers: ['지질 외피', '불균일 tegument', '정이십면체 capsid'],
    genomeOrganization: 'packed-dna',
    specialStructures: ['외피와 capsid 사이의 두꺼운 tegument'],
    evidence: evidence('observed', ['pdb-6odm', 'ictv-herpes']),
  },
  {
    id: 'herpesvirus-human-expansion',
    family: 'herpesvirus',
    virusIds: ['varicella-zoster-virus', 'epstein-barr-virus'],
    builder: 'hsv',
    envelopeShape: 'spherical',
    surfaceComponents: [
      surface('glycoprotein-long', '긴 당단백질', 'crown', 'dominant'),
      surface('glycoprotein-short', '짧은 당단백질', 'knob', 'minor'),
    ],
    layers: ['지질 외피', '불균일 tegument', '정이십면체 capsid'],
    genomeOrganization: 'packed-dna',
    specialStructures: ['외피와 capsid 사이의 herpesvirus tegument'],
    evidence: evidence('family-supported', ['ictv-herpes']),
  },
  {
    id: 'rhabdovirus-vsv',
    family: 'rhabdovirus',
    virusIds: ['vsv-indiana'],
    builder: 'vsv',
    envelopeShape: 'bullet',
    surfaceComponents: [surface('glycoprotein-g', 'G 당단백질', 'cone', 'dominant')],
    layers: ['총알형 외피', 'matrix', '방향성 나선 RNP'],
    genomeOrganization: 'helical-rnp',
    specialStructures: ['둥근 끝과 평평한 밑면'],
    evidence: evidence('observed', ['emd-26603']),
  },
  {
    id: 'rhabdovirus-rabies',
    family: 'rhabdovirus',
    virusIds: ['rabies-virus'],
    builder: 'vsv',
    envelopeShape: 'bullet',
    surfaceComponents: [surface('glycoprotein-g', 'G 당단백질', 'cone', 'dominant')],
    layers: ['총알형 외피', 'matrix', '방향성 나선 RNP'],
    genomeOrganization: 'helical-rnp',
    specialStructures: ['둥근 끝과 평평한 밑면'],
    evidence: evidence('family-supported', ['ictv-rhabdoviridae']),
  },
  {
    id: 'hepadnavirus-hbv',
    family: 'hepadnavirus',
    virusIds: ['hbv'],
    builder: 'hbv',
    envelopeShape: 'compact',
    surfaceComponents: [surface('hbsag', 'HBsAg', 'knob', 'dominant')],
    layers: ['HBsAg 외피', '정이십면체 HBc core'],
    genomeOrganization: 'circular-partial-dna',
    specialStructures: ['완전한 Dane particle'],
    evidence: evidence('observed', ['pdb-6htx', 'ictv-hepadnaviridae']),
  },
  {
    id: 'alphavirus-sindbis',
    family: 'alphavirus',
    virusIds: ['sindbis'],
    builder: 'alphavirus',
    envelopeShape: 'spherical',
    surfaceComponents: [surface('e1-e2-trimer', 'E1/E2 삼량체', 'cone', 'dominant')],
    layers: ['정렬된 glycoprotein shell', '지질 외피', '정이십면체 nucleocapsid'],
    genomeOrganization: 'icosahedral-rna-core',
    specialStructures: ['외부 spike와 내부 core의 대칭 대응'],
    evidence: evidence('observed', ['pdb-6imm', 'ictv-togaviridae']),
  },
  {
    id: 'alphavirus-sfv',
    family: 'alphavirus',
    virusIds: ['semliki-forest'],
    builder: 'alphavirus',
    envelopeShape: 'spherical',
    surfaceComponents: [surface('e1-e2-trimer', 'E1/E2 삼량체', 'cone', 'dominant')],
    layers: ['조밀한 glycoprotein shell', '지질 외피', '정이십면체 nucleocapsid'],
    genomeOrganization: 'icosahedral-rna-core',
    specialStructures: ['Sindbis보다 조밀한 계열 근거 기반 표면'],
    evidence: evidence('observed', ['emd-sfv', 'ictv-togaviridae']),
  },
  {
    id: 'alphavirus-chikungunya',
    family: 'alphavirus',
    virusIds: ['chikungunya-virus'],
    builder: 'alphavirus',
    envelopeShape: 'spherical',
    surfaceComponents: [surface('e1-e2-trimer', 'E1/E2 삼량체', 'cone', 'dominant')],
    layers: ['정렬된 glycoprotein shell', '지질 외피', '정이십면체 nucleocapsid'],
    genomeOrganization: 'icosahedral-rna-core',
    specialStructures: ['외부 spike와 내부 core의 대칭 대응'],
    evidence: evidence('observed', ['pdb-6nk5', 'ictv-togaviridae']),
  },
  {
    id: 'cystovirus-phi6',
    family: 'cystovirus',
    virusIds: ['phi6'],
    builder: 'cystovirus',
    envelopeShape: 'pleomorphic',
    surfaceComponents: [surface('attachment-protein', '부착 단백질', 'club', 'minor')],
    layers: ['지질 외피', '외부 core shell', '내부 core shell'],
    genomeOrganization: 'segmented-dsrna-core',
    specialStructures: ['외피형 파지', '3개 dsRNA 분절'],
    evidence: evidence('family-supported', ['ictv-cystoviridae']),
  },
  {
    id: 'filovirus-family',
    family: 'filovirus',
    virusIds: [
      'ebola-virus',
      'sudan-virus',
      'bundibugyo-virus',
      'tai-forest-virus',
      'reston-virus',
      'bombali-virus',
    ],
    builder: 'filovirus',
    envelopeShape: 'filamentous',
    surfaceComponents: [surface('gp', 'GP', 'club', 'dominant')],
    layers: ['관형 외피', 'VP40 matrix', '나선형 nucleocapsid'],
    genomeOrganization: 'helical-rnp',
    specialStructures: ['계열 공통 굽은 필라멘트 중심선'],
    evidence: evidence('family-supported', ['ictv-orthoebolavirus']),
  },
  {
    id: 'poxvirus-vaccinia-fallback',
    family: 'poxvirus',
    virusIds: ['vaccinia-mv'],
    builder: 'vaccinia',
    envelopeShape: 'brick',
    surfaceComponents: [],
    layers: ['성숙 입자 막', '아령형 core wall', 'lateral body'],
    genomeOrganization: 'packed-dna',
    specialStructures: ['v4.4 전면 개편 제외 대상의 명시적 기존 전용 모델'],
    evidence: evidence('observed', ['ictv-pox', 'pnas-vaccinia']),
  },
] as const;

export const CORONAVIRUS_RENDER_PROFILES: readonly CoronavirusRenderProfile[] = [
  {
    id: 'coronavirus-alpha-human',
    virusIds: ['hcov-229e', 'hcov-nl63'],
    envelopeRadius: 1.98,
    envelopeScale: [1.04, 0.97, 1],
    matrixRadius: 1.7,
    rnpStrands: 3,
    surface: [
      {
        id: 'spike-s',
        shape: 'crown',
        highCount: 48,
        lowCount: 24,
        radius: 2.35,
        color: 0xf0a6ca,
      },
      {
        id: 'membrane-m',
        shape: 'knob',
        highCount: 20,
        lowCount: 10,
        radius: 2.12,
        color: 0xe8bd72,
      },
      {
        id: 'envelope-e',
        shape: 'channel',
        highCount: 6,
        lowCount: 3,
        radius: 2.04,
        color: 0x5f8fc7,
      },
    ],
  },
  {
    id: 'coronavirus-beta-embeco',
    virusIds: ['hcov-oc43', 'hcov-hku1'],
    envelopeRadius: 2.12,
    envelopeScale: [1.02, 0.98, 1.03],
    matrixRadius: 1.81,
    rnpStrands: 4,
    surface: [
      {
        id: 'spike-s',
        shape: 'crown',
        highCount: 54,
        lowCount: 27,
        radius: 2.48,
        color: 0xf0a6ca,
      },
      {
        id: 'hemagglutinin-esterase',
        shape: 'club',
        highCount: 18,
        lowCount: 9,
        radius: 2.36,
        color: 0x8af8e9,
      },
      {
        id: 'membrane-m',
        shape: 'knob',
        highCount: 22,
        lowCount: 11,
        radius: 2.25,
        color: 0xe8bd72,
      },
      {
        id: 'envelope-e',
        shape: 'channel',
        highCount: 7,
        lowCount: 4,
        radius: 2.18,
        color: 0x5f8fc7,
      },
    ],
  },
  {
    id: 'coronavirus-beta-sarbeco',
    virusIds: ['sars-cov', 'sars-cov-2'],
    envelopeRadius: 2.08,
    envelopeScale: [1.03, 0.96, 1.02],
    matrixRadius: 1.78,
    rnpStrands: 3,
    surface: [
      {
        id: 'spike-s',
        shape: 'crown',
        highCount: 64,
        lowCount: 32,
        radius: 2.48,
        color: 0xf0a6ca,
      },
      {
        id: 'membrane-m',
        shape: 'knob',
        highCount: 28,
        lowCount: 14,
        radius: 2.25,
        color: 0xe8bd72,
      },
      {
        id: 'envelope-e',
        shape: 'channel',
        highCount: 10,
        lowCount: 5,
        radius: 2.18,
        color: 0x5f8fc7,
      },
    ],
  },
  {
    id: 'coronavirus-beta-merbeco',
    virusIds: ['mers-cov'],
    envelopeRadius: 2.15,
    envelopeScale: [1.05, 0.98, 1],
    matrixRadius: 1.83,
    rnpStrands: 4,
    surface: [
      {
        id: 'spike-s',
        shape: 'crown',
        highCount: 58,
        lowCount: 29,
        radius: 2.58,
        color: 0xf0a6ca,
      },
      {
        id: 'membrane-m',
        shape: 'knob',
        highCount: 24,
        lowCount: 12,
        radius: 2.3,
        color: 0xe8bd72,
      },
      {
        id: 'envelope-e',
        shape: 'channel',
        highCount: 8,
        lowCount: 4,
        radius: 2.23,
        color: 0x5f8fc7,
      },
    ],
  },
] as const;

const PROFILE_BY_VIRUS = new Map(
  ENVELOPED_SIGNATURE_PROFILES.flatMap((profile) =>
    profile.virusIds.map((virusId) => [virusId, profile] as const),
  ),
);

const CORONAVIRUS_RENDER_BY_VIRUS = new Map(
  CORONAVIRUS_RENDER_PROFILES.flatMap((profile) =>
    profile.virusIds.map((virusId) => [virusId, profile] as const),
  ),
);

export function getEnvelopedSignatureProfile(
  virusId: string,
): EnvelopedSignatureProfile | undefined {
  return PROFILE_BY_VIRUS.get(virusId);
}

export function getCoronavirusRenderProfile(virusId: string): CoronavirusRenderProfile {
  const profile = CORONAVIRUS_RENDER_BY_VIRUS.get(virusId);
  if (!profile) throw new Error(`Missing coronavirus render profile: ${virusId}`);
  return profile;
}

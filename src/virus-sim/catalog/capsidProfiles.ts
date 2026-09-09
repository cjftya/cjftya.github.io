import type {
  GenomeOrganization,
  IcosahedralTopologySignature,
  LayeredCapsidLayerSignature,
  LayeredCapsidSignature,
  StructuralComponentEvidence,
  SurfaceComponentSignature,
} from './structuralTypes';
import type { ModelBuilderId, ObservationLayerId, ObservationPartId } from './types';

export interface CapsidSignatureProfile {
  readonly id: string;
  readonly family: 'icosahedral' | 'layered';
  readonly virusIds: readonly string[];
  readonly builder: ModelBuilderId;
  readonly surfaceComponents: readonly SurfaceComponentSignature[];
  readonly layers: readonly string[];
  readonly genomeOrganization: GenomeOrganization;
  readonly specialStructures: readonly string[];
  readonly evidence: readonly StructuralComponentEvidence[];
  readonly icosahedral?: IcosahedralTopologySignature;
  readonly layeredCapsid?: LayeredCapsidSignature;
}

const surface = (
  id: string,
  label: string,
  shape: SurfaceComponentSignature['shape'],
  abundance: SurfaceComponentSignature['relativeAbundance'],
  partId: ObservationPartId,
  layerId: ObservationLayerId,
): SurfaceComponentSignature => ({
  id,
  label,
  shape,
  relativeAbundance: abundance,
  partId,
  layerId,
});

const evidence = (
  level: StructuralComponentEvidence['level'],
  sourceIds: readonly string[],
): readonly StructuralComponentEvidence[] => [
  { componentId: 'particle', level, sourceIds },
];

const ico = (
  surfacePattern: IcosahedralTopologySignature['shell']['surfacePattern'],
  capsomerOrganization: IcosahedralTopologySignature['capsomerOrganization'],
  options: Omit<IcosahedralTopologySignature, 'shell' | 'capsomerOrganization'> & {
    readonly faceting?: IcosahedralTopologySignature['shell']['faceting'];
  } = {},
): IcosahedralTopologySignature => {
  const { faceting = 'moderate', ...rest } = options;
  return {
    shell: { faceting, surfacePattern },
    capsomerOrganization,
    ...rest,
  };
};

const layer = (
  role: LayeredCapsidLayerSignature['role'],
  radiusScale: number,
  faceting: LayeredCapsidLayerSignature['faceting'],
  surfacePattern: LayeredCapsidLayerSignature['surfacePattern'],
  opacity: number,
): LayeredCapsidLayerSignature => ({
  role,
  radiusScale,
  faceting,
  surfacePattern,
  opacity,
});

const capsidSurface = surface(
  'ordered-capsomer',
  '질서 있는 표면 단위',
  'knob',
  'dominant',
  'capsomer',
  'capsid',
);

export const CAPSID_SIGNATURE_PROFILES: readonly CapsidSignatureProfile[] = [
  {
    id: 'ms2-compact-t3',
    family: 'icosahedral',
    virusIds: ['ms2'],
    builder: 'ms2',
    surfaceComponents: [capsidSurface],
    layers: ['compact T=3-like capsid', 'ssRNA core'],
    genomeOrganization: 'single-rna-core',
    specialStructures: ['한 꼭짓점의 비대칭 maturation protein'],
    evidence: evidence('observed', ['pdb-5tc1']),
    icosahedral: ico('compact-t3', 't3-like', {
      faceting: 'moderate',
      asymmetricFeature: 'maturation-protein',
    }),
  },
  {
    id: 'adenovirus-vertex-fiber',
    family: 'icosahedral',
    virusIds: ['adenovirus-5'],
    builder: 'adenovirus',
    surfaceComponents: [
      surface('penton-fiber', 'Penton fiber', 'knob', 'sparse', 'fiber', 'capsid'),
    ],
    layers: ['faceted capsid', 'capsomer', 'packed dsDNA'],
    genomeOrganization: 'packed-dna',
    specialStructures: ['12개 꼭짓점 penton·shaft·terminal knob'],
    evidence: evidence('observed', ['pdb-4v4u']),
    icosahedral: ico('vertex-spiked', 'family-fallback', {
      faceting: 'strong',
      vertexFeature: { kind: 'penton-fiber', count: 12, relativeLength: 0.71 },
    }),
  },
  {
    id: 'microvirus-vertex-spiked-t1',
    family: 'icosahedral',
    virusIds: ['phix174'],
    builder: 'icosahedral-capsid',
    surfaceComponents: [
      surface(
        'vertex-spike',
        '오각 꼭짓점 돌기',
        'cone',
        'sparse',
        'spike',
        'surface-protein',
      ),
    ],
    layers: ['T=1-like capsid', 'vertex spike', 'ssDNA core'],
    genomeOrganization: 'single-stranded-dna-core',
    specialStructures: ['12개 꼭짓점 중심 spike'],
    evidence: evidence('observed', ['pdb-2bpa']),
    icosahedral: ico('vertex-spiked', 't1-like', {
      faceting: 'strong',
      vertexFeature: { kind: 'spike', count: 12, relativeLength: 0.2 },
    }),
  },
  {
    id: 'levivirus-compact-asymmetric',
    family: 'icosahedral',
    virusIds: ['qbeta'],
    builder: 'icosahedral-capsid',
    surfaceComponents: [capsidSurface],
    layers: ['compact T=3-like capsid', 'ssRNA core'],
    genomeOrganization: 'single-rna-core',
    specialStructures: ['한쪽 maturation protein 위치'],
    evidence: evidence('observed', ['pdb-1qbe']),
    icosahedral: ico('compact-t3', 't3-like', {
      asymmetricFeature: 'maturation-protein',
    }),
  },
  {
    id: 'compact-rna-t3-family',
    family: 'icosahedral',
    virusIds: ['ap205', 'flock-house'],
    builder: 'icosahedral-capsid',
    surfaceComponents: [
      surface(
        'compact-domain',
        'compact 피복 도메인',
        'knob',
        'dominant',
        'surface-domain',
        'capsid',
      ),
    ],
    layers: ['compact T=3-like capsid', 'RNA core'],
    genomeOrganization: 'single-rna-core',
    specialStructures: ['큰 fiber 없는 조밀한 피복 배열'],
    evidence: evidence('observed', ['pdb-5jzr', 'pdb-4ftb']),
    icosahedral: ico('compact-t3', 't3-like', { surfaceDomainScale: 0.72 }),
  },
  {
    id: 'aav-dimpled-small-capsid',
    family: 'icosahedral',
    virusIds: ['aav2'],
    builder: 'icosahedral-capsid',
    surfaceComponents: [
      surface(
        'dimple-ring',
        '대칭축 depression',
        'channel',
        'minor',
        'surface-domain',
        'capsid',
      ),
      surface(
        'axial-channel',
        '축 주변 channel',
        'channel',
        'sparse',
        'channel',
        'capsid',
      ),
    ],
    layers: ['dimpled capsid', 'ssDNA core'],
    genomeOrganization: 'single-stranded-dna-core',
    specialStructures: ['돌출부 사이의 recessed ring 인상'],
    evidence: evidence('observed', ['pdb-1lp3']),
    icosahedral: ico('dimpled', 'family-fallback', {
      faceting: 'smooth',
      surfaceDomainScale: 0.84,
    }),
  },
  {
    id: 'parvovirus-channelled-capsid',
    family: 'icosahedral',
    virusIds: ['canine-parvovirus'],
    builder: 'icosahedral-capsid',
    surfaceComponents: [
      surface(
        'cylindrical-domain',
        '축 주변 cylinder',
        'channel',
        'minor',
        'surface-domain',
        'capsid',
      ),
      surface(
        'fivefold-channel',
        '오중축 channel',
        'channel',
        'sparse',
        'channel',
        'capsid',
      ),
    ],
    layers: ['channelled capsid', 'ssDNA core'],
    genomeOrganization: 'single-stranded-dna-core',
    specialStructures: ['오중축 cylinder와 주변 depression'],
    evidence: evidence('observed', ['pdb-2cas']),
    icosahedral: ico('channelled', 'family-fallback', {
      faceting: 'smooth',
      surfaceDomainScale: 1.08,
    }),
  },
  {
    id: 'circovirus-compact-t1',
    family: 'icosahedral',
    virusIds: ['pcv2'],
    builder: 'icosahedral-capsid',
    surfaceComponents: [
      surface(
        'compact-domain',
        '작은 피복 도메인',
        'knob',
        'dominant',
        'surface-domain',
        'capsid',
      ),
    ],
    layers: ['small T=1-like capsid', 'circular ssDNA core'],
    genomeOrganization: 'single-stranded-dna-core',
    specialStructures: ['작고 조밀한 표면 배열'],
    evidence: evidence('observed', ['pdb-3jci']),
    icosahedral: ico('compact-t3', 't1-like', {
      faceting: 'smooth',
      surfaceDomainScale: 0.66,
    }),
  },
  {
    id: 'papilloma-pentameric',
    family: 'icosahedral',
    virusIds: ['hpv16'],
    builder: 'icosahedral-capsid',
    surfaceComponents: [
      surface(
        'l1-pentamer',
        'L1 pentamer 단위',
        'knob',
        'dominant',
        'surface-domain',
        'capsid',
      ),
    ],
    layers: ['pentamer-dominant capsid', 'circular dsDNA core'],
    genomeOrganization: 'circular-dna-core',
    specialStructures: ['넓게 분리된 오각 표면 단위'],
    evidence: evidence('observed', ['pdb-7kzf']),
    icosahedral: ico('pentameric', 'pentamer-dominant', {
      faceting: 'smooth',
      surfaceDomainScale: 1.16,
    }),
  },
  {
    id: 'polyoma-vp1-pentameric',
    family: 'icosahedral',
    virusIds: ['sv40', 'murine-polyomavirus'],
    builder: 'icosahedral-capsid',
    surfaceComponents: [
      surface(
        'vp1-pentamer',
        'VP1 pentamer 단위',
        'knob',
        'dominant',
        'surface-domain',
        'capsid',
      ),
    ],
    layers: ['VP1 pentameric capsid', 'circular dsDNA core'],
    genomeOrganization: 'circular-dna-core',
    specialStructures: ['family-level pentameric shell'],
    evidence: evidence('observed', ['pdb-1sva', 'pdb-1sie']),
    icosahedral: ico('pentameric', 'pentamer-dominant', {
      faceting: 'smooth',
      surfaceDomainScale: 0.96,
    }),
  },
  {
    id: 'calicivirus-protruding-domain',
    family: 'icosahedral',
    virusIds: ['norwalk', 'rhdv'],
    builder: 'icosahedral-capsid',
    surfaceComponents: [
      surface(
        'p-domain',
        '돌출 P-domain',
        'club',
        'dominant',
        'surface-domain',
        'surface-protein',
      ),
    ],
    layers: ['shell domain', 'raised P-domain', 'ssRNA core'],
    genomeOrganization: 'single-rna-core',
    specialStructures: ['cup-like 간격을 만드는 paired protrusions'],
    evidence: evidence('observed', ['pdb-1ihm', 'pdb-3j1p']),
    icosahedral: ico('protruding-domain', 't3-like', {
      faceting: 'smooth',
      surfaceDomainScale: 1.18,
    }),
  },
  {
    id: 'astrovirus-star-feature',
    family: 'icosahedral',
    virusIds: ['astrovirus-1'],
    builder: 'icosahedral-capsid',
    surfaceComponents: [
      surface(
        'spike-domain',
        'radial spike domain',
        'cone',
        'minor',
        'spike',
        'surface-protein',
      ),
    ],
    layers: ['compact capsid', 'radial surface feature', 'ssRNA core'],
    genomeOrganization: 'single-rna-core',
    specialStructures: ['제한적인 별 모양 표면 인상'],
    evidence: evidence('observed', ['pdb-5ewn']),
    icosahedral: ico('star-feature', 't3-like', {
      faceting: 'smooth',
      vertexFeature: { kind: 'spike', count: 12, relativeLength: 0.17 },
    }),
  },
  {
    id: 'plant-soft-t3',
    family: 'icosahedral',
    virusIds: ['ccmv', 'bmv', 'cmv-fny'],
    builder: 'icosahedral-capsid',
    surfaceComponents: [
      surface(
        'soft-capsomer',
        '부드러운 T=3 단위',
        'knob',
        'dominant',
        'surface-domain',
        'capsid',
      ),
    ],
    layers: ['soft T=3 capsid', 'segmented RNA core'],
    genomeOrganization: 'segmented-rna-core',
    specialStructures: ['얕은 골을 둔 compact plant capsid'],
    evidence: evidence('observed', ['pdb-1cwp', 'pdb-1js9', 'pdb-1f15']),
    icosahedral: ico('plant-soft', 't3-like', {
      faceting: 'smooth',
      surfaceDomainScale: 0.82,
      genomeSegmentCount: 3,
    }),
  },
  {
    id: 'plant-pseudo-t3',
    family: 'icosahedral',
    virusIds: ['cpmv'],
    builder: 'icosahedral-capsid',
    surfaceComponents: [
      surface(
        'large-small-units',
        '큰·작은 피복 단위',
        'knob',
        'dominant',
        'surface-domain',
        'capsid',
      ),
    ],
    layers: ['pseudo T=3 capsid', 'two-segment RNA core'],
    genomeOrganization: 'segmented-rna-core',
    specialStructures: ['교차하는 두 크기의 surface unit'],
    evidence: evidence('observed', ['pdb-1ny7', 'pdb-5a33']),
    icosahedral: ico('plant-pseudo-t3', 'pseudo-t3-like', {
      faceting: 'moderate',
      surfaceDomainScale: 1.02,
      genomeSegmentCount: 2,
    }),
  },
  {
    id: 'plant-protruding-t3',
    family: 'icosahedral',
    virusIds: ['tbsv'],
    builder: 'icosahedral-capsid',
    surfaceComponents: [
      surface(
        'plant-p-domain',
        '돌출 plant domain',
        'club',
        'dominant',
        'surface-domain',
        'surface-protein',
      ),
    ],
    layers: ['T=3 shell', 'raised domains', 'ssRNA core'],
    genomeOrganization: 'single-rna-core',
    specialStructures: ['shell에서 분리된 굵은 돌출 영역'],
    evidence: evidence('observed', ['pdb-2tbv']),
    icosahedral: ico('plant-protruding', 't3-like', {
      surfaceDomainScale: 1.05,
    }),
  },
  {
    id: 'plant-small-t1',
    family: 'icosahedral',
    virusIds: ['stmv'],
    builder: 'icosahedral-capsid',
    surfaceComponents: [capsidSurface],
    layers: ['dense T=1 capsid', 'ssRNA core'],
    genomeOrganization: 'single-rna-core',
    specialStructures: ['매우 작은 compact 위성 입자'],
    evidence: evidence('observed', ['pdb-1a34']),
    icosahedral: ico('plant-dense', 't1-like', {
      faceting: 'moderate',
      surfaceDomainScale: 0.62,
    }),
  },
  {
    id: 'plant-dense-t3',
    family: 'icosahedral',
    virusIds: ['tymv'],
    builder: 'icosahedral-capsid',
    surfaceComponents: [
      surface(
        'dense-capsomer',
        '조밀한 T=3 단위',
        'knob',
        'dominant',
        'surface-domain',
        'capsid',
      ),
    ],
    layers: ['dense T=3 capsid', 'ssRNA core'],
    genomeOrganization: 'single-rna-core',
    specialStructures: ['껍질 가까이 이어지는 조밀한 표면 단위'],
    evidence: evidence('observed', ['pdb-1auy']),
    icosahedral: ico('plant-dense', 't3-like', {
      faceting: 'smooth',
      surfaceDomainScale: 0.72,
    }),
  },
  {
    id: 'plant-rounded-family-fallback',
    family: 'icosahedral',
    virusIds: ['camv'],
    builder: 'icosahedral-capsid',
    surfaceComponents: [
      surface(
        'rounded-domain',
        '둥근 family-level 단위',
        'knob',
        'dominant',
        'surface-domain',
        'capsid',
      ),
    ],
    layers: ['rounded isometric capsid', 'circular dsDNA core'],
    genomeOrganization: 'circular-dna-core',
    specialStructures: ['ICTV 형태 설명 기반 family fallback'],
    evidence: evidence('family-supported', ['ictv-caulimoviridae']),
    icosahedral: ico('plant-rounded', 'family-fallback', {
      faceting: 'smooth',
      surfaceDomainScale: 0.78,
    }),
  },
  {
    id: 'rotavirus-triple-layer',
    family: 'layered',
    virusIds: ['rotavirus-rrv'],
    builder: 'rotavirus',
    surfaceComponents: [
      surface('vp4', 'VP4 spike', 'cone', 'minor', 'spike', 'outer-capsid'),
    ],
    layers: ['outer capsid', 'middle capsid', 'core capsid'],
    genomeOrganization: 'layered-segments',
    specialStructures: ['3개 역할별 shell', '11개 dsRNA 분절'],
    evidence: evidence('observed', ['pdb-4v7q']),
    layeredCapsid: {
      layers: [
        layer('outer-capsid', 1, 'smooth', 'porous-protein', 0.76),
        layer('middle-capsid', 0.77, 'moderate', 'faceted-units', 0.86),
        layer('core-capsid', 0.53, 'strong', 'dense-core', 0.92),
      ],
      projectionCount: 44,
      genomeSegmentCount: 11,
    },
  },
  {
    id: 'birnavirus-double-layer',
    family: 'layered',
    virusIds: ['ibdv'],
    builder: 'layered-capsid',
    surfaceComponents: [],
    layers: ['outer capsid', 'core capsid'],
    genomeOrganization: 'segmented-dsrna-core',
    specialStructures: ['서로 다른 표면 밀도의 double capsid', '2개 dsRNA 분절'],
    evidence: evidence('observed', ['pdb-2df7']),
    layeredCapsid: {
      layers: [
        layer('outer-capsid', 1, 'moderate', 'faceted-units', 0.8),
        layer('core-capsid', 0.63, 'strong', 'dense-core', 0.9),
      ],
      genomeSegmentCount: 2,
    },
  },
  {
    id: 'bluetongue-triple-layer',
    family: 'layered',
    virusIds: ['bluetongue'],
    builder: 'layered-capsid',
    surfaceComponents: [
      surface(
        'outer-projection',
        '바깥 shell projection',
        'knob',
        'minor',
        'spike',
        'outer-capsid',
      ),
    ],
    layers: ['outer capsid', 'middle capsid', 'core capsid'],
    genomeOrganization: 'segmented-dsrna-core',
    specialStructures: ['각 층의 다른 faceting', '10개 dsRNA 분절'],
    evidence: evidence('observed', ['pdb-2btv']),
    layeredCapsid: {
      layers: [
        layer('outer-capsid', 1, 'smooth', 'porous-protein', 0.74),
        layer('middle-capsid', 0.76, 'moderate', 'faceted-units', 0.84),
        layer('core-capsid', 0.51, 'strong', 'dense-core', 0.94),
      ],
      projectionCount: 32,
      genomeSegmentCount: 10,
    },
  },
  {
    id: 'reovirus-turreted-triple-layer',
    family: 'layered',
    virusIds: ['reovirus-t3d'],
    builder: 'layered-capsid',
    surfaceComponents: [
      surface(
        'turret',
        '오중축 turret',
        'channel',
        'sparse',
        'turret',
        'surface-protein',
      ),
    ],
    layers: ['outer capsid', 'middle capsid', 'core capsid'],
    genomeOrganization: 'segmented-dsrna-core',
    specialStructures: ['12개 channelled turret', '10개 dsRNA 분절'],
    evidence: evidence('observed', ['pdb-1ej6']),
    layeredCapsid: {
      layers: [
        layer('outer-capsid', 1, 'strong', 'faceted-units', 0.78),
        layer('middle-capsid', 0.75, 'moderate', 'porous-protein', 0.85),
        layer('core-capsid', 0.5, 'strong', 'dense-core', 0.94),
      ],
      vertexFeature: { kind: 'turret', count: 12, relativeLength: 0.18, opening: true },
      genomeSegmentCount: 10,
    },
  },
  {
    id: 'tectivirus-internal-membrane',
    family: 'layered',
    virusIds: ['prd1'],
    builder: 'layered-capsid',
    surfaceComponents: [
      surface(
        'vertex-entry',
        'vertex entry complex',
        'cone',
        'sparse',
        'spike',
        'surface-protein',
      ),
    ],
    layers: ['external capsid', 'internal membrane', 'dsDNA core'],
    genomeOrganization: 'double-stranded-dna-core',
    specialStructures: ['faceted capsid 안쪽의 지질막'],
    evidence: evidence('observed', ['pdb-1w8x']),
    layeredCapsid: {
      layers: [
        layer('capsid', 1, 'strong', 'faceted-units', 0.82),
        layer('inner-membrane', 0.69, 'smooth', 'membrane', 0.55),
      ],
      projectionCount: 12,
    },
  },
  {
    id: 'corticovirus-internal-membrane',
    family: 'layered',
    virusIds: ['pm2'],
    builder: 'layered-capsid',
    surfaceComponents: [
      surface(
        'vertex-spike',
        '짧은 vertex spike',
        'cone',
        'sparse',
        'spike',
        'surface-protein',
      ),
    ],
    layers: ['rounded capsid', 'internal membrane', 'circular dsDNA core'],
    genomeOrganization: 'circular-dna-core',
    specialStructures: ['둥근 outer capsid와 내부 막의 간격'],
    evidence: evidence('family-supported', ['ictv-corticoviridae']),
    layeredCapsid: {
      layers: [
        layer('capsid', 1, 'smooth', 'smooth-protein', 0.78),
        layer('inner-membrane', 0.72, 'smooth', 'membrane', 0.53),
      ],
      projectionCount: 12,
    },
  },
  {
    id: 'stiv-archaeal-turreted-membrane',
    family: 'layered',
    virusIds: ['stiv'],
    builder: 'layered-capsid',
    surfaceComponents: [
      surface(
        'archaeal-turret',
        '넓은 archaeal turret',
        'channel',
        'sparse',
        'turret',
        'surface-protein',
      ),
    ],
    layers: ['faceted capsid', 'internal membrane', 'circular dsDNA core'],
    genomeOrganization: 'circular-dna-core',
    specialStructures: ['12개 넓은 속 빈 turret', '내부 막'],
    evidence: evidence('observed', ['pdb-3j31']),
    layeredCapsid: {
      layers: [
        layer('capsid', 1, 'strong', 'faceted-units', 0.82),
        layer('inner-membrane', 0.67, 'smooth', 'membrane', 0.52),
      ],
      vertexFeature: { kind: 'turret', count: 12, relativeLength: 0.24, opening: true },
    },
  },
] as const;

const PROFILE_BY_VIRUS = new Map(
  CAPSID_SIGNATURE_PROFILES.flatMap((profile) =>
    profile.virusIds.map((virusId) => [virusId, profile] as const),
  ),
);

export function getCapsidSignatureProfile(
  virusId: string,
): CapsidSignatureProfile | undefined {
  return PROFILE_BY_VIRUS.get(virusId);
}

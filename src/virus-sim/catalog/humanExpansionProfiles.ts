import type {
  StructuralComponentEvidence,
  SurfaceComponentShape,
} from './structuralTypes';

export interface HumanRnpSurfaceProfile {
  readonly id: string;
  readonly label: string;
  readonly shape: SurfaceComponentShape;
  readonly abundance: 'dominant' | 'minor' | 'sparse';
  readonly color: number;
  readonly highCount: number;
  readonly lowCount: number;
  readonly radiusOffset: number;
}

export type HumanRnpCoreOrganization =
  'icosahedral' | 'helical' | 'segmented' | 'irregular-rnp' | 'grid-like-rnp';

export type SurfaceOrganization =
  | 'radial-sparse'
  | 'radial-pleomorphic'
  | 'icosahedral-raft'
  | 'helical-rows'
  | 'irregular-patches';

export interface HumanRnpProfile {
  readonly id: string;
  readonly virusIds: readonly string[];
  readonly family: string;
  readonly envelopeRadius: number;
  readonly envelopeScale: readonly [number, number, number];
  readonly envelopeDeformation?: number;
  readonly surfaces: readonly HumanRnpSurfaceProfile[];
  readonly surfaceOrganization: SurfaceOrganization;
  readonly matrix: boolean;
  readonly core: HumanRnpCoreOrganization;
  readonly segmentCount?: number;
  readonly genomeOrganization: 'single-rna-core' | 'helical-rnp' | 'segmented-rnp';
  readonly sourceIds: readonly string[];
  readonly evidence: readonly StructuralComponentEvidence[];
  readonly evidenceByVirus?: Readonly<
    Record<string, readonly StructuralComponentEvidence[]>
  >;
}

const surface = (
  id: string,
  label: string,
  shape: SurfaceComponentShape,
  abundance: HumanRnpSurfaceProfile['abundance'],
  color: number,
  counts: readonly [number, number],
  radiusOffset: number,
): HumanRnpSurfaceProfile => ({
  id,
  label,
  shape,
  abundance,
  color,
  highCount: counts[0],
  lowCount: counts[1],
  radiusOffset,
});

export const HUMAN_RNP_PROFILES: readonly HumanRnpProfile[] = [
  {
    id: 'flavivirus-smooth-envelope',
    virusIds: ['dengue-virus', 'zika-virus', 'yellow-fever-virus', 'west-nile-virus'],
    family: 'flavivirus',
    envelopeRadius: 2.02,
    envelopeScale: [1, 0.98, 1.02],
    surfaces: [
      surface(
        'e-m-raft',
        'E/M 단백질 표면',
        'knob',
        'dominant',
        0xe7a3c8,
        [72, 36],
        0.08,
      ),
    ],
    surfaceOrganization: 'icosahedral-raft',
    matrix: false,
    core: 'irregular-rnp',
    genomeOrganization: 'single-rna-core',
    sourceIds: ['ictv-flaviviridae', 'flavivirus-imperfect-symmetry'],
    evidence: [],
    evidenceByVirus: {
      'dengue-virus': [
        { componentId: 'particle', level: 'observed', sourceIds: ['pdb-3j27'] },
        { componentId: 'surface-shell', level: 'observed', sourceIds: ['pdb-3j27'] },
        {
          componentId: 'inner-core',
          level: 'conceptual',
          sourceIds: ['flavivirus-imperfect-symmetry'],
        },
      ],
      'zika-virus': [
        { componentId: 'particle', level: 'observed', sourceIds: ['pdb-5ire'] },
        { componentId: 'surface-shell', level: 'observed', sourceIds: ['pdb-5ire'] },
        {
          componentId: 'inner-core',
          level: 'conceptual',
          sourceIds: ['flavivirus-imperfect-symmetry'],
        },
      ],
      'yellow-fever-virus': [
        {
          componentId: 'particle',
          level: 'family-supported',
          sourceIds: ['ictv-flaviviridae'],
        },
        {
          componentId: 'surface-shell',
          level: 'family-supported',
          sourceIds: ['ictv-flaviviridae', 'pdb-6iw4'],
        },
        {
          componentId: 'inner-core',
          level: 'conceptual',
          sourceIds: ['flavivirus-imperfect-symmetry'],
        },
      ],
      'west-nile-virus': [
        {
          componentId: 'particle',
          level: 'family-supported',
          sourceIds: ['ictv-flaviviridae'],
        },
        {
          componentId: 'surface-shell',
          level: 'family-supported',
          sourceIds: ['ictv-flaviviridae'],
        },
        {
          componentId: 'inner-core',
          level: 'conceptual',
          sourceIds: ['flavivirus-imperfect-symmetry'],
        },
      ],
    },
  },
  {
    id: 'henipavirus-nipah-pleomorphic-rnp',
    virusIds: ['nipah-virus'],
    family: 'henipavirus',
    envelopeRadius: 2.18,
    envelopeScale: [1.08, 0.94, 1],
    envelopeDeformation: 0.04,
    surfaces: [
      surface(
        'attachment-g',
        'G 부착 단백질',
        'club',
        'dominant',
        0xf0a6ca,
        [44, 22],
        0.3,
      ),
      surface('fusion-f', 'F 융합 단백질', 'cone', 'minor', 0xe8bd72, [20, 10], 0.24),
    ],
    surfaceOrganization: 'radial-pleomorphic',
    matrix: true,
    core: 'helical',
    genomeOrganization: 'helical-rnp',
    sourceIds: ['ictv-paramyxoviridae'],
    evidence: [
      {
        componentId: 'particle',
        level: 'family-supported',
        sourceIds: ['ictv-paramyxoviridae'],
      },
    ],
  },
  {
    id: 'morbillivirus-measles-pleomorphic-rnp',
    virusIds: ['measles-virus'],
    family: 'morbillivirus',
    envelopeRadius: 2.18,
    envelopeScale: [1.08, 0.94, 1],
    envelopeDeformation: 0.04,
    surfaces: [
      surface(
        'attachment-h',
        'H 부착 단백질',
        'club',
        'dominant',
        0xf0a6ca,
        [44, 22],
        0.3,
      ),
      surface('fusion-f', 'F 융합 단백질', 'cone', 'minor', 0xe8bd72, [20, 10], 0.24),
    ],
    surfaceOrganization: 'radial-pleomorphic',
    matrix: true,
    core: 'helical',
    genomeOrganization: 'helical-rnp',
    sourceIds: ['ictv-paramyxoviridae'],
    evidence: [
      {
        componentId: 'particle',
        level: 'family-supported',
        sourceIds: ['ictv-paramyxoviridae'],
      },
    ],
  },
  {
    id: 'orthorubulavirus-mumps-pleomorphic-rnp',
    virusIds: ['mumps-virus'],
    family: 'orthorubulavirus',
    envelopeRadius: 2.18,
    envelopeScale: [1.08, 0.94, 1],
    envelopeDeformation: 0.04,
    surfaces: [
      surface(
        'attachment-hn',
        'HN 부착 단백질',
        'club',
        'dominant',
        0xf0a6ca,
        [44, 22],
        0.3,
      ),
      surface('fusion-f', 'F 융합 단백질', 'cone', 'minor', 0xe8bd72, [20, 10], 0.24),
    ],
    surfaceOrganization: 'radial-pleomorphic',
    matrix: true,
    core: 'helical',
    genomeOrganization: 'helical-rnp',
    sourceIds: ['ictv-paramyxoviridae'],
    evidence: [
      {
        componentId: 'particle',
        level: 'family-supported',
        sourceIds: ['ictv-paramyxoviridae'],
      },
    ],
  },
  {
    id: 'pneumovirus-rsv-rnp',
    virusIds: ['rsv'],
    family: 'pneumovirus',
    envelopeRadius: 2.12,
    envelopeScale: [1.06, 0.95, 1],
    surfaces: [
      surface('fusion-f', 'F 단백질', 'club', 'dominant', 0xf0a6ca, [48, 24], 0.28),
      surface('attachment-g', 'G 단백질', 'knob', 'minor', 0xe8bd72, [18, 9], 0.2),
    ],
    surfaceOrganization: 'radial-pleomorphic',
    matrix: true,
    core: 'helical',
    genomeOrganization: 'helical-rnp',
    sourceIds: ['ictv-pneumoviridae'],
    evidence: [
      {
        componentId: 'particle',
        level: 'family-supported',
        sourceIds: ['ictv-pneumoviridae'],
      },
    ],
  },
  {
    id: 'arenavirus-lassa-segmented',
    virusIds: ['lassa-virus'],
    family: 'arenavirus',
    envelopeRadius: 2.08,
    envelopeScale: [1.04, 0.97, 1],
    surfaces: [
      surface(
        'glycoprotein',
        'GPC 유래 spike',
        'club',
        'dominant',
        0xf0a6ca,
        [42, 21],
        0.28,
      ),
    ],
    surfaceOrganization: 'radial-pleomorphic',
    matrix: true,
    core: 'segmented',
    segmentCount: 2,
    genomeOrganization: 'segmented-rnp',
    sourceIds: ['ictv-arenaviridae'],
    evidence: [
      {
        componentId: 'particle',
        level: 'family-supported',
        sourceIds: ['ictv-arenaviridae'],
      },
    ],
  },
  {
    id: 'nairovirus-cchf-trisegmented',
    virusIds: ['cchf-virus'],
    family: 'nairovirus',
    envelopeRadius: 2.04,
    envelopeScale: [1.02, 0.98, 1.03],
    surfaces: [
      surface('gn-gc', 'Gn/Gc 당단백질', 'club', 'dominant', 0xf0a6ca, [46, 23], 0.25),
    ],
    surfaceOrganization: 'radial-pleomorphic',
    matrix: true,
    core: 'segmented',
    segmentCount: 3,
    genomeOrganization: 'segmented-rnp',
    sourceIds: ['ictv-nairoviridae'],
    evidence: [
      {
        componentId: 'particle',
        level: 'family-supported',
        sourceIds: ['ictv-nairoviridae'],
      },
    ],
  },
  {
    id: 'hantavirus-hantaan-trisegmented',
    virusIds: ['hantaan-virus'],
    family: 'hantavirus',
    envelopeRadius: 2.04,
    envelopeScale: [1.02, 0.98, 1.03],
    surfaces: [
      surface('gn-gc', 'Gn/Gc 당단백질', 'club', 'dominant', 0xf0a6ca, [46, 23], 0.25),
    ],
    surfaceOrganization: 'radial-pleomorphic',
    matrix: true,
    core: 'segmented',
    segmentCount: 3,
    genomeOrganization: 'segmented-rnp',
    sourceIds: ['ictv-hantaviridae', 'hantaan-cryo-et'],
    evidence: [
      { componentId: 'particle', level: 'observed', sourceIds: ['hantaan-cryo-et'] },
      {
        componentId: 'surface-shell',
        level: 'observed',
        sourceIds: ['hantaan-cryo-et'],
      },
    ],
  },
  {
    id: 'hepacivirus-lipoviroparticle',
    virusIds: ['hepatitis-c-virus'],
    family: 'hepacivirus',
    envelopeRadius: 1.92,
    envelopeScale: [1.08, 0.96, 1.02],
    envelopeDeformation: 0.08,
    surfaces: [
      surface('e1-e2', 'E1/E2 당단백질', 'club', 'minor', 0xf0a6ca, [28, 14], 0.22),
    ],
    surfaceOrganization: 'irregular-patches',
    matrix: false,
    core: 'irregular-rnp',
    genomeOrganization: 'single-rna-core',
    sourceIds: ['ictv-flaviviridae', 'hcv-particle-review', 'hcv-ultrastructure'],
    evidence: [
      {
        componentId: 'particle',
        level: 'family-supported',
        sourceIds: ['hcv-particle-review', 'hcv-ultrastructure'],
      },
      {
        componentId: 'inner-core',
        level: 'conceptual',
        sourceIds: ['hcv-particle-review'],
      },
    ],
  },
  {
    id: 'rubivirus-envelope-core',
    virusIds: ['rubella-virus'],
    family: 'rubivirus',
    envelopeRadius: 1.94,
    envelopeScale: [1.06, 0.95, 1.02],
    envelopeDeformation: 0.07,
    surfaces: [
      surface('e1-e2', 'E1/E2 spike', 'cone', 'dominant', 0xf0a6ca, [48, 24], 0.26),
    ],
    surfaceOrganization: 'helical-rows',
    matrix: false,
    core: 'grid-like-rnp',
    genomeOrganization: 'single-rna-core',
    sourceIds: ['ictv-matonaviridae', 'rubella-cryo-et', 'rubella-helical-structure'],
    evidence: [
      {
        componentId: 'particle',
        level: 'observed',
        sourceIds: ['rubella-cryo-et', 'rubella-helical-structure'],
      },
      {
        componentId: 'surface-shell',
        level: 'observed',
        sourceIds: ['rubella-cryo-et', 'rubella-helical-structure'],
      },
      {
        componentId: 'inner-core',
        level: 'observed',
        sourceIds: ['rubella-cryo-et', 'rubella-helical-structure'],
      },
    ],
  },
];

const PROFILE_BY_VIRUS = new Map(
  HUMAN_RNP_PROFILES.flatMap((profile) =>
    profile.virusIds.map((virusId) => [virusId, profile] as const),
  ),
);

export function getHumanRnpProfile(virusId: string): HumanRnpProfile {
  const profile = PROFILE_BY_VIRUS.get(virusId);
  if (!profile) throw new Error(`Missing human RNP profile: ${virusId}`);
  return profile;
}

export function getHumanRnpEvidence(
  profile: HumanRnpProfile,
  virusId: string,
): readonly StructuralComponentEvidence[] {
  return profile.evidenceByVirus?.[virusId] ?? profile.evidence;
}

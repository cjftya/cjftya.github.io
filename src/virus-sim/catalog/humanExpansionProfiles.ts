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

export interface HumanRnpProfile {
  readonly id: string;
  readonly virusIds: readonly string[];
  readonly family: string;
  readonly envelopeRadius: number;
  readonly envelopeScale: readonly [number, number, number];
  readonly surfaces: readonly HumanRnpSurfaceProfile[];
  readonly matrix: boolean;
  readonly core: 'icosahedral' | 'helical' | 'segmented';
  readonly segmentCount?: number;
  readonly genomeOrganization: 'single-rna-core' | 'helical-rnp' | 'segmented-rnp';
  readonly sourceIds: readonly string[];
  readonly evidence: StructuralComponentEvidence['level'];
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
    matrix: false,
    core: 'icosahedral',
    genomeOrganization: 'single-rna-core',
    sourceIds: ['ictv-flaviviridae'],
    evidence: 'family-supported',
  },
  {
    id: 'paramyxovirus-pleomorphic-rnp',
    virusIds: ['nipah-virus', 'measles-virus', 'mumps-virus'],
    family: 'paramyxovirus',
    envelopeRadius: 2.18,
    envelopeScale: [1.08, 0.94, 1],
    surfaces: [
      surface(
        'attachment',
        '부착 당단백질',
        'club',
        'dominant',
        0xf0a6ca,
        [44, 22],
        0.3,
      ),
      surface('fusion', '융합 단백질', 'cone', 'minor', 0xe8bd72, [20, 10], 0.24),
    ],
    matrix: true,
    core: 'helical',
    genomeOrganization: 'helical-rnp',
    sourceIds: ['ictv-paramyxoviridae'],
    evidence: 'family-supported',
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
    matrix: true,
    core: 'helical',
    genomeOrganization: 'helical-rnp',
    sourceIds: ['ictv-pneumoviridae'],
    evidence: 'family-supported',
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
    matrix: true,
    core: 'segmented',
    segmentCount: 2,
    genomeOrganization: 'segmented-rnp',
    sourceIds: ['ictv-arenaviridae'],
    evidence: 'family-supported',
  },
  {
    id: 'bunyavirales-trisegmented',
    virusIds: ['cchf-virus', 'hantaan-virus'],
    family: 'bunyavirales',
    envelopeRadius: 2.04,
    envelopeScale: [1.02, 0.98, 1.03],
    surfaces: [
      surface('gn-gc', 'Gn/Gc 당단백질', 'club', 'dominant', 0xf0a6ca, [46, 23], 0.25),
    ],
    matrix: true,
    core: 'segmented',
    segmentCount: 3,
    genomeOrganization: 'segmented-rnp',
    sourceIds: ['ictv-nairoviridae', 'ictv-hantaviridae'],
    evidence: 'family-supported',
  },
  {
    id: 'hepacivirus-lipoviroparticle',
    virusIds: ['hepatitis-c-virus'],
    family: 'hepacivirus',
    envelopeRadius: 1.92,
    envelopeScale: [1.08, 0.96, 1.02],
    surfaces: [
      surface('e1-e2', 'E1/E2 당단백질', 'club', 'minor', 0xf0a6ca, [28, 14], 0.22),
    ],
    matrix: false,
    core: 'icosahedral',
    genomeOrganization: 'single-rna-core',
    sourceIds: ['ictv-flaviviridae', 'hcv-particle-review'],
    evidence: 'family-supported',
  },
  {
    id: 'rubivirus-envelope-core',
    virusIds: ['rubella-virus'],
    family: 'rubivirus',
    envelopeRadius: 1.94,
    envelopeScale: [1.02, 0.98, 1],
    surfaces: [
      surface('e1-e2', 'E1/E2 spike', 'cone', 'dominant', 0xf0a6ca, [48, 24], 0.26),
    ],
    matrix: false,
    core: 'icosahedral',
    genomeOrganization: 'single-rna-core',
    sourceIds: ['ictv-matonaviridae'],
    evidence: 'family-supported',
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

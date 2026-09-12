import type { ModelBuilderId } from './types';
import type {
  GenomeOrganization,
  HelicalSignature,
  SpecialGeometrySignature,
  StructuralComponentEvidence,
  SurfaceComponentSignature,
} from './structuralTypes';

export interface SpecialGeometrySignatureProfile {
  readonly id: string;
  readonly virusIds: readonly string[];
  readonly builder: ModelBuilderId;
  readonly envelopeShape?: 'filamentous' | 'brick';
  readonly surfaceComponents: readonly SurfaceComponentSignature[];
  readonly layers: readonly string[];
  readonly genomeOrganization: GenomeOrganization;
  readonly specialStructures: readonly string[];
  readonly evidence: readonly StructuralComponentEvidence[];
  readonly helical?: HelicalSignature;
  readonly specialGeometry?: SpecialGeometrySignature;
}

const evidence = (
  sourceIds: readonly string[],
  level: StructuralComponentEvidence['level'] = 'observed',
): readonly StructuralComponentEvidence[] => [
  { componentId: 'particle', level, sourceIds },
];

export const SPECIAL_GEOMETRY_SIGNATURE_PROFILES: readonly SpecialGeometrySignatureProfile[] =
  [
    {
      id: 'tmv-rigid-helical',
      virusIds: ['tmv'],
      builder: 'tmv',
      surfaceComponents: [],
      layers: ['helical coat', 'central channel', 'RNA'],
      genomeOrganization: 'helical-rna',
      specialStructures: ['rigid rod', 'open central channel'],
      evidence: evidence(['pdb-2tmv']),
      helical: {
        rigidity: 'rigid',
        centerline: 'straight',
        body: { length: 6.5, radius: 0.69, pitch: 0.36, strandCount: 5 },
        coat: {
          organization: 'helical-units',
          unitShape: 'wedge-like',
          unitScale: 0.115,
        },
        channel: { present: true, radiusScale: 0.28 },
        genomePath: 'helical-path',
      },
    },
    {
      id: 'm13-thin-semiflexible',
      virusIds: ['m13'],
      builder: 'm13',
      surfaceComponents: [],
      layers: ['helical coat', 'axial ssDNA'],
      genomeOrganization: 'single-stranded-dna-core',
      specialStructures: ['opposite terminal protein assemblies'],
      evidence: evidence(['pdb-2mjz']),
      helical: {
        rigidity: 'semi-flexible',
        centerline: 'gentle-bend',
        body: { length: 7.8, radius: 0.3, pitch: 0.31, strandCount: 5 },
        coat: {
          organization: 'helical-units',
          unitShape: 'short-rod',
          unitScale: 0.065,
        },
        genomePath: 'centerline-following',
        terminalStructures: [
          { end: 'start', kind: 'protein-cluster', count: 1, relativeLength: 0.34 },
          { end: 'end', kind: 'cap', count: 1, relativeLength: 0.24 },
        ],
      },
    },
    {
      id: 'pvx-flexible-helix',
      virusIds: ['pvx'],
      builder: 'plant-filament',
      surfaceComponents: [],
      layers: ['helical coat', 'RNA'],
      genomeOrganization: 'helical-rna',
      specialStructures: ['broad flexible filament'],
      evidence: evidence(['emd-pvx']),
      helical: {
        rigidity: 'flexible',
        centerline: 'flexible-s',
        body: { length: 6.6, radius: 0.48, pitch: 0.48, strandCount: 4 },
        coat: {
          organization: 'helical-units',
          unitShape: 'disc-like',
          unitScale: 0.09,
        },
        genomePath: 'centerline-following',
        terminalStructures: [
          { end: 'both', kind: 'cap', count: 1, relativeLength: 0.18 },
        ],
      },
    },
    {
      id: 'papmv-prominent-helix',
      virusIds: ['papmv'],
      builder: 'plant-filament',
      surfaceComponents: [],
      layers: ['prominent helical coat', 'RNA'],
      genomeOrganization: 'helical-rna',
      specialStructures: ['prominent coat ribbon'],
      evidence: evidence(['pdb-4dox', 'ictv-alphaflexiviridae']),
      helical: {
        rigidity: 'flexible',
        centerline: 'gentle-bend',
        body: { length: 6.1, radius: 0.5, pitch: 0.62, strandCount: 3 },
        coat: {
          organization: 'ring-like',
          unitShape: 'capsule-like',
          unitScale: 0.12,
        },
        genomePath: 'helical-path',
        terminalStructures: [
          { end: 'both', kind: 'cap', count: 1, relativeLength: 0.18 },
        ],
      },
    },
    {
      id: 'pvy-thin-flexible-helix',
      virusIds: ['pvy'],
      builder: 'plant-filament',
      surfaceComponents: [],
      layers: ['thin helical coat', 'RNA'],
      genomeOrganization: 'helical-rna',
      specialStructures: ['thin elongated potyvirus filament'],
      evidence: evidence(['pdb-6hxx']),
      helical: {
        rigidity: 'flexible',
        centerline: 'flexible-s',
        body: { length: 6.8, radius: 0.39, pitch: 0.4, strandCount: 5 },
        coat: {
          organization: 'helical-units',
          unitShape: 'short-rod',
          unitScale: 0.07,
        },
        genomePath: 'centerline-following',
        terminalStructures: [
          { end: 'end', kind: 'cap', count: 1, relativeLength: 0.18 },
        ],
      },
    },
    {
      id: 'filovirus-family',
      virusIds: [
        'marburg-virus',
        'ebola-virus',
        'sudan-virus',
        'bundibugyo-virus',
        'tai-forest-virus',
        'reston-virus',
        'bombali-virus',
      ],
      builder: 'filovirus',
      envelopeShape: 'filamentous',
      surfaceComponents: [
        {
          id: 'gp',
          label: 'GP',
          shape: 'club',
          relativeAbundance: 'dominant',
          partId: 'spike',
          layerId: 'surface-protein',
        },
      ],
      layers: ['envelope', 'surface-protein', 'matrix', 'nucleocapsid', 'genome'],
      genomeOrganization: 'helical-rnp',
      specialStructures: ['pleomorphic curved filament', 'helical nucleocapsid'],
      evidence: evidence(
        ['ictv-orthoebolavirus', 'ictv-filoviridae-structure'],
        'family-supported',
      ),
      helical: {
        rigidity: 'flexible',
        centerline: 'flexible-s',
        body: { length: 8.2, radius: 0.58, pitch: 0.39, strandCount: 1 },
        coat: {
          organization: 'smooth-concept',
          unitShape: 'capsule-like',
          unitScale: 0.08,
        },
        genomePath: 'helical-path',
      },
    },
    {
      id: 'sirv2-terminal-fiber-rod',
      virusIds: ['sirv2'],
      builder: 'archaeal-rod',
      surfaceComponents: [],
      layers: ['rigid coat', 'terminal fibers', 'linear DNA'],
      genomeOrganization: 'double-stranded-dna-core',
      specialStructures: ['three terminal fibers at each end'],
      evidence: evidence(['ictv-rudiviridae'], 'family-supported'),
      specialGeometry: {
        kind: 'rod',
        body: { length: 5.5, radius: 0.68 },
        surfaceOrganization: 'rigid-rod-coat',
        genomePath: 'central-path',
        terminalStructures: [
          { end: 'both', kind: 'fiber', count: 3, relativeLength: 0.72 },
        ],
      },
    },
    {
      id: 'ssv1-polar-spindle',
      virusIds: ['ssv1'],
      builder: 'spindle-virus',
      surfaceComponents: [],
      layers: ['outer shell', 'spindle body', 'terminal fibers', 'DNA'],
      genomeOrganization: 'circular-dna-core',
      specialStructures: ['fusiform taper', 'one polar terminal assembly'],
      evidence: evidence(['ictv-fuselloviridae'], 'family-supported'),
      specialGeometry: {
        kind: 'spindle',
        body: { length: 5.12, radius: 1.25, taper: 0.82 },
        surfaceOrganization: 'fusiform-shell',
        genomePath: 'looped-path',
        terminalStructures: [
          { end: 'end', kind: 'fiber', count: 6, relativeLength: 0.8 },
        ],
      },
    },
    {
      id: 'atv-bicaudate-spindle',
      virusIds: ['atv'],
      builder: 'spindle-virus',
      surfaceComponents: [],
      layers: ['outer shell', 'spindle body', 'two tails', 'DNA'],
      genomeOrganization: 'double-stranded-dna-core',
      specialStructures: ['long tails at both tapered poles'],
      evidence: evidence(['ictv-bicaudaviridae'], 'family-supported'),
      specialGeometry: {
        kind: 'spindle',
        body: { length: 5.2, radius: 1.18, taper: 0.92 },
        surfaceOrganization: 'fusiform-shell',
        genomePath: 'central-path',
        terminalStructures: [
          { end: 'both', kind: 'tail', count: 1, relativeLength: 1.35 },
        ],
      },
    },
    {
      id: 'geminivirus-faceted-twins',
      virusIds: ['maize-streak', 'tylcv'],
      builder: 'geminate-capsid',
      surfaceComponents: [],
      layers: ['faceted twin capsids', 'shared interface', 'circular DNA'],
      genomeOrganization: 'circular-dna-core',
      specialStructures: ['two incomplete faceted lobes', 'shared bridge'],
      evidence: evidence(['ictv-geminiviridae'], 'family-supported'),
      specialGeometry: {
        kind: 'geminate',
        body: { length: 4.8, radius: 1.2, lobeSpacing: 1.42 },
        surfaceOrganization: 'faceted-twin-lobes',
        genomePath: 'paired-path',
        internalStructures: ['geminate bridge'],
      },
    },
    {
      id: 'poxvirus-vaccinia-fallback',
      virusIds: ['vaccinia-mv', 'mpox-virus', 'variola-virus'],
      builder: 'vaccinia',
      envelopeShape: 'brick',
      surfaceComponents: [],
      layers: ['outer membrane', 'core wall', 'lateral bodies', 'genome'],
      genomeOrganization: 'packed-dna',
      specialStructures: [
        'rounded layered brick',
        'dumbbell core',
        'paired lateral bodies',
      ],
      evidence: evidence(['ictv-pox', 'pnas-vaccinia']),
      specialGeometry: {
        kind: 'brick',
        body: { length: 4.7, radius: 1.7, roundness: 0.34 },
        surfaceOrganization: 'layered-rounded-brick',
        genomePath: 'looped-path',
        internalStructures: ['dumbbell core wall', 'paired lateral bodies'],
      },
    },
  ] as const;

const PROFILE_BY_VIRUS = new Map(
  SPECIAL_GEOMETRY_SIGNATURE_PROFILES.flatMap((profile) =>
    profile.virusIds.map((virusId) => [virusId, profile] as const),
  ),
);

export function getSpecialGeometrySignatureProfile(
  virusId: string,
): SpecialGeometrySignatureProfile | undefined {
  return PROFILE_BY_VIRUS.get(virusId);
}

import { ENVELOPED_SIGNATURE_PROFILES } from './envelopedProfiles';
import type { StructuralSignature } from './structuralTypes';

export type {
  GenomeOrganization,
  StructuralComponentEvidence,
  StructuralSignature,
  SurfaceComponentShape,
  SurfaceComponentSignature,
} from './structuralTypes';

const signature = (input: StructuralSignature): StructuralSignature => input;

const ENVELOPED_SIGNATURES = ENVELOPED_SIGNATURE_PROFILES.flatMap((profile) =>
  profile.virusIds.map((virusId) =>
    signature({
      id: `${virusId}-${profile.id}-v1`,
      virusId,
      profileId: profile.id,
      builder: profile.builder,
      envelopeShape: profile.envelopeShape,
      surfaceComponents: profile.surfaceComponents,
      layers: profile.layers,
      genomeOrganization: profile.genomeOrganization,
      specialStructures: profile.specialStructures,
      evidence: profile.evidence,
    }),
  ),
);

const FOUNDATION_SIGNATURES: readonly StructuralSignature[] = [
  signature({
    id: 'adenovirus-5-fidelity-v1',
    virusId: 'adenovirus-5',
    builder: 'adenovirus',
    surfaceComponents: [
      {
        id: 'penton-fiber',
        label: 'Penton fiber',
        shape: 'knob',
        relativeAbundance: 'sparse',
        partId: 'fiber',
        layerId: 'capsid',
      },
    ],
    layers: ['정이십면체 capsid', 'capsomer'],
    genomeOrganization: 'packed-dna',
    specialStructures: ['12개 꼭짓점 penton·fiber'],
    evidence: [{ componentId: 'particle', level: 'observed', sourceIds: ['pdb-4v4u'] }],
  }),
  signature({
    id: 'rotavirus-rrv-fidelity-v1',
    virusId: 'rotavirus-rrv',
    builder: 'rotavirus',
    surfaceComponents: [
      {
        id: 'vp4',
        label: 'VP4 spike',
        shape: 'cone',
        relativeAbundance: 'minor',
        partId: 'spike',
        layerId: 'outer-capsid',
      },
    ],
    layers: ['outer capsid', 'middle capsid', 'core capsid'],
    genomeOrganization: 'layered-segments',
    specialStructures: ['11개 dsRNA 분절'],
    evidence: [{ componentId: 'particle', level: 'observed', sourceIds: ['pdb-4v7q'] }],
  }),
  signature({
    id: 't4-fidelity-v1',
    virusId: 't4',
    builder: 't4',
    surfaceComponents: [],
    layers: ['prolate head', 'contractile sheath', 'inner tube'],
    genomeOrganization: 'packed-dna',
    specialStructures: ['neck', 'baseplate', 'long tail fibers'],
    evidence: [
      {
        componentId: 'particle',
        level: 'observed',
        sourceIds: ['pdb-7vs5', 'pdb-2bsg'],
      },
    ],
  }),
  signature({
    id: 'tmv-fidelity-v1',
    virusId: 'tmv',
    builder: 'tmv',
    surfaceComponents: [],
    layers: ['helical coat', 'central channel'],
    genomeOrganization: 'helical-rna',
    specialStructures: ['rigid rod', 'coat 안쪽 RNA 경로'],
    evidence: [{ componentId: 'particle', level: 'observed', sourceIds: ['pdb-2tmv'] }],
  }),
] as const;

export const STRUCTURAL_SIGNATURES: readonly StructuralSignature[] = [
  ...ENVELOPED_SIGNATURES,
  ...FOUNDATION_SIGNATURES,
];

const SIGNATURE_BY_VIRUS = new Map(
  STRUCTURAL_SIGNATURES.map((entry) => [entry.virusId, entry]),
);

export function getStructuralSignature(
  virusId: string,
): StructuralSignature | undefined {
  return SIGNATURE_BY_VIRUS.get(virusId);
}

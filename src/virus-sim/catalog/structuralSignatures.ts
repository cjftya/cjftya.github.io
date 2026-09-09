import type { ModelBuilderId, ObservationLayerId, ObservationPartId } from './types';

export type SurfaceComponentShape = 'club' | 'cone' | 'knob' | 'channel';
export type GenomeOrganization =
  | 'helical-rnp'
  | 'segmented-rnp'
  | 'paired-rna-in-core'
  | 'packed-dna'
  | 'layered-segments'
  | 'helical-rna';

export interface SurfaceComponentSignature {
  readonly id: string;
  readonly label: string;
  readonly shape: SurfaceComponentShape;
  readonly relativeAbundance: 'dominant' | 'minor' | 'sparse';
  readonly partId: ObservationPartId;
  readonly layerId: ObservationLayerId;
}

export interface StructuralComponentEvidence {
  readonly componentId: string;
  readonly level: 'observed' | 'family-supported' | 'conceptual';
  readonly sourceIds: readonly string[];
}

export interface StructuralSignature {
  readonly id: string;
  readonly virusId: string;
  readonly builder: ModelBuilderId;
  readonly envelopeShape?: 'spherical' | 'pleomorphic' | 'filamentous';
  readonly surfaceComponents: readonly SurfaceComponentSignature[];
  readonly layers: readonly string[];
  readonly genomeOrganization: GenomeOrganization;
  readonly specialStructures: readonly string[];
  readonly evidence: readonly StructuralComponentEvidence[];
}

const signature = (input: StructuralSignature): StructuralSignature => input;

export const STRUCTURAL_SIGNATURES: readonly StructuralSignature[] = [
  signature({
    id: 'sars-cov-2-fidelity-v1',
    virusId: 'sars-cov-2',
    builder: 'coronavirus',
    envelopeShape: 'pleomorphic',
    surfaceComponents: [
      {
        id: 'spike-s',
        label: 'S 삼량체',
        shape: 'club',
        relativeAbundance: 'dominant',
        partId: 'spike',
        layerId: 'surface-protein',
      },
      {
        id: 'membrane-m',
        label: 'M 단백질',
        shape: 'knob',
        relativeAbundance: 'minor',
        partId: 'spike',
        layerId: 'surface-protein',
      },
      {
        id: 'envelope-e',
        label: 'E 단백질',
        shape: 'channel',
        relativeAbundance: 'sparse',
        partId: 'spike',
        layerId: 'surface-protein',
      },
    ],
    layers: ['지질 외피', 'M 단백질층', '나선형 N-RNA 복합체'],
    genomeOrganization: 'helical-rnp',
    specialStructures: ['코로나형 긴 S 돌기'],
    evidence: [
      {
        componentId: 'particle',
        level: 'family-supported',
        sourceIds: ['ictv-coronaviridae'],
      },
    ],
  }),
  signature({
    id: 'influenza-a-fidelity-v1',
    virusId: 'influenza-a',
    builder: 'influenza',
    envelopeShape: 'pleomorphic',
    surfaceComponents: [
      {
        id: 'ha',
        label: 'HA',
        shape: 'cone',
        relativeAbundance: 'dominant',
        partId: 'spike',
        layerId: 'surface-protein',
      },
      {
        id: 'na',
        label: 'NA',
        shape: 'knob',
        relativeAbundance: 'minor',
        partId: 'spike',
        layerId: 'surface-protein',
      },
      {
        id: 'm2',
        label: 'M2 채널',
        shape: 'channel',
        relativeAbundance: 'sparse',
        partId: 'spike',
        layerId: 'surface-protein',
      },
    ],
    layers: ['지질 외피', 'M1 matrix', '8개 RNP'],
    genomeOrganization: 'segmented-rnp',
    specialStructures: ['서로 다른 HA·NA 돌기'],
    evidence: [
      {
        componentId: 'particle',
        level: 'family-supported',
        sourceIds: ['ictv-influenza', 'influenza-quant'],
      },
    ],
  }),
  signature({
    id: 'hiv-1-fidelity-v1',
    virusId: 'hiv-1',
    builder: 'lentivirus',
    envelopeShape: 'spherical',
    surfaceComponents: [
      {
        id: 'env',
        label: 'Env 삼량체',
        shape: 'club',
        relativeAbundance: 'sparse',
        partId: 'spike',
        layerId: 'surface-protein',
      },
    ],
    layers: ['지질 외피', 'matrix', '원뿔형 capsid'],
    genomeOrganization: 'paired-rna-in-core',
    specialStructures: ['비대칭 원뿔형 성숙 core'],
    evidence: [
      {
        componentId: 'particle',
        level: 'observed',
        sourceIds: ['hiv-particle-review', 'pdb-3j3q'],
      },
    ],
  }),
  signature({
    id: 'ebola-fidelity-v1',
    virusId: 'ebola-virus',
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
    layers: ['관형 외피', 'VP40 matrix', '나선형 nucleocapsid'],
    genomeOrganization: 'helical-rnp',
    specialStructures: ['굽은 필라멘트 중심선'],
    evidence: [
      {
        componentId: 'particle',
        level: 'family-supported',
        sourceIds: ['ictv-orthoebolavirus'],
      },
    ],
  }),
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

const SIGNATURE_BY_VIRUS = new Map(
  STRUCTURAL_SIGNATURES.map((entry) => [entry.virusId, entry]),
);

export function getStructuralSignature(
  virusId: string,
): StructuralSignature | undefined {
  return SIGNATURE_BY_VIRUS.get(virusId);
}

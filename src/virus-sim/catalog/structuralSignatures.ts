import { ENVELOPED_SIGNATURE_PROFILES } from './envelopedProfiles';
import { CAPSID_SIGNATURE_PROFILES } from './capsidProfiles';
import { SPECIAL_GEOMETRY_SIGNATURE_PROFILES } from './specialGeometryProfiles';
import { PHAGE_SIGNATURE_PROFILES } from './phageProfiles';
import type { StructuralSignature } from './structuralTypes';
import { HUMAN_EXPANSION_STRUCTURAL_SIGNATURES } from './humanExpansionSignatures';

export type {
  GenomeOrganization,
  StructuralComponentEvidence,
  StructuralSignature,
  SurfaceComponentShape,
  SurfaceComponentSignature,
  CapsidFaceting,
  IcosahedralSurfacePattern,
  IcosahedralTopologySignature,
  LayeredCapsidLayerSignature,
  LayeredCapsidRole,
  LayeredCapsidSignature,
  LayerSurfacePattern,
  VertexFeatureKind,
  VertexFeatureSignature,
  CenterlineArchetype,
  GenomePathKind,
  HelicalCoatOrganization,
  HelicalCoatUnitShape,
  HelicalRigidity,
  HelicalSignature,
  SpecialGeometryKind,
  SpecialGeometrySignature,
  TerminalStructureKind,
  TerminalStructureSignature,
  PhageBaseplateStyle,
  PhageHeadShape,
  PhageHeadSurfacePattern,
  PhageNeckStyle,
  PhageReceptorKind,
  PhageReceptorSignature,
  PhageStructuralSignature,
  PhageTailType,
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

const CAPSID_SIGNATURES = CAPSID_SIGNATURE_PROFILES.flatMap((profile) =>
  profile.virusIds.map((virusId) =>
    signature({
      id: `${virusId}-${profile.id}-v1`,
      virusId,
      profileId: profile.id,
      builder: profile.builder,
      surfaceComponents: profile.surfaceComponents,
      layers: profile.layers,
      genomeOrganization: profile.genomeOrganization,
      specialStructures: profile.specialStructures,
      evidence: profile.evidence,
      icosahedral: profile.icosahedral,
      layeredCapsid: profile.layeredCapsid,
    }),
  ),
);

const SPECIAL_GEOMETRY_SIGNATURES = SPECIAL_GEOMETRY_SIGNATURE_PROFILES.flatMap(
  (profile) =>
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
        helical: profile.helical,
        specialGeometry: profile.specialGeometry,
      }),
    ),
);

const PHAGE_SIGNATURES = PHAGE_SIGNATURE_PROFILES.flatMap((profile) =>
  profile.virusIds.map((virusId) =>
    signature({
      id: `${virusId}-${profile.id}-v1`,
      virusId,
      profileId: profile.id,
      builder: profile.builder,
      surfaceComponents: [],
      layers: ['head capsid', 'tail architecture', 'packed genome'],
      genomeOrganization: 'packed-dna',
      specialStructures: [
        `${profile.signature.head.shape} head`,
        `${profile.signature.tail.type} tail`,
      ],
      evidence: profile.evidence,
      phage: profile.signature,
    }),
  ),
);

const ALL_STRUCTURAL_SIGNATURES: readonly StructuralSignature[] = [
  ...ENVELOPED_SIGNATURES,
  ...CAPSID_SIGNATURES,
  ...SPECIAL_GEOMETRY_SIGNATURES,
  ...PHAGE_SIGNATURES,
  ...HUMAN_EXPANSION_STRUCTURAL_SIGNATURES,
];

export const STRUCTURAL_SIGNATURES: readonly StructuralSignature[] = [
  ...new Map(
    ALL_STRUCTURAL_SIGNATURES.map((entry) => [entry.virusId, entry] as const),
  ).values(),
];

const SIGNATURE_BY_VIRUS = new Map(
  STRUCTURAL_SIGNATURES.map((entry) => [entry.virusId, entry]),
);

export function getStructuralSignature(
  virusId: string,
): StructuralSignature | undefined {
  return SIGNATURE_BY_VIRUS.get(virusId);
}

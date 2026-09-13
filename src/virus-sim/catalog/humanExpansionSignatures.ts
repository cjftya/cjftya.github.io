import { HUMAN_RNP_PROFILES, getHumanRnpEvidence } from './humanExpansionProfiles';
import type { StructuralSignature } from './structuralTypes';

export const HUMAN_EXPANSION_STRUCTURAL_SIGNATURES: readonly StructuralSignature[] =
  HUMAN_RNP_PROFILES.flatMap((profile) =>
    profile.virusIds.map((virusId) => ({
      id: `${virusId}-${profile.id}-v1`,
      virusId,
      profileId: profile.id,
      builder: 'human-rnp' as const,
      envelopeShape: 'pleomorphic' as const,
      surfaceComponents: profile.surfaces.map((component) => ({
        id: component.id,
        label: component.label,
        shape: component.shape,
        relativeAbundance: component.abundance,
        partId: 'spike' as const,
        layerId: 'surface-protein' as const,
      })),
      layers: [
        '지질 외피',
        '표면 당단백질',
        ...(profile.matrix ? ['matrix'] : []),
        'nucleocapsid/RNP',
        'RNA genome',
      ],
      genomeOrganization: profile.genomeOrganization,
      specialStructures: [
        profile.core === 'segmented'
          ? `${profile.segmentCount ?? 3}개 RNA-RNP 분절`
          : `${profile.core} RNA core`,
      ],
      evidence: getHumanRnpEvidence(profile, virusId),
    })),
  );

import type { ExperienceState } from '../experience/ExperienceState';
import type { SpecimenPersonality } from './specimen/SpecimenPersonality';

export type VirusId = string;
export type ObservationPresetId = VirusId;

export type ModelBuilderId =
  | 't4'
  | 'lambda'
  | 't7'
  | 'ms2'
  | 'tmv'
  | 'm13'
  | 'adenovirus'
  | 'rotavirus'
  | 'hsv'
  | 'influenza'
  | 'vsv'
  | 'vaccinia'
  | 'generic-icosahedral'
  | 'generic-phage'
  | 'generic-filament'
  | 'generic-enveloped'
  | 'generic-layered'
  | 'generic-geminate'
  | 'generic-spindle'
  | 'generic-rod';

export type GeometryFamily =
  | 'icosahedral'
  | 'phage'
  | 'filament'
  | 'enveloped'
  | 'layered'
  | 'geminate'
  | 'spindle'
  | 'rod';

export type InspectionView = 'surface' | 'transparent' | 'section' | 'exploded';
export type DemoKind = 'none' | 'structure-tour';
export type MotionMode = 'active' | 'calm' | 'brownian' | 'static';
export type LocalMotion = 'none' | 'flexible-filament' | 'articulated-fiber';

export type ObservationPartId =
  | 'capsid'
  | 'capsomer'
  | 'genome'
  | 'neck'
  | 'sheath'
  | 'inner-tube'
  | 'baseplate'
  | 'tail-fiber'
  | 'tailspike'
  | 'flexible-tail'
  | 'portal'
  | 'maturation-protein'
  | 'channel'
  | 'coat-protein'
  | 'terminal-protein'
  | 'penton'
  | 'fiber'
  | 'outer-capsid'
  | 'middle-capsid'
  | 'core-capsid'
  | 'inner-membrane'
  | 'envelope'
  | 'spike'
  | 'turret'
  | 'surface-domain'
  | 'geminate-bridge'
  | 'tegument'
  | 'matrix'
  | 'rnp'
  | 'nucleocapsid'
  | 'core-wall'
  | 'lateral-body'
  | 'terminal-tail';

export type ObservationLayerId =
  | 'envelope'
  | 'surface-protein'
  | 'tegument'
  | 'capsid'
  | 'tail'
  | 'outer-capsid'
  | 'middle-capsid'
  | 'core-capsid'
  | 'inner-membrane'
  | 'matrix'
  | 'nucleocapsid'
  | 'membrane'
  | 'core-wall'
  | 'lateral-body'
  | 'genome';

export interface ObservationPartDefinition {
  readonly id: ObservationPartId;
  readonly name: string;
  readonly summary: string;
  readonly detail: string;
}

export interface LayerDefinition {
  readonly id: ObservationLayerId;
  readonly name: string;
  readonly note?: string;
}

export type CatalogTag =
  | 'phage'
  | 'helical'
  | 'icosahedral'
  | 'enveloped'
  | 'complex'
  | 'plant'
  | 'animal'
  | 'archaea';

export interface TourStop {
  readonly partId: ObservationPartId;
  readonly label: string;
  readonly view: InspectionView;
  readonly genomeVisible?: boolean;
}

export interface ObservationDefinition {
  readonly id: ObservationPresetId;
  readonly identityKey: string;
  readonly name: string;
  readonly shortName: string;
  readonly nameEn: string;
  readonly aliases: readonly string[];
  readonly particleState: string;
  readonly category: string;
  readonly genomeLabel: string;
  readonly description: string;
  readonly feature: string;
  readonly morphologyTags: readonly CatalogTag[];
  readonly silhouette:
    | 'polyhedron'
    | 'phage'
    | 'filament'
    | 'envelope'
    | 'bullet'
    | 'brick'
    | 'geminate'
    | 'spindle'
    | 'rod';
  readonly parts: readonly ObservationPartId[];
  readonly layers: readonly LayerDefinition[];
  readonly sourceIds: readonly string[];
  readonly modelBuilder: ModelBuilderId;
  readonly geometryProfileId: string;
  readonly motionProfileId: 'active' | 'calm';
  readonly evidenceStatus: 'verified';
  readonly representation: 'source-informed-procedural';
  readonly localMotion: LocalMotion;
  readonly tourStops: readonly TourStop[];
  readonly simplifications: readonly string[];
  readonly displayLength: number;
  readonly sectionRadius: number;
}

export interface ObservationVec3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface ObservationQuaternion {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly w: number;
}

export interface ObservationMotionState {
  readonly version: 'observation-motion-v2.5';
  readonly mode: MotionMode;
  readonly position: ObservationVec3;
  readonly previousPosition: ObservationVec3;
  readonly quaternion: ObservationQuaternion;
  readonly previousQuaternion: ObservationQuaternion;
  readonly anchorPosition: ObservationVec3;
  readonly anchorQuaternion: ObservationQuaternion;
  readonly seed: number;
  readonly tick: number;
  readonly translationTick: number;
  readonly rotationTick: number;
  readonly translationPhase: number;
  readonly rotationPhase: number;
}

export interface ObservationDemoState {
  readonly kind: DemoKind;
  readonly progress: number;
  readonly playing: boolean;
}

export type LayerVisibility = Readonly<Record<ObservationLayerId, boolean>>;

export interface ObservationState {
  readonly presetId: ObservationPresetId;
  readonly view: InspectionView;
  readonly selectedPartId: ObservationPartId | null;
  readonly running: boolean;
  readonly speed: number;
  readonly translationEnabled: boolean;
  readonly rotationEnabled: boolean;
  readonly followTarget: boolean;
  readonly explosion: number;
  readonly sectionOffset: number;
  readonly genomeVisible: boolean;
  readonly layerVisibility: LayerVisibility;
  readonly demo: ObservationDemoState;
  readonly motion: ObservationMotionState;
  readonly experience: ExperienceState;
  readonly personality: SpecimenPersonality;
}

export interface ObservationSnapshot extends ObservationState {
  readonly tick: number;
  readonly seed: number;
}

export interface StructureTourPose {
  readonly view: InspectionView;
  readonly explosion: number;
  readonly sectionOffset: number;
  readonly genomeVisible: boolean;
  readonly focusPartId: ObservationPartId | null;
  readonly label: string;
}

export type ConceptPresetId =
  'icosahedral' | 'tailed-phage' | 'filamentous' | 'enveloped';

export type VirusId =
  | 't4'
  | 'lambda'
  | 't7'
  | 'ms2'
  | 'tmv'
  | 'm13'
  | 'adenovirus-5'
  | 'rotavirus-rrv'
  | 'hsv1'
  | 'influenza-a'
  | 'vsv-indiana'
  | 'vaccinia-mv';

export type ObservationPresetId = ConceptPresetId | VirusId;

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
  | 'concept-icosahedral'
  | 'concept-filamentous'
  | 'concept-enveloped';

export type InspectionView = 'surface' | 'transparent' | 'section' | 'exploded';

export type DemoKind = 'none' | 'structure-tour' | 'phage-delivery';

export type MotionMode = 'smooth' | 'brownian' | 'static';

export type ObservationPartId =
  | 'capsid'
  | 'capsomer'
  | 'genome'
  | 'neck'
  | 'sheath'
  | 'inner-tube'
  | 'baseplate'
  | 'tail-fiber'
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
  | 'envelope'
  | 'spike'
  | 'tegument'
  | 'matrix'
  | 'rnp'
  | 'nucleocapsid'
  | 'core-wall'
  | 'lateral-body';

export type ObservationLayerId =
  | 'envelope'
  | 'surface-protein'
  | 'tegument'
  | 'capsid'
  | 'tail'
  | 'outer-capsid'
  | 'middle-capsid'
  | 'core-capsid'
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

export type CatalogTag = 'phage' | 'helical' | 'icosahedral' | 'enveloped';

export interface ObservationDefinition {
  readonly id: ObservationPresetId;
  readonly name: string;
  readonly shortName: string;
  readonly nameEn: string;
  readonly category: string;
  readonly genomeLabel: string;
  readonly description: string;
  readonly feature: string;
  readonly morphologyTags: readonly CatalogTag[];
  readonly silhouette:
    'polyhedron' | 'phage' | 'filament' | 'envelope' | 'bullet' | 'brick';
  readonly parts: readonly ObservationPartId[];
  readonly layers: readonly LayerDefinition[];
  readonly sourceIds: readonly string[];
  readonly modelBuilder: ModelBuilderId;
  readonly representation: 'source-informed-procedural' | 'concept';
  readonly simplifications: readonly string[];
  readonly displayLength: number;
  readonly sectionRadius: number;
  readonly supportsDeliveryDemo: boolean;
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
  readonly version: 'observation-motion-v2';
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
}

export interface PhageDeliveryPose {
  readonly approach: number;
  readonly sheathContraction: number;
  readonly tubeExtension: number;
  readonly genomeTransfer: number;
  readonly surfaceVisible: boolean;
  readonly label: '표면 접근' | '부착' | '꼬리집 수축' | '유전체 전달' | '빈 입자';
}

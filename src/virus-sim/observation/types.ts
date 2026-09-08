export type ObservationPresetId =
  'icosahedral' | 'tailed-phage' | 'filamentous' | 'enveloped';

export type InspectionView = 'surface' | 'transparent' | 'section' | 'exploded';

export type DemoKind = 'none' | 'structure-tour' | 'phage-delivery';

export type ObservationPartId =
  | 'capsid'
  | 'capsomer'
  | 'genome'
  | 'neck'
  | 'sheath'
  | 'inner-tube'
  | 'baseplate'
  | 'tail-fiber'
  | 'envelope'
  | 'spike';

export type ObservationLayerId = 'envelope' | 'capsid' | 'genome';

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
  readonly position: ObservationVec3;
  readonly previousPosition: ObservationVec3;
  readonly quaternion: ObservationQuaternion;
  readonly previousQuaternion: ObservationQuaternion;
  readonly seed: number;
  readonly tick: number;
}

export interface ObservationDemoState {
  readonly kind: DemoKind;
  readonly progress: number;
  readonly playing: boolean;
}

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
  readonly layerVisibility: Readonly<Record<ObservationLayerId, boolean>>;
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

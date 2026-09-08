import type { ObservationSnapshot } from '../observation/types';

export type ObservationMomentType =
  'rotation-reveal' | 'drift-change' | 'alignment' | 'quiet-detail';

export interface ObservationMoment {
  readonly specimenId: string;
  readonly type: ObservationMomentType;
  readonly interestScore: number;
  readonly label: string;
  readonly duration: number;
}

export function detectObservationMoment(
  snapshot: ObservationSnapshot,
): ObservationMoment {
  const quaternion = snapshot.motion.quaternion;
  const position = snapshot.motion.position;
  const rotationEnergy = Math.min(
    1,
    Math.abs(quaternion.x) + Math.abs(quaternion.y) + Math.abs(quaternion.z),
  );
  const driftEnergy = Math.min(1, Math.hypot(position.x, position.y, position.z) / 0.5);
  const phase = Math.abs(Math.sin(snapshot.motion.rotationPhase * 0.37));
  const values = [
    {
      type: 'rotation-reveal' as const,
      score: 0.45 + rotationEnergy * 0.48,
      label: '새로운 구조 면이 보이고 있어요',
    },
    {
      type: 'drift-change' as const,
      score: 0.42 + driftEnergy * 0.44,
      label: '완만한 이동 곡선이 감지됐어요',
    },
    {
      type: 'alignment' as const,
      score: 0.38 + phase * 0.5,
      label: '구조 정렬 순간을 관찰해보세요',
    },
    {
      type: 'quiet-detail' as const,
      score: snapshot.running ? 0.36 : 0.76,
      label: '정지된 구조를 가까이 살펴볼 수 있어요',
    },
  ];
  const best = values.reduce((left, right) =>
    right.score > left.score ? right : left,
  );
  return {
    specimenId: snapshot.presetId,
    type: best.type,
    interestScore: Math.min(1, best.score),
    label: best.label,
    duration: 4.5,
  };
}

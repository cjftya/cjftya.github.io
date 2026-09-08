import type { ObservationSnapshot } from '../observation/types';
import {
  detectObservationMoment,
  type ObservationMoment,
} from './ObservationMomentDetector';

const IDLE_DELAY_MS = 14_000;
const MOMENT_INTERVAL_MS = 2_400;

export class ExperienceDirector {
  private lastMomentAt = Number.NEGATIVE_INFINITY;
  private lastDocumentaryShotAt = Number.NEGATIVE_INFINITY;

  evaluateMoment(snapshot: ObservationSnapshot, now: number): ObservationMoment | null {
    if (now - this.lastMomentAt < MOMENT_INTERVAL_MS) return null;
    this.lastMomentAt = now;
    const moment = detectObservationMoment(snapshot);
    return moment.interestScore >= 0.66 ? moment : null;
  }

  shouldStartDocumentary(
    snapshot: ObservationSnapshot,
    now: number,
    lastInteractionAt: number,
  ): boolean {
    return (
      snapshot.experience.autoDocumentary &&
      !snapshot.experience.reducedMotion &&
      snapshot.demo.kind === 'none' &&
      (snapshot.experience.stage === 'observe' ||
        snapshot.experience.stage === 'follow') &&
      now - lastInteractionAt >= IDLE_DELAY_MS
    );
  }

  shouldAdvanceDocumentary(snapshot: ObservationSnapshot, now: number): boolean {
    if (snapshot.experience.stage !== 'documentary') return false;
    if (now - this.lastDocumentaryShotAt < 6_200) return false;
    this.lastDocumentaryShotAt = now;
    return true;
  }

  markDocumentaryShot(now: number): void {
    this.lastDocumentaryShotAt = now;
  }
}

import { describe, expect, it } from 'vitest';
import { FixedStepClock } from '../src/viola/core/FixedStepClock';
import { Vector2, closestPointOnSegment, safeUnit } from '../src/viola/core/Vector2';
import { experimentCategories, experiments } from '../src/viola/data/experiments';

describe('Viola shared physics core', () => {
  it('normalizes zero-length vectors without producing NaN', () => {
    const vector = new Vector2().normalize();
    const unit = safeUnit(0, 0);

    expect(vector).toMatchObject({ x: 0, y: 0 });
    expect(unit).toEqual({ x: 0, y: 0, length: 0 });
    expect(Number.isFinite(vector.x)).toBe(true);
    expect(Number.isFinite(vector.y)).toBe(true);
  });

  it('handles a zero-length segment when finding a closest point', () => {
    const closest = closestPointOnSegment(
      new Vector2(30, 40),
      new Vector2(8, 9),
      new Vector2(8, 9),
    );
    expect(closest).toMatchObject({ x: 8, y: 9 });
  });

  it('uses fixed 60 Hz steps independent of frame packet size', () => {
    const clock = new FixedStepClock();
    let steps = 0;
    for (let index = 0; index < 10; index += 1)
      clock.consume(1 / 120, () => {
        steps += 1;
      });
    expect(steps).toBe(5);
  });
});

describe('Viola experiment catalog', () => {
  it('contains all 46 unique experiments in the five original groups', () => {
    expect(experiments).toHaveLength(46);
    expect(new Set(experiments.map((experiment) => experiment.id)).size).toBe(46);
    expect(new Set(experiments.map((experiment) => experiment.originalName)).size).toBe(
      46,
    );
    expect(new Set(experiments.map((experiment) => experiment.category))).toEqual(
      new Set(experimentCategories),
    );
  });

  it('labels every date as a valid source record date', () => {
    for (const experiment of experiments) {
      expect(experiment.recordedAt).toMatch(/^20\d{2}-\d{2}-\d{2}$/);
      expect(Number.isNaN(Date.parse(experiment.recordedAt))).toBe(false);
      expect(experiment.hint.length).toBeGreaterThan(4);
    }
  });
});

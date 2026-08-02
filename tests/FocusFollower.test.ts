import { Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { FocusFollower } from '../src/core/camera/FocusFollower';

describe('FocusFollower', () => {
  it('reports only the orbital movement after focus begins', () => {
    const follower = new FocusFollower();
    const movement = new Vector3();

    follower.begin(new Vector3(4, 0, 2));

    expect(follower.update(new Vector3(4.25, 0.1, 1.8), movement)).toBe(true);
    expect(movement.x).toBeCloseTo(0.25);
    expect(movement.y).toBeCloseTo(0.1);
    expect(movement.z).toBeCloseTo(-0.2);
  });

  it('updates its reference position without accumulating old movement', () => {
    const follower = new FocusFollower();
    const movement = new Vector3();

    follower.begin(new Vector3(1, 2, 3));
    follower.update(new Vector3(2, 3, 4), movement);
    follower.update(new Vector3(2.5, 3, 3.5), movement);

    expect(movement.toArray()).toEqual([0.5, 0, -0.5]);
  });

  it('stops producing movement after focus is cleared', () => {
    const follower = new FocusFollower();
    const movement = new Vector3(9, 9, 9);

    follower.begin(new Vector3());
    follower.clear();

    expect(follower.update(new Vector3(1, 0, 0), movement)).toBe(false);
    expect(movement.toArray()).toEqual([9, 9, 9]);
  });
});

interface Vec3Like {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export function calculateExplodedPosition(
  origin: Vec3Like,
  direction: Vec3Like,
  amount: number,
  distance: number,
): Vec3Like {
  const normalized = Math.min(1, Math.max(0, amount));
  return {
    x: origin.x + direction.x * normalized * distance,
    y: origin.y + direction.y * normalized * distance,
    z: origin.z + direction.z * normalized * distance,
  };
}

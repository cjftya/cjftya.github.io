function hashLattice(x: number, y: number, z: number, seed: number): number {
  let hash =
    seed ^
    Math.imul(x, 374_761_393) ^
    Math.imul(y, 668_265_263) ^
    Math.imul(z, 2_147_483_647);
  hash = Math.imul(hash ^ (hash >>> 13), 1_274_126_177);
  hash ^= hash >>> 16;
  return (hash >>> 0) / 4_294_967_295;
}

function smooth(value: number): number {
  return value * value * (3 - 2 * value);
}

function lerp(start: number, end: number, amount: number): number {
  return start + (end - start) * amount;
}

export function sampleSeededNoise(
  x: number,
  y: number,
  z: number,
  seed: number,
): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const z0 = Math.floor(z);
  const x1 = x0 + 1;
  const y1 = y0 + 1;
  const z1 = z0 + 1;
  const tx = smooth(x - x0);
  const ty = smooth(y - y0);
  const tz = smooth(z - z0);

  const lower = lerp(
    lerp(hashLattice(x0, y0, z0, seed), hashLattice(x1, y0, z0, seed), tx),
    lerp(hashLattice(x0, y1, z0, seed), hashLattice(x1, y1, z0, seed), tx),
    ty,
  );
  const upper = lerp(
    lerp(hashLattice(x0, y0, z1, seed), hashLattice(x1, y0, z1, seed), tx),
    lerp(hashLattice(x0, y1, z1, seed), hashLattice(x1, y1, z1, seed), tx),
    ty,
  );

  return lerp(lower, upper, tz);
}

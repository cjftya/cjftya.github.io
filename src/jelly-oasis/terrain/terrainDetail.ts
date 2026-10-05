import {
  DataTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  RepeatWrapping,
} from 'three';

export const TERRAIN_DETAIL_SIZE = 512;

/** Periodic value noise: every octave wraps at the same tile boundary. */
function noise(x: number, y: number, period: number, seed: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const hash = (a: number, b: number): number => {
    let n =
      Math.imul((a % period) + seed, 374761393) ^ Math.imul(b % period, 668265263);
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  };
  const a = hash(ix, iy);
  const b = hash(ix + 1, iy);
  const c = hash(ix, iy + 1);
  const d = hash(ix + 1, iy + 1);
  return (a + (b - a) * sx) * (1 - sy) + (c + (d - c) * sx) * sy;
}

/** Original procedural data, not borrowed art. RGBA = grass / soil / rock / macro.
 * One 512² RGBA8 allocation, ~1.33 MiB including mipmaps; no network asset load.
 * Channels are linear scalar detail, NOT sRGB base-color textures.
 */
export function createTerrainDetail(): DataTexture {
  const size = TERRAIN_DETAIL_SIZE;
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const u = (x + 0.5) / size;
      const v = (y + 0.5) / size;
      const n = (frequency: number, seed: number): number =>
        noise(u * frequency, v * frequency, frequency, seed);
      const grass = n(64, 11) * 0.55 + n(128, 12) * 0.25 + n(16, 13) * 0.2;
      const soil = n(32, 21) * 0.45 + n(96, 22) * 0.35 + n(8, 23) * 0.2;
      const rock = n(8, 31) * 0.55 + n(24, 32) * 0.3 + n(64, 33) * 0.15;
      const macro = n(8, 41) * 0.75 + n(16, 42) * 0.25;
      const offset = (y * size + x) * 4;
      data[offset] = Math.round(grass * 255);
      data[offset + 1] = Math.round(soil * 255);
      data[offset + 2] = Math.round(rock * 255);
      data[offset + 3] = Math.round(macro * 255);
    }
  }
  const texture = new DataTexture(data, size, size);
  texture.name = 'OasisPackedSurfaceDetail';
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

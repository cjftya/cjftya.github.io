import {
  DataTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  RepeatWrapping,
  RGBAFormat,
} from 'three';

// Small, deterministic textures generated locally; no external image assets.
export function createWaterNormal() {
  const size = 128,
    bytes = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const u = (x / size) * Math.PI * 2,
        v = (y / size) * Math.PI * 2;
      const dx =
        Math.cos(u * 3 + v * 2) * 0.2 +
        Math.cos(u * 7 - v * 5) * 0.12 +
        Math.cos(u * 13 + v * 11) * 0.07;
      const dy =
        Math.cos(u * 3 + v * 2) * 0.13 -
        Math.cos(u * 7 - v * 5) * 0.09 +
        Math.cos(u * 13 + v * 11) * 0.06;
      const length = Math.hypot(dx, dy, 1),
        i = (y * size + x) * 4;
      bytes.set(
        [
          Math.round(((dx / length) * 0.5 + 0.5) * 255),
          Math.round(((dy / length) * 0.5 + 0.5) * 255),
          Math.round(255 / length),
          255,
        ],
        i,
      );
    }
  const texture = new DataTexture(bytes, size, size, RGBAFormat);
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}
export function createFoamTexture() {
  const size = 128,
    bytes = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const u = (x / size) * 2 - 1,
        v = (y / size) * 2 - 1;
      const radius = Math.hypot(u, v);
      const cloud = Math.sin(u * 18 + Math.sin(v * 13)) * Math.cos(v * 16 + u * 4);
      const edge = Math.max(0, Math.min(1, (1 - radius + cloud * 0.13) * 3));
      const holes = Math.max(0.1, Math.min(1, cloud * 0.65 + 0.52));
      bytes.set([240, 248, 243, Math.round(edge * holes * 255)], (y * size + x) * 4);
    }
  const texture = new DataTexture(bytes, size, size, RGBAFormat);
  texture.magFilter = texture.minFilter = LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

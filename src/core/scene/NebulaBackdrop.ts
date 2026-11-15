import {
  AdditiveBlending,
  BackSide,
  DataTexture,
  LinearFilter,
  Mesh,
  MeshBasicMaterial,
  RepeatWrapping,
  SphereGeometry,
  SRGBColorSpace,
} from 'three';
import { sampleSeededNoise } from '../../planets/generators/seededNoise';

// One small, seamless texture generated once; no animated noise or render targets.
export function createNebulaTexture(): DataTexture {
  const width = 512;
  const height = 256;
  const pixels = new Uint8Array(width * height * 4);

  for (let row = 0; row < height; row += 1) {
    const latitude = ((row + 0.5) / height) * Math.PI;
    const horizontal = Math.sin(latitude);
    const y = Math.cos(latitude);
    for (let column = 0; column < width; column += 1) {
      const longitude = ((column + 0.5) / width) * Math.PI * 2;
      const x = horizontal * Math.cos(longitude);
      const z = horizontal * Math.sin(longitude);
      const broad = sampleSeededNoise(x * 2.6, y * 2.6, z * 2.6, 1201);
      const detail = sampleSeededNoise(x * 8, y * 8, z * 8, 1202);
      // Broken cloud bands leave generous dark gaps in every viewing direction.
      const band = Math.exp(-Math.pow((y + x * 0.32 - z * 0.2) * 3.3, 2));
      const density = Math.max(0, broad * 0.78 + detail * 0.22 - 0.36) * band;
      const tint = sampleSeededNoise(x * 3, y * 3, z * 3, 1203);
      const offset = (row * width + column) * 4;
      pixels[offset] = Math.round(75 + tint * 55);
      pixels[offset + 1] = Math.round(85 - tint * 32);
      pixels[offset + 2] = 155;
      pixels[offset + 3] = Math.round(Math.min(density * 1.1, 0.32) * 255);
    }
  }

  const texture = new DataTexture(pixels, width, height);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = RepeatWrapping;
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

export class NebulaBackdrop {
  private readonly texture = createNebulaTexture();
  readonly object = new Mesh(
    new SphereGeometry(100, 24, 16),
    new MeshBasicMaterial({
      map: this.texture,
      side: BackSide,
      transparent: true,
      opacity: 1,
      blending: AdditiveBlending,
      // Opaque planets already wrote depth: the nebula must stay behind them.
      depthTest: true,
      depthWrite: false,
      toneMapped: false,
    }),
  );

  constructor() {
    this.object.renderOrder = -1000;
    this.object.frustumCulled = false;
  }

  dispose(): void {
    this.object.geometry.dispose();
    this.object.material.dispose();
    this.texture.dispose();
  }
}

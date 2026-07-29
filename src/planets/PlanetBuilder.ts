import {
  IcosahedronGeometry,
  MeshStandardMaterial,
  RingGeometry,
  SRGBColorSpace,
  TextureLoader,
} from 'three';
import type { Texture } from 'three';
import { Planet } from '../solar-system/Planet';
import type { PlanetDefinition } from './PlanetDefinition';
import { sampleSeededNoise } from './generators/seededNoise';

export class PlanetBuilder {
  constructor(private readonly textureLoader = new TextureLoader()) {}

  async build(definition: PlanetDefinition): Promise<Planet> {
    const geometry = new IcosahedronGeometry(definition.planet.shape.radius, 3);
    this.deformGeometry(geometry, definition);

    const texture = await this.loadTexture(definition);
    const material = new MeshStandardMaterial({
      color: definition.planet.surface.baseColor,
      map: texture,
      roughness: 0.78,
      metalness: 0.04,
    });

    const ring =
      definition.planet.ring.enabled && definition.planet.ring.width > 0
        ? {
            geometry: new RingGeometry(
              definition.planet.shape.radius * 1.22,
              definition.planet.shape.radius * 1.22 + definition.planet.ring.width,
              64,
            ),
            material: new MeshStandardMaterial({
              color: definition.planet.ring.color,
              roughness: 0.7,
              side: 2,
              transparent: true,
              opacity: 0.82,
            }),
          }
        : undefined;

    return new Planet(definition, geometry, material, ring);
  }

  private deformGeometry(
    geometry: IcosahedronGeometry,
    definition: PlanetDefinition,
  ): void {
    const { radius, roughness, frequency } = definition.planet.shape;
    const position = geometry.getAttribute('position');

    for (let index = 0; index < position.count; index += 1) {
      const x = position.getX(index);
      const y = position.getY(index);
      const z = position.getZ(index);
      const length = Math.hypot(x, y, z);
      const normalX = x / length;
      const normalY = y / length;
      const normalZ = z / length;
      const noise = sampleSeededNoise(
        normalX * frequency,
        normalY * frequency,
        normalZ * frequency,
        definition.planet.seed,
      );
      const displacedRadius = radius * (1 + (noise * 2 - 1) * roughness);

      position.setXYZ(
        index,
        normalX * displacedRadius,
        normalY * displacedRadius,
        normalZ * displacedRadius,
      );
    }

    position.needsUpdate = true;
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
  }

  private async loadTexture(definition: PlanetDefinition): Promise<Texture | null> {
    const texturePath = definition.planet.surface.texture;

    if (texturePath === null) {
      return null;
    }

    try {
      const texture = await this.textureLoader.loadAsync(texturePath);
      texture.colorSpace = SRGBColorSpace;
      return texture;
    } catch (error) {
      console.warn(
        `Failed to load texture for project "${definition.id}". Using its base color.`,
        error,
      );
      return null;
    }
  }
}

import {
  BufferAttribute,
  Color,
  IcosahedronGeometry,
  MeshStandardMaterial,
  RingGeometry,
} from 'three';
import { Planet } from '../solar-system/Planet';
import type { PlanetDefinition } from './PlanetDefinition';
import { sampleSeededNoise } from './generators/seededNoise';
import { sampleSurfacePattern } from './generators/surfacePattern';

export class PlanetBuilder {
  async build(definition: PlanetDefinition): Promise<Planet> {
    const geometry = new IcosahedronGeometry(definition.planet.shape.radius, 3);
    this.deformGeometry(geometry, definition);
    this.applyProceduralColors(geometry, definition);

    const material = new MeshStandardMaterial({
      color: '#ffffff',
      vertexColors: true,
      emissive: definition.planet.surface.baseColor,
      emissiveIntensity: 0.055,
      roughness: 0.72,
      metalness: 0.06,
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
              emissive: definition.planet.ring.color,
              emissiveIntensity: 0.06,
              roughness: 0.7,
              side: 2,
              transparent: true,
              opacity: 0.68,
              depthWrite: false,
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

  private applyProceduralColors(
    geometry: IcosahedronGeometry,
    definition: PlanetDefinition,
  ): void {
    const position = geometry.getAttribute('position');
    const colors = new Float32Array(position.count * 3);
    const baseColor = new Color(definition.planet.surface.baseColor);
    const color = new Color();

    for (let index = 0; index < position.count; index += 1) {
      const x = position.getX(index);
      const y = position.getY(index);
      const z = position.getZ(index);
      const length = Math.hypot(x, y, z);
      const pattern = sampleSurfacePattern(
        x / length,
        y / length,
        z / length,
        definition.planet.seed,
      );
      color.copy(baseColor).offsetHSL(pattern * 0.035, pattern * 0.12, pattern * 0.21);
      color.toArray(colors, index * 3);
    }

    geometry.setAttribute('color', new BufferAttribute(colors, 3));
  }
}

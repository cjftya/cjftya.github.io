import { Color, MeshStandardMaterial, Vector4 } from 'three';
import { createTerrainDetail } from './terrainDetail';
import {
  surfaceColor,
  surfaceDebug,
  surfaceRoughness,
  surfaceUniforms,
  surfaceVaryings,
} from './terrainSurfaceShader';

export const TERRAIN_SURFACE_CONFIG = {
  // The current world has slope 0–0.212 (1 - normal.y), not 0–1.
  dirtStart: 0.025,
  dirtEnd: 0.12,
  rockStart: 0.09,
  rockEnd: 0.205,
  textureScale: 1,
  macroStrength: 1,
} as const;

export function createTerrainSurface(maxHeight: number) {
  const detail = createTerrainDetail();
  const config = TERRAIN_SURFACE_CONFIG;
  const uniforms = {
    terrainDetail: { value: detail },
    terrainGrass: { value: new Color('#729578') },
    terrainDirt: { value: new Color('#918773') },
    terrainRock: { value: new Color('#898b85') },
    terrainSlopes: {
      value: new Vector4(
        config.dirtStart,
        config.dirtEnd,
        config.rockStart,
        config.rockEnd,
      ),
    },
    terrainHeight: { value: maxHeight },
    terrainScale: { value: Number(config.textureScale) },
    terrainMacro: { value: Number(config.macroStrength) },
    terrainDebug: { value: 0 },
  };
  const material = new MeshStandardMaterial({
    vertexColors: true,
    roughness: 1,
    flatShading: false,
  });
  material.name = 'OasisTerrainSurfaceV2';
  material.customProgramCacheKey = () => 'oasis-terrain-surface-v2';
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${surfaceVaryings}`)
      .replace(
        '#include <project_vertex>',
        `#include <project_vertex>
        vTerrainWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;
        vTerrainNormal = inverseTransformDirection(transformedNormal, viewMatrix);`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>\n${surfaceVaryings}\n${surfaceUniforms}`,
      )
      .replace('#include <color_fragment>', surfaceColor)
      .replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>\n${surfaceRoughness}`,
      )
      .replace(
        '#include <tonemapping_fragment>',
        `#include <tonemapping_fragment>\n${surfaceDebug}`,
      );
  };
  // Material disposal owns its one texture, including pagehide / context lifecycle.
  material.addEventListener('dispose', () => detail.dispose());
  return { material, uniforms };
}

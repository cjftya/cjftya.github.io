import * as THREE from 'three';
import type { ObservationLayerId } from '../../observation/types';
import type { ExperienceQuality } from '../quality/quality';
import type { ObservationModel } from '../models/types';

interface MaterialProfile {
  readonly roughness: number;
  readonly clearcoat: number;
  readonly emissiveIntensity: number;
  readonly transmission: number;
}

const MATERIAL_PROFILES: Partial<Record<ObservationLayerId, MaterialProfile>> = {
  envelope: {
    roughness: 0.34,
    clearcoat: 0.2,
    emissiveIntensity: 0.11,
    transmission: 0.06,
  },
  membrane: {
    roughness: 0.37,
    clearcoat: 0.16,
    emissiveIntensity: 0.1,
    transmission: 0.04,
  },
  'inner-membrane': {
    roughness: 0.38,
    clearcoat: 0.14,
    emissiveIntensity: 0.1,
    transmission: 0.05,
  },
  'surface-protein': {
    roughness: 0.43,
    clearcoat: 0.09,
    emissiveIntensity: 0.13,
    transmission: 0,
  },
  capsid: {
    roughness: 0.54,
    clearcoat: 0.06,
    emissiveIntensity: 0.12,
    transmission: 0,
  },
  'outer-capsid': {
    roughness: 0.5,
    clearcoat: 0.07,
    emissiveIntensity: 0.12,
    transmission: 0,
  },
  'middle-capsid': {
    roughness: 0.58,
    clearcoat: 0.04,
    emissiveIntensity: 0.1,
    transmission: 0,
  },
  'core-capsid': {
    roughness: 0.62,
    clearcoat: 0.03,
    emissiveIntensity: 0.1,
    transmission: 0,
  },
  genome: { roughness: 0.72, clearcoat: 0.02, emissiveIntensity: 0.2, transmission: 0 },
  tegument: {
    roughness: 0.7,
    clearcoat: 0.02,
    emissiveIntensity: 0.08,
    transmission: 0,
  },
  matrix: {
    roughness: 0.66,
    clearcoat: 0.02,
    emissiveIntensity: 0.09,
    transmission: 0,
  },
  nucleocapsid: {
    roughness: 0.59,
    clearcoat: 0.03,
    emissiveIntensity: 0.14,
    transmission: 0,
  },
  tail: { roughness: 0.57, clearcoat: 0.04, emissiveIntensity: 0.1, transmission: 0 },
  'core-wall': {
    roughness: 0.61,
    clearcoat: 0.03,
    emissiveIntensity: 0.09,
    transmission: 0,
  },
  'lateral-body': {
    roughness: 0.64,
    clearcoat: 0.02,
    emissiveIntensity: 0.08,
    transmission: 0,
  },
};

export function applyScientificMaterials(
  model: ObservationModel,
  virusId: string,
  quality: ExperienceQuality,
): void {
  const materialLayers = new Map<THREE.Material, ObservationLayerId>();
  for (const [layer, objects] of model.layers) {
    for (const object of objects) {
      object.traverse((child) => {
        if (!('material' in child)) return;
        const material = (child as THREE.Mesh).material;
        const materials = Array.isArray(material) ? material : [material];
        for (const entry of materials)
          if (!materialLayers.has(entry)) materialLayers.set(entry, layer);
      });
    }
  }
  const variation = colorVariation(virusId);
  for (const [material, layer] of materialLayers) {
    const profile = MATERIAL_PROFILES[layer] ?? MATERIAL_PROFILES.capsid!;
    material.userData.virusMaterialRole = layer;
    material.userData.v3ScientificMaterial = true;
    if (material instanceof THREE.MeshStandardMaterial) {
      material.roughness = THREE.MathUtils.clamp(
        profile.roughness + (quality === 'performance' ? 0.08 : variation * 0.035),
        0.24,
        0.86,
      );
      material.metalness = Math.min(material.metalness, 0.035);
      material.emissiveIntensity = profile.emissiveIntensity;
      const hsl = { h: 0, s: 0, l: 0 };
      material.color.getHSL(hsl);
      material.color.setHSL(
        (hsl.h + variation * 0.012 + 1) % 1,
        THREE.MathUtils.clamp(hsl.s * 0.94, 0.22, 0.86),
        THREE.MathUtils.clamp(
          hsl.l * (quality === 'enhanced' ? 1.02 : 0.98),
          0.12,
          0.78,
        ),
      );
    }
    if (material instanceof THREE.MeshPhysicalMaterial) {
      material.clearcoat =
        quality === 'performance' ? profile.clearcoat * 0.35 : profile.clearcoat;
      material.clearcoatRoughness = 0.68;
      material.transmission =
        quality === 'enhanced' ? profile.transmission : profile.transmission * 0.45;
      material.thickness = profile.transmission > 0 ? 0.18 : 0;
      material.ior = 1.38;
    }
    material.needsUpdate = true;
  }
}

function colorVariation(value: string): number {
  let hash = 0;
  for (const character of value)
    hash = Math.imul(hash ^ character.charCodeAt(0), 16_777_619);
  return ((hash >>> 0) / 0xffff_ffff) * 2 - 1;
}

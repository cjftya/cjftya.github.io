import { describe, expect, it, vi } from 'vitest';
import { Group, Mesh, Points } from 'three';
import { createFantasySanctuary } from '../src/jelly-oasis/landmark/createFantasySanctuary';
import { polygonDistance } from '../src/jelly-oasis/terrain/excavateTerrain';
import { createEnchantedUnderstory } from '../src/jelly-oasis/landmark/createEnchantedUnderstory';
import { VegetationWind } from '../src/jelly-oasis/animation/vegetationWind';
import type {
  BufferGeometry,
  MeshStandardMaterial,
  ShaderMaterial,
  WebGLRenderer,
} from 'three';
const pond = {
  positions: [
    [-9, 0, 0],
    [9, 0, 0],
    [9, 0, 16],
    [-9, 0, 16],
  ],
  indices: [
    [0, 1, 2],
    [0, 2, 3],
  ],
};
const ground = (x: number, z: number) => Math.sin(x * 0.03) + Math.cos(z * 0.02);
describe('fantasy sanctuary lifecycle and animation', () => {
  it('rebuilds on sampled terrain without accumulating geometry or transforms', () => {
    const content = new Group();
    const effect = createFantasySanctuary(content, pond);
    effect.place(ground, 0);
    const first = effect.snapshot(),
      childCount = effect.group.children.length;
    const geometry = (effect.group.getObjectByName('CrystalColonies_0') as Mesh)
      .geometry;
    geometry.computeBoundingBox();
    expect(geometry.attributes.position!.count).toBeGreaterThan(100);
    expect(geometry.boundingBox!.max.y).toBeGreaterThan(7.5);
    const dispose = vi.spyOn(geometry, 'dispose');
    effect.place((x, z) => ground(x, z) + 3, 3);
    expect(dispose).toHaveBeenCalledOnce();
    effect
      .snapshot()
      .colonies.forEach((c, i) => expect(c.y).toBeCloseTo(first.colonies[i]!.y + 3));
    effect.place(ground, 0);
    expect(effect.snapshot().colonies).toEqual(first.colonies);
    expect(effect.group.children).toHaveLength(childCount);
    effect.group.traverse((o) => {
      if (o instanceof Mesh || o instanceof Points)
        expect(
          Array.from(o.geometry.getAttribute('position').array).every(Number.isFinite),
        ).toBe(true);
    });
    effect.dispose();
    effect.dispose();
    expect(content.children).toHaveLength(0);
  });
  it('keeps reduced-motion frames static but responds to time-of-day changes', () => {
    const effect = createFantasySanctuary(new Group(), pond);
    effect.place(ground, 0);
    expect(effect.update(0.1, 12, true, 800)).toBe(true);
    expect(effect.update(0.1, 12, true, 800)).toBe(false);
    expect(effect.snapshot().elapsed).toBe(0);
    expect(effect.night).toBe(0);
    expect(effect.update(0.1, 0, true, 800)).toBe(true);
    expect(effect.night).toBe(1);
    effect.update(0.1, 0, false, 800);
    expect(effect.snapshot().elapsed).toBeCloseTo(0.1);
    effect.dispose();
    expect(effect.update(0.1, 0, false, 800)).toBe(false);
  });
  it('reduces mobile particles while retaining all landmark crystals', () => {
    const desktop = createFantasySanctuary(new Group(), pond);
    const mobile = createFantasySanctuary(new Group(), pond, true);
    desktop.place(ground, 0);
    mobile.place(ground, 0);
    expect(mobile.snapshot().shards).toBe(desktop.snapshot().shards);
    expect(mobile.snapshot().particles).toBe(desktop.snapshot().particles / 2);
    expect(mobile.snapshot().understory.anchors).toEqual(
      desktop.snapshot().understory.anchors,
    );
    expect(desktop.snapshot().understory.anchors.length).toBeGreaterThan(100);
    for (const anchor of desktop.snapshot().understory.anchors) {
      expect(polygonDistance(anchor.x, anchor.z, pond.positions)).toBeLessThan(-1.15);
      expect(anchor.y).toBeCloseTo(ground(anchor.x, anchor.z));
    }
    desktop.dispose();
    mobile.dispose();
  });
  it('keeps the approach clear and updates glow after wind clones plant materials', () => {
    const approach = {
      positions: [
        [-14, 0, 18],
        [-6, 0, 18],
        [-14, 0, 29],
        [-6, 0, 29],
      ],
      indices: [],
    };
    const effect = createEnchantedUnderstory(pond, approach);
    effect.place(ground);
    for (const anchor of effect.snapshot().anchors)
      if (anchor.z >= 18 && anchor.z <= 29)
        expect(Math.abs(anchor.x + 10)).toBeGreaterThanOrEqual(3.8);
    const wind = new VegetationWind();
    wind.bind(effect.group);
    const flowers = effect.group.getObjectByName('EnchantedFlowers') as Mesh;
    const material = flowers.material as MeshStandardMaterial;
    const shader = {
      uniforms: {},
      vertexShader: '#include <begin_vertex>\n#include <project_vertex>',
      fragmentShader: '#include <emissivemap_fragment>',
    } as Parameters<MeshStandardMaterial['onBeforeCompile']>[0];
    material.onBeforeCompile(shader, {} as WebGLRenderer);
    effect.update(1);
    expect(shader.uniforms.enchantedNight!.value).toBe(1);
    expect(shader.vertexShader).toContain('oasisDeform(transformed)');
    effect.update(0);
    expect(shader.uniforms.enchantedNight!.value).toBe(0);
    const pool = effect.group.getObjectByName('UnderstoryColourBounce') as Mesh<
      BufferGeometry,
      ShaderMaterial
    >;
    expect(pool.material.uniforms.fogColor).toBeDefined();
    wind.dispose();
    const dispose = vi.spyOn(flowers.geometry, 'dispose');
    effect.dispose();
    effect.dispose();
    expect(dispose).toHaveBeenCalledOnce();
  });
});

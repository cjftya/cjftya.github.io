import { readFileSync } from 'node:fs';
import {
  BufferGeometry,
  MeshStandardMaterial,
  PerspectiveCamera,
  Vector3,
} from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MeteorField } from '../src/core/scene/MeteorField';
import { createNebulaTexture, NebulaBackdrop } from '../src/core/scene/NebulaBackdrop';
import type { ProjectCollection } from '../src/data/Project';
import { Planet } from '../src/solar-system/Planet';

function motionPreferences(reduced = false, coarse = false): void {
  vi.stubGlobal('window', {
    matchMedia: (query: string) => ({
      matches: query.includes('reduced-motion') ? reduced : coarse,
    }),
  });
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('lightweight space atmosphere', () => {
  it('keeps the static nebula deterministic, small and faint with dark gaps', () => {
    const first = createNebulaTexture();
    const second = createNebulaTexture();
    const pixels = first.image.data as Uint8Array;
    expect(pixels).toEqual(second.image.data);
    expect(pixels.byteLength).toBe(512 * 256 * 4);
    let dark = 0;
    let clouds = 0;
    let maxAlpha = 0;
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i]! <= 4) dark += 1;
      if (pixels[i]! > 12) clouds += 1;
      maxAlpha = Math.max(maxAlpha, pixels[i]!);
    }
    expect(dark / (512 * 256)).toBeGreaterThan(0.4);
    expect(clouds).toBeGreaterThan(1000);
    expect(maxAlpha).toBeLessThanOrEqual(82);
    // First/last columns sample adjacent directions, without a wrap discontinuity.
    for (let row = 0; row < 256; row += 1) {
      const a = row * 512 * 4;
      const b = (row * 512 + 511) * 4;
      for (let channel = 0; channel < 4; channel += 1) {
        expect(Math.abs(pixels[a + channel]! - pixels[b + channel]!)).toBeLessThan(8);
      }
    }
    first.dispose();
    second.dispose();
  });

  it('disposes the added geometry, material and texture', () => {
    const nebula = new NebulaBackdrop();
    const geometry = vi.spyOn(nebula.object.geometry, 'dispose');
    const material = vi.spyOn(nebula.object.material, 'dispose');
    const texture = vi.spyOn(nebula.object.material.map!, 'dispose');
    nebula.dispose();
    expect(geometry).toHaveBeenCalledOnce();
    expect(material).toHaveBeenCalledOnce();
    expect(texture).toHaveBeenCalledOnce();
  });

  it.each([0.46, 1, 2.1])(
    'spawns visible trails at aspect %s after camera movement',
    (aspect) => {
      motionPreferences();
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const camera = new PerspectiveCamera(48, aspect, 0.1, 180);
      camera.position.set(30, 12, -20);
      camera.lookAt(-5, 3, 7);
      camera.updateMatrixWorld(true);
      const meteors = new MeteorField();
      meteors.update(13, camera);
      meteors.update(0.4, camera);
      meteors.object.updateMatrixWorld(true);
      const position = meteors.object.geometry.getAttribute('position');
      const projected = new Vector3().fromBufferAttribute(position, 0);
      meteors.object.localToWorld(projected).project(camera);
      expect(Math.abs(projected.x)).toBeLessThan(1);
      expect(Math.abs(projected.y)).toBeLessThan(1);
      expect(projected.z).toBeGreaterThan(-1);
      expect(projected.z).toBeLessThan(1);
      expect(meteors.object.material.opacity).toBeGreaterThan(0);
      expect(meteors.object.geometry.drawRange.count).toBe(12);
      meteors.update(0.5, camera);
      expect(meteors.object.geometry.drawRange.count).toBe(0);
      // The larger event uses the same buffer and one trail, then retires.
      meteors.update(60, camera);
      meteors.update(1, camera);
      expect(meteors.object.material.opacity).toBeGreaterThan(0);
      expect(meteors.object.geometry.drawRange.count).toBe(12);
      meteors.update(0.6, camera);
      expect(meteors.object.geometry.drawRange.count).toBe(0);
      meteors.dispose();
    },
  );

  it('keeps trails disabled with reduced motion', () => {
    motionPreferences(true);
    const meteors = new MeteorField();
    meteors.update(120, new PerspectiveCamera());
    expect(meteors.object.geometry.drawRange.count).toBe(0);
    meteors.dispose();
  });

  it('gives authored planets stable, varied axes without tumbling during spin', () => {
    const collection = JSON.parse(
      readFileSync(new URL('../public/data/projects.json', import.meta.url), 'utf8'),
    ) as ProjectCollection;
    const axes: Vector3[] = [];
    for (const definition of collection.projects) {
      const planet = new Planet(
        definition,
        new BufferGeometry(),
        new MeshStandardMaterial(),
      );
      const twin = new Planet(
        definition,
        new BufferGeometry(),
        new MeshStandardMaterial(),
      );
      const tilt = planet.selectableMesh.parent!.parent!;
      expect(tilt.quaternion.toArray()).toEqual(
        twin.selectableMesh.parent!.parent!.quaternion.toArray(),
      );
      const before = tilt.quaternion.clone();
      const axis = new Vector3(0, 1, 0).applyQuaternion(before);
      axes.push(axis);
      const initialPosition = planet.bodyAnchor.position.clone();
      planet.update(0.5);
      expect(tilt.quaternion.toArray()).toEqual(before.toArray());
      expect(planet.bodyAnchor.position.toArray()).toEqual(initialPosition.toArray());
      const spin = planet.selectableMesh.parent!.rotation.y;
      expect(Math.sign(spin)).toBe(
        definition.planet.rotation.direction === 'clockwise' ? -1 : 1,
      );
      planet.dispose();
      twin.dispose();
    }
    expect(axes.some((axis) => Math.abs(axis.z) > 0.15)).toBe(true);
    expect(axes.some((axis) => Math.abs(axis.y) < 0.6)).toBe(true);
  });
});

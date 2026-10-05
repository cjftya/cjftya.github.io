import { MeshStandardMaterial } from 'three';
import type { Mesh, PlaneGeometry } from 'three';
import type { createTerrainSurface } from './terrainSurface';

/** Attached only to the existing opt-in environment inspector. */
export function createSurfaceDebug(
  terrain: Mesh<PlaneGeometry, MeshStandardMaterial>,
  surface: ReturnType<typeof createTerrainSurface>,
  invalidate: () => void,
) {
  const root = document.createElement('div');
  root.innerHTML = `<label><input id="terrain-surface" type="checkbox" checked> 부드러운 지표면</label>
    <label>표면 보기 <select id="terrain-surface-view" aria-label="표면 보기">
    <option value="0">완성 재질</option><option value="1">잔디 / 흙 / 암석 (RGB)</option>
    <option value="2">잔디 비중</option><option value="3">흙 비중</option><option value="4">암석 비중</option>
    <option value="5">경사</option><option value="6">넓은 색 변화</option></select></label>
    <label>질감 크기 <input id="terrain-scale" aria-label="질감 크기" type="range" min="0.5" max="2" step="0.1" value="1"></label>
    <label>넓은 색 변화 <input id="terrain-macro" aria-label="넓은 색 변화" type="range" min="0" max="1.5" step="0.1" value="1"></label>`;
  document.querySelector('#environment-debug')!.append(root);
  const legacy = new MeshStandardMaterial({
    vertexColors: true,
    roughness: 1,
    flatShading: true,
  });
  legacy.name = 'OasisTerrainLegacyComparison';
  const events = new AbortController();
  root.addEventListener(
    'input',
    () => {
      const enabled = root.querySelector<HTMLInputElement>('#terrain-surface')!.checked;
      const next = enabled ? surface.material : legacy;
      next.wireframe = terrain.material.wireframe;
      terrain.material = next;
      surface.uniforms.terrainDebug.value = Number(
        root.querySelector<HTMLSelectElement>('#terrain-surface-view')!.value,
      );
      surface.uniforms.terrainScale.value = Number(
        root.querySelector<HTMLInputElement>('#terrain-scale')!.value,
      );
      surface.uniforms.terrainMacro.value = Number(
        root.querySelector<HTMLInputElement>('#terrain-macro')!.value,
      );
      invalidate();
    },
    { signal: events.signal },
  );
  return {
    dispose() {
      events.abort();
      legacy.dispose();
      root.remove();
    },
  };
}

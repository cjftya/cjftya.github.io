import {
  DynamicDrawUsage,
  IcosahedronGeometry,
  InstancedMesh,
  MeshStandardMaterial,
  Object3D,
} from 'three';
import { ENVIRONMENT_CONFIG, seededRandom } from './weather';

export function createClouds() {
  const { cloudClusters: clusters, puffsPerCluster: puffs } = ENVIRONMENT_CONFIG;
  const count = clusters * puffs;
  const geometry = new IcosahedronGeometry(1, 1);
  const material = new MeshStandardMaterial({
    color: '#fff2db',
    roughness: 1,
    flatShading: true,
  });
  const mesh = new InstancedMesh(geometry, material, count);
  mesh.name = 'OasisClouds';
  mesh.instanceMatrix.setUsage(DynamicDrawUsage);
  mesh.frustumCulled = false;
  const random = seededRandom(7136);
  const data = new Float32Array(count * 6);
  const origins = new Float32Array(clusters * 3);
  for (let cluster = 0; cluster < clusters; cluster++) {
    origins[cluster * 3] = random() * 620 - 310;
    origins[cluster * 3 + 1] = 90 + random() * 45;
    // Most clouds frame the meadow instead of covering its center.
    origins[cluster * 3 + 2] = (cluster % 2 ? 1 : -1) * (140 + random() * 140);
    for (let puff = 0; puff < puffs; puff++) {
      const i = (cluster * puffs + puff) * 6;
      data.set(
        [
          (puff - 2) * 12,
          random() * 7,
          random() * 14 - 7,
          12 + random() * 9,
          5 + random() * 5,
          9 + random() * 6,
        ],
        i,
      );
    }
  }
  const transform = new Object3D();
  function update(seconds: number, coverage: number, darkness: number): void {
    for (let cluster = 0; cluster < clusters; cluster++) {
      // Grow/shrink complete clusters smoothly instead of popping the instance count.
      const scale = Math.min(1, Math.max(0, coverage * clusters - cluster));
      const smoothed = scale * scale * (3 - 2 * scale);
      let x = ((origins[cluster * 3]! + seconds * 1.7 + 360) % 720) - 360;
      if (x < -360) x += 720;
      // Fade at the wrap boundary so recycled clusters cannot jump visibly.
      const edgeFade = Math.min(1, (360 - Math.abs(x)) / 65);
      for (let puff = 0; puff < puffs; puff++) {
        const index = cluster * puffs + puff;
        const i = index * 6;
        transform.position.set(
          x + data[i]!,
          origins[cluster * 3 + 1]! + data[i + 1]! - darkness * 18,
          origins[cluster * 3 + 2]! + data[i + 2]!,
        );
        transform.scale
          .set(data[i + 3]!, data[i + 4]!, data[i + 5]!)
          .multiplyScalar(Math.max(0.0001, smoothed * edgeFade));
        transform.updateMatrix();
        mesh.setMatrixAt(index, transform.matrix);
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
  }
  update(0, 0.22, 0);
  return {
    mesh,
    count,
    update,
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}

import {
  BufferGeometry, DodecahedronGeometry, DoubleSide, Float32BufferAttribute,
  Group, Mesh, MeshStandardMaterial,
} from 'three';

export function createPassingBirds() {
  const group = new Group();
  group.name = 'PassingBirds';
  group.visible = false;
  const feather = new MeshStandardMaterial({ color: '#69647b', flatShading: true, side: DoubleSide });
  const wing = new BufferGeometry();
  wing.setAttribute('position', new Float32BufferAttribute([
    0,0,0.42, 1.12,0.17,0.17, 0,0,-0.44,
    1.12,0.17,0.17, 1.97,0.07,-0.58, 0,0,-0.44,
  ], 3));
  wing.computeVertexNormals();
  const body = new DodecahedronGeometry(1);
  const flock = Array.from({ length: 4 }, (_, i) => {
    const bird = new Group();
    const torso = new Mesh(body, feather);
    torso.scale.set(0.22, 0.19, 0.78);
    const left = new Mesh(wing, feather);
    const right = new Mesh(wing, feather);
    left.scale.x = -1;
    bird.add(torso, left, right);
    bird.position.set((i % 2 ? 1 : -1) * i * 1.3, Math.sin(i) * 0.7, -i * 3.1);
    bird.scale.setScalar(1 - i * 0.045);
    group.add(bird);
    return { left, right };
  });
  let water = 0;
  return {
    group,
    place(waterHeight: number) { water = waterHeight; },
    update(time: number, reducedMotion: boolean) {
      const clock = time + 53;
      const pass = Math.floor(clock / 58);
      const t = (clock % 58) / 13;
      group.visible = !reducedMotion && t < 1;
      if (!group.visible) return;
      const direction = pass % 2 ? 1 : -1;
      group.rotation.y = direction * Math.PI / 2;
      group.position.set(direction * (t * 128 - 64),
        water + 19 + 3 * Math.sin(t * Math.PI) + 2 * Math.sin(pass),
        8 + 5 * Math.sin(t * Math.PI + pass));
      group.scale.setScalar(Math.min(1, t * 14, (1 - t) * 14));
      flock.forEach(({ left, right }, i) => {
        const stroke = Math.max(0, Math.sin(time * 1.3 + i)) *
          Math.sin(time * (9 + i * 0.35) + i);
        left.rotation.z = -(0.13 + 0.47 * stroke);
        right.rotation.z = -left.rotation.z;
      });
    },
    dispose() { wing.dispose(); body.dispose(); feather.dispose(); },
  };
}

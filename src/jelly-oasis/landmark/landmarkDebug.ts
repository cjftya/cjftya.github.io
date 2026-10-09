import {
  Box3,
  Box3Helper,
  BufferGeometry,
  Color,
  DoubleSide,
  Group,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  Vector3,
} from 'three';
import type { OvergrownRuin } from './createOvergrownRuin';
import { guideGeometry } from './createOvergrownRuin';
import { LANDMARK_CANDIDATES, LANDMARK_FIRST_IMPORTS } from './landmarkConfig';
import type { LandmarkCamera } from './landmarkConfig';
import { landmarkWorldPoint, sampleGround, surveySite } from './landmarkPlacement';
import { disposeLandmarkResources } from './loadLandmarkAssets';
import { auditLandmark } from './landmarkAudit';

export function createLandmarkDebug(
  landmark: OvergrownRuin,
  invalidate: () => void,
  setCamera: (view: LandmarkCamera) => void,
) {
  const panel = document.createElement('details');
  panel.id = 'landmark-debug';
  panel.open = true;
  if (matchMedia('(max-width: 720px)').matches) panel.open = false;
  panel.innerHTML = `<summary>랜드마크 통합 검수</summary>
    <label>후보 지역 <select id="landmark-site">${LANDMARK_CANDIDATES.map((c) => `<option value="${c.id}">${c.label}</option>`).join('')}</select></label>
    <label>방향 <input id="landmark-yaw" type="range" min="-180" max="180" step="5" value="${Math.round((landmark.placement.rotationY * 180) / Math.PI)}"><output id="landmark-transform"></output></label>
    <div class="debug-row"><label>X <input id="landmark-x" type="number" min="-110" max="110" value="${landmark.placement.position.x}"></label><label>Z <input id="landmark-z" type="number" min="-110" max="110" value="${landmark.placement.position.z}"></label></div>
    <label>개별 자산 <select id="landmark-isolate"><option value="">전체 blockout</option>${LANDMARK_FIRST_IMPORTS.map((n) => `<option>${n}</option>`).join('')}</select></label>
    <div class="debug-row"><button data-view="overview">Overview</button><button data-view="medium">Medium</button><button data-view="ground">Ground</button></div>
    <label><input id="landmark-visible" type="checkbox" checked> 랜드마크</label>
    <label><input id="landmark-reference" type="checkbox"> 원본 전체 배치 (청록 wireframe)</label>
    <label><input id="landmark-route" type="checkbox"> 순환로 / 16 m 공터 / 아치 접근</label>
    <label><input id="landmark-pond" type="checkbox"> 연못 제외 / 폭포 방향</label>
    <label><input id="landmark-bounds" type="checkbox"> 범위 / 후보 / 나무·암벽 위치</label>
    <button id="landmark-audit" type="button">동선 접지 검사</button>
    <output id="landmark-stats"></output><output id="landmark-audit-result"></output>`;
  document.querySelector('.oasis-shell')!.append(panel);
  const events = new AbortController();
  const environmentPanel =
    document.querySelector<HTMLDetailsElement>('#environment-debug')!;
  panel.addEventListener(
    'toggle',
    () => {
      if (panel.open && matchMedia('(max-width: 720px)').matches)
        environmentPanel.open = false;
    },
    { signal: events.signal },
  );
  environmentPanel.addEventListener(
    'toggle',
    () => {
      if (environmentPanel.open && matchMedia('(max-width: 720px)').matches)
        panel.open = false;
    },
    { signal: events.signal },
  );
  const guides = new Group(),
    route = new Group(),
    pond = new Group(),
    bounds = new Group();
  guides.name = 'LandmarkDebugGuides';
  guides.add(route, pond, bounds);
  landmark.root.add(guides);
  route.visible = pond.visible = bounds.visible = false;
  const candidateGuides = new Group();
  candidateGuides.name = 'CandidateFootprints';
  landmark.root.parent!.add(candidateGuides);
  candidateGuides.visible = false;
  const geometries: BufferGeometry[] = [];
  const lineMaterial = new LineBasicMaterial({
    color: '#fff3ae',
    depthTest: false,
    transparent: true,
    opacity: 0.75,
  });
  for (const candidate of LANDMARK_CANDIDATES) {
    const points: Vector3[] = [];
    const corners = [
      [-40, -38],
      [40, -38],
      [40, 38],
      [-40, 38],
      [-40, -38],
    ];
    for (let i = 0; i < 4; i++)
      for (let step = 0; step < 40; step++) {
        const a = corners[i]!,
          b = corners[i + 1]!,
          t = step / 40;
        const p = landmarkWorldPoint(
          a[0]! + (b[0]! - a[0]!) * t,
          a[1]! + (b[1]! - a[1]!) * t,
          candidate,
        );
        points.push(
          new Vector3(p.x, sampleGround(p.x, p.z, landmark.terrain) + 0.15, p.z),
        );
      }
    points.push(points[0]!.clone());
    const geometry = new BufferGeometry().setFromPoints(points);
    geometries.push(geometry);
    candidateGuides.add(new Line(geometry, lineMaterial));
  }
  const projected: { mesh: Mesh; source: number[][] }[] = [];
  for (const [name, guide] of Object.entries(landmark.assets.layout.guides)) {
    const isRoute = name.startsWith('Creature');
    const mesh = new Mesh(
      guideGeometry(guide),
      new MeshBasicMaterial({
        color: name.includes('Clearing') ? '#ffda73' : isRoute ? '#85ffa7' : '#61dfff',
        side: DoubleSide,
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
        depthTest: false,
      }),
    );
    mesh.name = name;
    mesh.renderOrder = 5;
    (isRoute ? route : pond).add(mesh);
    projected.push({ mesh, source: guide.positions });
  }
  const box = new Box3Helper(new Box3(), new Color('#ffdf8b'));
  bounds.add(box);
  // Small crosses identify the selected site, primary tree and cliff anchors.
  for (const [x, z] of [
    [0, 0],
    [-12, -18],
    [0.015, -12.587],
  ]) {
    const points = [
      new Vector3(x! - 2, 0, z),
      new Vector3(x! + 2, 0, z),
      new Vector3(x, 0, z),
      new Vector3(x, 0, z! - 2),
      new Vector3(x, 0, z! + 2),
    ];
    const geometry = new BufferGeometry().setFromPoints(points);
    geometries.push(geometry);
    const marker = new Line(geometry, lineMaterial);
    bounds.add(marker);
  }
  const query = <T extends HTMLElement>(id: string) =>
    panel.querySelector<T>(`#${id}`)!;
  function refresh() {
    for (const { mesh, source } of projected) {
      const positions = mesh.geometry.attributes.position!;
      for (let i = 0; i < source.length; i++) {
        const p = source[i]!;
        positions.setY(
          i,
          landmark.localGround(p[0]!, p[2]!) +
            (mesh.name.startsWith('Waterfall') ? p[1]! : 0.16),
        );
      }
      positions.needsUpdate = true;
      mesh.geometry.computeBoundingSphere();
    }
    box.box.set(new Vector3(-40, -1, -38), new Vector3(40, 30, 38));
    for (const marker of bounds.children)
      if (marker instanceof Line && marker !== box) {
        const positions = marker.geometry.attributes.position!;
        for (let i = 0; i < positions.count; i++)
          positions.setY(
            i,
            landmark.localGround(positions.getX(i), positions.getZ(i)) + 0.3,
          );
        positions.needsUpdate = true;
        marker.geometry.computeBoundingSphere();
      }
    const { position, rotationY } = landmark.placement;
    query<HTMLOutputElement>('landmark-transform').value =
      `(${position.x}, ${landmark.root.position.y.toFixed(2)}, ${position.z}) · ${((rotationY * 180) / Math.PI).toFixed(0)}° · 1 m/unit`;
    const survey = surveySite(landmark.placement, landmark.terrain);
    query<HTMLOutputElement>('landmark-stats').value =
      `16 modules · ${landmark.assetTriangles.toLocaleString()} asset triangles · 0 image textures\nGLB + layout load ${landmark.assets.loadMs.toFixed(0)} ms\nRelief ${survey.relief.toFixed(2)} m · pond shore ${survey.pondRelief.toFixed(2)} m\nWorld footprint ${(survey.worldAreaFraction * 100).toFixed(2)}% · meadow overlap ${(survey.meadowOverlap * 100).toFixed(1)}%`;
    query<HTMLOutputElement>('landmark-audit-result').value = '';
    invalidate();
  }
  function move() {
    const x = query<HTMLInputElement>('landmark-x').valueAsNumber,
      z = query<HTMLInputElement>('landmark-z').valueAsNumber;
    if (!Number.isFinite(x) || !Number.isFinite(z)) return;
    landmark.place({
      position: { x, z },
      rotationY:
        (query<HTMLInputElement>('landmark-yaw').valueAsNumber * Math.PI) / 180,
      scale: 1,
    });
    refresh();
  }
  panel.addEventListener(
    'input',
    (event) => {
      const target = event.target as HTMLInputElement;
      if (['landmark-x', 'landmark-z', 'landmark-yaw'].includes(target.id)) move();
    },
    { signal: events.signal },
  );
  panel.addEventListener(
    'change',
    async (event) => {
      const target = event.target as HTMLInputElement;
      switch (target.id) {
        case 'landmark-site': {
          const candidate = LANDMARK_CANDIDATES.find((c) => c.id === target.value)!;
          query<HTMLInputElement>('landmark-x').value = String(candidate.position.x);
          query<HTMLInputElement>('landmark-z').value = String(candidate.position.z);
          query<HTMLInputElement>('landmark-yaw').value = String(
            Math.round((candidate.rotationY * 180) / Math.PI),
          );
          move();
          setCamera('medium');
          break;
        }
        case 'landmark-isolate':
          landmark.isolate(target.value);
          setCamera('medium');
          break;
        case 'landmark-visible':
          landmark.root.visible = target.checked;
          break;
        case 'landmark-route':
          route.visible = target.checked;
          break;
        case 'landmark-pond':
          pond.visible = target.checked;
          break;
        case 'landmark-bounds':
          bounds.visible = candidateGuides.visible = target.checked;
          break;
        case 'landmark-reference':
          try {
            await landmark.showReference(target.checked);
          } catch (error) {
            query<HTMLOutputElement>('landmark-audit-result').value = String(error);
            target.checked = false;
          }
          break;
      }
      invalidate();
    },
    { signal: events.signal },
  );
  panel.addEventListener(
    'click',
    (event) => {
      const target = event.target as HTMLElement;
      if (target.dataset.view) setCamera(target.dataset.view as LandmarkCamera);
      if (target.id === 'landmark-audit') {
        const audit = auditLandmark(landmark);
        query<HTMLOutputElement>('landmark-audit-result').value =
          `Loop ${audit.loop.clear ? 'PASS' : 'BLOCKED'} · clearing ${audit.clearing.clear ? 'PASS' : 'BLOCKED'}\nApproach ${audit.approach.clear ? 'PASS' : 'BLOCKED'} · passage ${audit.passage.clear ? 'PASS' : 'BLOCKED'}\nJamb width ${audit.passage.measuredJambWidth.toFixed(2)} m · sampled check only`;
      }
    },
    { signal: events.signal },
  );
  refresh();
  return {
    dispose() {
      events.abort();
      panel.remove();
      guides.removeFromParent();
      candidateGuides.removeFromParent();
      disposeLandmarkResources([route, pond]);
      geometries.forEach((g) => g.dispose());
      lineMaterial.dispose();
      box.dispose();
    },
  };
}

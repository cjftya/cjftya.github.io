// Inspect binary glTF independently of Blender and write the delivery report.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const out = path.resolve('artifacts/jelly-oasis/overgrown-ruin-v1');
const manifest = JSON.parse(fs.readFileSync(path.join(out, 'asset-manifest.json'), 'utf8'));
const checks = [];
for (const file of fs.readdirSync(path.join(out, 'exports')).filter(f => f.endsWith('.glb'))) {
  const bytes = fs.readFileSync(path.join(out, 'exports', file));
  assert.equal(bytes.toString('ascii', 0, 4), 'glTF');
  assert.equal(bytes.readUInt32LE(4), 2);
  assert.equal(bytes.readUInt32LE(8), bytes.length);
  assert.equal(bytes.readUInt32LE(16), 0x4e4f534a);
  const gltf = JSON.parse(bytes.toString('utf8', 20, 20 + bytes.readUInt32LE(12)));
  assert.equal((gltf.images ?? []).length, 0);
  const combined = file.startsWith('Overgrown_');
  const name = file.slice(0, -4);
  const expected = combined ? manifest.assets.filter(a => a.export_asset) : [manifest.assets.find(a => a.name === name)];
  const meshNodes = gltf.nodes.filter(n => n.mesh !== undefined);
  assert.deepEqual(meshNodes.map(n => n.name).sort(), expected.map(a => a.name).sort());
  let triangles = 0;
  for (const node of meshNodes) {
    assert.ok((node.scale ?? [1, 1, 1]).every(s => Math.abs(s - 1) < 1e-6));
    if (!combined) assert.ok((node.translation ?? [0, 0, 0]).every(x => Math.abs(x) < 1e-6));
    const a = expected.find(a => a.name === node.name);
    const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
    let count = 0;
    for (const primitive of gltf.meshes[node.mesh].primitives) {
      assert.equal(primitive.mode ?? 4, 4);
      count += gltf.accessors[primitive.indices].count / 3;
      const pos = gltf.accessors[primitive.attributes.POSITION];
      pos.min.forEach((v, i) => { lo[i] = Math.min(lo[i], v); });
      pos.max.forEach((v, i) => { hi[i] = Math.max(hi[i], v); });
      const material = gltf.materials[primitive.material];
      assert.ok(a.materials.includes(material.name));
      assert.ok(material.pbrMetallicRoughness.baseColorFactor.length === 4);
    }
    assert.equal(count, a.triangles);
    const expectedDims = [a.dimensions_m[0], a.dimensions_m[2], a.dimensions_m[1]];
    expectedDims.forEach((d, i) => assert.ok(Math.abs(hi[i] - lo[i] - d) < 0.001, `${node.name}: axis ${i}`));
    triangles += count;
  }
  checks.push({ file, bytes: bytes.length, meshes: meshNodes.length, triangles, passed: true });
}
fs.writeFileSync(path.join(out, 'glb-validation.json'), JSON.stringify(checks, null, 2) + '\n');
const dimensions = a => a.dimensions_m.map(x => x.toFixed(2)).join(' × ');
const rows = manifest.assets.map(a => `| ${a.name} | ${dimensions(a)} | ${a.triangles.toLocaleString('en-US')} | ${a.export_asset ? '포함' : '가이드만'} |`).join('\n');
const materials = [...new Set(manifest.assets.flatMap(a => a.materials))];
const report = `# Jelly Oasis — Overgrown Oasis Ruin Blockout v1

계획서에 따라 실제 Blender MCP 씬 작업, 모듈 작성, 동선 검수와 GLB export test를 완료했다. 완성 자산이 아니라 크기·배치·재사용 기준을 정하는 blockout이다.

- Blender ${manifest.blender_version}, 씬 \`${manifest.scene}\`.
- 기존 \`Scene\`과 Cube/Camera/Light는 별도 씬에 보존했다.
- 파일: [jelly-oasis-overgrown-ruin-v1.blend](../artifacts/jelly-oasis/overgrown-ruin-v1/jelly-oasis-overgrown-ruin-v1.blend).
- 전체 배치 GLB: [Overgrown_Oasis_Ruin_Blockout_v1.glb](../artifacts/jelly-oasis/overgrown-ruin-v1/exports/Overgrown_Oasis_Ruin_Blockout_v1.glb).
- [전체 보기](../artifacts/jelly-oasis/overgrown-ruin-v1/overview.png), [동선 평면도](../artifacts/jelly-oasis/overgrown-ruin-v1/layout-guides.png), [지상 시점](../artifacts/jelly-oasis/overgrown-ruin-v1/ground-level.png).

## 크기와 구도

프레젠테이션 지면 범위는 **80 × 76m**이다. 약 28m 나무를 뒤쪽 왼편에, 17m 절벽을 중앙 뒤쪽에, 9.5m 아치를 오른쪽에 둔다. 연못 footprint는 약 24.31 × 20.22m이다. 이는 320 × 320m 월드 안에 배치할 하나의 랜드마크이며 지면 원판은 검수용이다.

## 컬렉션과 모듈

\`JellyOasis_Landmark_v1\` 아래 ${manifest.collections.map(c => '`' + c + '`').join(', ')}를 구성했다. \`BLOCKOUT/CompositionGuides\`는 기본적으로 숨겨져 있다. Outliner의 모니터 아이콘으로 켜면 녹색 순환 동선, 노란 공터, 청색 폭포 궤적을 볼 수 있다. 파란 연못 폴리곤은 수면 구현이 아닌 위치 가이드다. 검수 오브젝트는 CAM_Landmark_Overview, CAM_Ground_Level, CAM_Ruin_Close, CAM_Layout_Top, JO_Review_Sun, LandmarkBounds_80x76m이다.

| 오브젝트 | Blender 치수 X × Y × Z (m) | 삼각형 | GLB |
|---|---:|---:|---|
${rows}

전체 GLB는 독립 오브젝트 **${manifest.exported_asset_count}개, ${manifest.total_exported_triangles.toLocaleString('en-US')} triangles**다. 원판, 물 footprint, 경로/폭포 가이드, 조명과 카메라는 제외했다. 모든 export mesh scale은 (1,1,1)이다. Tree/Root의 교차하는 닫힌 부분과 cliff의 여러 닫힌 덩어리는 blockout 조립 구조이며 boolean union은 하지 않았다.

## 이동 공간 검수

- 순환로: 타원 중심선 반경 34 × 32m, 법선 방향 폭 **6m**, 외곽 범위 74 × 70m.
- 남쪽 공터: 중심 (0, -27), **직경 16m**, 약 201m².
- 동쪽 진입 가이드: 폭 6m 단면을 연결한 굽은 경로. 아치 기단 사이 최소 통과 폭은 **${manifest.movement.arch_minimum_jamb_clearance_m}m**(상부 기둥 사이 약 4.85m).
- 지상 높이 0.08–3m 사이의 모델 삼각형을 수평 투영하고 연못 footprint를 포함해 검사했다. 순환로 5,040점, 공터 3,209점, 진입로 4,212점에서 장애물 겹침이 없었다.
- 이는 샘플 기반 배치 검수다. NavMesh, 충돌 시스템, 캐릭터 반경에 따른 이동 검증은 이후 단계다.
- 순환로·공터·연못·진입로의 합집합은 0.5m 격자 추정으로 **${manifest.movement.reserved_space_union_m2}m², 전체 지면의 ${manifest.movement.reserved_space_percent}%**다. 겹친 부분은 한 번만 센다. 실제 빈 지면은 이보다 넓게 남겼다.

## 메시 및 GLB 검증

닫힌 자산에서 boundary/non-manifold edge와 loose vertex가 발견되지 않았다. PondEdge는 terrain에 맞춰 사용할 열린 ribbon이므로 양쪽 boundary가 의도적으로 존재한다. 생성 시 법선을 재계산했고, bevel은 적용한 상태다. 이미지 texture는 0개다.

9개 모듈 GLB와 전체 배치 GLB를 저장했다. 단일 모듈의 node translation은 0으로 내보내어 즉시 재사용할 수 있다. 전체 배치 GLB는 씬 내 위치를 유지한다. Blender Z-up → glTF Y-up 변환은 exporter에서 처리했으며, 좌표 대응은 (x, y, z) → (x, z, -y)다.

Cliff_Waterfall_A, Ruin_Arch_A, Rock_Large_A를 임시 Blender 씬으로 다시 불러와 치수·원점·삼각형 수·재질 슬롯 수를 비교했다. 최대 치수 오차와 원점 오차는 모두 0m였다. 추가로 10개 GLB의 바이너리 헤더, 메시 이름, 축 변환 후 치수, 단위 scale, 재질 이름/색상 필드, 삼각형 수, texture 부재를 독립 Node.js 검사로 확인했다.

Rock/Cliff 원점은 바닥 bbox 중앙, Arch는 통로 바닥 중앙, Tree는 줄기 지면 접점이다. Root_Large_A는 뿌리 시작 단면 중심이며, 씬에서는 높이 1.3m의 연결점에 배치되어 있다. 뿌리의 아래쪽 부분은 지면에 조금 묻히도록 허용했다.

검증 원자료: [asset-manifest.json](../artifacts/jelly-oasis/overgrown-ruin-v1/asset-manifest.json), [movement-audit.json](../artifacts/jelly-oasis/overgrown-ruin-v1/movement-audit.json), [glb-validation.json](../artifacts/jelly-oasis/overgrown-ruin-v1/glb-validation.json).

## 임시 재질

${materials.map(m => '- `' + m + '`').join('\n')}

모두 단색 Principled material이다. 결정에는 위치 확인용으로 약한 emissive만 적용했다. 이미지 텍스처, 수면 셰이더, 폭포 셰이더, HDRI, 볼류메트릭, 베이크 조명은 없다.

## 남은 blockout과 다음 단계

나무 잎은 blob, 뿌리는 관형 실루엣, 절벽은 큰 암석 덩어리, 연못 가장자리는 지면에 맞추기 전의 높이 가이드다. 작은 암석 및 crystal은 핵심 모듈보다 적은 삼각형을 사용했다. BrokenWall은 396 triangles로 400 목표 하한보다 약간 작고, crystal cluster는 각각 66 triangles(3개 총 198)로 위치 확인에 필요한 형태만 남겼다.

다음 상세화 우선순위는 (1) 절벽 groove와 rock 면 정리, (2) 유적 상단 파손과 석재 비대칭 강화, (3) 나무 가지·뿌리 연결 및 canopy 확정이다. 이끼·덩굴·풀·꽃·안개·수면·폭포·collision·NavMesh·AI는 이번 범위 밖이다.

Three.js에서 처음 시험할 자산은 **Rock_Large_A → Ruin_Arch_A → Cliff_Waterfall_A** 순서다. 순서대로 terrain 높이 배치, 통로 폭, 큰 구조물의 크기를 확인하기 좋다. 이후 전체 배치 GLB로 상대 위치를 검토하고 물은 기존 Three.js 환경 시스템에서 작성한다. 실제 웹 통합은 이번 단계에서 수행하지 않았다.

## 재현

Blender에서 [build_overgrown_ruin_v1.py](../scripts/blender/build_overgrown_ruin_v1.py)를 실행한 뒤 [inspect_export_overgrown_ruin_v1.py](../scripts/blender/inspect_export_overgrown_ruin_v1.py)를 실행한다. 생성 스크립트는 동일 이름의 씬이 이미 있으면 중단하여 기존 작업을 덮어쓰지 않는다. 보고서 및 독립 GLB 검사는 프로젝트 루트에서 \`node scripts/blender/report_overgrown_ruin_v1.mjs\`로 재생성한다.
`;
fs.writeFileSync(path.resolve('docs/jelly-oasis-overgrown-ruin-blockout-v1.md'), report);
console.log(JSON.stringify({ glbs: checks.length, allPassed: true, totalSceneTriangles: manifest.total_exported_triangles, report: 'docs/jelly-oasis-overgrown-ruin-blockout-v1.md' }, null, 2));

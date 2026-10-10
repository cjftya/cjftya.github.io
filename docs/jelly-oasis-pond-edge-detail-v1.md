# Jelly Oasis — Pond Edge Detail v1

검토 가능한 후보를 저장했다. 기술 검증은 통과했으며 일반 페이지는 기존 pond blockout을 사용한다. 원래 수면 guide를 보존했으므로 전체 타원형 인상은 일부 남는다. production 승인·커밋·push·배포는 하지 않았다.

## 기준과 파일

- 기준 로컬 master: e9d0176fa4b2fb1c9ade7db9a899e23487160d0f (Tree Detail이 이미 기본값인 상태). 시작 작업 트리는 깨끗했다. GitHub 443 연결 실패로 원격 최신 SHA 확인은 불가했다.
- Blender 원본: artifacts/jelly-oasis/landmark-tree-detail-v1/jelly-oasis-landmark-tree-detail-v1.blend (활성 파일과 일치, 미저장 변경 없음).
- 새 Blender: artifacts/jelly-oasis/pond-edge-detail-v1/jelly-oasis-pond-edge-detail-v1.blend.
- 후보 GLB: public/assets/jelly-oasis/landmarks/overgrown-ruin/PondEdge_Blockout_Detail_v1.glb.
- 기존 원본·layout·Tree/Cliff/Ruin/Root GLB 변경 없음. 월드 320m, 배치 (70,58), yaw 30°, scale 1 유지.

## 형상과 접지

Shore_Base 192 triangles, Bank_Upper 4개 320 triangles, Rocks_A 9개 720 triangles. 두 흙 접근부, 두 불균등 암석 구간, 절벽 쪽 5.92m 낮은 유입 구간을 둔다. WaterEntry_Guide는 export에서 제외했다. 기존 Earth/Canopy_Sage/Rock 재질 5개를 사용하며 이미지 텍스처는 없다.

| GLB           | Triangles | Materials |  Bytes |
| ------------- | --------: | --------: | -----: |
| 기존 blockout |       192 |         1 |  11604 |
| 후보          |     1,232 |         5 | 149032 |

Z-up→Y-up, pivot/scale 보존. GLB 재임포트의 triangles·bounds·역할 extras가 일치한다. rigid 형상은 manifold이며 loose vertex/zero-area face 0. Shore_Base의 열린 표면 경계는 의도한 구성이다.

Shore_Base의 UV.x는 지형 보정 가중치(수면 접점 0, 중간 .38, 지형 접점 1)다. 수면 접점은 수면 아래 0.09m, 지형 접점은 지형 아래 0.06m로 연결한다. Bank_Upper/Rocks는 낮은 45% 높이의 support를 지형에 0.14m 박는 rigid 이동만 적용한다. GLB의 재질별 primitive가 같은 원본 오브젝트의 이동값을 공유한다. 매 place 호출은 불변 원본 정점에서 다시 계산하며 매 프레임 geometry를 생성하지 않는다.

| 측정                      |      기존 |      후보 |
| ------------------------- | --------: | --------: |
| 수면 월드 Y (m)           | -5.389069 | -5.389069 |
| 최대 수면–지형 lift (m)   |  0.711868 |  0.741707 |
| 최대 원본 정점 Y 이동 (m) |  1.063369 |  1.013348 |

두 번째 값은 기존 audit와 같은 수면·지형 높이차이며 세 번째는 원본에서의 이동량이다. 후보의 바위·둔덕 변형량은 0(전체 이동만 수행). A→B→A 및 위치·yaw·scale 변경 후 복귀: 모든 대상 정점 최초 A와 동일, 최대 차이 0. 기존 6m 순환로/16m 공터/4.62m 아치 통로 표본 검사 PASS.

## 화면과 검증

artifacts/jelly-oasis/pond-edge-detail-v1/의 before-/after- overview, medium, ground, waterfall-facing, night, rain, mobile PNG 14장. 같은 카메라·환경으로 비교했으며 camera 값은 browser-qa.json에 저장했다. 낮 12시 CLEAR, 달빛 0시 CLEAR, 12시 RAIN, mobile 390×844. 초기 baseline보다 pond를 보기 쉬운 ground/waterfall 카메라를 최종 전후 양쪽에 동일 적용했다. Blender top/front/three-quarter PNG 3장도 같은 폴더에 있다.

기존의 균일한 밝은 띠가 잔디·흙 구간으로 나뉘고 낮은 둔덕·바위의 실루엣이 생겼다. 확인한 화면에서 큰 틈·부유·z-fighting은 보이지 않았다. 나무/뿌리/유적/절벽 시야와 동선 검사는 유지된다. 수면 guide를 보존하므로 타원 윤곽 자체는 남는다. 일부 먼 쪽 형상은 수면 아래에 잠긴다. 절벽과 연못의 기존 간격도 유지하며 실제 폭포 연결은 다음 작업 범위다.

- npm run lint: PASS.
- npm test -- --maxWorkers=2: 52 files / 288 tests PASS. 첫 실행에서 +0/-0 비교와 무관한 Uriel 5초 timeout이 발생했다. 좌표 비교에 1e-6 허용치를 적용했고 재실행은 모두 통과했다. 최종 export/접지에 대한 landmark 테스트 8개도 PASS.
- npm run build: PASS (TypeScript 포함).
- npm run qa:landmark: PASS; 현재 기본 Tree에 맞게 오래된 triangle 기대값 9844→19802만 갱신하고 browser executable override를 추가했다.
- node scripts/pond-detail-browser-qa.mjs: PASS, 14 paired screenshots, GLB HTTP 200, console/page/shader errors 0. shadow on/off, reduced-motion, touch 기본 shadow off, pagehide 정리/재진입 검사 포함.
- production 빌드에서 ?pond=detail만 붙인 일반 URL은 후보를 선택하지 않는다. 개발 서버는 기존 정책상 항상 debugEnabled=true이다. 첫 브라우저 검사 실패는 이를 production처럼 검사한 조건 오류였고 실제 preview에서 확인했다.

표본 동선 검사 및 headless touch/390px 화면은 연속 collision 또는 실기 모바일 FPS의 증거가 아니다. 물 셰이더·폭포·생물·NavMesh·식생·환경 UI는 이번 범위에 추가하지 않았다.

## 확인 URL과 수정 파일

로컬 후보: http://127.0.0.1:5175/projects/jelly-oasis/?debug&pond=detail

기존 비교: http://127.0.0.1:5175/projects/jelly-oasis/?debug&pond=blockout

Tree/Ruin/Cliff 비교 query는 그대로 유지된다. Tree는 현재 기본 detail을 보존하며 ?debug&tree=blockout으로 비교할 수 있다. 배포된 사이트에는 아직 이 후보가 없다.

수정 TypeScript: createOvergrownRuin.ts, loadLandmarkAssets.ts, jelly-oasis/main.ts. 검증: tests/jelly-oasis-landmark.test.ts, scripts/landmark-browser-qa.mjs, scripts/pond-detail-browser-qa.mjs. 재현 스크립트: scripts/blender/detail_pond_edge_v1.py 및 export_pond_edge_v1.py. 핵심 수치: audit-summary.json, mesh-audit.json, browser-qa.json. 기존 전체 QA 결과는 landmark-regression/에 별도 저장했다.

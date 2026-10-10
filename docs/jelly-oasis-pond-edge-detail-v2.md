# Jelly Oasis 연못 가장자리 v2

이 문서는 후보 커밋 4cba769의 검증 기록입니다. 이후 사용자 요청으로 [v2를 운영 기본값으로 전환](jelly-oasis-pond-production-v2.md)했습니다.
비대칭 수면과 둑을 같은 57개 경계점으로 연결했습니다. 원래 타원 guide는 수면 높이를 정하는 기준으로 유지하고, v2 GLB extras에 저장한 별도 경계를 수면·검수 오버레이·연못 제외 영역에 함께 사용합니다. 폭이 다른 흙/풀 경사면과 크기가 다른 바위 3개 군집을 배치했습니다. 좁은 만의 경사면 접힘을 제거했고, 풀 구간에는 기존 지형 재질을 재사용해 주변 지면으로 이어지도록 했습니다.

사용자의 후속 지시로 master 커밋·push는 승인되었습니다. production의 일반 URL은 기존 pond blockout을 유지합니다. v1 후보와 원본 GLB/layout 등 28개 파일의 SHA-256을 확인해 보존했습니다. 기준 HEAD는 e9d0176이며 원격 최신 여부는 푸시 시점 별도 확인합니다.

## 확인 URL
- [v1](http://127.0.0.1:5175/projects/jelly-oasis/?debug&pond=detail)
- [v2](http://127.0.0.1:5175/projects/jelly-oasis/?debug&pond=detail-v2)
- [production preview 일반 URL](http://127.0.0.1:5176/projects/jelly-oasis/)

## 비교 수치
| 항목 | v1 | v2 |
| --- | ---: | ---: |
| Pond GLB triangles | 1,232 | 1,176 |
| GLB materials | 5 | 5 |
| GLB bytes | 149,032 | 113,244 |
| GLB image textures | 0 | 0 |
| 수면 triangles | 48 | 55 |
| 전체 landmark triangles | 20,842 | 20,786 |
| 최종 QA draw calls | 104 | 96 |
| renderer textures | 4 | 5 |
| renderer geometries | 77 | 69 |
| 수면 world Y (m) | −5.389069483 | −5.389069483 |
| 최대 수면–지형 차이 (m) | 0.741707 | 0.814511 |

v2는 폴리곤 56개, GLB 35,788바이트가 줄었습니다. 풀 경사면은 기존 terrain shader의 별도 소유 material을 사용하므로 생성 텍스처 1개가 추가됩니다. 이 텍스처는 material dispose에 연결되어 해제됩니다. 파일 이미지 텍스처는 추가하지 않았습니다. 로드 시간과 draw calls는 headless 단일 실행의 관측값이며 FPS 벤치마크가 아닙니다.

## 같은 시점 비교
Blender top은 ORTHO, 중심 (0, −7, 0), distance 32, 최대 이미지 변 1000으로 고정했습니다. 웹 시점은 v1 baseline 카메라를 사용합니다. 정오 CLEAR·밤 CLEAR·정오 RAIN 및 390×844 화면을 비교했습니다.

| 시점 | v1 | v2 |
| --- | --- | --- |
| Blender top | [이미지](../artifacts/jelly-oasis/pond-edge-detail-v2/blender-top-v1.png) | [이미지](../artifacts/jelly-oasis/pond-edge-detail-v2/blender-top-v2.png) |
| overview | [이미지](../artifacts/jelly-oasis/pond-edge-detail-v2/before-overview.png) | [이미지](../artifacts/jelly-oasis/pond-edge-detail-v2/after-overview.png) |
| medium | [이미지](../artifacts/jelly-oasis/pond-edge-detail-v2/before-medium.png) | [이미지](../artifacts/jelly-oasis/pond-edge-detail-v2/after-medium.png) |
| ground | [이미지](../artifacts/jelly-oasis/pond-edge-detail-v2/before-ground.png) | [이미지](../artifacts/jelly-oasis/pond-edge-detail-v2/after-ground.png) |
| waterfall-facing | [이미지](../artifacts/jelly-oasis/pond-edge-detail-v2/before-waterfall-facing.png) | [이미지](../artifacts/jelly-oasis/pond-edge-detail-v2/after-waterfall-facing.png) |
| night | [이미지](../artifacts/jelly-oasis/pond-edge-detail-v2/before-night.png) | [이미지](../artifacts/jelly-oasis/pond-edge-detail-v2/after-night.png) |
| rain | [이미지](../artifacts/jelly-oasis/pond-edge-detail-v2/before-rain.png) | [이미지](../artifacts/jelly-oasis/pond-edge-detail-v2/after-rain.png) |
| mobile | [이미지](../artifacts/jelly-oasis/pond-edge-detail-v2/before-mobile.png) | [이미지](../artifacts/jelly-oasis/pond-edge-detail-v2/after-mobile.png) |

상면과 중거리에서 타원이 비대칭 만으로 바뀌고, 지상에서는 v1의 밝은 고리·장식 둔덕 대신 풀 경사면이 지형과 이어집니다. 돌은 서쪽/남쪽/동쪽의 서로 다른 3개 군집이며 나머지 접근부는 비워 두었습니다. 저폴리곤 흙 접근부의 면과 경계는 일부 보입니다.

## 검증
- lint / build 통과.
- npm test -- --maxWorkers=2: 52개 파일, 289개 테스트 통과. 병렬 작업 중 기존 Uriel 테스트의 5초 시간 초과가 발생했으나 작업 완료 후 기본 제한 전체 재실행은 통과했습니다.
- 최종 폭 조정 후 landmark 테스트 9개와 pond 브라우저 QA 재실행 통과.
- qa:landmark: 기존 tree/ruin/cliff·환경·기본 pond 회귀, 21장 캡처 통과.
- pond 브라우저 QA: v1/v2 14장, variant/triangle 수, 물 높이 동일, HTTP 200, 콘솔 오류 없음, 그림자 토글·touch·pagehide 통과.
- production preview의 일반 URL 및 debug 없는 pond=detail-v2 URL에서 기존 PondEdge_Blockout.glb만 선택됨을 확인.
- GLB 재임포트 triangles / bounds / 역할 / 공유 수면 extras 일치. loose vertex·zero-area face·비정상 내부 edge 없음. 둑의 최소 상향 normal Z는 0.394580이며 접힌 면 없음. 경사면의 열린 두 경계 114개 edge는 의도된 구조입니다.
- 수면 polygon 면적과 55개 삼각형 면적 합 모두 348.424303m².
- 위치·yaw·scale 변경 후 A→B→A 정점 배열 복귀 통과.
- 6m 순환로 / 16m 공터 / 접근부 / 4.62m 아치 통로의 표본 교차 검사 통과.

## 파일과 재현
- [Blender v2](../artifacts/jelly-oasis/pond-edge-detail-v2/jelly-oasis-pond-edge-detail-v2.blend)
- [GLB v2](../public/assets/jelly-oasis/landmarks/overgrown-ruin/PondEdge_Blockout_Detail_v2.glb)
- [윤곽 데이터](../scripts/blender/pond-contour-v2.json)
- [생성 스크립트](../scripts/blender/detail_pond_edge_v2.py): v1 blend를 열고 실행하면 새 v2를 저장합니다. 이미 생성된 v2를 중복 실행하지 않습니다.
- [export 스크립트](../scripts/blender/export_pond_edge_v2.py): v2 scene에서 실행해 GLB와 health/reimport 기록을 생성합니다.
- [QA 스크립트](../scripts/pond-detail-browser-qa.mjs): POND_QA_VERSION=v2, LANDMARK_QA_URL=로컬 서버, LANDMARK_QA_PRODUCTION_URL=preview URL을 설정하고 실행합니다.
- [검증 요약](../artifacts/jelly-oasis/pond-edge-detail-v2/audit-summary.json), [메시](../artifacts/jelly-oasis/pond-edge-detail-v2/mesh-audit.json), [건강 검사](../artifacts/jelly-oasis/pond-edge-detail-v2/mesh-health.json), [브라우저 기록](../artifacts/jelly-oasis/pond-edge-detail-v2/browser-qa.json).

코드 변경은 createOvergrownRuin.ts / loadLandmarkAssets.ts / landmarkAudit.ts / landmarkDebug.ts / main.ts, 기존 v1 기반 접지와 debug 선택, 테스트 및 QA 스크립트에 한정됩니다. 전역 지형 생성이나 원본 layout을 수정하지 않았습니다.

폭포의 실제 흐름 연결은 다음 작업입니다. 모바일 확인은 headless viewport/touch 검사이므로 실기기 FPS와 연속 충돌을 보증하지 않습니다.

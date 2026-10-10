# Jelly Oasis — Landmark Tree Detail v1

2026-10-10. 기준: master / 04e2551 (Ruin + Root 완료 결과). 시작 시 작업 트리는 clean.
초기 브랜치 생성은 .git 쓰기 권한으로 실패했다. 이후 사용자가 완료 후 master push를 명시적으로 요청했으며, 검증 완료 후 master에 커밋·push한다. production 기본 나무는 blockout을 유지한다. master push는 기존 GitHub Pages 배포 workflow를 실행한다.

## 열어 보기

- 후보: http://127.0.0.1:4176/projects/jelly-oasis/?debug&tree=detail
- 기존: http://127.0.0.1:4176/projects/jelly-oasis/?debug&tree=blockout
- 일반 URL은 기존 Tree_Landmark_Blockout.glb를 사용한다.
- 두 URL의 동일한 카메라 preset 및 reviewCamera를 사용해 비교했다.

## 파일과 제작

입력: artifacts/jelly-oasis/ruin-root-night-v1/jelly-oasis-ruin-root-detail-v1.blend.
Blender MCP 연결 및 5.2.2 LTS 확인. 원본 씬을 변경하기 전에 source-preserved.blend로 별도 저장했다.

- [작업 파일](../artifacts/jelly-oasis/landmark-tree-detail-v1/jelly-oasis-landmark-tree-detail-v1.blend)
- [원본 보존](../artifacts/jelly-oasis/landmark-tree-detail-v1/source-preserved.blend)
- [후보 GLB](../public/assets/jelly-oasis/landmarks/overgrown-ruin/Tree_Landmark_Detail_v1.glb)
- [바이너리 보존·GLB 검사](../artifacts/jelly-oasis/landmark-tree-detail-v1/glb-audit.json)

줄기는 높이에 따라 굽힘과 단면을 변화시킨 sweep이다. 큰 가지 6개와 보조 가지 14개를 배치하고 Boolean union 및 제한된 smooth로 분기 접합을 정리했다. 줄기·가지는 4,186 triangles, 수관은 7,680 triangles다.
수관은 크기·회전·높이·윤곽이 다른 24개 불규칙 군집을 한 mesh에 병합했다. 기존 세 가지 잎색과 나무 재질을 재사용했다. 수관 아래에서 일부 하늘 틈과 가지 지지 구조가 보인다.
원본 나무는 숨겨 보존하고 Tree_Landmark_Detail_v1 아래 Trunk_and_Branches와 Canopy_Clusters를 추가했다.
외부 Root/Ruin/Cliff 모델과 layout은 수정하지 않았다. 모든 기존 GLB의 SHA-256을 기준 commit과 대조했다.

| 항목 | 기존 | 후보 |
|---|---:|---:|
| Blender X/Y/Z 크기 | 25 / 20 / 28m | 25 / 20 / 28m |
| 삼각형 | 1,908 | 11,866 |
| glTF meshes | 1 | 2 |
| primitives / materials | 4 / 4 | 4 / 4 |
| 이미지 texture | 0 | 0 |
| 바이트 | 187,124 | 677,916 |
| Blender origin | −12 / 18 / 0 | −12 / 18 / 0 |
| scale | 1 / 1 / 1 | 1 / 1 / 1 |

GLB root/mesh transform은 identity, export는 Z-up → glTF Y-up이다. runtime 식별 이름은 Tree_Landmark_Blockout을 유지한다.
전체 landmark는 9,844 → 19,802 triangles다. export GLB triangle과 아래 shadow pass 포함 렌더 triangle을 구분한다.

## 접지·뿌리·동선

기존 12개 바닥 정점을 정확히 보존하여 지형 접지용 9개 support sample이 일치한다.
런타임 접지 높이 **−3.687496879m**, 최대 표본 매몰량 **0.844051078m**로 기존과 정확히 같다.
전체 배치 X70/Z58, yaw30°, scale1과 모든 모듈 contact 결과도 동일하다.
줄기 하단은 기존 넓은 base root 시작부에 연결된다. 외부 root의 지형 보정과 연결 계산을 재사용한다.
지형 이동 후 원위치 복귀 검사도 통과했다.

표본 검사: 6m loop 5,040개, 16m clearing 3,209개, approach 4,212개, arch passage 1,000개 모두 교차 없음. 아치 기둥 간격 4.62m. 연속 충돌/NavMesh 보장은 아니다.

## 동일 카메라 비교

| 시점 | 기존 | 후보 |
|---|---|---|
| 전체 | [전](../artifacts/jelly-oasis/landmark-tree-detail-v1/before-overview-noon.png) | [후](../artifacts/jelly-oasis/landmark-tree-detail-v1/after-overview-noon.png) |
| 중거리 | [전](../artifacts/jelly-oasis/landmark-tree-detail-v1/before-medium-noon.png) | [후](../artifacts/jelly-oasis/landmark-tree-detail-v1/after-medium-noon.png) |
| 나무 지상 | [전](../artifacts/jelly-oasis/landmark-tree-detail-v1/before-tree-ground.png) | [후](../artifacts/jelly-oasis/landmark-tree-detail-v1/after-tree-ground.png) |
| 좌측 3/4 | [전](../artifacts/jelly-oasis/landmark-tree-detail-v1/before-tree-left.png) | [후](../artifacts/jelly-oasis/landmark-tree-detail-v1/after-tree-left.png) |
| 우측 3/4 | [전](../artifacts/jelly-oasis/landmark-tree-detail-v1/before-tree-right.png) | [후](../artifacts/jelly-oasis/landmark-tree-detail-v1/after-tree-right.png) |
| 수관 아래 | [전](../artifacts/jelly-oasis/landmark-tree-detail-v1/before-tree-under.png) | [후](../artifacts/jelly-oasis/landmark-tree-detail-v1/after-tree-under.png) |
| 모바일 중거리 | [전](../artifacts/jelly-oasis/landmark-tree-detail-v1/before-mobile-medium.png) | [후](../artifacts/jelly-oasis/landmark-tree-detail-v1/after-mobile-medium.png) |

[낮](../artifacts/jelly-oasis/landmark-tree-detail-v1/environment-noon.png), [노을](../artifacts/jelly-oasis/landmark-tree-detail-v1/environment-sunset.png), [달빛 밤](../artifacts/jelly-oasis/landmark-tree-detail-v1/environment-night.png), [흐림](../artifacts/jelly-oasis/landmark-tree-detail-v1/environment-overcast.png), [비](../artifacts/jelly-oasis/landmark-tree-detail-v1/environment-rain.png), [안개](../artifacts/jelly-oasis/landmark-tree-detail-v1/environment-mist.png).

## 성능·검증

Windows headless Edge, production preview. desktop 1440×1000 / DPR1, mobile viewport 390×844 및 가로 844×390.
기존 canopy castShadow=false 정책을 유지했다. 줄기·가지 castShadow=true, receiveShadow=true. 모바일은 전체 shadow off. 별도 shadow map은 추가하지 않았다.

| 조건 | draw calls | rendered triangles | GPU textures |
|---|---:|---:|---:|
| 기존 낮, shadow ON | 71 | 48,760 | 4 |
| 후보 낮, shadow ON | 71 | 62,596 | 4 |
| 후보 달빛 밤, shadow ON | 72 | 62,596 | 4 |
| 후보 밤, shadow OFF | 41 | 37,866 | 2 |
| 후보 모바일 밤 | 41 | 37,866 | 2 |

실기 모바일 GPU FPS/frame time은 측정하지 않았다. 정지 이미지로 애니메이션 성능을 주장하지 않는다.

- lint 및 TypeScript 통과; 최종 npm run build (Vite + legacy copy) 통과.
- 전체 Vitest --maxWorkers=2: 52 files / 287 tests 통과. 최초 병렬 렌더링 중 무관한 Uriel test가 5초 timeout으로 실패했으며, 렌더링 종료 후 같은 조건 전체 재실행 통과. timeout 설정은 변경하지 않았다.
- [브라우저 QA](../artifacts/jelly-oasis/landmark-tree-detail-v1/browser-qa.json): 낮/노을/밤/흐림/비/안개, shadow toggle, context restore, persisted pagehide/pageshow, 모바일 UI, production blockout 기본값 통과. GLB HTTP200, 콘솔/shader 오류 0.
- [생명주기 QA](../artifacts/jelly-oasis/landmark-tree-detail-v1/lifecycle-qa.json): GLB404 시 명시적 오류 UI, pagehide 후 debug API 제거, 지연 GLB 응답 후 scene 재등록 없음 확인. 실제 GLB unit test로 중복 dispose 및 실패 후 늦은 성공 응답의 resource 정리 검증.
- [보충 시점 QA](../artifacts/jelly-oasis/landmark-tree-detail-v1/supplemental-qa.json).

## 남은 미적 판단과 한계

중거리에서 큰 세 덩어리였던 기존 수관보다 층과 가지 구조가 읽히며, 아치·연못·절벽을 가리지 않는다. 근거리에서는 아직 둥근 잎 군집의 인상이 남고 일부 보조 가지 끝이 눈에 띈다. 더 잎다운 가장자리와 가지 끝의 자연스러운 가림은 다음 미적 수정 후보다. 아주 가까운 우측 시점에서는 절벽이 줄기를 가리는 기존 배치 관계를 유지한다. 모바일 비교 캡처는 같은 medium 목표점을 유지하고 카메라 거리를 1.55배 늘려 나무와 아치를 함께 담았다. 앱의 기존 preset 자체는 변경하지 않았다.
수관 그림자는 기존대로 꺼져 있어 바닥에는 가지 중심의 그림자가 보인다. 이 단계에서 바람·식생·수면·NavMesh는 추가하지 않았다.

Blender 활성 씬 정적 export 후 재임포트 검사 통과: 삼각형 11,866개와 bounds가 정확히 일치한다. [메시 검사](../artifacts/jelly-oasis/landmark-tree-detail-v1/mesh-audit.json)의 비다양체 edge, loose vertex, zero-area face, winding 오류, duplicate vertex 모두 0. Boolean 접합부를 삼각분할할 때 생성된 중복 내부 면 11쌍을 제거하고 느슨한 edge/vertex를 정리했다.

전체 씬 export가 다른 씬 전환에서 지연되는 것을 설치된 exporter stack으로 확인해 use_active_scene=True 및 export_animations=False를 지정했다. 원본 다른 씬은 수정하지 않았다. 별도 background Blender에서 export 0.11초, import 1.26초로 검증했다.

Blender 비교 12장은 blender-before/after-{tree-front,tree-left,tree-right,tree-ground,tree-under,overview}.png에 있다. 원본 Ruin+Root와 Cliff .blend도 [SHA-256 검사](../artifacts/jelly-oasis/landmark-tree-detail-v1/source-preservation.json)에서 기준 commit과 일치한다.

최종 정리 모델의 [단독 정면](../artifacts/jelly-oasis/landmark-tree-detail-v1/blender-after-tree-isolated.png)과 [잎을 숨긴 가지 구조](../artifacts/jelly-oasis/landmark-tree-detail-v1/blender-after-tree-skeleton.png)도 별도 Blender scene에서 렌더했다. 전체 landmark 비교 렌더는 외형에 영향을 주지 않는 내부 중복 면 정리 전이며, 웹 비교·단독 렌더·GLB 수치는 최종 정리 후 결과다.

라이브 Blender의 이전 전체 씬 export 호출은 응답 제한을 초과해 정상 복귀를 확인하지 못했다. 최종 저장 파일은 background Blender에서 독립적으로 읽고 내보내기·재임포트를 검증했다.

# Jelly Oasis — Overgrown Oasis Ruin Blockout v1

계획서에 따라 실제 Blender MCP 씬 작업, 모듈 작성, 동선 검수와 GLB export test를 완료했다. 완성 자산이 아니라 크기·배치·재사용 기준을 정하는 blockout이다.

- Blender 5.2.2 LTS, 씬 `JellyOasis_OvergrownRuin_v1`.
- 기존 `Scene`과 Cube/Camera/Light는 별도 씬에 보존했다.
- 파일: [jelly-oasis-overgrown-ruin-v1.blend](../artifacts/jelly-oasis/overgrown-ruin-v1/jelly-oasis-overgrown-ruin-v1.blend).
- 전체 배치 GLB: [Overgrown_Oasis_Ruin_Blockout_v1.glb](../artifacts/jelly-oasis/overgrown-ruin-v1/exports/Overgrown_Oasis_Ruin_Blockout_v1.glb).
- [전체 보기](../artifacts/jelly-oasis/overgrown-ruin-v1/overview.png), [동선 평면도](../artifacts/jelly-oasis/overgrown-ruin-v1/layout-guides.png), [지상 시점](../artifacts/jelly-oasis/overgrown-ruin-v1/ground-level.png).

## 크기와 구도

프레젠테이션 지면 범위는 **80 × 76m**이다. 약 28m 나무를 뒤쪽 왼편에, 17m 절벽을 중앙 뒤쪽에, 9.5m 아치를 오른쪽에 둔다. 연못 footprint는 약 24.31 × 20.22m이다. 이는 320 × 320m 월드 안에 배치할 하나의 랜드마크이며 지면 원판은 검수용이다.

## 컬렉션과 모듈

`JellyOasis_Landmark_v1` 아래 `BLOCKOUT`, `CLIFF`, `RUIN`, `TREE`, `POND`, `ACCENT`, `REVIEW`를 구성했다. `BLOCKOUT/CompositionGuides`는 기본적으로 숨겨져 있다. Outliner의 모니터 아이콘으로 켜면 녹색 순환 동선, 노란 공터, 청색 폭포 궤적을 볼 수 있다. 파란 연못 폴리곤은 수면 구현이 아닌 위치 가이드다. 검수 오브젝트는 CAM_Landmark_Overview, CAM_Ground_Level, CAM_Ruin_Close, CAM_Layout_Top, JO_Review_Sun, LandmarkBounds_80x76m이다.

| 오브젝트 | Blender 치수 X × Y × Z (m) | 삼각형 | GLB |
|---|---:|---:|---|
| Ground_Presentation_ONLY | 80.00 × 76.00 × 0.00 | 64 | 가이드만 |
| Pond_Blockout | 24.31 × 20.22 × 0.00 | 48 | 가이드만 |
| CreaturePaths_Loop_6m | 74.00 × 70.00 × 0.00 | 256 | 가이드만 |
| CreatureClearing_Diameter16m | 16.00 × 16.00 × 0.00 | 48 | 가이드만 |
| CreaturePaths_ArchApproach_6m | 6.00 × 26.00 × 0.00 | 8 | 가이드만 |
| Waterfall_Drop_Guide_L | 0.14 × 9.03 × 16.45 | 36 | 가이드만 |
| Waterfall_Drop_Guide_R | 0.14 × 9.03 × 16.45 | 36 | 가이드만 |
| Cliff_Waterfall_A | 21.33 × 11.77 × 17.00 | 2,136 | 포함 |
| Rock_Large_A | 7.65 × 5.65 × 5.50 | 436 | 포함 |
| Rock_Large_B | 5.37 × 4.44 × 4.00 | 220 | 포함 |
| Rock_Large_C | 4.52 × 3.68 × 3.50 | 220 | 포함 |
| Rock_Large_D | 6.32 × 4.66 × 4.20 | 220 | 포함 |
| Rock_Large_E | 4.52 × 4.53 × 3.00 | 220 | 포함 |
| Ruin_Arch_A | 8.77 × 2.35 × 9.50 | 924 | 포함 |
| Ruin_Wall_A | 8.20 × 1.48 × 5.30 | 440 | 포함 |
| Ruin_BrokenWall_A | 7.67 × 4.46 × 5.98 | 396 | 포함 |
| Tree_Landmark_Blockout | 25.00 × 20.00 × 28.00 | 1,908 | 포함 |
| Root_Large_A | 4.93 × 12.58 × 6.20 | 356 | 포함 |
| Root_Tree_Base_Blockout | 3.07 × 9.01 × 2.71 | 76 | 포함 |
| PondEdge_Blockout | 27.95 × 23.25 × 0.33 | 192 | 포함 |
| Crystal_Blockout_A | 2.60 × 1.61 × 3.40 | 66 | 포함 |
| Crystal_Blockout_B | 2.60 × 1.61 × 3.40 | 66 | 포함 |
| Crystal_Blockout_C | 2.60 × 1.61 × 3.40 | 66 | 포함 |

전체 GLB는 독립 오브젝트 **16개, 7,942 triangles**다. 원판, 물 footprint, 경로/폭포 가이드, 조명과 카메라는 제외했다. 모든 export mesh scale은 (1,1,1)이다. Tree/Root의 교차하는 닫힌 부분과 cliff의 여러 닫힌 덩어리는 blockout 조립 구조이며 boolean union은 하지 않았다.

## 이동 공간 검수

- 순환로: 타원 중심선 반경 34 × 32m, 법선 방향 폭 **6m**, 외곽 범위 74 × 70m.
- 남쪽 공터: 중심 (0, -27), **직경 16m**, 약 201m².
- 동쪽 진입 가이드: 폭 6m 단면을 연결한 굽은 경로. 아치 기단 사이 최소 통과 폭은 **4.63m**(상부 기둥 사이 약 4.85m).
- 지상 높이 0.08–3m 사이의 모델 삼각형을 수평 투영하고 연못 footprint를 포함해 검사했다. 순환로 5,040점, 공터 3,209점, 진입로 4,212점에서 장애물 겹침이 없었다.
- 이는 샘플 기반 배치 검수다. NavMesh, 충돌 시스템, 캐릭터 반경에 따른 이동 검증은 이후 단계다.
- 순환로·공터·연못·진입로의 합집합은 0.5m 격자 추정으로 **1912.5m², 전체 지면의 40.02%**다. 겹친 부분은 한 번만 센다. 실제 빈 지면은 이보다 넓게 남겼다.

## 메시 및 GLB 검증

닫힌 자산에서 boundary/non-manifold edge와 loose vertex가 발견되지 않았다. PondEdge는 terrain에 맞춰 사용할 열린 ribbon이므로 양쪽 boundary가 의도적으로 존재한다. 생성 시 법선을 재계산했고, bevel은 적용한 상태다. 이미지 texture는 0개다.

9개 모듈 GLB와 전체 배치 GLB를 저장했다. 단일 모듈의 node translation은 0으로 내보내어 즉시 재사용할 수 있다. 전체 배치 GLB는 씬 내 위치를 유지한다. Blender Z-up → glTF Y-up 변환은 exporter에서 처리했으며, 좌표 대응은 (x, y, z) → (x, z, -y)다.

Cliff_Waterfall_A, Ruin_Arch_A, Rock_Large_A를 임시 Blender 씬으로 다시 불러와 치수·원점·삼각형 수·재질 슬롯 수를 비교했다. 최대 치수 오차와 원점 오차는 모두 0m였다. 추가로 10개 GLB의 바이너리 헤더, 메시 이름, 축 변환 후 치수, 단위 scale, 재질 이름/색상 필드, 삼각형 수, texture 부재를 독립 Node.js 검사로 확인했다.

Rock/Cliff 원점은 바닥 bbox 중앙, Arch는 통로 바닥 중앙, Tree는 줄기 지면 접점이다. Root_Large_A는 뿌리 시작 단면 중심이며, 씬에서는 높이 1.3m의 연결점에 배치되어 있다. 뿌리의 아래쪽 부분은 지면에 조금 묻히도록 허용했다.

검증 원자료: [asset-manifest.json](../artifacts/jelly-oasis/overgrown-ruin-v1/asset-manifest.json), [movement-audit.json](../artifacts/jelly-oasis/overgrown-ruin-v1/movement-audit.json), [glb-validation.json](../artifacts/jelly-oasis/overgrown-ruin-v1/glb-validation.json).

## 임시 재질

- `JO_Ground_PresentationOnly`
- `JO_Pond_BlueFootprint_ONLY`
- `JO_Debug_PathGreen`
- `JO_Debug_ClearanceYellow`
- `JO_Debug_WaterfallCyan`
- `JO_Rock_GrayBrown`
- `JO_Rock_LightPlane`
- `JO_Rock_DarkPlane`
- `JO_Ruin_WarmGray`
- `JO_Ruin_LightStone`
- `JO_Ruin_ShadowStone`
- `JO_Tree_DarkBrown`
- `JO_Canopy_Sage`
- `JO_Canopy_Light`
- `JO_Canopy_Shadow`
- `JO_PondEdge_Earth`
- `JO_Crystal_VioletPlaceholder`

모두 단색 Principled material이다. 결정에는 위치 확인용으로 약한 emissive만 적용했다. 이미지 텍스처, 수면 셰이더, 폭포 셰이더, HDRI, 볼류메트릭, 베이크 조명은 없다.

## 남은 blockout과 다음 단계

나무 잎은 blob, 뿌리는 관형 실루엣, 절벽은 큰 암석 덩어리, 연못 가장자리는 지면에 맞추기 전의 높이 가이드다. 작은 암석 및 crystal은 핵심 모듈보다 적은 삼각형을 사용했다. BrokenWall은 396 triangles로 400 목표 하한보다 약간 작고, crystal cluster는 각각 66 triangles(3개 총 198)로 위치 확인에 필요한 형태만 남겼다.

다음 상세화 우선순위는 (1) 절벽 groove와 rock 면 정리, (2) 유적 상단 파손과 석재 비대칭 강화, (3) 나무 가지·뿌리 연결 및 canopy 확정이다. 이끼·덩굴·풀·꽃·안개·수면·폭포·collision·NavMesh·AI는 이번 범위 밖이다.

Three.js에서 처음 시험할 자산은 **Rock_Large_A → Ruin_Arch_A → Cliff_Waterfall_A** 순서다. 순서대로 terrain 높이 배치, 통로 폭, 큰 구조물의 크기를 확인하기 좋다. 이후 전체 배치 GLB로 상대 위치를 검토하고 물은 기존 Three.js 환경 시스템에서 작성한다. 실제 웹 통합은 이번 단계에서 수행하지 않았다.

## 재현

Blender에서 [build_overgrown_ruin_v1.py](../scripts/blender/build_overgrown_ruin_v1.py)를 실행한 뒤 [inspect_export_overgrown_ruin_v1.py](../scripts/blender/inspect_export_overgrown_ruin_v1.py)를 실행한다. 생성 스크립트는 동일 이름의 씬이 이미 있으면 중단하여 기존 작업을 덮어쓰지 않는다. 보고서 및 독립 GLB 검사는 프로젝트 루트에서 `node scripts/blender/report_overgrown_ruin_v1.mjs`로 재생성한다.

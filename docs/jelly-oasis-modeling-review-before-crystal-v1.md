# Jelly Oasis — 기존 모델링 전체 검수 (Phase A)

검수일: 2026-10-10. **판정: WARN. BLOCK 결함은 이번 검사에서 발견하지 않았다.** 주요 로딩·배치·동선·회귀 검사는 PASS이며, 스타일과 근접 화면의 미관 차이를 아래에 기록한다. 사용자 요청에 따라 Phase A까지만 수행했다. Crystal 제작 및 기존 모델 수정은 실행하지 않았다.

## 기준 및 보존

- git fetch origin 완료. master / HEAD / origin/master 모두 `11324c15a7a5f28f4d7c612b52ef35c88baaafd3`.
- 시작 전부터 `pond-edge-detail-v2/jelly-oasis-pond-edge-detail-v2.blend`에 미커밋 변경이 있었다. 그대로 보존하고 검수 폴더의 `source-preserved.blend`에 파일 사본을 만들었다. reset/clean/checkout/merge/push 없음.
- Blender 활성 파일은 최신 통합 pond-edge-detail-v2 소스이며 dirty=false. 실제 상세 절벽·유적·뿌리·나무·연못 v2와 수정 A/B/C 확인. 보존용 blockout은 숨김 상태. 소스의 추가 Cube는 로딩 대상 16개 GLB에 포함되지 않는다.
- 새 production build를 직접 띄운 `http://127.0.0.1:4183/projects/jelly-oasis/` 기준으로 일반 화면 기본 로딩과 `?debug` 검수 화면을 확인했다. 원격 GitHub Pages 화면은 이번에 확인하지 않았으며 배포 최신성 판정은 하지 않는다.
- 일반 URL은 debug API 없이 16개 GLB를 정상 로딩한다. 상세 절벽/유적·뿌리/나무/연못 v2가 기본이며 수정 3개는 기존 blockout.
- 320×320m 월드, 중심 X70/Z58, yaw30°, scale1, 16개 앵커를 유지했다. BrokenWall의 local X+4/Z+11은 런타임에서 한 번 적용되며 Blender 소스에는 이중 적용되지 않았다.

## 16개 모듈 전수표

전부 HTTP 200. 총 **20,786 triangles**. GLB 전체 삼각형에서 비유한 위치 및 0면적 삼각형은 0건. 재질은 모두 이미지 텍스처 없는 기존 모델 재질이며, 연못 shore는 런타임 terrain 재질·색으로 교체된다. Flat 수는 각 삼각형의 세 정점 법선 일치 수다. 월드 좌표는 확인된 layout/런타임 오프셋/회전/접지값에서 계산한 모듈 origin이다. 지지점/최대 매립값은 접지 알고리즘의 수치로, 모든 표면의 연속 접촉 보증은 아니다. 연못 Y는 별도 수면 기준이다.

| 모듈 | 실제 GLB | triangles | 재질 | Flat/전체 | 월드 origin XYZ(m) | 지지점/최대 매립(m) | 그림자 정책 | 실루엣·표면 판정 |
|---|---|---:|---|---:|---|---|---|---|
| Cliff_Waterfall_A | Cliff_Waterfall_A_Detail_v1.glb | 3,238 | Rock_GrayBrown, Rock_LightPlane | 3238/3238 | (63.72, -5.67, 47.09) | 61 / 1.888 | 수신·투사 | WARN: 띠 반복 |
| Rock_Large_A | Rock_Large_A.glb | 436 | Rock_GrayBrown, Rock_LightPlane, Rock_DarkPlane | 436/436 | (55.61, -4.71, 73.28) | 22 / 1.034 | 수신·투사 | PASS: 크기·위치 차등, 유사한 바위 계열 |
| Rock_Large_B | Rock_Large_B.glb | 220 | Rock_GrayBrown, Rock_LightPlane, Rock_DarkPlane | 220/220 | (44.69, -3.22, 58.89) | 16 / 0.826 | 수신·투사 | PASS: 크기·위치 차등, 유사한 바위 계열 |
| Rock_Large_C | Rock_Large_C.glb | 220 | Rock_GrayBrown, Rock_LightPlane, Rock_DarkPlane | 220/220 | (95.51, -4.18, 52.50) | 16 / 0.709 | 수신·투사 | PASS: 크기·위치 차등, 유사한 바위 계열 |
| Rock_Large_D | Rock_Large_D.glb | 220 | Rock_GrayBrown, Rock_LightPlane, Rock_DarkPlane | 220/220 | (65.87, -4.70, 81.16) | 16 / 0.833 | 수신·투사 | PASS: 크기·위치 차등, 유사한 바위 계열 |
| Rock_Large_E | Rock_Large_E.glb | 220 | Rock_GrayBrown, Rock_LightPlane, Rock_DarkPlane | 220/220 | (81.60, -3.71, 34.13) | 16 / 0.645 | 수신·투사 | PASS: 크기·위치 차등, 유사한 바위 계열 |
| Ruin_Arch_A | Ruin_Arch_A_Detail_v1.glb | 1,046 | Ruin_WarmGray, Ruin_LightStone, Ruin_ShadowStone | 1046/1046 | (79.99, -5.80, 45.30) | 24 / 1.290 | 수신·투사 | WARN: 규칙적 석재·작은 줄눈 |
| Ruin_Wall_A | Ruin_Wall_A_Detail_v1.glb | 500 | Ruin_WarmGray, Ruin_LightStone | 500/500 | (56.88, -5.60, 63.27) | 36 / 1.334 | 수신·투사 | WARN: 규칙적 석재 |
| Ruin_BrokenWall_A | Ruin_BrokenWall_A_Detail_v1.glb | 450 | Ruin_WarmGray, Ruin_LightStone | 450/450 | (86.05, -4.81, 41.80) | 36 / 1.193 | 수신·투사 | PASS: 아치와 연결 |
| Tree_Landmark_Blockout | Tree_Landmark_Detail_v1.glb | 11,866 | Canopy_Sage, Canopy_Light, Canopy_Shadow, Tree_DarkBrown | 7680/11866 | (50.61, -3.69, 48.41) | 9 / 0.844 | 수신 / 줄기 투사, 수관 제외 | WARN: 줄기 Smooth·가지 끝 노출 |
| Root_Large_A | Root_Large_A_Detail_v1.glb | 740 | Tree_DarkBrown | 740/740 | (54.61, -4.39, 55.34) | 51 / 1.095 | 수신·투사 | PASS: 벽을 감싸는 높이 변화 |
| Root_Tree_Base_Blockout | Root_Tree_Base_Blockout_Detail_v1.glb | 256 | Tree_DarkBrown | 256/256 | (50.61, -4.16, 48.41) | 19 / 0.967 | 수신·투사 | PASS: 거목→뿌리 연결 |
| PondEdge_Blockout | PondEdge_Blockout_Detail_v2.glb | 1,176 | Rock_GrayBrown, Rock_LightPlane, Rock_DarkPlane, PondEdge_Earth, Canopy_Sage | 720/1176 | (73.50, -5.39, 64.06) | 993 / 0.000 | 수신 / 투사 제외 | WARN: 단순 수면·얇은 둑 |
| Crystal_Blockout_A | Crystal_Blockout_A.glb | 66 | Crystal_VioletPlaceholder | 66/66 | (92.49, -4.76, 66.95) | 18 / 0.474 | 수신·투사 | WARN: 동일한 블록아웃 |
| Crystal_Blockout_B | Crystal_Blockout_B.glb | 66 | Crystal_VioletPlaceholder | 66/66 | (63.01, -5.11, 75.89) | 18 / 0.425 | 수신·투사 | WARN: 동일한 블록아웃 |
| Crystal_Blockout_C | Crystal_Blockout_C.glb | 66 | Crystal_VioletPlaceholder | 66/66 | (67.79, -3.84, 36.18) | 18 / 0.358 | 수신·투사 | WARN: 동일한 블록아웃 |

## 핵심 발견 및 우선순위 (최대 5건)

1. **P2 / 나무 스타일 WARN.** 수관 7,680 triangles는 Flat이지만 줄기·가지 4,186 triangles는 Smooth이다. Blender에서도 Trunk_and_Branches의 4,186면 모두 Smooth, Subdivision 등 modifier는 없다. 가까이에서 줄기의 명암이 다른 바위·뿌리보다 매끈하다. 일부 가지 끝은 수관 밑에서 잘린 막대처럼 노출된다. 수관 덩어리의 유사성도 보이지만 크기·명도·높이 차이는 있다. 높이 약 28m 실루엣과 가지 연결은 유지된다. 후속 작업에서는 줄기/가지만 국소 Flat 후보 비교, 노출된 끝의 길이·수관 접점을 먼저 검토한다. 근거: [tree-under](../artifacts/jelly-oasis/modeling-review-before-crystal-v1/tree-under.png), [medium](../artifacts/jelly-oasis/modeling-review-before-crystal-v1/medium.png).
2. **P3 / 절벽·유적 반복 WARN.** 절벽은 단일 덩어리로 이어지고 폭포 홈이 읽히지만 밝은 수평 띠가 세 층으로 연속되어 인공적인 반복이 강하다. 아치·벽은 손상된 모서리보다 균일한 석재와 좁은 줄눈이 먼저 읽히며, 아치 상단 작은 틈은 근접 화면에서 눈에 띈다. 큰 부유/통로 막힘은 발견하지 않았다. 바위 B~E는 같은 220-triangle 계열로 유사하지만 높이 3~4.2m와 배치·폭이 다르다. 후속 최소안은 일부 띠/석재만 높이·길이·손상 차등화이며 이번에는 수정하지 않았다. 근거: [cliff-front](../artifacts/jelly-oasis/modeling-review-before-crystal-v1/cliff-front.png), [arch](../artifacts/jelly-oasis/modeling-review-before-crystal-v1/arch.png), [ground](../artifacts/jelly-oasis/modeling-review-before-crystal-v1/ground.png).
3. **P3 / 연못 표현 WARN.** v2 비대칭 물가와 구간별 바위는 유지되며 큰 열린 틈은 보이지 않는다. 일부 둑은 얇은 베이지 띠로 읽히고 수면을 통해 지형·바위가 보여 깊이감이 약하다. 물은 기존 반투명 inspection plane이며 폭포 물줄기도 아직 없다. 이는 현재 물/폭포 표현 범위의 한계로 메시 누락과 구분한다. shore의 Blender Smooth 228 polygons 및 GLB 비-Flat 456 triangles도 기록한다. 지형 이음새용 표면의 스타일 차이이며 일괄 법선 변경은 하지 않았다. 근거: [pond-top](../artifacts/jelly-oasis/modeling-review-before-crystal-v1/pond-top.png), [pond-waterfall-facing](../artifacts/jelly-oasis/modeling-review-before-crystal-v1/pond-waterfall-facing.png).
4. **P3 / 수정 WARN(예상된 blockout).** A/B/C는 모두 66 triangles, 높이 3.4m, 동일한 보라색·결정 조합이다. 가까이에서 색이 강하고 복제 형태가 드러나지만 전체 화면에서는 거목/절벽을 압도하지 않으며 이동 표본 침범이 없다. A/B/C 앵커와 상세화 여유를 보존했다. 근거: [crystal-ground](../artifacts/jelly-oasis/modeling-review-before-crystal-v1/crystal-ground.png), [medium](../artifacts/jelly-oasis/modeling-review-before-crystal-v1/medium.png).
5. **P2 / 모바일 medium 프레이밍 WARN.** 390×844의 실제 touch viewport에서 shadow-off는 정상이나 기존 medium 카메라가 좌우 수관·아치·주변 바위를 일부 자른다. 모델 결함보다는 카메라/세로 화면 프레이밍 문제다. 향후 aspect에 따른 거리 조정을 검토할 수 있다. 모바일 두 캡처는 기본 10시 CLEAR이며 정오 비교 캡처로 해석하지 않는다. 근거: [mobile-overview](../artifacts/jelly-oasis/modeling-review-before-crystal-v1/mobile-overview.png), [mobile-medium](../artifacts/jelly-oasis/modeling-review-before-crystal-v1/mobile-medium.png).

뿌리는 거목에서 벽 상단으로 올라가 벽을 감싸고 끝이 지면으로 내려간다. 연결부의 각진 접합과 높이 변화가 보이지만 심각한 벽 관통/끊어짐은 검수 화면에서 발견하지 않았다. 근거: [root-ruin](../artifacts/jelly-oasis/modeling-review-before-crystal-v1/root-ruin.png). 전체 장면은 나무·절벽·유적·연못을 하나의 구도로 읽을 수 있고 앞쪽 여백과 순환 동선을 유지한다. [overview](../artifacts/jelly-oasis/modeling-review-before-crystal-v1/overview.png) 및 [medium](../artifacts/jelly-oasis/modeling-review-before-crystal-v1/medium.png) 참조.

## 기술·회귀 검사

| 검사 | 결과 |
|---|---|
| npm run lint | PASS |
| npm test -- --maxWorkers=2 | PASS: 52 files / 289 tests |
| npm run build | PASS: TypeScript + Vite production build |
| npm run qa:landmark | PASS: 21 captures, GLB HTTP 200, errors=[] |
| node scripts/pond-detail-browser-qa.mjs | PASS: POND_QA_VERSION=v2, 14 비교 captures, errors=[] |
| 추가 GLB·상세부 검수 audit.mjs | PASS: 16 production GLB, 상세부/낮밤/비/mobile 15 captures, errors=[] |

기존 QA의 LANDMARK_QA_URL과 LANDMARK_QA_PRODUCTION_URL은 모두 로컬 production preview 4183을 사용했다. 결과 경로는 기존 산출물을 덮어쓰지 않도록 이번 검수 폴더의 landmark/ 및 pond/로 분리했다. 기존 QA가 생성하는 비교 캡처는 재사용했으며 추가 blockout 전체 비교는 하지 않았다.

- 순환로 폭 6m: 5040 samples PASS. 공터 직경 16m: 3209 samples PASS. 아치 접근부: 4212 samples PASS. 중앙 통과 폭 4m: 1000 samples PASS. 실측 jamb 간격 **4.62m**. NavMesh/실제 충돌 검증은 아니다.
- 연못 v2 embedded 공유 guide: 57 positions(중심점 포함). 수면/오버레이/동선 제외 경계가 동일 pondGuide를 사용한다. 수면 높이 **-5.389069m**는 v1/v2 QA에서 동일. max lift **0.815m**, v2 max displacement **0.997m**. 이는 지면 적응 수치이며 그만큼 떠 있다는 뜻은 아니다.
- 낮: 태양 intensity 2.5 / castShadow=true. 자정 CLEAR: 달 intensity 0.65 / castShadow=true / map allocated=true. [night](../artifacts/jelly-oasis/modeling-review-before-crystal-v1/night.png). RAIN 표시 확인: [rain](../artifacts/jelly-oasis/modeling-review-before-crystal-v1/rain.png). shadow OFF와 touch 모바일 shadow-off QA 통과.
- pagehide 시 debug API/패널 제거 및 console 오류 없음. 기존 dispose는 geometry/material/texture Set으로 중복 해제를 방지하고 실패한 병렬 로딩은 allSettled 후 해제한다. 강제 GLB 404에서 명시적 오류와 지형 유지 QA 통과. 실제 GPU 메모리 누수 장시간 측정은 하지 않았다.
- 전체 기본 GLB의 큰 구멍/눈에 띄는 뒤집힌 면/심한 부유는 캡처에서 발견하지 않았다. 모든 삼각형의 manifold/방향 일관성 또는 애니메이션 중 z-fighting 부재를 증명하는 검사는 아니다.

| 동일 desktop overview QA 조건 | calls | rendered triangles |
|---|---:|---:|
| landmark 숨김 | 5 | 30768 |
| landmark 표시 | 99 | 63594 |
| shadow OFF | 68 | 38864 |

렌더 지표는 해당 카메라/그림자 패스 포함 값이며 GLB triangle 합계와 다르다. 이번에는 모델 변경이 없어 전후 자산 triangle 변화는 **0**. Headless Edge와 좁은 touch viewport를 사용했고 실기 모바일 FPS는 측정하지 않았다.

## 산출물 및 종료 상태

- 이 보고서, 검수 폴더의 glb-audit.json / blender-scene-audit.json / review-browser.json / landmark/browser-qa.json / pond/browser-qa.json, 캡처 PNG, 보존용 blend 사본 및 재실행용 audit.mjs/report.mjs.
- 코드·GLB·layout·원본 blend 변경 없음. 시작 전 blend 변경은 그대로 남아 있다. 로컬 master 유지, 커밋·push 없음.
- WARN 항목은 향후 개선 후보로 남긴다. 품질 게이트상 심각한 BLOCK은 발견하지 않았지만 **사용자 요청 범위에 따라 여기서 종료하며 Phase B는 미실행**이다.

# Jelly Oasis — 미관 개선 보고서 및 후속 작업안

작성일: 2026-10-10. 상태: **보고서 완료, 아래 개선 작업은 미실행.**

기존 모델링 검수에서 로딩·배치·동선의 BLOCK 결함은 발견하지 않았다. 남은 항목은 스타일 통일, 반복감 완화, 모바일 구도와 물 표현 개선이다. 이번에 완성한 Crystal Accent v1은 후속 미관 작업의 기준 후보로 사용한다.

근거는 [기존 전체 검수](jelly-oasis-modeling-review-before-crystal-v1.md)와 [Crystal v1 제작·검증 보고서](jelly-oasis-crystal-accent-detail-v1.md)다. 아래 우선순위는 화면에서의 영향과 작업 범위를 고려한 제안이며, 새로운 모델 결함을 확인했다는 의미는 아니다.

## 개선 순서

| 순서 | 대상 | 현재 관찰 | 제안 | 완료 기준 |
|---|---|---|---|---|
| 1 / P2 | 모바일 medium 구도 | 390×844에서 좌우 수관·아치·주변 바위가 잘림 | 세로 화면에서 aspect에 따른 거리·타깃 조정 후보 비교 | 주요 실루엣이 읽히고 지면 여백 확보, 데스크톱 구도와 이동 조작 정상 |
| 2 / P2 | 거목 줄기·가지 | Smooth 명암과 일부 잘린 막대 같은 가지 끝 | 줄기·가지만 국소 Flat 비교, 노출된 끝과 수관 접점 수정 | 바위·뿌리와 명암 스타일 일치, 가지 끝 정리, 거목 실루엣 유지 |
| 3 / P3 | 절벽 | 밝은 수평 띠 세 층의 연속 반복 | 일부 띠 높이·길이·명도와 큰 면의 흐름 차등화 | 수평 반복 완화, 폭포 홈과 한 덩어리 실루엣 유지 |
| 4 / P3 | 아치·벽 | 균일한 석재, 좁은 줄눈과 상단 작은 틈 | 일부 석재 길이·높이·모서리 손상 조정 | 풍화된 유적 인상 강화, 아치 연결부와 통과 공간 유지 |
| 5 / P3 | 연못 물가·수면 | 얇은 베이지 띠와 낮은 깊이감 | 물가 일부 두께·색 변화, 기존 수면 색·투명도 후보 비교 | 둑과 지형이 자연스럽게 이어지고 물 영역이 명확하게 읽힘 |

### 1. 모바일 구도

근거: [현재 모바일 medium](../artifacts/jelly-oasis/modeling-review-before-crystal-v1/mobile-medium.png), [overview](../artifacts/jelly-oasis/modeling-review-before-crystal-v1/mobile-overview.png).

모델 배치보다 카메라를 먼저 조정한다. 세로 화면에서 medium 거리와 타깃 높이를 조절하되 너무 멀어져 랜드마크가 작아지거나 지형만 과도하게 보이지 않도록 비교한다. Crystal QA의 [mobile 후보](../artifacts/jelly-oasis/crystal-accent-detail-v1/detail-mobile.png)는 검수 카메라만 1.55배 멀리 둔 예시로, 제품에 그대로 적용할 확정값은 아니다.

후속 검수는 390×844, 더 좁은 세로 화면, 가로 모바일, 데스크톱의 같은 시간·날씨에서 한다. 리사이즈·화면 회전·카메라 프리셋 전환과 이동 입력도 확인한다. FPS 평가는 실제 기기에서 별도 측정해야 한다.

### 2. 거목 스타일과 가지 끝

근거: [수관 아래](../artifacts/jelly-oasis/modeling-review-before-crystal-v1/tree-under.png), [전체 medium](../artifacts/jelly-oasis/modeling-review-before-crystal-v1/medium.png).

현재 수관 7,680 triangles는 Flat, 줄기·가지 4,186 triangles는 Smooth다. 단순한 전체 Flat 전환은 작은 면의 명암을 과도하게 드러낼 수 있으므로, 줄기·가지 후보를 가까운 화면과 전체 구도에서 먼저 비교한다. 가지 끝은 수관 안으로 자연스럽게 이어지도록 끝부분 길이·방향 또는 해당 수관 접점만 수정한다. 수관 덩어리의 반복감은 이 수정 후에도 두드러질 때 일부 크기·방향·명도만 조정한다.

높이 약 28m, 주된 수관 실루엣, 원점·앵커·접지와 거목→뿌리 연결을 유지한다. Subdivision이나 전체 수관 재제작은 첫 개선 범위에 넣지 않는다.

### 3. 절벽의 띠 반복

근거: [절벽 정면](../artifacts/jelly-oasis/modeling-review-before-crystal-v1/cliff-front.png).

세 개 층을 모두 다시 만들기보다 일부 밝은 띠의 끝 위치, 높이와 길이를 달리해 연속적인 가로선부터 완화한다. 큰 암석 면의 방향과 명도 차이는 전체 구도에서 절벽의 덩어리를 읽는 데 필요한 만큼만 넣는다. 작은 장식이나 재질 분할을 늘리기 전에 기존 면과 재질로 해결 가능한지 확인한다.

폭포 홈·전체 높이·바닥 지지점과 연못 방향을 보존한다. 이 단계의 폭포 홈 수정과 실제 물줄기 효과 추가는 별개의 작업이다.

### 4. 유적 석재의 균일함

근거: [아치](../artifacts/jelly-oasis/modeling-review-before-crystal-v1/arch.png), [지면 시점](../artifacts/jelly-oasis/modeling-review-before-crystal-v1/ground.png), [뿌리와 벽](../artifacts/jelly-oasis/modeling-review-before-crystal-v1/root-ruin.png).

실루엣을 바꾸는 일부 석재와 모서리부터 손상 정도를 차등화한다. 모든 석재를 무작위로 비트는 방식은 피하고, 하중을 받는 아치 형태와 벽의 연결이 읽히도록 유지한다. 상단 작은 틈은 근접 화면에서 의도된 줄눈인지 어색한 단절인지 다시 비교한 뒤 해당 연결부만 조정한다.

아치 jamb 간격 약 4.62m와 중앙 4m 통과 영역을 유지한다. BrokenWall의 local X+4/Z+11은 현재 런타임에서 한 번만 적용되므로 Blender나 layout에 중복 반영하지 않는다. 뿌리가 감싸는 벽과의 접점도 함께 확인한다.

### 5. 연못 물가와 깊이감

근거: [연못 위](../artifacts/jelly-oasis/modeling-review-before-crystal-v1/pond-top.png), [폭포 방향](../artifacts/jelly-oasis/modeling-review-before-crystal-v1/pond-waterfall-facing.png).

먼저 얇게 보이는 물가 구간의 면 폭·색과 바위 연결을 국소 조정한다. shore는 지형 이음새 역할을 하며 Blender Smooth 228 polygons / GLB 비-Flat 456 triangles이므로 전체 법선을 일괄 바꾸기 전에 지형과의 경계를 비교한다.

수면은 기존 반투명 inspection plane이다. 색·투명도 조절로 지형이 지나치게 드러나는 인상을 완화할 수 있는지 우선 검토한다. 굴절·반사·깊이에 따른 색·물줄기·거품·파티클을 포함하는 물 시스템은 이 최소 개선과 분리해 별도 범위로 설계한다. 폭포 물줄기는 현재 없으며 누락 메시 복구 작업으로 취급하지 않는다.

연못 v2 공유 guide, 수면 높이 약 -5.389069m, 지형 적응·동선 제외 영역을 유지한다. 경계 수정이 guide에 영향을 준다면 시각 모델만 바꾸지 말고 수면·오버레이·동선이 같은 guide를 쓰는지 함께 검증한다.

## Crystal v1의 위치

A/B/C의 동일한 blockout 형태는 새 후보에서 높이·기울기·면 구성을 차등화했고, 발광은 군집당 3/102 triangles로 줄였다. 이 항목은 **후보 제작과 검증 완료**로 분류한다. 일반 화면은 기존 blockout을 유지하므로 기본 화면에서의 전환은 별도 적용 결정이 남아 있다. 후보는 `?debug&crystal=detail`에서 확인한다.

후보 자산 합계는 20,894 triangles로 기존 대비 +108이다. 같은 카메라에서 desktop draw calls +18, mobile +9가 관찰되었다. 후속 작업은 triangles뿐 아니라 재질 수와 그림자 패스 비용도 비교한다. 이번 결과로 실제 모바일 FPS가 검증되었다고 해석하지 않는다.

## 작업 방식과 공통 완료 기준

한 번에 모바일 구도 또는 모델 계열 하나씩 개선하고, 기존/후보를 동일 카메라·시간·날씨로 비교한다. 기본 화면 전환은 후보 검증 후 진행한다. 작업량 추정은 각 후보의 첫 비교 후 확정하며 현재 근거만으로 소요 시간을 단정하지 않는다.

- 보존: 기존 사용자 Blender 변경을 덮어쓰지 않고 후보 파일을 별도로 저장한다. 원점·scale 1·320×320m 월드·중심 X70/Z58·yaw 30°·16개 앵커를 유지한다.
- 메시: 수정 대상의 열린 면·뒤집힌 면·0면적·부유를 확인하고 GLB export/reimport 후 bounds·triangles·재질을 비교한다. Flat/Smooth는 대상별 의도를 기록한다.
- 접지·동선: 전체 contact와 배치 drift, 폭 6m 순환로·직경 16m 공터·아치 접근부·중앙 4m 통과 표본을 재검사한다. 표본 PASS는 실제 충돌 또는 NavMesh 보증과 구분한다.
- 화면: 전체·근접·낮·밤·비·shadow OFF·모바일을 비교한다. 모델을 정리하는 과정에서 거목·절벽·유적·연못의 시각적 위계가 바뀌지 않는지 확인한다.
- 통합: 해당 변경의 테스트, lint/build와 landmark 브라우저 QA를 통과한다. 자산 HTTP 200, 콘솔 오류 없음, 실패 시 지형 유지와 dispose/reload를 확인한다.
- 성능·보고: 같은 카메라에서 triangles·draw calls를 기록하고 기존 대비 증감을 설명한다. 후보 Blender/GLB·전후 캡처·검사 로그·변경 보고서를 함께 남긴다.

권장 첫 작업 묶음은 **모바일 카메라 후보 비교 → 거목 줄기·가지 국소 후보**다. 절벽·유적·연못은 이후 별도 후보로 진행해 전후 효과와 회귀 원인을 확인하기 쉽게 유지한다.

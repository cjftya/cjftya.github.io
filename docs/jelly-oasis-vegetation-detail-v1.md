# Jelly Oasis — Vegetation Detail v1 실행 결과

2026-10-12. 기준 master: `5d4d191c7ff013f2dedb0fe2a06921bcb7d89102`.

## 결과와 기본값

**절제형 A를 기본으로 적용한다.** 풀 120개, 관목 24개, 야생화 36개를 랜드마크 주변의 작은 군집에 배치했다. 정오 전체 시점에서는 거목·암벽·호수·유적의 실루엣이 유지되고, 지면 시점에서는 식생 3종이 구분된다. 아트 최종 판단은 **USER_REVIEW**다. 기본값과 A/B는 동일 시드(173101570)를 사용하지만 종간 간격 검사 때문에 A의 모든 종이 B의 부분집합인 것은 아니다.

| 설정           |  풀 | 관목 | 야생화 | 총 개체 | 식생 삼각형 | 본체 메시 |
| -------------- | --: | ---: | -----: | ------: | ----------: | --------: |
| Off 비교 기준  |   0 |    0 |      0 |       0 |           0 |   0 draws |
| A 기본 desktop | 120 |   24 |     36 |     180 |       4,812 |         3 |
| B 비교 desktop | 210 |   33 |     54 |     297 |       7,278 |         3 |
| A mobile       |  80 |   16 |     24 |     120 |       3,208 |         3 |

B는 요청한 관목 36개 중 33개만 배치했다. 목표의 최대 12배 후보 제한을 지켜 밀집 공간에 억지로 넣지 않았다. 종류별 source geometry는 grass 10 / shrub 80 / flower 47 triangles다. 공유 geometry·material 각각 3개, 새 이미지 텍스처 0개, 실시간 그림자 투사 0개다. 꽃의 색은 잎·줄기와 분리한 연보라/노랑 vertex color이며 emissive는 사용하지 않는다.

## 구현과 보호 규칙

- `vegetationConfig.ts`: 고정 seed, A/B/off 수량, 종별 최대 수평 반경·크기·경사 기준. 생산 URL의 식생 쿼리는 무시한다.
- `vegetationPlacement.ts`: 군집 생성, 실제 호수 polygon + 1m + 개체 반경 보호, 6m 순환로와 안전 여유, 16m 공터, 가이드 기반 아치 접근로, 4m 통과 구간과 양끝 여유, 월드 경계·경사·종간 간격 검사.
- GLB 개별 삼각형 중 실제 지면 -0.5m ~ +1.3m 높이 구간과 만나는 면의 로컬 XZ 박스를 보수적으로 보호한다. 나무 수관 전체 AABB를 쓰지 않는다. 박스 방식은 실제 삼각형보다 넓게 배제할 수 있지만 겹침을 허용하기 위한 근사는 아니다. 정적 배치 시에만 계산한다.
- `createVegetation.ts`: 접힌 뾰족한 잎 묶음, 낮은 3덩어리 관목과 줄기, 줄기·잎·작은 꽃머리. Flat 면, 불투명 geometry, 3개의 `InstancedMesh`, 정적 instance matrix/color.
- `createOvergrownRuin.ts`: 식생을 root 자식으로 소유하고 **모델 접지·호수 굴착·water rebuild 이후** `place()`에서 재계산한다. 실제 `sampleGround` 사용, 1.5cm 뿌리 묻힘. isolate·material refresh·dispose 연동. geometry/material/instance buffers는 식생 소유자가 한 번만 해제한다.
- mobile은 같은 desktop 배치의 종별 순서에서 3개 중 2개를 안정적으로 선택한다. 다른 시드나 프레임별 재생성을 사용하지 않는다.
- debug만 `?debug&vegetation=off|density-a|density-b` 및 snapshot/검수 좌표 API를 제공한다. 생산 설정 UI 추가 없음.

기존 지형·물 구현·날씨·시간·카메라 설정과 16개 GLB는 그대로 유지했다. 수정한 기존 소스는 `createOvergrownRuin.ts`, `main.ts` 두 파일의 식생 연결 부분뿐이다.

## 검증

**PASS — 자동 검사:** 린트, 전체 59개 test files / 314 tests, TypeScript 검사와 production build. 식생 전용 검사는 실제 16개 GLB를 로드한다. 같은 seed/placement의 재현성, 다른 seed의 변화, 호수·통로·기단 배제, 실제 굴착 지면 접지, matrix 높이, basin/west/north 및 회전·축소 placement, 중복 메시 없음, 형상 유한 좌표/정상 법선/0면적 없음/반경 상한, 모바일 동일 master subset, A/B 예산, isolate, double dispose 안전을 확인했다. 기존 `auditLandmark`의 loop/clearing/approach/passage도 PASS다.

**PASS — production preview 브라우저:** Chromium 143 + SwiftShader, 1440×900 / 390×844 / 360×780 / 844×390. debug Off/A/B 동일 camera·CLEAR·12시, 근접 3종, 정오/자정/RAIN/MIST, 16개 GLB, 일반 진입과 debug 쿼리 무시, Reset, 격리/복원, 3회 rebuild의 geometry/texture 수 유지, WebGL loss/restore, BFCache persisted pagehide/pageshow, 사이트 변경, CPU fallback 및 GLB 404 알림. 정상 시나리오의 pageerror/console error 0개. 404 시나리오의 로드 오류는 의도된 오류다. 실제 수면 높이 해법과 rain impulse가 유지되는지 확인했다.

브라우저 결과는 [`browser-qa.json`](../artifacts/jelly-oasis/vegetation-detail-v1/browser-qa.json)에 남겼다. screenshot과 snapshot은 동일 검수 실행에서 수집했다.

## 성능 수치의 해석

1440×900 / CLEAR / 12시 / medium 고정 카메라의 `renderer.info.render` snapshot:

| 비교 | calls | triangles |
| ---- | ----: | --------: |
| Off  |    34 |    64,561 |
| A    |    40 |    74,185 |
| B    |    40 |    79,117 |

식생 자체는 본체 **+3 draws**, A **4,812 triangles**다. 위 snapshot에는 기존 수면 반사/굴절 캡처를 거친 렌더 통계가 섞여, 관측 증가량은 **+6 calls / +9,624 triangles**다. Three.js의 nested render 통계를 전체 GPU 프레임 비용이나 본체 비용으로 동일시하지 않는다. 그림자 투사는 꺼져 있다. 단일 renderCpuMs 표본은 SwiftShader 실행 잡음이 커서 성능 향상/실기 FPS 판단에 사용하지 않는다.

**NOT_TESTED:** 실물 Galaxy Fold/실제 모바일 GPU FPS, 장시간 GPU 메모리 측정, 비복귀 일반 pagehide의 브라우저 강제 종료 후 GPU 관찰. CPU 자원 소유권/반복 해제는 자동 검사로 확인했다. 브라우저 에뮬레이션에서 geometry/texture 수가 안정적인 것을 장시간 leak 부재의 증명으로 확대하지 않는다.

## 화면 검수와 한계

**PASS(구현자 검수):** 정오와 지면 시점에서 식생은 3종으로 구분되며 호수·공터·아치 앞 통로와 큰 랜드마크 실루엣을 보존한다. 풀·꽃은 sparse 군집이고 관목은 작은 다면체다. 수면 충격 시야를 막지 않는다. 밤에는 자연스럽게 어두워지고 Crystal과 발광 경쟁이 없다. 비·안개에서도 형상이 유지된다.

**WARN:** 전체 원경에서는 작은 풀·꽃이 점으로 보이고 야간에는 대비가 낮다. 새 야간 발광·기존 카메라 확대를 추가하지 않았다. 캡처 환경에 한글 폰트가 없어 일부 기존 UI 문자가 빈 사각형으로 보이며, 식생 코드에서 글꼴이나 UI를 변경하지 않았다. 원경의 식생 강조나 꽃의 추가 형태 개선은 사용자 화면 확인 뒤 판단한다.

**USER_REVIEW:** 새 풀·관목·야생화의 모양/색 및 절제형 A의 밀도. B는 디버그 비교용으로만 남긴다. 다음 후보는 필요 시 군집 중심과 꽃머리 실루엣의 소규모 조정이며, Blender·바람·생물·충돌 시스템을 이번 범위에 포함하지 않았다.

## 캡처

- 동일 시점 A/B: [A medium](../artifacts/jelly-oasis/vegetation-detail-v1/density-a-medium.jpg), [B medium](../artifacts/jelly-oasis/vegetation-detail-v1/density-b-medium.jpg), [Off medium](../artifacts/jelly-oasis/vegetation-detail-v1/off-medium.jpg), 각 ground 캡처.
- 근접: [풀](../artifacts/jelly-oasis/vegetation-detail-v1/prototype-grass.jpg), [관목](../artifacts/jelly-oasis/vegetation-detail-v1/prototype-shrub.jpg), [야생화](../artifacts/jelly-oasis/vegetation-detail-v1/prototype-flower.jpg).
- [밤](../artifacts/jelly-oasis/vegetation-detail-v1/night.jpg), [비](../artifacts/jelly-oasis/vegetation-detail-v1/rain.jpg), [안개](../artifacts/jelly-oasis/vegetation-detail-v1/mist.jpg), mobile390/mobile360/landscape, production, Reset, restore 캡처 포함.

브라우저 QA 재실행: `OASIS_QA_BROWSER=/path/to/chromium node scripts/vegetation-browser-qa.mjs` (`npm run build` 이후). 브라우저 경로가 없으면 Playwright 설치 경로 또는 `/tmp/chromium`을 사용한다. 브라우저 binary와 임시 전체 PNG는 커밋하지 않고 소형 JPEG와 JSON만 제출한다.

## 원격 CI 보정

첫 원격 실행은 313/314 통과 후 기존 opt-in waterfall-flow-rebuild 검사가 30초 제한으로 실패했다. 물 전용 fixture는 식생을 `off`로 명시하고, off refresh는 불필요한 GLB 접지 footprint 계산을 생략한다. 기존 물 검사 assertion과 30초 제한은 그대로 유지했다. 식생+기본 호수 조합은 새 실제 GLB 통합 테스트 및 GPGPU/CPU 브라우저 QA에서 계속 검사한다. 생산 기본 A와 렌더 결과는 변경하지 않았다.

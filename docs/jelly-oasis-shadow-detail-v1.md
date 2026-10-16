# Jelly Oasis v1 마지막 마감 — 그림자와 주변 디테일

기준: master `633f3e22288d02a4b8c5750ec5ecece3f576d3f1` · 작업일 2026-10-16

## 변경 결과

- **그림자:** 카메라 거리마다 움직이고 확대/축소되던 직교 투영을 섬 중심의 고정 범위로 바꿨다. 기본 224m 월드는 반폭 184m, 중심 높이 20m이며 지형의 모든 모서리와 높이 -60~100m를 포함한다. 192/320m 검사 월드도 같은 방식으로 계산한다. 근접 확대에서 수관/배경의 그림자 생성 물체가 투영 범위에서 빠지는 문제를 막고, 정지된 시간대에서 카메라 움직임 때문에 그림자 격자가 변하는 현상을 없앴다.
- **선명도와 접지:** 넓어진 고정 범위에 맞춰 데스크톱 2048, 모바일 1024 그림자 맵을 사용한다. normalBias는 0.12→0.08, bias는 -0.0001을 유지한다. 현 Three 버전이 지원하는 PCFShadowMap을 명시했다. 태양/달은 기존 임계값으로 교대하며 활성 그림자 맵은 최대 하나다. 기존 달빛 보조광은 그림자를 추가하지 않는다.
- **일반 나무:** 성목 수관을 더 입체적으로 만들고 직립형·기울어진형·낮게 갈라진형 3종을 섞는다. 어린 나무는 2종이다. 기존 배치 난수에서 형태를 결정하므로 재구성해도 동일하다. 모바일은 성목 2종을 사용한다. 기존 반경/높이 안에 들어가며 위치, 간격, 경사 제한은 그대로다.
- **경사면:** 기존 동쪽 두 곳과 서쪽 한 곳의 하층 식생 영역에 맞춰 넓은 이끼·흙 색 전환을 더했다. 기존 텍스처 표본을 재사용하며 추가 텍스처나 식생 밀어넣기는 없다.
- **유적:** 세계수 둘레 담장의 일부 상단과 무너진 끝에 비대칭 모서리 마모, 작은 깊이/너비 차이와 이끼색을 적용했다. 아치 구조와 담장을 넘는 뿌리 높이는 유지했다.

## 비교 화면

전체 구도 기준 화면은 [이전 낮 화면](../artifacts/jelly-oasis/final-art-polish-v1/desktop-day.png)이다.

| 시점      | 변경 전                                                                       | 변경 후                                                                   |
| --------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| 전체 낮   | [이전](../artifacts/jelly-oasis/final-art-polish-v1/desktop-day.png)          | [수정](../artifacts/jelly-oasis/shadow-detail-v1/desktop-day.png)         |
| 근접 낮   | [동일 시점](../artifacts/jelly-oasis/shadow-detail-v1/before-contact-day.png) | [수정](../artifacts/jelly-oasis/shadow-detail-v1/desktop-contact-day.png) |
| 전체 밤   | [이전](../artifacts/jelly-oasis/final-art-polish-v1/desktop-night.png)        | [수정](../artifacts/jelly-oasis/shadow-detail-v1/desktop-night.png)       |
| 모바일 낮 | [이전](../artifacts/jelly-oasis/final-art-polish-v1/mobile-day.png)           | [수정](../artifacts/jelly-oasis/shadow-detail-v1/mobile-day.png)          |

추가 검수: [숲/경사면](../artifacts/jelly-oasis/shadow-detail-v1/desktop-grove-day.png), [근접 밤](../artifacts/jelly-oasis/shadow-detail-v1/desktop-contact-night.png), [멀리서 본 새벽](../artifacts/jelly-oasis/shadow-detail-v1/desktop-wide-dawn.png), [황혼](../artifacts/jelly-oasis/shadow-detail-v1/desktop-dusk.png), [모바일 밤](../artifacts/jelly-oasis/shadow-detail-v1/mobile-night.png), [모바일 황혼](../artifacts/jelly-oasis/shadow-detail-v1/mobile-dusk.png).

## 비용과 한계

| 항목                             |            이전 |            이번 |
| -------------------------------- | --------------: | --------------: |
| 데스크톱/모바일 scenery 인스턴스 |       290 / 243 |       290 / 243 |
| scenery draw 수                  |           6 / 6 |           9 / 8 |
| scenery 삼각형                   | 57,980 / 48,324 | 58,292 / 50,092 |
| scenery 텍스처                   |               0 |               0 |
| 활성 그림자 맵 최대 수           |               1 |               1 |
| 그림자 맵 해상도                 |      1024 / 512 |     2048 / 1024 |

삼각형 증가는 scenery 기준 약 0.54%/3.66%다. 그림자 맵 픽셀 수는 4배이며 실제 GPU 메모리/처리 비용도 증가한다. 고정 범위는 줌 안정성과 전체 그림자 유지에 유리하지만 극단적인 확대에서도 그림자 해상도가 추가로 높아지지는 않는다. 시간 흐름에 따른 광원 회전은 계속되므로 모든 종류의 그림자 앨리어싱을 제거한 것은 아니다.

검수는 Chromium 153 + SwiftShader에서 수행했다. 모바일은 412×915 터치 에뮬레이션이며 실기기 FPS/발열 측정은 아니다. PCF 맵 비용 증가의 실기기 영향은 출시 후 확인할 항목이다. 위 draw/삼각형 수는 scenery 자체 카운터이며 후처리의 마지막 패스 수치를 전체 장면 성능으로 사용하지 않았다.

## 검증

- 관련 Vitest 4개 파일, **20개 테스트 통과**: environment, night-weather, scenery, sacred-lake.
- 태양/달의 7개 시간 각도, 3개 월드 크기에서 지형 모서리와 높은 생성 물체가 그림자 클립 범위 안에 들어가는지 검증. 카메라 거리 5~1050에서 투영 행렬·중심·광원 방향 유지.
- 나무 모든 변형의 실제 정점이 기존 배치 반경/높이를 지키는지 확인. 실제 GLB/지형의 배치, 통로, 접지, 재구성, dispose 회귀 테스트 통과.
- `npm run build` 통과(TypeScript 검사 포함), 변경 파일 ESLint와 `git diff --check` 통과.
- 데스크톱/모바일 낮·황혼·밤 6개 화면 및 근접 낮/밤·숲·넓은 새벽 4개 화면 확인. 브라우저 오류 0, 물 GPU 오류 없음.
- 실제 마우스 회전/휠 확대, 5.5→6.5→18→19→20→0→12시 전환 확인. 투영 범위 고정, 활성/할당 그림자 맵 최대 1, 낮·밤 광원 교대 유지.
- 관측 결과와 카메라 좌표: [results.json](../artifacts/jelly-oasis/shadow-detail-v1/results.json). 이전 근접 검수: [before-results.json](../artifacts/jelly-oasis/shadow-detail-v1/before-results.json).

재현: `node scripts/shadow-detail-browser-qa.mjs`. 필요할 때 `OASIS_QA_BROWSER`, `OASIS_QA_SOFTWARE=1`, `OASIS_QA_FONT_CSS`로 검수 환경을 지정한다. 폰트 주입은 검수 전용이며 제품 소스나 의존성은 바꾸지 않는다.

## 반영 상태

작업 브랜치 `codex/oasis-v1-shadow-detail`에 구현과 검수 기록을 저장한다. 이 작업에서는 master 배포를 실행하지 않는다.

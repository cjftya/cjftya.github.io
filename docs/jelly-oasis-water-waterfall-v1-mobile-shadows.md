# Jelly Oasis — Water & Waterfall v1 · 모바일 그림자 · 전 방향 카메라 실행 결과

2026-10-11. **구현·기술 검증 PASS.** 물/폭포는 독립 디버그 후보로 유지하며, 모바일 그림자와 전 방향 카메라는 작업 브랜치의 일반 기본 동작으로 적용했어요. `master` 및 GitHub Pages에는 아직 반영하지 않았어요.

## 버전과 범위

- 시작 `origin/master`: `a20893ced58f84d55aab0e88bace074606497dae`.
- 작업 브랜치: `work/jelly-oasis-water-camera-v1`.
- 원격 구현 커밋: `1ff9134cf85c59bce973b080a1918a70bb009eaa`. 검수 자료·문서는 후속 커밋에 포함하며 최종 HEAD는 완료 응답/PR에서 확인할 수 있어요.
- 선행 미관 개선의 refined 거목·물가·절벽 및 soft 수면이 실제 기본값인 것을 확인했어요. `fd46b393` 시점의 옛 색/투명도를 일반 기준선으로 되돌리지 않았어요.
- 기존 GLB·Blender 소스·layout.json은 변경하지 않았고, Blender 실행/MCP 없이 Three.js에서 구현했어요.

## 단계별 판정

| 단계 | 판정 | 검증 근거 |
|---|---|---|
| 0 기준선 | PASS | 최신 master, 1440×900 및 390×844 정오/자정·medium/폭포/연못 위 8장과 좌표·접지·동선 JSON 저장 |
| 1 수면 | PASS / 미관 WARN | 공유 pond geometry와 soft 재질을 유지하고 diffuse 색만 약하게 이동. 시각 변화는 의도적으로 작아 미관 채택은 사용자 검토 대상 |
| 2 폭포 | PASS / 미관 WARN | 현재 절벽 GLB 표면을 실제 raycast해 리본 1개 구성. 절벽 홈→지면 흐름→공유 연못 연결. 포말 없이 단순한 착수 끝단이므로 후속 연출 개선 여지 있음 |
| 3 모바일 그림자 | PASS | 512×512, 정오 Sun/자정 Moon 실제 caster·map 및 화면, OFF/ON·복구 확인 |
| 3A 카메라 | PASS | 실제 마우스/터치로 양극 방향·360° 이상 회전, 정오 태양·자정 달 화면 중심 도달. 줌·핀치·리셋·회전 검증 |
| 4 회귀 | PASS | lint, 52파일/294테스트, build, landmark/pond v2/ruin-night 및 전용 브라우저 QA 통과 |
| 5 리뷰 | READY | 후보 비교와 검수 근거 기록. master push·물/폭포 기본 채택은 별도 사용자 리뷰 단계 |

## 수면과 폭포

`?debug&water=v1`, `?debug&waterfall=v1`로 각각 선택할 수 있어요. 둘을 함께 사용하는 URL은 `?debug&water=v1&waterfall=v1`이에요. `waterfall=off` 또는 인자 생략은 기존 폭포 없는 상태를 유지해요.

일반 페이지는 계속 refined 자산 + soft 수면 `#568f96 / opacity 0.76 / roughness 0.85`를 사용해요. 기존 `?debug&water=baseline`은 옛 `#639b9c / 0.65` 비교 기능을 유지했으며, 이번 주 비교는 **현재 일반 soft → v1**이에요. `water=deep`, Crystal detail 등 기존 쿼리도 유지했어요. debug 없는 `?water=v1&waterfall=v1`은 화면을 바꾸지 않으며 픽셀 동일 검증을 통과했어요.

수면은 기존 MeshStandardMaterial의 조명·안개·그림자를 유지한 채 `onBeforeCompile`로 작은 diffuse 패턴만 움직여요. 정점·외곽·수위를 바꾸거나 수면을 이중 적재하지 않아요. 폭포는 flat-shaded 리본 1개, **122 triangles / 추가 draw call 1개 / 이미지 텍스처 0개**예요. 리본의 누적 경로 거리로 패턴을 이동시켜 수직 낙하와 하단 흐름의 방향을 연결했어요. 별도 광원·파티클·렌더 타깃·물리 엔진은 추가하지 않았어요.

기존 Waterfall_Drop_Guide의 위치를 완전한 흐름 경로로 사용하지 않았어요. 실제 적용 refined 절벽과 지형 접지를 기준으로 표면을 확인하고 공유 pond geometry에 raycast해 착수점을 찾았어요. 기본 배치의 경로 표본은 62개이며 상승 구간은 없어요. 시작은 현재 절벽 중앙 홈의 입구이고, 착수 Y는 기존 수면 +0.035m예요. 작은 간격은 수면과 리본의 z-fighting을 피하기 위한 효과 메시 간격이에요.

| 장면 | 현재 soft | v1 후보 |
|---|---|---|
| 정오 폭포 방향 | [soft](../artifacts/jelly-oasis/water-waterfall-v1/desktop-soft-waterfall.png) | [물·폭포 v1](../artifacts/jelly-oasis/water-waterfall-v1/desktop-v1-waterfall.png) |
| 자정 | [soft](../artifacts/jelly-oasis/water-waterfall-v1/desktop-soft-night.png) | [v1](../artifacts/jelly-oasis/water-waterfall-v1/desktop-v1-night.png) |
| 연못 위 | [soft](../artifacts/jelly-oasis/water-waterfall-v1/desktop-soft-pond-top.png) | [v1](../artifacts/jelly-oasis/water-waterfall-v1/desktop-v1-pond-top.png) |
| 모바일 | [soft](../artifacts/jelly-oasis/water-waterfall-v1/mobile-soft-waterfall.png) | [v1](../artifacts/jelly-oasis/water-waterfall-v1/mobile-v1-waterfall.png) |

기존 `frame()`의 dt를 사용해요. reduced-motion에서는 정지하고, 후보가 숨겨지거나 개별 자산 검수로 제외되면 효과 업데이트를 멈춰요. pagehide 종료와 WebGL 복구도 확인했어요. 셰이더/geometry/material은 기존 landmark의 자원 정리 경로에 포함돼요.

## 모바일 그림자

`main.ts`와 `EnvironmentController.ts`의 모바일 강제 OFF 제한을 제거했어요. 모바일 512×512, 데스크톱 1024×1024이며 Sun/Moon 설정은 같아요. 단일 caster 전환·히스테리시스·비활성 맵 해제·shadow focus/texel snapping·bias 및 기존 수관 caster 제외 정책은 유지했어요.

390×844, 360×780, 844×390에서 일반 초기 그림자가 ON이에요. 정오 Sun, 자정 Moon의 실제 map allocation과 castShadow를 확인했고, OFF에서는 양쪽 map과 caster가 해제돼요. 복구 후에도 선택된 시간과 그림자가 유지돼요. 기존 모바일 OFF를 정상으로 보던 QA와 map-size 기대값을 이번 정책에 맞게 수정했어요.

[모바일 Moon 그림자](../artifacts/jelly-oasis/water-waterfall-v1/mobile-moon-shadow.png), [OFF 비교](../artifacts/jelly-oasis/water-waterfall-v1/mobile-shadow-off.png), [가로 화면](../artifacts/jelly-oasis/water-waterfall-v1/mobile-844x390.png).

## 전 방향 카메라

원인은 일반 초기/Reset 및 landmark 프리셋의 상하 제한이 하늘 방향을 막고 있던 것이에요. sky 자체는 이미 카메라 상대 좌표·안쪽 면·clip 범위로 정상 표시돼 별도 천체 렌더링 수정은 하지 않았어요.

OrbitControls 상하 범위를 **0.01 ~ π−0.01 rad**로 확장했고 좌우 회전은 제한 없이 유지해요. 카메라가 지형에 닿으면 eye와 pivot을 같이 올려 시선 각도를 보존하므로, 높이 보정이 하늘 보기 입력을 다시 막지 않아요. 일반 수평 pan 범위는 월드 중심 반경 115.2m로 제한하며, 지형 따라가기는 수평 이동의 높이 차만 적용해 높아진 하늘 pivot을 강제로 내리지 않아요. 최초/Reset 구도, 기본 줌 35~1050m, 줌 속도와 기존 제스처는 유지했어요. 정확한 극점을 피해서 반전을 방지해요.

검수 카메라 API로 천체를 강제 지정하지 않고 실제 마우스/CDP 터치 입력을 보내 정오 태양과 자정 달을 화면에 넣었어요. 시선과 천체 방향 내적은 PC·모바일 모두 **0.99999 이상**이에요. 좌우 누적 회전은 PC 약 11.98rad, 모바일 약 8.88rad로 각각 한 바퀴를 넘었고, 양쪽 극점까지 실제 입력으로 도달했어요.

| 조작 검증 | PC | 모바일 |
|---|---|---|
| 태양 | [마우스 드래그](../artifacts/jelly-oasis/water-waterfall-v1/desktop-sun-input.png) | [터치 드래그](../artifacts/jelly-oasis/water-waterfall-v1/mobile-sun-input.png) |
| 달 | [마우스 드래그](../artifacts/jelly-oasis/water-waterfall-v1/desktop-moon-input.png) | [터치 드래그](../artifacts/jelly-oasis/water-waterfall-v1/mobile-moon-input.png) |

모바일 핀치로 orbit 거리 약 **942.69→626.46m**, 극단적 wheel 입력에서 **35/1050m** 제한을 확인했어요. 일반 페이지 실제 드래그가 화면을 바꾸고, Reset 후 화면이 최초 화면과 픽셀 단위로 동일한 것도 확인했어요. 리셋 버튼 hover를 제거한 상태로 비교했어요.

## 보존과 성능

320×320m 월드, X70/Z58·yaw30°·scale1, **16모듈 / 20,786 asset triangles**, 기존 BrokenWall 오프셋, 공유 연못 수위 **−5.389069482748612m**, 접지 기록과 loop/clearing/approach/passage 표본을 보존했어요. NavMesh·연속 물리 충돌까지 보증하는 검사는 아니에요.

아래는 동일한 모바일 에뮬레이션·고정 카메라·정오 CLEAR에서 12개 표본의 중앙값이에요. **헤드리스 소프트웨어 렌더링의 CPU 제출 시간**이며 GPU 시간이나 실제 휴대전화 FPS가 아니에요.

| 구성 | calls | rendered triangles | geometries | textures | render CPU ms | frame CPU ms |
|---|---:|---:|---:|---:|---:|---:|
| soft · shadow OFF | 19 | 34,524 | 67 | 3 | 0.80 | 0.90 |
| soft · shadow ON | 50 | 59,254 | 67 | 5 | 1.65 | 1.70 |
| v1 · shadow OFF | 20 | 34,646 | 68 | 3 | 0.70 | 0.70 |
| v1 · shadow ON | 51 | 59,376 | 68 | 5 | 0.90 | 0.95 |

warm-up·캐시·실행 환경 차이 때문에 v1의 CPU 중앙값이 더 낮다는 것을 성능 개선으로 해석하지 않아요. 그림자 비용은 calls만으로 평가하지 않아요. **실기 30fps·GPU 시간·장시간 발열/누수는 미측정**이에요. 기존 30fps 모바일 예산과 DPR 정책은 유지했어요.

## 실행한 검증

| 검사 | 결과 |
|---|---|
| `npm run lint` | PASS |
| `npm test -- --maxWorkers=2` | PASS · 52 files / 294 tests |
| `npm run build` | PASS · TypeScript + production Vite build |
| `npm run qa:landmark`에 해당하는 landmark 스크립트 | PASS |
| `node scripts/pond-detail-browser-qa.mjs` (`POND_QA_VERSION=v2`) | PASS |
| `node scripts/ruin-night-browser-qa.mjs` | PASS |
| `node scripts/water-camera-browser-qa.mjs` | PASS · 41개 상태, GLB 응답 256개 모두 200, console/page errors=[] |
| `node scripts/water-camera-interaction-qa.mjs` | PASS · 핀치·줌 경계·숨긴 효과 정지/복귀·pagehide·일반 쿼리/입력/Reset |

새 QA는 production preview를 자식 프로세스로 시작할 수 있어요. 기존 QA는 실제 환경 변수와 preview URL을 지정해 실행했어요. 브라우저 실행 파일은 `LANDMARK_QA_BROWSER`, 느린 검증 환경의 기존 QA 대기는 `LANDMARK_QA_TIMEOUT_MS=120000`으로 지정했어요. headless Chromium 141을 사용했고 저장소의 Playwright 버전은 변경하지 않았어요.

초기 QA의 실패는 검증 중 dist 재빌드로 생긴 stale asset 404, 소프트웨어 렌더링의 날씨 전환 대기 시간, 기존 pageshow 검사의 고정 200ms 대기, 테스트에서 bubble되지 않은 select 이벤트 및 Reset 버튼 hover 차이였어요. 각각 원인을 특정해 테스트 흐름/상태 대기/입력 이벤트/캡처를 보정했고 제품의 날씨 전환 시간은 바꾸지 않았어요. 최종 검증에는 해당 실패가 남아 있지 않아요. 캡처의 한글 시스템 폰트는 이 Linux 환경에 없어 네모로 표시되지만 UI 텍스트 코드는 변경하지 않았어요.

전체 상태는 [browser-qa.json](../artifacts/jelly-oasis/water-waterfall-v1/browser-qa.json), 추가 조작은 [interaction-qa.json](../artifacts/jelly-oasis/water-waterfall-v1/interaction-qa.json), 회귀 명령 결과는 [regression/results.json](../artifacts/jelly-oasis/water-waterfall-v1/regression/results.json)과 각 실행 로그에 있어요. 기존 과거 보고서와 검수 자료는 보존했어요.

## 남은 리뷰와 Git

- 수면 잔물결은 작고 폭포 착수 끝은 단순해요. 미관 최종 채택과 추가 포말/끝단 연출은 이번 리뷰에서 결정할 수 있어요.
- 실기 모바일 장시간 성능 측정은 다음 검수로 남겨요.
- 원격 작업 브랜치에 구현·검수 자료를 기록하고 draft PR로 검토할 수 있게 준비해요.
- 계획서의 승인 정책대로 **master push와 새 수면/폭포 일반 기본값 전환은 아직 하지 않아요**. 모바일 그림자/카메라는 해당 브랜치를 병합하면 일반 기본값에 적용돼요.

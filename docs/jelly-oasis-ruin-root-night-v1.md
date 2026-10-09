# Jelly Oasis — Ruin + Root Detail v1 / Night Environment v1

2026-10-09. 작업 브랜치: `feature/jelly-oasis-ruin-root-night-v1`.
`origin/master`를 fetch해 기준 `eed7deb`와 일치함을 확인한 뒤 분기했다.
master merge/push는 하지 않았다. 상세 GLB 다섯 개가 기본값이며
`?debug&ruin=blockout`으로 기존 유적·뿌리와 비교한다.
`?debug&cliff=blockout`은 기존 절벽 비교 기능을 유지한다.

2026-10-10 마무리 시 다시 fetch한 `origin/master`도 `eed7deb`였다.
자산 커밋은 `9a03320`, 런타임·테스트 커밋은 `81f9893`이다.
이 문서와 비교 캡처·브라우저 QA는 이어지는 별도 검증 커밋에 보관한다.

## 자산과 보존

원본 live scene은 Cliff Detail v1을 포함한
`artifacts/jelly-oasis/cliff-detail-v1/jelly-oasis-cliff-detail-v1.blend`였다.
원본을 덮어쓰지 않고 다음 파일을 만들었다.

- [작업 전 씬 백업](../artifacts/jelly-oasis/ruin-root-night-v1/source-preserved.blend)
- [상세 모델 작업 씬](../artifacts/jelly-oasis/ruin-root-night-v1/jelly-oasis-ruin-root-detail-v1.blend)
- [Blender topology / 재임포트 audit](../artifacts/jelly-oasis/ruin-root-night-v1/mesh-audit.json)
- [최종 GLB audit / 원본 SHA-256](../artifacts/jelly-oasis/ruin-root-night-v1/glb-audit.json)

기존 GLB 다섯 개와 Cliff Detail v1은 기준 커밋의 바이너리와 일치한다.
`layout.json`은 JSON 내용이 일치한다(Windows checkout의 CRLF 차이는 제외).
추가 이미지 텍스처와 추가 root module은 없다. 돌은 크기와 줄눈 위치를
비대칭으로 조정하고 모서리를 잘라냈으며, 주 뿌리는 곡선·타원 단면·점진적
굵기 변화로 벽을 감싸도록 새로 만들었다. 예산 하한을 맞추는 세분화는 하지 않았다.

각 파일은 `public/assets/jelly-oasis/landmarks/overgrown-ruin/`에 있다.

| 파일 | 전 → 후 삼각형 | primitive / 재질 | 바이트 | Blender 크기 X/Y/Z (m) |
|---|---:|---:|---:|---|
| `Ruin_Arch_A_Detail_v1.glb` | 924 → 1,046 | 3 / 3 | 62,584 | 8.916 / 2.486 / 9.495 |
| `Ruin_Wall_A_Detail_v1.glb` | 440 → 500 | 2 / 2 | 34,736 | 8.200 / 2.001 / 4.987 |
| `Ruin_BrokenWall_A_Detail_v1.glb` | 396 → 450 | 2 / 2 | 37,376 | 7.715 / 4.530 / 5.611 |
| `Root_Large_A_Detail_v1.glb` | 356 → 740 | 1 / 1 | 62,264 | 5.353 / 12.222 / 5.974 |
| `Root_Tree_Base_Blockout_Detail_v1.glb` | 76 → 256 | 1 / 1 | 58,768 | 3.483 / 9.211 / 2.490 |

랜드마크 전체는 **9,044 → 9,844 triangles (+800)**다.
원점 변화는 모두 0, scale은 모두 `(1,1,1)`이다. GLB node transform은
identity이며 Blender `(X,Y,Z)`는 glTF `(X,Z,-Y)`로 변환된다.
최종 GLB를 Blender에 재임포트해 치수·삼각형 수를 대조했다.
비다양체 edge, 느슨한 정점, 중복 정점, 면적 0 face, 불일치 winding은 모두 0이다.
재사용 가능한 닫힌 돌 조각의 맞닿는 내부 면은 유지한다. 단일 union mesh로 합치지 않았다.

마지막 live MCP export audit 응답은 300초 제한을 초과했지만 Blender 작업 자체는
계속되어 audit와 `.blend` 저장을 완료했다. 이후 MCP scene 조회로 정상 응답과
36개 오브젝트(원본 및 새 5개 mesh 포함)를 확인했다. 열린 앱을 강제 종료하거나
새 빈 씬으로 대체하지 않았다. 별도 background Blender의 추가 재임포트 확인도 수행했다.

## 실제 배치와 연결

Terrain Surface v2 320×320m, 랜드마크 X70/Z58, yaw 30°, scale 1을 유지한다.
파손 벽의 local X+4/Z+11은 런타임에서 한 번만 적용한다. Blender 비교 렌더에서는
그에 대응하는 X+4/Y−11을 임시 적용하고 다시 되돌렸다.
절벽·나무 전체·연못·공터는 옮기지 않았다.

개별 접지 후 생기는 뿌리 연결부 높이 차이는 root mesh에만 보정한다.
원본 vertex를 보존하고 나무 받침 → 공유 연결점 → 벽 상단 → 지면에 묻힌 끝의
높이를 보간한다. 모듈 anchor는 유지하며 반복 배치 시 누적 변형이 없다.
실제 GLB 테스트에서 두 root의 접합 표면 간 최근접 거리는 0.35m 미만이고,
서쪽 지역으로 이동한 뒤 분지로 복귀한 vertex 배열이 원래 결과와 일치한다.

표본 기반 audit 결과:

- 아치 기둥 간 **4.62m**, 중앙 4m 통로 1,000 표본 교차 없음.
- 폭 **6m** 순환로 5,040 표본 교차 없음.
- 직경 **16m** 공터 3,209 표본 교차 없음.
- 아치 접근로 4,212 표본 교차 없음.
- Cliff 접지 높이 −5.671586m, pond 높이 −5.389069m 유지.

이는 0.08–3m 높이의 투영 GLB 삼각형 표본 검사다. 연속 collision/NavMesh 보장은 아니다.

## 달, 그림자, 날씨

`createSky.ts`의 기존 dome에 texture 없는 moon disc와 작은 halo를 추가했다.
스카이를 먼저 그린 뒤 지형/오브젝트가 덮으므로 달이 지형 뒤로 가려진다.
공통 `moonDirection`을 태양 방향의 반대쪽으로 계산하고 shader와 기존
Moon DirectionalLight에 함께 사용한다. `moon.target`도 씬에 포함한다.
지평선 높이 smoothstep, night 값, 날씨 감쇠를 곱해 빛과 원반을 함께 약화한다.
안개는 halo를 넓힌다. 월상·텍스처·추가 광원은 만들지 않았다.

Sun/Moon 모두 같은 focus, 45–230m half-span, texel snapping,
1024² map, bias −0.0001, normalBias 0.12를 사용한다.
약한 광량 구간의 0.035/0.055 hysteresis로 caster를 선택하며 동시에 하나만 활성화한다.
비활성 light의 shadow map은 해제한다. 모바일과 `setShadows(false)`에서는 둘 다 꺼진다.
context restore 후 현재 시각과 moon caster가 유지된다.

일반 카메라가 지형을 향하므로 높은 자정 달을 직접 볼 수 있게 환경 패널에
**하늘 보기**를 추가했다. 기존 **전체 보기**는 지형 카메라와 orbit 제한을 복원한다.
기존 시간·속도·재생 제어는 유지하며, 패널은 항상 노출되고 기본 접힘이다.

자동 날씨는 기본 ON, reduced-motion은 시계와 자동 날씨 모두 기본 OFF다.
새 seed를 한 번 만들고 `seededRandom` 스트림으로 **120–240초** dwell을 뽑는다.
모든 preset이 후보이며 같은 preset 연속 선택은 없고, 맑음↔구름↔흐림↔비 등
인접 조건의 가중치가 높다. 기존 **5초 profile blend**를 유지한다.
수동 선택은 현재와 같은 preset이어도 자동 OFF가 되고, 자동 재활성화는 현재
날씨를 유지한 채 새 dwell을 시작한다. 시간 정지와 독립적으로 누적된다.
별도 interval은 없으며 숨김/페이지 재진입 시 경과시간 폭주를 막는다.
기본 하루는 **960초(16분)**이고 0.25× / 1× / 4× / 12×를 유지한다.

## 화면과 성능 근거

모든 이번 결과는 [결과 폴더](../artifacts/jelly-oasis/ruin-root-night-v1/)에 있다.
Blender의 `blender-before/after-*` 18장은 동일 카메라 비교다.
브라우저 `before/after-*`는 동일 camera transform에서 모델만 바꾼 비교다.

| 확인 | 전 | 후 |
|---|---|---|
| 뿌리/서쪽 벽 | [before](../artifacts/jelly-oasis/ruin-root-night-v1/before-root-right.png) | [after](../artifacts/jelly-oasis/ruin-root-night-v1/after-root-right.png) |
| 아치 정면 | [before](../artifacts/jelly-oasis/ruin-root-night-v1/before-arch-front.png) | [after](../artifacts/jelly-oasis/ruin-root-night-v1/after-arch-front.png) |
| 아치 지상 | [before](../artifacts/jelly-oasis/ruin-root-night-v1/before-arch-ground.png) | [after](../artifacts/jelly-oasis/ruin-root-night-v1/after-arch-ground.png) |
| 야간 medium | [이전 마일스톤](../artifacts/jelly-oasis/cliff-detail-v1/after-medium-night.png) | [moon shadow](../artifacts/jelly-oasis/ruin-root-night-v1/environment-night.png) |

[좌측 뿌리](../artifacts/jelly-oasis/ruin-root-night-v1/after-root-left.png),
[지상 뿌리](../artifacts/jelly-oasis/ruin-root-night-v1/after-root-ground.png),
[달](../artifacts/jelly-oasis/ruin-root-night-v1/production-moon-sky.png),
[자동 날씨 패널](../artifacts/jelly-oasis/ruin-root-night-v1/panel-auto-on.png),
[모바일 달](../artifacts/jelly-oasis/ruin-root-night-v1/mobile-moon-sky.png),
[모바일 세로 패널](../artifacts/jelly-oasis/ruin-root-night-v1/mobile-panel.png),
[모바일 가로 패널](../artifacts/jelly-oasis/ruin-root-night-v1/mobile-landscape-panel.png).

Windows headless Edge, production preview, desktop 1440×1000 / DPR1에서
`renderer.info`로 측정했다. triangle 수에는 shadow pass가 포함된다.

| 조건 | draw calls | rendered triangles | GPU texture 개수 |
|---|---:|---:|---:|
| 12:00 CLEAR, shadow ON | 71 | 48,760 | 4 |
| 00:00 CLEAR, shadow ON | 72 | 48,760 | 4 |
| 00:00 CLEAR, shadow OFF | 41 | 27,908 | 2 |
| 00:00 RAIN, shadow ON | 73 | 48,760 | 4 |
| mobile 390×844, 야간 | 41 | 27,908 | 2 |

달 disc 자체는 기존 sky draw 안에서 그리므로 추가 draw call/texture가 없다.
야간의 한 call 증가는 별 points다. 낮과 밤의 shadow map 메모리 수가 같다.
로컬 Three.js PCF 구현의 1024² RGBA8 color + uint depth는 명목상 약 **8MiB**다.
이는 포맷 기반 추정이며 드라이버 전체 GPU 메모리를 측정한 값은 아니다.
실기 모바일 FPS와 GPU frame time은 측정하지 않았다. 패널 ms 수치를 실기 FPS로 해석하지 않는다.

## 검증과 후속 작업

- `npm run lint`: 통과.
- `npm test -- --maxWorkers=2`: 52 files / 285 tests 통과.
- `npm run build`: TypeScript + Vite + legacy copy 통과.
- `node scripts/audit-ruin-root-assets.mjs`: 원본 보존 / GLB transform / node / texture 검사 통과.
- `npm run qa:cliff`: 통과, 결과는 `ruin-root-night-v1/cliff-regression/`.
- `npm run qa:ruin-night`: 통과, 최종 공개/모바일 하늘 보기 및 reset 포함. GLB HTTP 200, 콘솔/shader 오류 0.
- `npm run qa:landmark`: 통과, 결과는 `ruin-root-night-v1/landmark-regression/`.

전용 브라우저 QA는 낮/노을/00시/03시/흐림/비/안개, dusk caster 전환,
shadow OFF/ON, context loss/restore, persisted pagehide/pageshow,
수동 override 및 재활성화, paused clock, production 기본 상세 자산,
390×844 / 844×390 패널 접근성을 검증한다.
표준 코드 경로와 callback을 실제 UI에서 구동하며 GLB HTTP 200 및 콘솔 오류를 수집한다.

`Landmark Tree Detail v1`에서는 기존 trunk와 새 base root의 넓은 접합부를
기준으로 줄기 단면을 자연스럽게 이어주면 된다. 수관·가지·나무 전체 모델,
수면·폭포 shader·식생·생물·NavMesh는 이번에 변경하지 않았다.
돌은 재사용 가능한 개별 닫힌 조각의 구조를 유지하므로 내부 맞댐 면 제거는
추후 별도 최적화가 가능하다. 주 뿌리는 서쪽 벽을 감싸며, 동쪽 아치까지
장거리 뿌리를 추가해 동선을 침범하는 구성은 만들지 않았다.

수정 파일은 다음과 같다. 생성 바이너리와 이미지 목록은 위 audit/결과 폴더에 있다.

- 환경: `src/jelly-oasis/environment/EnvironmentController.ts`, `autoWeather.ts`, `createSky.ts`, `debugPanel.ts`, `weather.ts`.
- 런타임: `src/jelly-oasis/main.ts`, `landmark/createOvergrownRuin.ts`, `landmark/loadLandmarkAssets.ts`.
- 테스트: `tests/jelly-oasis-environment.test.ts`, `jelly-oasis-night-weather.test.ts`, `jelly-oasis-landmark.test.ts`.
- QA: `scripts/ruin-night-browser-qa.mjs`, `audit-ruin-root-assets.mjs`, 기존 `cliff-detail-browser-qa.mjs`, `landmark-browser-qa.mjs`, `package.json`.
- Blender 재현 스크립트: `scripts/blender/detail_ruin_root_v1.py`, `refine_ruin_stones_v1.py`, `render_ruin_root_v1.py`, `audit_export_ruin_root_v1.py`, `verify_ruin_root_exports.py`.
- 보고서: 이 문서와 `artifacts/jelly-oasis/ruin-root-night-v1/`.

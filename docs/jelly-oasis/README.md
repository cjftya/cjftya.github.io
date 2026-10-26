# Jelly Oasis 운영·개발 안내

2026-10-26 코드 기준이에요. 과거 단계별 보고서의 후보 URL·예산·통과 건수는 당시 기록이며 현재 기본값을 뜻하지 않아요. 전체 기록은 [문서 안내](../README.md)에서 찾아요.

## 실행과 현재 상태

`npm ci` 후 `npm run dev`로 `/projects/jelly-oasis/`를 열어요. 배포 빌드는 `npm run build`, 로컬 확인은 `npm run preview`예요. 독립 Vite 엔트리이며 `copy-legacy.mjs`가 빌드된 HTML을 원본으로 덮어쓰지 않도록 제외해요.

일반 화면에는 지형·세계수·유적·식생, 시간·날씨·하늘, 연못 수면과 후처리가 있어요. `main.ts`는 `pondOnly: true`, `water: true`, `waterfall: false`를 전달해요. 과거 폭포·수로 후보 기록만 보고 일반 화면에 다시 켜지 않아요.

초기 URL은 `startupOptions.ts`에서 한 번 해석해요. 검수 변형은 개발 모드 또는 `?debug`에서만 적용해요. 현재 기본값은 상세 절벽·유적·세계수·Crystal, 연못 v2 선택에 refined 미관 변형을 적용하는 경로예요. `?debug&pond=detail-v2`는 refined 이전 v2 비교용이고, `?debug&pond=blockout` / `?debug&pond=detail`은 이전 모델 비교용이에요. Crystal은 `?debug&crystal=blockout`으로 이전 모델과 비교해요. 일반 URL에서 이 모델 선택 쿼리로 기본값을 바꾸지 않아요.

## 수정할 위치

| 경로 (`src/jelly-oasis/` 기준)                                                 | 책임                                        |
| ------------------------------------------------------------------------------ | ------------------------------------------- |
| `main.ts`, `startupOptions.ts`                                                 | 장면 통합, 생명주기, URL 옵션               |
| `terrain/worldLayout.ts`, `terrain/heightfield.ts`, `terrain/createTerrain.ts` | 월드 설정, 결정적 높이 샘플, 지형 메시·색상 |
| `environment/timeOfDay.ts`, `environment/weather.ts`                           | 시간 계산, 날씨 프로필·전환                 |
| `environment/EnvironmentController.ts`                                         | 조명·하늘·안개·구름·비와 환경 자원 소유     |
| `landmark/`                                                                    | GLB 로딩, 접지·동선, 연못과 수면 자원       |
| `vegetation/`, `composition/`, `scenery/`, `meadow/`                           | 결정적 식생·풍경 배치와 인스턴싱            |

단일 시간·날씨 상태에서 조명·하늘·안개·강수가 함께 반응해요. 날씨는 `CLEAR`, `PARTLY_CLOUDY`, `OVERCAST`, `RAIN`, `MIST`예요. 순수 계산과 Three.js 자원 소유를 구분하고, 큰 지형 형상과 반복 오브젝트는 생성 시 구성해요. 세부 기본값·예산은 현재 설정과 테스트를 확인해요. 초기 지형·환경 단계의 triangle/draw 수를 전체 장면의 현재 수치로 사용하지 않아요.

## 보존할 동작

- seed와 지형 샘플링, 모델 앵커·접지·동선, 연못 경계와 실제 자산 경로를 유지해요.
- 반복 오브젝트는 공유 geometry/material과 인스턴싱을 활용하고 프레임마다 지형이나 자원을 재생성하지 않아요.
- 정적 상태의 불필요한 draw를 줄이되 바람·수면처럼 별도로 진행하는 애니메이션을 고려해요. 환경 시간 정지와 모든 애니메이션 정지는 같은 의미가 아니에요.
- hidden page, BFCache 복귀, resize, WebGL 손실·복구, 영구 이탈 시 dispose를 함께 확인해요.
- GPGPU 수면과 CPU fallback을 보존해요. 후보 선택·UI의 과거 설명만으로 현재 자원 경로나 기본 수면을 변경하지 않아요.
- physics·navmesh·실시간 기상 연동이나 범용 게임 엔진을 정리 작업에 추가하지 않아요.

## 검증

```bash
npm run lint
npm run format:check
npm test
npm run build
```

전체 포맷 검사는 기존 보고서 등의 차이로 실패할 수 있어요. 변경한 문서만 먼저 검사하고 무관한 파일을 일괄 포맷하지 않아요. Uriel 공식 데이터 조회는 네트워크 작업이므로 일반 정리에 필요하지 않으며 `data:update`를 실행하지 않아요.

브라우저 검수는 스크립트별 환경 변수와 전제 조건을 먼저 읽어요. 모든 스크립트가 최신 기본 장면과 호환되는 것은 아니에요.

| 검수                | 명령·기록                                                                                                  |
| ------------------- | ---------------------------------------------------------------------------------------------------------- |
| 모델 자산·랜드마크  | `npm run qa:landmark` (`LANDMARK_QA_URL`, `LANDMARK_QA_BROWSER`, `LANDMARK_QA_OUTPUT`; 기본 브라우저 Edge) |
| 최신 하늘·바람      | `node scripts/oasis-fantasy-sky-qa.mjs`                                                                    |
| 후처리·성능 비교    | [최적화 검증과 재현 방법](../jelly-oasis-performance-v1.md)                                                |
| 모델 원본·재제작    | [Blender blockout과 재현](../jelly-oasis-overgrown-ruin-blockout-v1.md)                                    |
| 연못 v2 모델 근거   | [형상·검증 기록](../jelly-oasis-pond-edge-detail-v2.md)                                                    |
| 과거 환경 최종 감사 | [전제·검증 한계와 스크립트](../jelly-oasis-environment-polish-v1.md)                                       |

낮·노을·밤, 맑음·비·안개, PC/모바일 세로·가로에서 모델·수면·카메라를 확인해요. shader/console 오류, 자원 경로, 반복 재배치·복구 뒤 자원 증가를 검사해요. 이미지·계측 JSON과 수동 원본은 검증 근거이므로 보존해요. 소프트웨어 WebGL이나 모바일 뷰포트 에뮬레이션 결과를 실기기 FPS·발열·터치 검증으로 표현하지 않아요.

# 저장소 유지보수 지도

## 구조를 정리한 근거

2026-11-14 기준으로 HTML 진입점·소스 import·빌드 후 복사·CI·문서 참조를 확인했어요.
앱은 이미 독립된 Vite 진입점으로 나뉘어 있고, 앱 사이의 직접 의존성은 Oasis가
루트 앱의 `RendererManager`를 사용하던 한 곳이었어요. 이 렌더러만 `src/shared/`로
옮겼어요. 앱 전체를 재배치하거나 별도 패키지·범용 프레임워크로 바꿀 필요는 없어요.

Oasis의 766줄 진입점에는 카메라 상태와 검수 API가 장면 생명주기에 섞여 있었어요.
계산·호출 순서는 유지하면서 카메라와 검수 API를 분리했어요. `main.ts`는 장면 구성,
프레임 실행과 자원 해제를 조정해요. 프레임별 수치는 콜백으로 읽어 초기 값에 고정되지 않아요.

## 작업별 수정 위치

| 작업                      | 소스·설정                                                                      | 검증 시작점                                                        |
| ------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| 행성 목록·링크·은하계     | `public/data/projects.json`                                                    | `tests/projects-file.test.ts`, `tests/projectActionPolicy.test.ts` |
| 루트 앱의 선택·카메라·UI  | `src/app`, `src/core`, `src/ui`, `src/solar-system`, `src/planets`, `src/data` | `tests/pageLifecycle.test.ts`, 루트 앱 관련 테스트                 |
| 앱 공용 렌더러            | `src/shared/rendering/RendererManager.ts`                                      | `tests/RendererManager.test.ts`, 루트와 Oasis 브라우저 확인        |
| Oasis 장면 통합·복구·해제 | `src/jelly-oasis/main.ts`                                                      | [Oasis 운영 안내](jelly-oasis/README.md)                           |
| Oasis 카메라·지형 추종    | `src/jelly-oasis/app/createOasisCameraRig.ts`                                  | `tests/jelly-oasis-camera-rig.test.ts`, 카메라 브라우저 확인       |
| Oasis 검수 API            | `src/jelly-oasis/app/createInspectionApi.ts`                                   | `?debug`의 `window.__oasisLandmark`, 기존 QA 스크립트              |
| Uriel 화면·분석·Worker    | `src/uriel`                                                                    | [Uriel 운영 안내](uriel.md), `tests/uriel*`                        |
| Viola 실험·시뮬레이션     | `src/viola`                                                                    | `tests/viola*`                                                     |
| Virus Sim 모델·관찰 UI    | `src/virus-sim`                                                                | [Virus Sim 안내](virus-sim.md), `tests/virus-sim`                  |
| HTML 빌드 진입점          | `config/siteEntries.json`                                                      | `tests/site-build.test.mjs`, 전체 빌드                             |
| 정적 프로젝트 복사        | `scripts/copy-legacy.mjs`                                                      | `tests/site-build.test.mjs`, 배포 HTML 확인                        |

## 의존성 경계

각 독립 앱은 자기 디렉터리와 `src/shared/`만 참조해요. 루트 앱도 독립 앱의 내부를
가져오지 않아요. `src/shared/`는 어느 앱에도 의존하지 않아요. 공용 코드는 실제로
둘 이상에서 사용하는 부분만 추출해요. `shared/`는 기존 공개 URL을 유지하는 레거시
스크립트이며, TypeScript 공용 코드인 `src/shared/`와 목적이 달라요.

`npm run lint`는 `scripts/eslint/app-boundaries.mjs`로 상대 경로의 일반 import,
재노출(export), 동적 import와 타입 import를 검사해요. 경로를 정규화하므로 `../`의
깊이를 바꿔도 경계를 우회할 수 없어요. 현재 별도 alias는 없어요. alias를 도입한다면
검사 규칙의 경로 해석도 함께 확장해요. 앱 목록은 `config/siteEntries.json`의 프로젝트 경로에서 가져오므로 별도 목록을 유지하지 않아요.

## 앱 추가와 배포

1. `projects/<앱>/index.html`과 `src/<앱>/`에 진입점을 만들어요.
2. `config/siteEntries.json`에 HTML을 한 번 등록해요. Vite 입력과 레거시 복사 제외
   목록이 여기서 함께 파생돼요. `public/data/projects.json`은 화면의 프로젝트 목록이므로 별도로 등록해요.
3. 소스 디렉터리 이름을 HTML 경로의 앱 이름과 맞추고 앱 테스트를 추가해요.
4. lint·테스트·빌드 후 공개 URL과 빌드된 HTML을 확인해요.

`projects/weddingcard/`와 `shared/`는 원본 그대로 복사해요. 목록에서 숨긴 프로젝트도
기존 공개 URL이 남아 있을 수 있어요. 프로젝트 목록에 없다는 이유만으로 삭제하지 않아요.

## 현재 문서와 보관 자료

현재 기준은 [문서 안내](README.md)에서 시작해요. 완료된 보고서 46개는
[보관 인덱스](archive/README.md)로 분리했고, 예전 정리 보고서 2개는 그곳의 짧은
이력으로 통합했어요. 루트 README의 상세 Uriel 설명도 [전용 안내](uriel.md)로 옮겼어요.

`artifacts/`, 모델 제작·QA 스크립트와 공개 자산을 대조했으며, 이번 조사에서 추가로
바이트가 같은 추적 파일은 없었어요. QA·모델 제작·비교 근거는 보존해요. 테스트가
다시 쓰는 계측 JSON과 캡처는 이번 코드 정리 커밋에 섞지 않아요.

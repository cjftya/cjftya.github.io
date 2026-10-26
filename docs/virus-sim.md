# Virus Sim v4.9 유지보수 안내

95종 바이러스의 3D 구조를 관찰하는 뷰어예요. 기능 개발은 v4.9에서 완료했으며,
현재 관리 원칙은 회귀 방지와 최소 변경이에요. 모델 품질 개선이나 기능 추가는 별도 작업으로 다뤄요.

## 실행과 배포

저장소 루트에서 Node.js 22.13 이상으로 `npm ci`, `npm run dev`를 실행한 뒤
`/projects/virus-sim/`을 열어요. 공개 주소는
<https://cjftya.github.io/projects/virus-sim/>예요.

`projects/virus-sim/index.html` → `src/virus-sim/main.ts` → `app.ts`가 진입 경로예요.
Vite 멀티 엔트리가 `dist/projects/virus-sim/index.html`을 생성하며,
`scripts/copy-legacy.mjs`는 이 앱을 레거시 복사에서 제외해요.
기본 브랜치는 `master`이고 push 시 기존 Pages 워크플로가 검사 후 배포해요.

## 코드와 데이터 지도

아래 경로는 `src/virus-sim/` 기준이에요.

| 경로                                            | 책임                                                                       |
| ----------------------------------------------- | -------------------------------------------------------------------------- |
| `main.ts`, `app.ts`                             | 시작·종료, 관찰 상태와 UI·렌더러 연결                                      |
| `catalog/registry.ts`                           | 기존 `model/virusCatalog.ts`와 `catalog/definitions/` 콘텐츠 통합, ID 조회 |
| `catalog/`                                      | 치수·구조 프로필·출처, `explanations/` 부위 설명, `history/` 역사 자료     |
| `model/observationPresets.ts`                   | 카탈로그에서 관찰 프리셋 조회                                              |
| `observation/`                                  | 관찰 상태·레이어·부위 타입, 변환                                           |
| `rendering/SceneRenderer.ts`, `SpecimenView.ts` | Three.js 장면·입력·모델 표시와 선택                                        |
| `rendering/models/createObservationModel.ts`    | `modelBuilder` ID에 맞는 빌더 선택                                         |
| `rendering/scanner/`, `scanner/math.ts`         | 단면 렌더링과 계산                                                         |
| `ui/`, `styles.css`                             | DOM 레이아웃·이벤트·설정·모바일 표시                                       |

`VIRUS_CATALOG`의 95개 고유 ID, 카탈로그·프리셋·빌더 등록 관계를 유지해요.
기존 V2 이름의 카탈로그도 현재 통합 데이터의 일부예요. 콘텐츠를 수정할 때는
치수·구조 프로필·설명·출처·레이어·모델 빌더의 대응을 함께 확인하고,
원본 형상과 과학적 설명을 일반 정리 작업에서 바꾸지 않아요.
`createObservationModel.ts`의 빌더는 ID로 간접 호출되므로 단순 검색 결과만으로 제거하지 않아요.

## 보존 규칙

- 선택·회전·줌·이동·이미지 저장, 단면·레이어·부위 설명과 표시 설정을 보존해요.
- 모바일 뷰포트와 스크롤, 선택 UI 동작을 유지해요.
- `ui/preferences.ts`의 `virus-sim-v2.5-font-scale`, `virus-sim-v3.5-settings`는
  현재 사용자 설정 키예요. 이름과 레거시 키 제거 로직을 임의 변경하지 않아요.
- `tests/virus-sim/v3.5-*`부터 `v4.9-*`까지는 현재 회귀 테스트예요.
  과거 버전명만 보고 삭제하거나 기대값을 완화하지 않아요.
- 다른 앱, 공유 코드, 의존성, 배포 경로는 이번 유지보수 범위 밖이에요.

## 검증

저장소 루트에서 실행해요.

```bash
npx vitest run tests/virus-sim
npm run format:check
npm run lint
npm test
npm run build
```

전체 포맷 검사가 기존부터 실패하면 결과를 구분하고 변경 파일만 포맷해요.
전체 저장소에 `npm run format`을 일괄 적용하지 않아요.
빌드 후 `dist/projects/virus-sim/index.html`과 연결된 리소스를 확인해요.
브라우저에서는 직접 진입·새로고침, 모델 선택·표시, 회전·줌·이동,
단면·레이어·설명·저장, 모바일 너비와 기존 저장 설정 복원을 확인해요.
실행하지 못한 검사는 미실행으로 보고해요.

## 이번 정리의 판단

- 유지: 전체 런타임·95종 데이터·버전별 테스트·저장 키. 현재 호출·등록과 회귀 보증에 필요해요.
- 갱신: 루트 README와 아키텍처의 PixiJS 설명을 실제 Three.js 구현에 맞춰 고쳤어요.
- 추가: 이 문서를 유지보수 진입점으로 두고 범위가 제한된 AI 지침에서 연결해요.
- 제거: Virus Sim 전용 중복·과거 문서는 발견되지 않아 삭제하지 않았어요.
- 보류: 기능·품질·성능 변경과 증거가 없는 미사용 코드 제거는 수행하지 않았어요.
  다른 프로젝트의 문서와 과거 검증 기록은 유지해요.

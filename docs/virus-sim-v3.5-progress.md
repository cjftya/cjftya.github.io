# Virus Sim v3.5 진행 기록

## 기준 상태

- 시작 브랜치: `master`
- 시작 커밋: `c0daff345539e3aa107bec39b36b6805fc268861`
- 시작 작업 트리: 변경 없음
- `AGENTS.md`: 저장소에 없음
- 의존성 설치: `npm ci` 성공
- 기준 검증 (2026-09-08 UTC)
  - `npm run lint`: 성공
  - `npm run test`: 성공, 32 files / 175 tests
  - `npm run build`: 성공

## 단계 상태

| 단계                     | 상태        | 메모                                                                                  |
| ------------------------ | ----------- | ------------------------------------------------------------------------------------- |
| 0. 기준 확인             | 완료        | 계획서 기준 SHA와 현재 HEAD가 일치함                                                  |
| 1. 책임 분리와 자동 제거 | 완료        | 자동 카메라·개체 이동·투어·Time Lens 제거, 수동 카메라와 구조 전환 분리               |
| 2. 공통 계약 정비        | 완료        | 직렬화 가능한 A/B 상태, 근거 단계, 치수·표본·변이 타입 도입                           |
| 3. 품질·신규 모델        | 완료        | 기존 56개 보존, 신규 15개와 필로·렌티·코로나 builder 추가                             |
| 4. 두 표본 비교          | 완료        | 단일 renderer의 A/B scissor, 반응형 배치, 정규화/실제 크기 지원                       |
| 5. 구조 스캐너           | 완료        | 실제 geometry clipping slab, render target과 전체 상태 복원                           |
| 6. 변이 비교             | 완료        | 16개 표본과 근거가 있는 3개 영역 수준 차이 연결                                       |
| 7. 장식·UI 마감          | 완료        | 장식 레이어 끄기·정지·강도, 수동 관찰 UI와 접근 가능한 보조 조작                      |
| 8. 정리·검증             | 제한부 완료 | 린트·173개 테스트·빌드 통과. 원격 브라우저의 로컬 주소 차단으로 실제 화면 QA는 미완료 |

## 변경 파일

- 상세 구현과 모듈 경계는 `docs/virus-sim.md`에 기록했다.
- 출처·자료 범위는 `docs/virus-sim-v3.5-sources.md`, 최종 책임과 수명 관리는 `docs/virus-sim-v3.5-architecture.md`에 기록했다.
- 전체 71개 자동 점검과 시각 검증 제한은 `docs/virus-sim-v3.5-quality-audit.md`에 기록했다.
- 핵심 상태·렌더링·UI는 `ObservationStore`, `SceneRenderer`, `SpecimenView`, `ManualCamera`로 분리했다.
- 화면 동기화와 DOM listener를 `VirusSimPanel`, `bindings`로 옮겨 `app.ts`는 action 조정만 담당한다.
- 출처·치수·표본은 `catalog/sources.ts`, `catalog/dimensions.ts`, `catalog/variants/registry.ts`에 분리했다.
- 자동 연출 관련 소스와 `motionProfileId`, `localMotion`, `tourParts` 메타데이터를 제거했다.

## 현재 검증 상태

- `npm run lint`: 통과
- `npm run test`: 통과, 32개 파일·173개 테스트
- `npm run build`: 통과, Virus Sim과 `/`, Uriel, Viola 번들 유지
- 전체 71개 high 모델: 선언 부위·레이어와 150 draw object / 250,000 triangle 예산 테스트 추가
- 비교 환산: 100/200 nm의 1:2 비율, 서로 다른 viewport의 공통 nm-per-pixel 테스트
- 상태: 장시간 유휴 불변, 종 변경 보존, 재조립 원점 복귀, 스캐너 분해 값 복원 테스트
- 브라우저 데스크톱/모바일: control-browser가 `127.0.0.1`을 `ERR_BLOCKED_BY_CLIENT`로 차단해 미완료
- 71개 모델 시각 contact sheet: 같은 로컬 브라우저 제한 때문에 미완료

## 이어서 할 일

1. 로컬 페이지에 접근 가능한 브라우저에서 데스크톱·모바일 조작과 콘솔 오류를 확인한다.
2. 71개 모델 contact sheet를 만들어 겹침, 단면, 분해와 선택 가독성을 시각 점검한다.
3. 발견된 시각 문제를 수정한 뒤 린트·테스트·빌드를 다시 실행한다.

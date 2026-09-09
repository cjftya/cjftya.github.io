# Virus Sim v4 진행 기록

## 기준 상태

- 계획 기준·실행 시작 SHA: `61c7d1fe2e98020899749ebb04d27a7a361bd2d8`
- 시작 브랜치: `master`
- 시작 작업 트리: 변경 없음
- `AGENTS.md`, `.openai/hosting.json`: 저장소와 상위 작업 경로에서 발견하지 못함
- 의존성: lockfile을 유지한 `npm ci` 성공
- 기준 검증: lint 성공, 32개 파일·173개 테스트 성공, build 성공

## 단계 상태

| 단계             | 상태    | 결과                                                                          |
| ---------------- | ------- | ----------------------------------------------------------------------------- |
| 기준 확인        | 완료    | v3.5의 71개 도감·A/B·스캐너·변이·수동 카메라 계약 확인                        |
| P0 레이아웃      | 완료    | 고정 `100dvh` workspace, stage와 항상 보이는 조작, 하단 패널 단독 스크롤      |
| 상태·렌더 경계   | 완료    | `WorkspaceStore`, `LabSession`, `LabScene` 추가, renderer와 RAF는 각 1개 유지 |
| 물리와 프로필    | 완료    | 71개 명시 매핑, 구·capsule·filament·compound, 1/120 sim-s fixed step          |
| 환경과 챔버      | 완료    | 직선·전단·유한 core 와류, 상대 점성, 동일 field marker, 깊이를 막는 장애물    |
| 다중 표본·결과   | 완료    | 기본 4개·최대 8개, 통과 시간, ring trajectory, 위치 교환, 60/120/300 sim-s    |
| 재실험·저장      | 완료    | 현재 조건 restart, tick command 정확 재생, 재생 분기, 단일 localStorage 슬롯  |
| 구조 관찰 연결   | 완료    | Lab 일시정지, 기존 A/B·카메라 저장, 임시 고품질 관찰 후 정확 복귀             |
| 자동 검증        | 완료    | lint, 33개 파일·186개 테스트, production build 성공                           |
| 브라우저 시각 QA | 진행 중 | 원격 브라우저가 로컬 주소를 차단함. 배포 주소에서 최종 확인 필요              |

## 확정된 구현 계약

- 물리 step: `1/120 sim-s`, 프레임 accumulator 최대 18 substep
- 시간 배율: 0.25×, 0.5×, 1×, 2×
- run 제한: 기본 60, 선택 120/300 sim-s, 명령 8192개
- trajectory: 표본당 최대 384점 ring buffer
- 표본: 기본 MS2, TMV, Ebola virus, T4; 공통 상한 8개
- 크기: 대표 길이 맞춤 또는 도감 대표 nm의 상대 비율
- 저장: schema 1, engine `virus-lab-v4.0`, 브라우저 설정 1개 슬롯
- 카메라: 관찰 A/B와 Lab이 각 pose를 소유하며 명시 입력으로만 변경

## 구현 중 함께 수정한 오류

- v3.5 고품질 geometry 선언에 실제 사용 ID인 `filovirus-v3.5`,
  `lentivirus-v3.5`, `coronavirus-v3.5`가 빠져 있던 문제를 수정했다.
- 최대 길이에 도달한 trajectory가 점 개수만 비교해 화면에서 멈추던 문제를 마지막
  좌표 signature 비교로 수정했다.
- 잘못된 구조 설정이 거부될 때 진행 중인 world를 시작 상태로 바꾸던 예외 처리를 제거했다.
- 재생 중 조건 변경이 중간 world를 불완전한 초기 설정으로 기록하던 문제를 0초부터의
  결정적 새 run 분기로 바꿨다. 원본 last run은 새 run이 확정되기 전까지 보존한다.
- 중간에 끝낸 run의 재생이 기록된 `completedTick`을 지나 계속 진행되던 문제를 마지막
  기록 tick의 자동 정지로 수정했다.
- 손상된 저장 설정을 조용히 버리던 처리를 구체적 오류 안내와 안전 기본값 복구로 바꿨다.
- 기본 표본과 같은 종을 추가할 때 `instanceId` 일련번호가 겹칠 수 있던 문제를 현재 배치 기반
  고유 ID 생성과 world 중복 검증으로 수정했다.
- 구 breakpoint의 sticky 조작 막대가 v4 fixed workspace를 침범하지 않도록 최종 cascade를 정리했다.
- chamber outline을 다시 만들 때 임시 BoxGeometry가 남던 경로를 즉시 dispose하도록 수정했다.

## 검증 기록

2026-09-09 UTC에 다음을 성공했다.

```bash
npm run lint
npm run test
npm run build
```

- 테스트: 33개 파일, 186개 성공
- build: `/`, `/projects/virus-sim/`, `/projects/uriel/`, `/projects/viola/` 산출물 유지
- Virus Sim 번들: JS 약 265.37 kB, gzip 약 72.60 kB
- 자동 fixture: 정지 불변, 30/60/120Hz cadence, 유한 와류, 상대 점성, capsule 방향,
  filament 길이·깊이 경계, 전체 몸체 통과, 8개 instance, 실제 크기 비율, 정확 재생,
  재생 분기, 손상·구버전 저장 거부

## 남은 확인과 재개 지점

원격 브라우저의 `127.0.0.1` 접근은 `ERR_BLOCKED_BY_CLIENT`로 차단돼 로컬 WebGL 화면,
콘솔, 71개 contact sheet와 실제 프레임 성능은 아직 확인하지 못했다. 배포 후
`/projects/virus-sim/`에서 desktop/mobile/낮은 높이/130% 글자, 관찰 회귀, Lab 3개 흐름,
구조 관찰 왕복, PNG, context loss를 직접 확인한다. 빌드 성공을 시각 QA로 간주하지 않는다.

재개 시 최소 명령은 `git diff --check`, `npm run lint`, `npm run test`, `npm run build`다.

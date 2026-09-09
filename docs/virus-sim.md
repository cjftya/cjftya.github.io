# Virus Sim v4 — Manual Structure Lab & Physics Arena

Virus Sim은 71개 바이러스 기본 항목의 대표 구조를 수동으로 관찰하고, 별도의 Micro Lab에서
형태·방향·흐름·통로 접촉을 개념적으로 실험하는 Three.js 앱이다. v4는 v3.5의 A/B 비교,
구조 스캐너, 표본·변이, 고품질 모델과 수동 카메라를 보존하면서 같은 화면에 Physics Arena를
추가한다.

이 앱은 전체 원자 좌표 복제, 유전체 기반 구조 예측, 정밀 CFD, 감염성·치료 효과나 생물학적
우열을 계산하는 도구가 아니다. 반복 수, 색, 분해 거리, 일부 내부 배치와 Lab 계수는 브라우저
관찰을 위한 절차 표현 또는 명시된 surrogate다.

## 실행

```bash
npm ci
npm run dev
```

개발 server 또는 build 결과에서 `/projects/virus-sim/`을 연다. 화면 상단의 `구조 관찰실`과
`Micro Lab` 버튼으로 모드를 바꾼다. stage와 핵심 조작·탭은 viewport 안에 남고, 아래 panel
본문만 scroll한다.

## 구조 관찰실

- camera는 drag orbit, 우클릭 또는 Shift+drag pan, wheel/pinch zoom, 접근 가능한 보조 버튼과
  사용자가 누른 전체 보기로만 움직인다. idle 자동 camera·tour·표본 운동은 없다.
- 종을 바꿔도 camera pose와 의미가 유지되는 보기·layer 상태를 보존한다. 새 모델에 없는
  선택 부위만 해제한다.
- 반투명·단면·분해·재조립은 짧은 구조 전환이며 camera 이동을 시작하지 않는다.
- A/B는 하나의 WebGLRenderer에서 scissor render한다. 같은 크기 맞춤과 도감 대표 nm의
  실제 크기 비율을 구분하고, camera 조작 연결을 선택할 수 있다.
- scanner는 현재 procedural geometry를 두 clipping plane의 slab로 render한다. 별도 WebGL
  context를 만들지 않으며 render target과 material 상태를 복원한다.
- variant 차이는 근거가 연결된 영역 수준만 표시하고 전체 입자 외형 차이로 과장하지 않는다.

## Micro Lab 사용법

기본 표본은 MS2, TMV, Ebola virus, T4이고 최대 8개까지 추가·교체·삭제할 수 있다. 같은 종도
고유 instance로 여러 번 배치할 수 있다. 구조 변경은 정지 상태에서만 가능하며 서로 겹치거나
chamber 밖인 초기 배치는 거부한다.

1. `표본` 탭에서 구성과 선택, 시작 위치 교환, 고품질 구조 관찰을 정한다.
2. `환경` 탭에서 기본/Obstacle Chamber, 직선·전단·와류, 방향, drive, 상대 점성, 제한된
   브라운 이동을 정한다.
3. 실행하고 0.25×/0.5×/1×/2× sim-time 배율 또는 정지를 사용한다.
4. `결과`에서 실제 물리 위치의 통과 상태·시간과 bounded trajectory를 읽는다.
5. `현재 조건으로 처음부터`는 현재 환경을 새 초기값으로 시작한다. `같은 조건으로 재실험`은
   마지막 run의 seed·초기 배치와 tick별 조건 변경을 재생한다.
6. 설정은 browser localStorage의 1개 슬롯에만 저장한다. 손상·구버전 설정은 이유를 표시하고
   안전한 기본값을 사용한다.

Lab에서 `고품질 구조 관찰`을 누르면 실험은 멈추고 기존 관찰 기능을 임시로 연다. 돌아오면
같은 Lab 시각·배치·camera·환경과 원래 관찰 A/B 상태가 복원되며 상태는 paused다. 관찰의
분해·단면을 Lab 충돌체에 복사하지 않고 순간 filament 굽힘을 기준 구조로 저장하지 않는다.

## 물리 해석 한계

| 항목                             | 의미                                                     |
| -------------------------------- | -------------------------------------------------------- |
| `lab-unit`, `sim-s`              | 실제 SI 단위를 주장하지 않는 개념 단위                   |
| 상대 점성                        | 구동 유속과 브라운 확산을 낮추는 계산 인자               |
| sphere/capsule/filament/compound | 도감 외형과 축을 공유하는 단순 충돌 surrogate            |
| 실제 크기 비율                   | 도감 대표 nm의 상대 화면/충돌 크기, 질량·부피비가 아님   |
| 통과                             | 전체 collision bounds가 exit plane을 지난 tick           |
| 미통과                           | 선택한 제한 시간 안의 관찰 결과, 수학적 불가능 판정 아님 |

flow marker와 표본은 같은 velocity field를 사용한다. 장식 particle은 관찰실의 의미 없는 배경
layer이고 물리 결과를 바꾸지 않는다. 상세 식·profile·fixture는
`docs/virus-sim-v4-physics.md`에 기록한다.

## 도감과 근거

기본 항목은 기존 56개와 filovirus·HIV·사람 coronavirus 15개를 합한 71개다. 계통·아형·분리주
variant는 기본 항목 수와 별도로 관리한다. 각 항목은 `observed`, `conceptual`, `unavailable`
근거 단계를 갖고, 직접 종별 입체 자료가 부족하면 계열 공통 구조와 그 한계를 표시한다.
PDB의 단백질 또는 부분 구조를 전체 입자 원자 좌표처럼 설명하지 않는다.

실제 크기 데이터에는 대표값·범위·측정 축·돌기 포함 여부·입자 상태·출처 ID가 있다.
`displayLength`는 관찰용 model unit이며 nm로 읽지 않는다.

## 구현 경계

- `catalog/`: 71개 identity, 출처, 실제 치수, variant와 근거
- `observation/ObservationStore.ts`: 직렬화 가능한 A/B 관찰 상태
- `lab/LabSession.ts`: fixed-step world, PRNG, 결과와 replay의 단일 원천
- `lab/physics/`: DOM/WebGL 없는 vector, field, rigid/filament step
- `lab/profiles/registry.ts`: 모든 도감 항목의 버전된 physics mapping
- `lab/chambers/descriptors.ts`: 표시와 충돌이 공유하는 chamber
- `rendering/SceneRenderer.ts`: 하나의 renderer·RAF와 모드별 입력 routing
- `rendering/lab/`: Lab 외형, trajectory, flow marker와 수동 camera
- `ui/`: DOM 표시와 typed action binding
- `workspace/WorkspaceStore.ts`: 모드·탭 상태
- `app.ts`: store·renderer·panel lifecycle 조정

## 검증

전체 저장소는 다음을 통과해야 한다.

```bash
npm run lint
npm run test
npm run build
```

v4 자동 테스트는 71개 mapping, 정지 불변, 30/60/120Hz fixed tick 일치, 유한 와류와 점성,
형태별 접촉, filament 길이·depth, 전체 몸체 통과, 8개 instance, 실제 nm 비율, 정확 replay와
분기, 저장 corruption을 확인한다. 브라우저·WebGL·성능·contact sheet의 실제 확인 상태는
`docs/virus-sim-v4-qa.md`에 자동 검증과 분리해 기록한다.

## 주요 자료

- [RCSB Protein Data Bank](https://www.rcsb.org/)
- [Electron Microscopy Data Bank](https://www.ebi.ac.uk/emdb/)
- [ICTV Virus Taxonomy Profiles](https://ictv.global/report)
- [CDC Human Coronavirus Types](https://www.cdc.gov/human-coronaviruses/php/types/index.html)

개별 링크와 자료 적용 범위는 `catalog/sources.ts`와 앱의 현재 항목 출처 panel에 표시한다.

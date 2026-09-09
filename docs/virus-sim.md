# Virus Sim v3.5 — Manual Structure Lab

Virus Sim은 공개 구조 자료를 바탕으로 바이러스 입자의 층과 대표 형태를 살펴보는
Three.js 관찰실이다. v3.5는 자동 카메라·개체 이동·다큐 투어를 제거하고 회전, 이동,
확대와 부위 선택을 모두 사용자 입력에 맡긴다. 기존 56개 기본 항목에 필로바이러스,
HIV, 사람 코로나바이러스 15개를 더해 기본 항목은 71개다. 계통·아형·분리주는 기본
항목과 별도인 비교 표본으로 집계한다.

이 앱은 전체 원자 좌표를 복제하거나 유전체 서열에서 입자 구조를 예측하는 도구가
아니다. 반복 수, 색, 분해 거리와 일부 내부 배치는 브라우저 관찰을 위한 절차 표현이다.

## 실행

```bash
npm ci
npm run dev
```

개발 서버 또는 빌드 결과에서 `/projects/virus-sim/`을 연다.

## v3.5 관찰 원칙

- 유휴 상태에서 표본과 카메라 pose는 변하지 않는다. 카메라 조작은 드래그, 우클릭
  또는 Shift+드래그, 휠, 터치 회전·핀치와 접근 가능한 버튼으로만 일어난다.
- 종이나 표본을 바꿔도 현재 카메라 pose와 의미가 유지되는 보기·레이어 상태를
  보존한다. 새 모델에 없는 선택 부위만 해제한다.
- 반투명·단면·분해·재조립은 짧은 구조 전환이다. 카메라 이동이나 이후 자동 루프를
  시작하지 않는다.
- 배경 파티클은 장식 레이어이며 표본의 물리 운동을 뜻하지 않는다. 끄기·정지와
  성능별 개수 예산을 제공한다.
- 감염, 숙주, 결합, 방어, 약물과 치료 효과는 v3.5 범위에 포함하지 않는다.

## 도감과 근거 단계

| 그룹                                     | 기본 항목 | 표현 원칙                               |
| ---------------------------------------- | --------: | --------------------------------------- |
| 기존 파지·식물·동물·곤충·고세균 바이러스 |        56 | 기존 identity와 전용/공통 builder 유지  |
| 에볼라 계열                              |         6 | 계열 공통 필라멘트·외피·matrix·나선 RNP |
| HIV                                      |         2 | 외피·matrix·성숙 원뿔형 capsid·유전체   |
| 사람 코로나바이러스                      |         7 | 외피·표면 돌기·matrix·RNA-단백질 복합체 |
| **합계**                                 |    **71** | 변이·계통·아형 표본은 별도 집계         |

모든 항목은 `observed`, `conceptual`, `unavailable` 가운데 하나의 근거 단계를 갖는다.
직접 종별 입체 자료가 부족한 세부는 같은 계열의 공통 구조를 사용하고 `conceptual`로
표시한다. PDB가 단백질이나 부분 구조만 다루는 경우 이를 전체 입자 좌표처럼 설명하지
않는다.

각 항목의 실제 크기 데이터에는 대표값과 범위, 측정 축, 돌기 포함 여부, 입자 상태와
출처 ID가 함께 있다. `displayLength`는 화면용 모델 단위이며 나노미터로 해석하지 않는다.

## 두 표본 비교

비교 모드는 A와 B를 별도 scene과 상태로 유지하면서 하나의 `WebGLRenderer`와 하나의
프레임 루프에서 scissor 렌더링한다. 넓은 화면은 좌우, 좁은 화면은 상하로 배치한다.

- `같은 크기로`: 각 모델의 화면상 대표 길이를 맞춰 구조를 비교한다. 실제 크기 비율이
  아니라는 안내를 항상 표시한다.
- `실제 크기로`: 두 항목의 대표 나노미터 값과 두 viewport를 함께 계산해 하나의
  nm-per-pixel 값을 적용한다. 100 nm와 200 nm 표본은 화면에서도 1:2가 된다.
- 조작 연결을 켜면 A/B 카메라 pose와 수동 보기 상태가 동기화된다. 슬롯 객체와 레이어
  map은 서로 복제해 한쪽 변경이 참조 공유로 번지지 않는다.

## 표본·변이 차이

v3.5에는 에볼라 Mayinga/Makona, HIV-1 B/C와 HIV-2 A/B, SARS-CoV-2 기준·Alpha·Beta·
Gamma·Delta·BA.1·BA.2·BA.5·XBB.1.5·JN.1 표본이 있다. 구조 차이는 근거가 연결된
다음 세 영역만 강조한다.

| 비교                    | 표시 영역                       | 한계                                                  |
| ----------------------- | ------------------------------- | ----------------------------------------------------- |
| EBOV Mayinga ↔ Makona   | GP 수용체 결합 영역의 A82V 위치 | 절차 표면의 점을 잔기 좌표라고 주장하지 않음          |
| HIV-1 subtype B ↔ C     | Env gp120 V3 영역               | 성숙 입자 전체 외형 차이로 확대하지 않음              |
| SARS-CoV-2 Delta ↔ BA.1 | Spike receptor-binding domain   | 서로 다른 PDB 구조 상태를 동일 조건으로 가정하지 않음 |

## 구조 스캐너

스캐너는 별도 WebGL 컨텍스트를 만들지 않는다. 현재 scene과 실제 procedural geometry에
두 clipping plane으로 얇은 slab를 만들고, 임시 orthographic camera와 render target으로
렌더한 뒤 픽셀을 2D canvas에 복사한다. 축, 정규화 위치와 두께를 조절할 수 있다.

스캐너 진입 시 분해 보기는 잠시 접고 종료 시 이전 분해 값으로 정확히 복원한다. 렌더
타깃, viewport, scissor, clear color, clipping material과 장식 표시 상태도 매 스캔 뒤
원래 값으로 돌린다.

## 모듈 경계

- `catalog/`: 71개 identity, 출처, 실제 치수, 표본·변이와 근거 단계
- `observation/ObservationStore.ts`: A/B 관찰 상태의 단일 원천과 직렬화 가능한 전이
- `inspection/transition.ts`: 자동 카메라와 분리된 짧은 구조 전환
- `comparison/scaling.ts`: 반응형 viewport와 정규화/실제 크기 환산
- `scanner/math.ts`: 정규화 위치를 모델 bounds의 얇은 slab로 변환
- `rendering/ManualCamera.ts`: 명시적 orbit·pan·dolly·전체 보기만 제공
- `rendering/SpecimenView.ts`: 모델, 레이어, 단면, 분해와 선택 처리
- `rendering/SceneRenderer.ts`: 단일 renderer·프레임 루프, A/B scissor와 입력 라우팅
- `rendering/scanner/ScannerRenderer.ts`: render target 기반 실제 geometry 단층
- `rendering/effects/DecorativeParticles.ts`: 의미 없는 장식 파티클 레이어
- `ui/VirusSimPanel.ts`: 71개 도감과 관찰·비교·변이·스캐너 표시 상태
- `ui/bindings.ts`: DOM 이벤트를 action으로 변환하고 한 AbortController로 수명 관리
- `app.ts`: 상태 저장소·렌더러·UI action 연결과 해제

## 검증 계약

`tests/virus-sim/v3.5-catalog.test.ts`는 56개 기존 identity와 15개 신규 identity, 전체
71개 치수·출처, 변이 참조 무결성, 모든 고품질 모델의 선언 부위·레이어와 렌더 예산을
확인한다.

`tests/virus-sim/v3.5-manual.test.ts`는 장시간 유휴 상태 불변, 종 변경 시 관찰 상태
보존, 분해 후 정확한 재조립, 스캐너 종료 복원, A/B 비공유 상태, 100/200 nm 1:2 환산,
서로 다른 viewport의 공통 nm-per-pixel과 slab 위치 계산을 확인한다.

전체 저장소는 `npm run lint`, `npm run test`, `npm run build`를 통과해야 한다. 빌드 뒤
`dist/projects/virus-sim/index.html`은 해시된 번들을 참조하고 `/`, Uriel, Viola와 Virus
Sim 경로를 함께 유지해야 한다.

## 주요 데이터베이스

- [RCSB Protein Data Bank](https://www.rcsb.org/)
- [Electron Microscopy Data Bank](https://www.ebi.ac.uk/emdb/)
- [ICTV Virus Taxonomy Profiles](https://ictv.global/report)
- [ICTV Orthoebolavirus](https://ictv.global/report/chapter/filoviridae/filoviridae/orthoebolavirus)
- [ICTV Retroviridae profile](https://pmc.ncbi.nlm.nih.gov/articles/PMC8744268/)
- [ICTV Coronaviridae](https://ictv.global/report/chapter/coronaviridae/coronaviridae)
- [CDC Human Coronavirus Types](https://www.cdc.gov/human-coronaviruses/php/types/index.html)

개별 링크와 자료 적용 범위는 `catalog/sources.ts`와 앱의 현재 항목 출처 패널에 표시한다.

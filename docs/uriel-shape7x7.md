# 7×7 Topological Shape — Core v1

## 범위와 기존 코드의 차이

기존 5·10·30게임 UI, 카드 스타일, 타임라인, Random Baseline을 유지하고
`7×7 Topological Shape · 실험`을 선택 메뉴에 추가했다.
Python 서버나 새 패키지를 추가하지 않고 기존 TypeScript/Web Worker에서 동작한다.

기존 v3는 실제/랜덤의 단일 조합 특징 분포를 비교한다. 새 모듈은 최근 3회 구조와
유사한 과거 구간을 찾고, 그 구간 **다음** 구조의 표준화 평균을 예측 목표로 삼는다.
이는 Nearest Historical State의 초기 point estimate이며, 다봉형 예측분포나
Shape Family Markov 모델을 구현했다고 주장하지 않는다.

## 코드 관리

`src/uriel/analysis/v3/shape7x7/` 안에서 역할별로 관리한다.

| 모듈            | 책임                                                      |
| --------------- | --------------------------------------------------------- |
| `config.ts`     | 고정 기본값, 허용 범위, 모델 버전                         |
| `grid.ts`       | 45개 유효 셀과 번호의 왕복 변환                           |
| `signature.ts`  | 거리·다중 규모 그래프·연결 군집, 32차원 서명              |
| `predictor.ts`  | 과거 Shape DB, 학습 전용 정규화, 최근 상태 검색           |
| `candidates.ts` | 스트리밍 표본, 상위 조합 heap, 엄격한 다양성, 랜덤 대조군 |
| `evaluation.ts` | 게임/합집합 지표, block bootstrap, Holm 검정              |
| `backtest.ts`   | 회차별 walk-forward와 동일 다양성 랜덤 묶음               |
| `study.ts`      | 합성 또는 순서 셔플 이력 전체 재학습, 신호 판정           |
| `algorithm.ts`  | 공통 알고리즘 인터페이스 연결                             |

숫자 샘플러, seed, 게임 타입, Worker, 화면은 기존 코드를 재사용한다.
등록은 `catalog.ts`의 메뉴/레지스트리에서 관리한다. 공통 인터페이스의 선택적
`generateGames`/`backtest` hook으로 알고리즘별 동작을 위임하므로,
새 모델을 추가할 때 공통 실행기에 계속 조건문을 쌓지 않는다.
아직 쓰지 않는 Geometry/Empty Space/Clustering용 빈 파일은 만들지 않았다.

## 고정된 정의

- 좌표: `x=(n-1)%7`, `y=floor((n-1)/7)`. 46~49에 해당하는 네 셀은 유효 영역 밖이다.
- 입력: 6개 점의 거리와 연결성. 번호 정체성, 번호별 빈도, 과거 당첨번호 overlap은 입력이 아니다.
- Euclidean 기본, Manhattan 설정 가능. 화면의 원형/보드 선택과 독립적으로 7×7을 사용한다.
- 거리 7개, r=1/1.5/2/2.5/3의 component/largest/edge 15개,
  r=2의 정렬된 군집 크기 6개, isolated/내부거리/군집간거리/군집중심거리 4개 = 32차원.
- average degree와 density는 그래프 진단으로 계산하되 edge count의 정확한 배수이므로
  모델 입력에 중복 가중하지 않는다. 군집이 하나이면 군집간 거리는 0으로 정의한다.
- 상대 거리 특징은 평행이동·90도 회전·반사에 불변이다. 회전으로 생긴 유효 영역 밖 셀을
  실제 조합으로 샘플링하지 않는다. 절대 위치 특징과 별도 정규화 모델은 후속 단계다.
- 학습의 평균·표준편차만 사용한다. 상수 차원의 scale은 1이다.
- 최근 3회 상태, 가까운 과거 상태 12개, 각 과거 구간의 successor는 현재 query 시작보다 이르다.
- 기본 예측은 expanding history. 연구 CLI의 사전 고정 저비용 설정은 rolling 120회다.
- 점수는 `exp(-standardized_squared_distance/2)`인 구조 유사도이고 당첨확률이 아니다.
- 100K~2M 조합 생성은 한 번 순회하며 메모리에 최대 3,000개만 유지한다.
  설정 Top 비율 안의 상위 최대 3,000개에서 선택하므로 큰 표본에서 Top 비율의 효과가 포화될 수 있다.
- 게임 간 overlap은 기본 3, 설정 최대 4. 조합이 부족해도 5개 중복을 허용하지 않고 오류를 알린다.
- 5/10게임은 같은 30게임의 앞부분이다. 결과에 실효 설정·seed·범위·버전·commit을 남긴다.

## 검증과 해석

UI walk-forward는 매 회차 직전까지 재학습한다. 랜덤 묶음은 같은 30게임/중복 상한으로
매 회차 1,000번 생성하고 같은 prefix 5/10/30을 평가한다.
학습 전 특징 계산은 행 단위 결정론적 변환만 허용하며 scaler/이웃 선택에 미래를 넣지 않는다.
결측·중복·역순 회차는 상태 전이 모델에서 거부한다.

합집합 Recall, 합집합 크기, 평균 게임 적중, 최고 적중의 평균/중앙값/3+/4+/5+/6,
평균 overlap, diversity, Shape 오차, 랜덤 lift/percentile/CI를 기록한다.
번호 합집합 크기가 U일 때 랜덤의 기대 포함 수는 `6U/45`다.
`관측 포함 수 - 6U/45`를 함께 기록해서 45개를 모두 덮는 게임 묶음의 Recall=1을
예측 신호로 오해하지 않도록 한다. CI는 길이 5의 circular moving-block bootstrap이다.

전체 null 연구는 **모든 합성 이력에 정규화→상태 검색→조합 선택→평가를 다시 실행**한다.
실제와 null에 같은 독립적인 고정 후보 bank와 같은 표본 수를 사용한다.
추가로 순서 셔플 null을 실행할 수 있다. 관측/합성 7개 endpoint의 단측 +1 Monte Carlo
p-value에 Holm 보정을 한다. 시간 3구간과 앞/뒤 validation/holdout 절반의 방향도 기록한다.
최소 1,000개 null 이력, 60개 평가 회차, 후보 지표 보정 p≤0.05, 차이 CI 하한>0,
모든 시간 구간/validation/holdout 양의 차이가 있어야 `weak-signal` 후보가 된다.
이미 여러 Uriel 실험에서 사용한 역사 데이터이므로 독립적인 최종 holdout이라고 부르지 않는다.
`potential/strong-signal` 승격은 구현하지 않았으며 새로운 미관측 데이터가 필요하다.
여러 설정·seed·모델을 시도하면 연구 간 추가 다중검정도 필요하다.

브라우저의 예측 화면은 구조 기반 **실험 후보**를 생성하지만 `selectedFeatureCount=0`이며
`NO SIGNAL · 예측력 미검증 실험`이라고 표시한다. 랜덤으로 생성했다고 거짓 표시하지 않는다.
화면 백테스트만으로 신호를 승격하지 않는다. 전체 null 이력 검증은 무거워 별도 CLI로 둔다.

## 실행

```bash
npm run research:shape
# 동일 기본 설정: seed 20260905, 1K 후보 bank, Top25%, rolling120,
# 최근96회, synthetic histories1000, bootstrap1000

npm run research:shape -- --samples 100000 --histories 1000 --training-window 0 --output docs/research/shape-full.json
npm run research:shape -- --null-kind shuffled --output docs/research/shape-shuffled.json
```

연구 bank는 1K~100K, 이력 수는 최대 10,000으로 제한한다. 실제 화면의 스트리밍 생성은
2M까지 지원한다. 다른 표본 수의 결과를 같은 실험으로 합치지 않는다. CLI JSON에는 데이터
SHA-256, 실행 시점, 실효 설정, 전체 null 분포, 실행 commit과 dirty 여부를 남긴다.

## 첫 실행 결과 (2026-09-05 UTC)

데이터: 저장된 1~~1239회, 마지막 날짜 2026-08-29. 이번 실행에서 온라인 최신 여부를
새로 확인하지 않았고 기존 업데이트/오프라인 fallback 로직은 변경하지 않았다.
평가: 1144~~1239회(96회), validation 1144~~1191 / 역사적 holdout 1192~~1239.
위 CLI 기본 설정을 결과를 보기 전에 고정했다. 비교한 synthetic 이력은 1,000개다.

| 게임 수 | Recall | 동일 합집합 크기 랜덤 기대 Recall | 평균 최고 적중 | 전체 null 평균 최고 적중 |
| ------- | -----: | --------------------------------: | -------------: | -----------------------: |
| 5       | 51.22% |                            52.57% |         1.7083 |                   1.7411 |
| 10      | 75.87% |                            77.01% |         2.0313 |                   2.0902 |
| 30      | 98.61% |                            98.77% |         2.5417 |                   2.5586 |

7개 endpoint 모두 Holm 보정 p=1.0, 차이 CI가 0을 포함한다. 결론은 **NO SIGNAL**이다.
모든 방법이 영원히 불가능하다는 증명은 아니지만, 이 설정을 더 복잡하게 확장할 근거는 없다.
30게임 합집합 평균은 44.45개여서 Recall 포화가 실제로 확인됐다.
무조건부 과거 평균보다 Shape 오차가 평균 0.0737 더 컸다. 최근 상태 검색의 효용도 확인되지 않았다.
이 결과는 1K/rolling120 탐색 실험이며 100K/전체 과거 설정에 대한 통계적 검증은 아니다.

원시 결과: [shape-core-v1-study.json](research/shape-core-v1-study.json).

## Phase별 완료 기록

| Phase   | 변경·검증                                            | 문제/통계 결과                               | 다음                         |
| ------- | ---------------------------------------------------- | -------------------------------------------- | ---------------------------- |
| 1       | 45셀 좌표 왕복/무효셀 테스트                         | 네 셀은 빈 번호가 아니라 영역 밖             | 거리                         |
| 2       | 15 pair 거리 압축·nearest, 직선 손계산 테스트        | 번호 빈도 입력 없음; 신호 판정 전            | 그래프                       |
| 3       | 5규모 connectivity, edge/degree/density 테스트       | 정확히 중복되는 차원 입력 제외               | 군집                         |
| 4       | component 기반 군집, [3,3] 테스트                    | 미존재 군집간 거리=0 정의                    | 서명                         |
| 5       | 32차원 고정 서명·D4/순서불변·유한값 테스트           | 부동소수점 1e-15 차이는 허용오차 검사        | 과거 DB                      |
| 6       | 오름차순 연속 이력 DB·누락 거부 테스트               | 데이터 최신 온라인 확인은 별도               | 과거 상태 검색               |
| 7       | 학습 scaler·최근3회/이웃12·rolling·embargo           | 미래 변조 결과 불변; 신호 판정 전            | 후보 생성                    |
| 8       | bounded heap·100K 실제 이력 생성                     | 단독 약1.46초, 회귀 병행 약2.01초(환경 의존) | 다양성                       |
| 9       | strict overlap≤3·nested 5/10/30                      | 부족하면 오류, 무조건 완화하지 않음          | walk-forward                 |
| 10      | prefix 재학습·게임/합집합 지표                       | 30게임 Recall 포화; 크기 보정 필수           | null                         |
| 11      | synthetic1000 full pipeline·셔플 옵션·bootstrap/Holm | 실제/합성 동일1K 예산, 고정bank              | 신호 판정                    |
| 12      | 시간분할/holdout/보정 검정                           | NO SIGNAL, 7개 보정p=1                       | Phase13~19 보류              |
| UI 연결 | 요청에 따라 Phase20의 최소 메뉴 연결을 앞당김        | 기존 스타일·5/10/30 유지, 실험 표시          | 검증된 신호가 있을 때만 확장 |

## 남은 검증 경계

최종 자동 검증: 테스트 29개 파일/141개 통과, TypeScript 타입 검사·ESLint·프로덕션 빌드 통과.
5/10/30별 서버 렌더링 테스트에서 각 행의 번호 6개, 알고리즘 메뉴, 접힌 진단 영역을 확인했다.

- Geometry, Orientation, Empty Space/Hole, Shape Family/Markov, 고급 회귀,
  full ablation은 계획서의 신호 gate에 따라 보류했다. persistent homology는 미구현이다.
- 100K 생성 동작은 테스트했으나 100K 예산의 1,000-null 장기 연구는 실행하지 않았다.
- 실제 브라우저 시각 QA는 환경의 `ERR_BLOCKED_BY_CLIENT`로 완료하지 못했다.
  렌더링/메뉴/행 개수 테스트와 프로덕션 빌드로 확인했지만 픽셀 단위 확인을 대체하지 않는다.

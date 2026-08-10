# Uriel 독립 Historical Holdout 검증 보고서

## 1. 목적과 동결 조건

Phase 1에서 반복 분석한 1044–1235회와 겹치지 않는 852–1043회를 독립
historical holdout으로 검증했다. 이 결과는 알고리즘 튜닝에 사용하지 않는다.

- 검증 구간: 852–1043회, 총 192회
- Candidate Pool: Top20
- Combination: Full Enumeration Diagnostic (`20C6 = 38,760`)
- Seed: `20260807`
- Monte Carlo: 32
- Ablation: ON
- Ranking Diagnostics: ON
- Candidate Engine, Ranking Score, Transition Tail Coverage 및 모든 가중치: 변경 없음
- 각 N회차는 1–N-1회 데이터만 사용

## 2. 핵심 결과

| 단계                          | 평균 Recall / Max Hit |            3+ |            4+ |          5+ |   6 |
| ----------------------------- | --------------------: | ------------: | ------------: | ----------: | --: |
| Candidate Top20               |                2.5625 |             — | 44회 (22.92%) | 8회 (4.17%) | 0회 |
| Full Enumeration Generation   |                     — |             — | 44회 (22.92%) | 8회 (4.17%) | 0회 |
| Transition Top100             |                2.1563 |             — |   8회 (4.17%) |         0회 | 0회 |
| Transition Final Top10 Before |                1.6771 | 26회 (13.54%) |   1회 (0.52%) |         0회 | 0회 |
| Transition Final Top10 After  |                1.7656 | 35회 (18.23%) |   1회 (0.52%) |         0회 | 0회 |

Candidate Recall 분포는 0개 9회, 1개 25회, 2개 59회, 3개 55회, 4개
36회, 5개 8회, 6개 0회다. Full Enumeration에서는 Candidate Top20의 모든
6개 조합을 생성하므로 Generation 4+/5+/6가 Candidate 4+/5+/6와 정확히
일치했다.

## 3. Transition Tail Coverage Before / After

| 지표               |        Before |         After |    변화 |
| ------------------ | ------------: | ------------: | ------: |
| 평균 Top10 Max Hit |        1.6771 |        1.7656 | +0.0885 |
| 3+                 | 26회 (13.54%) | 35회 (18.23%) |    +9회 |
| 4+                 |   1회 (0.52%) |   1회 (0.52%) |    동일 |
| 5+                 |           0회 |           0회 |    동일 |
| 6                  |           0회 |           0회 |    동일 |

회차별 비교에서는 24회가 개선되고 158회가 동일했으며 10회가 악화됐다.
Tail Coverage는 Holdout에서도 3+ 압축에는 일반화됐지만, 4+·5+ tail 개선은
재현하지 못했다.

## 4. 5-hit Opportunity 경로

Candidate Top20이 실제 번호 5개를 포함한 회차는 8회였다. Full Enumeration은
8회 모두 5-hit 조합을 생성했지만, Transition Top100에는 한 번도 5-hit 조합이
진입하지 못했다.

| 회차 | Candidate | Generation | Transition Top100 | Top10 Before | Top10 After | Best 5-hit Rank |
| ---: | --------: | ---------: | ----------------: | -----------: | ----------: | --------------: |
|  861 |         5 |          5 |                 3 |            2 |           3 |           3,491 |
|  881 |         5 |          5 |                 3 |            3 |           3 |           2,042 |
|  883 |         5 |          5 |                 3 |            2 |           3 |           3,975 |
|  935 |         5 |          5 |                 3 |            2 |           2 |           6,598 |
|  936 |         5 |          5 |                 3 |            2 |           2 |           8,883 |
|  954 |         5 |          5 |                 3 |            3 |           3 |          29,239 |
|  955 |         5 |          5 |                 4 |            4 |           3 |             554 |
|  996 |         5 |          5 |                 4 |            3 |           3 |           8,915 |

적중 번호는 다음과 같다.

- 861회: 11, 17, 21, 22, 25
- 881회: 4, 18, 20, 26, 27
- 883회: 18, 32, 33, 37, 44
- 935회: 4, 10, 32, 38, 44
- 936회: 11, 13, 17, 18, 29
- 954회: 9, 26, 28, 30, 41
- 955회: 9, 23, 26, 29, 33
- 996회: 6, 11, 24, 32, 39

따라서 이 Holdout의 5-hit 손실 경로는 다음과 같다.

`Candidate 8 → Generation 8 → Transition Top100 0 → Final Top10 0`

1044–1235 개발 구간에서는 5-hit 한 건이 Transition Top100 77위까지 도달해
Tail Coverage가 마지막 압축 손실을 해결했다. 반면 이번 Holdout에서는 5-hit이
모두 Top100 밖에 있어 Tail Coverage가 접근할 기회 자체가 없었다. 이 차이는
알고리즘을 변경할 근거가 아니라 동결된 Phase 1의 out-of-development 성능으로만
기록한다.

## 5. Random Monte Carlo 비교

Random은 각 회차 32개 반복의 평균을 192회 기준으로 정규화한 값이다.

| 지표               | Transition After | Random Monte Carlo ×32 |
| ------------------ | ---------------: | ---------------------: |
| 평균 Top10 Max Hit |           1.7656 |                 2.0837 |
| 3+                 |           18.23% |                 21.09% |
| 4+                 |            0.52% |                  1.29% |
| 5+                 |               0% |                 0.016% |
| 6                  |               0% |                     0% |

이 Holdout에서는 Transition After가 평균 Max Hit와 3+·4+·5+에서 Random
Monte Carlo보다 낮았다. 희귀 tail의 표본 변동은 크지만, 독립 검증 결과 자체는
우위 근거를 제공하지 않는다.

## 6. 기능 변경

백테스트의 검증 회차 선택에 다음을 추가했다.

- 최근 96회
- 최근 192회
- 이전 192회
- 사용자 지정 구간의 시작 회차 / 종료 회차

데이터가 1235회까지일 때 `이전 192회`는 최근 192회인 1044–1235회를 제외하고
자동으로 852–1043회를 선택한다. 사용자 지정 구간은 시작·종료 회차의 존재,
순서, 누락 회차, 최소 96회 선행 학습 데이터 여부를 검증한다.

결과 화면은 Shape Transition 기준으로 Candidate → Generation → Top100 →
Final Top10의 4+/5+/6 횟수를 표시하며, 5-hit Opportunity가 있으면 회차별 Top10
Before / After 경로를 표시한다. 기존 Candidate·Combination·Ranking·Portfolio
계산식은 수정하지 않았다.

## 7. 검증

- 범위 단위 테스트: 최근 96회, 최근 192회, 이전 192회, 사용자 지정 구간,
  잘못된 범위 및 미래 누수 방지 인덱스
- 정규 테스트: 77 passed, 6 skipped
- Holdout 통합 테스트: 6 passed, 26분 33초
- TypeScript 및 production build: 통과
- ESLint: 통과
- 변경 파일 Prettier: 통과

전체 저장소 `format:check`는 이번 작업과 무관한 기존
`public/data/projects.json` 포맷 차이 한 건 때문에 실패했으며, 해당 사용자 파일은
수정하지 않았다.

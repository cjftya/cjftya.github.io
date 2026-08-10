# Uriel 5+ Combination Ranking 고도화 변경 보고서

## 1. 작업 범위

- Walk-forward: 1044–1235회, 총 192회
- Candidate Pool: Top20
- Full Enumeration: `20C6 = 38,760`
- Seed: `20260807`
- Monte Carlo: 32
- Ablation: ON
- 본번호 6개만 평가
- Candidate Engine, 보너스 번호, Pool 크기, ML은 변경하지 않음
- 실제 당첨번호는 모든 점수와 순위가 확정된 뒤 평가에만 사용

## 2. 기준선 재정정

이번 전체 재계산과 별도의 Candidate-only 4구간 병렬 스캔이 같은 결과를
만들었다. 이전 보고서의 Candidate 4+ `36회`, 평균 Recall `2.5833`은 완전히
정정되지 않은 값이었다.

| Candidate Top20 | 이전 기준 | 독립 재검증 기준 |
| --------------- | --------: | ---------------: |
| Recall 평균     |    2.5833 |     **2.609375** |
| 4+ Opportunity  |        36 |           **42** |
| 5+ Opportunity  |         7 |            **7** |
| 6 Opportunity   |         0 |            **0** |

정확한 Recall 분포는 다음과 같다.

|  Hit |   0 |   1 |   2 |   3 |   4 |   5 |   6 |
| ---: | --: | --: | --: | --: | --: | --: | --: |
| 회차 |   2 |  32 |  54 |  62 |  35 |   7 |   0 |

Candidate Engine 코드는 변경되지 않았다. 새 기준선은 동일 소스에서 Candidate
Top20을 다시 생성한 결과이며 Ranking 진단 계층과 무관하게 재현됐다.

## 3. Phase 1 진단 구현

Full Enumeration 결과에 `rankingDiagnostics`를 추가했다.

- hit 0–6별 Score/Rank 분포
- count, mean, median, standard deviation
- min, max, p5, p25, p75, p90, p95, p99
- Top10/100/500/1000 진입률
- ordinary, 3-hit, 4-hit, 5-hit Feature 분포
- Feature Contribution 분포
- Feature Scale
- Feature Correlation
- Pair/Triple/Shape/Transition 상호작용
- Candidate 4+/5+ Opportunity별 최고 조합 순위와 기여도

ordinary 조합은 결과 파일과 메모리를 제한하기 위해 회차별 97 간격의 결정적
표본을 사용한다. 3/4/5-hit 조합은 전부 집계한다. Quantile은 1,000-bin
histogram으로 근사하고 count/mean/std 및 Top-K 진입률은 정확히 계산한다.

## 4. Feature Scale 분석

모든 원시 Feature는 0–1 범위 안에 있었지만 실제 분산 폭은 서로 달랐다.

| Feature             |   Mean |    Std |     P5 |    P95 |
| ------------------- | -----: | -----: | -----: | -----: |
| Individual Number   | 0.6781 | 0.0699 | 0.5565 | 0.7885 |
| Pair                | 0.2266 | 0.0682 | 0.1285 | 0.3505 |
| Triple              | 0.1428 | 0.0486 | 0.0765 | 0.2325 |
| Circle Shape        | 0.6748 | 0.1349 | 0.3965 | 0.8385 |
| Grid Shape          | 0.6740 | 0.1037 | 0.5005 | 0.8405 |
| Transition          | 0.3567 | 0.1358 | 0.1535 | 0.5915 |
| Frequency Balance   | 0.8728 | 0.1159 | 0.6435 | 0.9985 |
| Recency Balance     | 0.9111 | 0.1053 | 0.6855 | 0.9995 |
| Range / Gap Balance | 0.6241 | 0.3222 | 0.0625 | 0.9985 |
| Sum Balance         | 0.7807 | 0.2305 | 0.2875 | 0.9985 |
| Spatial Density     | 0.9224 | 0.0909 | 0.7285 | 0.9995 |

단순 범위 차이는 있으나 모든 값이 0–1로 제한돼 있었다. 따라서 raw scale만으로
Ranking 실패를 설명할 수 없고 percentile normalization은 실제 검증에서 실패했다.

## 5. Hit Group Feature 분리

| Feature median     | Ordinary |  3-hit |  4-hit |  5-hit | 방향             |
| ------------------ | -------: | -----: | -----: | -----: | ---------------- |
| Number / Agreement |   0.6805 | 0.6885 | 0.6955 | 0.6975 | 완만한 양의 방향 |
| Pair               |   0.2185 | 0.2205 | 0.2225 | 0.2345 | 양의 방향        |
| Triple             |   0.1355 | 0.1365 | 0.1385 | 0.1465 | 양의 방향        |
| Circle Shape       |   0.7185 | 0.7075 | 0.6955 | 0.6685 | 음의 방향        |
| Grid Shape         |   0.6755 | 0.6655 | 0.6545 | 0.6475 | 음의 방향        |
| Transition         |   0.3485 | 0.3395 | 0.3315 | 0.3285 | 음의 방향        |
| Frequency          |   0.9035 | 0.9105 | 0.9215 | 0.9525 | 양의 방향        |
| Recency            |   0.9505 | 0.9535 | 0.9545 | 0.9625 | 약한 양의 방향   |
| Range / Gap        |   0.6875 | 0.6595 | 0.5815 | 0.4905 | 강한 음의 방향   |
| Sum                |   0.8665 | 0.8645 | 0.8815 | 0.9155 | 대체로 양의 방향 |
| Density            |   0.9565 | 0.9575 | 0.9565 | 0.9715 | 약한 양의 방향   |

현재 weighted sum은 양·음 방향 Feature를 모두 “높을수록 좋다”로 합산한다. 그 결과
Number/Pair/Triple이 주는 약한 tail 신호가 Shape/Transition/Range에 의해 상쇄될 수
있다. 다만 이 방향을 같은 42회 결과에 맞춰 직접 뒤집는 것은 outcome fitting이므로
채택하지 않았다.

## 6. Feature Correlation과 중복

| Feature pair                        | Correlation |
| ----------------------------------- | ----------: |
| Individual Number ↔ Model Agreement |  **1.0000** |
| Range Balance ↔ Gap Balance         |  **1.0000** |
| Pair ↔ Triple                       |  **0.9734** |
| Circle Shape ↔ Range/Gap            |  **0.8084** |
| Low/High ↔ Sum                      |      0.6808 |
| Grid Shape ↔ Spatial Density        |      0.5352 |
| Grid Shape ↔ Transition             |      0.4643 |

`individualNumberScore`와 `modelAgreement`는 같은 값이다. 또한 6개 번호의 평균
연속 gap은 `(max - min) / 5`이므로 `rangeBalance`와 `gapBalance`도 같은 값이다.
중복 가중이 존재하지만 이를 제거한 단일 실험은 Top100/Top10 5+를 개선하지 못해
운영 점수식에는 반영하지 않았다.

## 7. Hit Group Score/Rank 결과

대표 전략에서 4/5-hit 조합 중앙순위는 대체로 전체 38,760개 중 중하위권이었다.

| Strategy      | 3-hit median rank | 4-hit median rank | 5-hit median rank |
| ------------- | ----------------: | ----------------: | ----------------: |
| Number        |            19,555 |            20,330 |            23,586 |
| Pair          |            19,051 |            18,392 |            14,826 |
| Pair + Triple |            18,974 |            18,198 |            14,361 |
| Shape         |            20,795 |            22,423 |            22,501 |
| Transition    |            20,446 |            21,842 |            23,392 |
| Hybrid        |            20,718 |            23,004 |            27,113 |
| Full Hybrid   |            20,756 |            22,772 |            26,725 |

Pair/Triple은 5-hit 중앙순위를 일부 개선하지만 Top100 분리력은 부족했다.
Shape/Transition/Hybrid는 4/5-hit 중앙순위가 3-hit보다 오히려 낮았다. 1044처럼
Transition이 매우 잘 맞는 개별 회차는 존재하지만 전역 분리 신호는 아니었다.

## 8. 5-hit Opportunity Baseline

| Round | Best Strategy | Best 5-hit Rank |
| ----: | ------------- | --------------: |
|  1044 | Transition    |              77 |
|  1066 | Full Hybrid   |             402 |
|  1072 | Transition    |           3,301 |
|  1100 | Transition    |             685 |
|  1102 | Number        |           6,848 |
|  1133 | Pair          |             787 |
|  1199 | Pair + Triple |           1,658 |

Generation 5-hit은 7/7이지만 Top100 5-hit은 1044 한 회차뿐이었다.

## 9. 실험 결과

### Experiment A — Percentile Normalization: 폐기

| Round | Before best rank | After best rank |
| ----: | ---------------: | --------------: |
|  1044 |               77 |              58 |
|  1066 |              402 |           1,279 |
|  1072 |            3,301 |           4,402 |
|  1100 |              685 |           2,137 |
|  1102 |            6,848 |           6,662 |
|  1133 |              787 |           1,907 |
|  1199 |            1,658 |           3,765 |

- Top100 5+: 1 → 1
- Final Top10 5+: 0 → 0
- 대부분 회차의 순위가 악화돼 제거

### Experiment B — Exact Redundancy Correction: 폐기

| Round | Before best rank | After best rank |
| ----: | ---------------: | --------------: |
|  1044 |               77 |              90 |
|  1066 |              402 |             374 |
|  1072 |            3,301 |           3,272 |
|  1100 |              685 |             651 |
|  1102 |            6,848 |           7,174 |
|  1133 |              787 |             787 |
|  1199 |            1,658 |           1,658 |

- 일부 소폭 개선은 있었지만 새 Top100/Top10 5-hit이 없음
- 운영 점수식에는 반영하지 않음

### Experiment C — Max-Signal Preservation: 폐기

기존의 top-3 agreement Tail Ensemble과 달리 일곱 주 전략 중 가장 강한 percentile
하나만 보존했다. 그러나 각 전략의 상위권이 합쳐지며 순위가 더 희석됐다.

| Round | Before best rank | After rank |
| ----: | ---------------: | ---------: |
|  1044 |               77 |        377 |
|  1066 |              402 |      1,747 |
|  1072 |            3,301 |     11,374 |
|  1100 |              685 |      2,780 |
|  1102 |            6,848 |     23,245 |
|  1133 |              787 |      3,351 |
|  1199 |            1,658 |      6,713 |

- Top100 5+: 1 → 0
- Final Top10 5+: 0 → 0
- 운영 코드에서 제거

### Experiment D — Transition Tail Coverage: 채택

1044의 5-hit 조합은 Transition 77위였고 기존 포트폴리오는 1–29위 안에서만
10게임을 선택했다. 해당 77위 조합은 31–80위 후보 중 기존 Top10과 번호 중복이
가장 낮은 후보 3위였다.

채택한 압축 방식:

1. 기존 최상위 7게임을 보존한다.
2. Transition Research 31–80위에서 후보를 찾는다.
3. 현재 선택 게임과의 최대 번호 중복을 최소화한다.
4. 동률이면 전체 중복 합, 그다음 원래 연구 순위를 사용한다.
5. 이 방식으로 Tail Coverage 3게임을 추가한다.

당첨번호, 특정 회차, Feature 방향은 선택 조건에 포함되지 않는다.

## 10. 전체 192회 Before / After

| Transition Top10         |   Before |        After |
| ------------------------ | -------: | -----------: |
| Average Max Hit          | 1.671875 | **1.729167** |
| 3+                       | 10.9375% | **11.4583%** |
| 4+                       |  0.5208% |  **1.0417%** |
| 5+                       |       0% |  **0.5208%** |
| 6                        |       0% |           0% |
| Candidate 4+ → Top100 4+ |     7/42 |         7/42 |
| Candidate 4+ → Top10 4+  |     1/42 |     **2/42** |
| Candidate 5+ → Top100 5+ |      1/7 |          1/7 |
| Candidate 5+ → Top10 5+  |      0/7 |      **1/7** |

1044회 Transition의 5-hit 조합은 Ranking 77위와 Top100 포함 상태를 유지하면서
Final Top10에 들어왔다. 따라서 개선 지점은 Ranking 점수 변경이 아니라
Top100→Top10 Compression이다.

## 11. Random Baseline 비교

| Metric                | Random Monte Carlo ×32 | Transition After |
| --------------------- | ---------------------: | ---------------: |
| Average Top10 Max Hit |                 2.0955 |           1.7292 |
| Top10 3+              |               22.0052% |         11.4583% |
| Top10 4+              |                1.5137% |          1.0417% |
| Top10 5+              |                0.1139% |      **0.5208%** |
| Top10 6               |                     0% |               0% |

평균, 3+, 4+는 아직 Random보다 낮다. 5+는 이번 표본에서 Random보다 높아졌지만
한 회차뿐이므로 반복 가능한 우위로 해석할 수 없다. 중요한 Guardrail은 기존
Transition 대비 모든 3+/4+/5+ 지표가 유지 또는 개선됐다는 점이다.

## 12. JSON/UI 변경

- `metricSchemaVersion: 4`
- `rankingDiagnostics.hitGroupDistributions`
- `rankingDiagnostics.featureDistributions`
- `rankingDiagnostics.featureContributionDistributions`
- `rankingDiagnostics.featureScales`
- `rankingDiagnostics.featureCorrelations`
- `rankingDiagnostics.fourHitOpportunities`
- `rankingDiagnostics.fiveHitOpportunities`
- `portfolioExperiment.before / after`
- 5-hit Opportunity별 `top10MaxHitBefore / top10MaxHit`
- UI에 Transition Tail Coverage Before/After 표 추가

## 13. 변경 파일

- `src/uriel/analysis/rankingDiagnostics.ts`
- `src/uriel/analysis/backtest.ts`
- `src/uriel/analysis/purchase.ts`
- `src/uriel/analysis/combination.ts`
- `src/uriel/components/BacktestPanel.tsx`
- `src/uriel/App.tsx`
- `tests/uriel-tail-diagnostic.test.ts`
- `tests/uriel-analysis.test.ts`
- `docs/uriel-ranking-enhancement-2026-08-10.md`

## 14. 결론과 다음 단계

이번 작업에서 Top100 5+를 1회보다 늘리는 Ranking score 변경은 찾지 못했다.
Percentile, 중복 제거, Max-Signal 방식은 모두 폐기했다.

대신 1044에서 분리된 Top100→Top10 Compression 병목을 Tail Coverage로 해결해
Final Top10 5-hit을 0회에서 1회로 만들었고, 전체 192회에서 3+/4+도 함께
개선했다.

다음 우선순위는 다음과 같다.

1. 새 표본이 쌓였을 때 Tail Coverage 5+의 반복성 재검증
2. Top100 5+를 1/7보다 늘리지 못한 Ranking Feature의 정보 한계 인정
3. 다음 Phase에서 Candidate Engine 5+/6 Opportunity 확대 검토
4. Candidate Engine 변경 시 이번 `2.609375 / 42 / 7 / 0` 기준선 고정

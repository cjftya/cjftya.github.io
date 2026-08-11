# FINAL DECISION: FAIL

## Uriel Phase 5 — Candidate Opportunity Quality & Final Viability Decision

사전 정의한 Candidate 가설 3개 중 Development의 Opportunity, Quality, Leave-One-Opportunity-Out, Delivery gate를 모두 통과한 가설은 없었다.

따라서 Phase 5 Candidate 가설은 Historical에 진입하지 않았다. Historical에서는 동결된 Current/Decay/Grid 기준선과 Phase 4/4B 회귀만 재현했다.

- Decision baseline: Current operating Candidate
- Frozen hypothesis: 없음
- Operating path: Current Candidate → Transition Top100 → Tail Coverage Final Top10, 변경 없음
- Locked Holdout 접근: 없음
- Additional Blind Holdout 접근: 없음
- 최종 처리: Uriel v1 종료

## 사전 정의 Candidate 가설

| Hypothesis                 | Fixed design                                           | Expected effect                                                |
| -------------------------- | ------------------------------------------------------ | -------------------------------------------------------------- |
| P5_A_STRONG_FLOOR          | Pure ranking, specialist slot 없음                     | 세 source 중 가장 약한 지지도를 높여 5·6번째 번호의 floor 개선 |
| P5_B_CROSS_MODEL           | Source median/mean과 Top20 agreement 결합              | 여러 독립 signal이 동시에 지지하는 번호 보존                   |
| P5_C_CONTROLLED_SPECIALIST | Consensus core 14 + Current/Decay/Grid specialist 각 2 | 과도한 coverage 없이 source-specific 번호 일부 보존            |

가설, 공식, slot, threshold는 결과 실행 전에 고정했다.

## Development 선택 결과

| Hypothesis                 | Candidate 4+/5+/6 | 개선된 core quality | LOO stable | Transition Top100 4+/5+/6 | Result |
| -------------------------- | ----------------: | ------------------: | ---------: | ------------------------: | ------ |
| P5_A_STRONG_FLOOR          |           49/12/1 |                   2 |      12/17 |                    12/1/0 | REJECT |
| P5_B_CROSS_MODEL           |           47/10/1 |                   2 |       1/15 |                     7/0/0 | REJECT |
| P5_C_CONTROLLED_SPECIALIST |           41/10/2 |                   0 |       0/15 |                    12/0/0 | REJECT |

### Development gate 상세

| Hypothesis                 | Gate A Opportunity | Gate B Quality | Gate C No Single-Round Dependency | Gate D Delivery |
| -------------------------- | ------------------ | -------------- | --------------------------------- | --------------- |
| P5_A_STRONG_FLOOR          | PASS               | PASS           | FAIL                              | PASS            |
| P5_B_CROSS_MODEL           | PASS               | PASS           | FAIL                              | FAIL            |
| P5_C_CONTROLLED_SPECIALIST | PASS               | FAIL           | FAIL                              | FAIL            |

P5_A는 유일하게 Opportunity, Quality, Delivery를 동시에 유지했지만 LOO가 12/17에 그쳤고, 한 Opportunity 제거 시 최소 개선 지표가 1개로 감소했다. Gate C에 따라 Historical winner로 동결할 수 없다.

P5_B는 best-5 Pair rank와 Candidate min을 개선했지만 ensemble floor가 악화됐고, Transition Top100 5+가 Current의 1회에서 0회로 감소했다.

P5_C는 Candidate 6 Opportunity를 2회 만들었지만 core quality 개선은 0개였고 Transition Top100 5+도 0회였다.

### Development quality

| Engine                     | best-5 Pair median | Candidate min | Ensemble worst | Exact-6 Pair | D1 Pair median |
| -------------------------- | -----------------: | ------------: | -------------: | -----------: | -------------: |
| Current                    |              4,982 |        0.5784 |         0.1615 |            - |              - |
| P5_A_STRONG_FLOOR          |              2,374 |        0.5053 |         0.1974 |       24,306 |         21,112 |
| P5_B_CROSS_MODEL           |            2,530.5 |        0.6365 |         0.1138 |       24,437 |         22,453 |
| P5_C_CONTROLLED_SPECIALIST |              6,784 |        0.5446 |         0.1806 |     16,582.5 |         18,881 |

사전 의미 기준은 rank 10% 이상 개선, percentile 0.02 이상 개선이었다.

- P5_A: best-5 Pair rank와 ensemble worst 개선, Candidate min 악화
- P5_B: best-5 Pair rank와 Candidate min 개선, ensemble worst 악화
- P5_C: 기준을 넘긴 core quality 없음

## Candidate Opportunity

| Engine          | Development 4+/5+/6 | Historical 4+/5+/6 |
| --------------- | ------------------: | -----------------: |
| Current         |              42/7/0 |             44/8/0 |
| Decay           |             54/14/1 |             29/4/0 |
| Grid Transition |              47/8/4 |            35/12/0 |
| Phase 5 frozen  |                없음 |      실행하지 않음 |

동일 Top20 크기의 Exact Random 기대값은 192회당 4+/5+/6 = 44.3131/10.0504/0.9137이다.

- P5_A 5+ 12회는 Random 기대 10.05회보다 소폭 높지만 LOO가 불안정했다.
- P5_B와 P5_C의 5+ 10회는 Random 기대와 사실상 같은 범위다.
- P5의 단발 또는 2회 6 Opportunity는 quality와 basin으로 전달되지 않았다.

## Opportunity Quality

Development gate를 통과한 P5 frozen candidate가 없으므로 Historical P5 열은 의도적으로 비어 있다.

| Metric                    | Dev Current | Dev P5 frozen | Hist Current | Hist P5 frozen |
| ------------------------- | ----------: | ------------: | -----------: | -------------: |
| best-5 Pair rank median   |       4,982 |             - |      9,090.5 |              - |
| Pair score                |      0.2722 |             - |       0.2435 |              - |
| Pair Gini                 |      0.3980 |             - |       0.4746 |              - |
| Pair entropy              |      0.8915 |             - |       0.8395 |              - |
| Candidate mean            |      0.7307 |             - |       0.7456 |              - |
| Candidate min             |      0.5784 |             - |       0.6200 |              - |
| Ensemble mean             |      0.4258 |             - |       0.5453 |              - |
| Ensemble worst            |      0.1615 |             - |       0.2214 |              - |
| Distance-1 Pair median    |           - |             - |            - |              - |
| Distance-1 Top500 density |           - |             - |            - |              - |

Cross-period에서 같은 방향으로 검증된 P5 core quality metric은 0개다. 이는 Historical에서 실패한 것이 아니라, Development gate 탈락으로 P5 Historical 실행 자체가 허용되지 않았기 때문이다.

## Recall 6 상세

| Round | Engine                     | Exact Pair | Transition |  Shape | Number | D1 Pair Median | D1 Top500 |
| ----: | -------------------------- | ---------: | ---------: | -----: | -----: | -------------: | --------: |
|  1176 | Decay baseline             |      7,884 |     15,143 | 21,340 | 21,697 |         11,406 |      0/84 |
|  1066 | Grid Transition            |      4,776 |     17,479 | 11,303 | 35,144 |         10,658 |      5/84 |
|  1123 | Grid Transition            |     12,350 |     22,165 | 21,509 | 11,614 |       13,933.5 |      0/84 |
|  1164 | Grid Transition            |     37,083 |     38,668 | 33,135 | 26,044 |         35,103 |      0/84 |
|  1228 | Grid Transition            |     17,400 |     34,271 | 29,948 | 24,380 |       17,529.5 |      0/84 |
|  1123 | P5_A_STRONG_FLOOR          |     24,306 |     15,149 | 23,568 | 13,968 |         21,112 |      0/84 |
|  1123 | P5_B_CROSS_MODEL           |     24,437 |     16,425 | 24,678 | 17,075 |         22,453 |      0/84 |
|  1123 | P5_C_CONTROLLED_SPECIALIST |     20,284 |     22,677 | 28,735 | 15,876 |         19,388 |      0/84 |
|  1133 | P5_C_CONTROLLED_SPECIALIST |     12,881 |     27,090 | 20,620 | 26,304 |         18,374 |      0/84 |

P5 exact Pair rank는 12,881–24,437에 머물렀다. 모든 P5 Recall 6의 distance-1 84개 조합은 Pair Top500 진입이 0개였다. 1176회 baseline보다도 basin이 약해졌으며, 반복 가능한 basin 형성 근거가 없다.

## Top100 Delivery와 Final Top10

| Engine                                 | Candidate 4+/5+/6 | Transition Top100 4+/5+/6 | 5+ preservation | Final Top10 4+/5+/6 |
| -------------------------------------- | ----------------: | ------------------------: | --------------: | ------------------: |
| Development Current                    |            42/7/0 |                     7/1/0 |          0.1429 |               2/1/0 |
| Development P5_A_STRONG_FLOOR          |           49/12/1 |                    12/1/0 |          0.0833 |               5/0/0 |
| Development P5_B_CROSS_MODEL           |           47/10/1 |                     7/0/0 |               0 |               3/0/0 |
| Development P5_C_CONTROLLED_SPECIALIST |           41/10/2 |                    12/0/0 |               0 |               5/0/0 |
| Historical Current                     |            44/8/0 |                     8/0/0 |               0 |               1/0/0 |

P5_A는 Transition Top100 5+를 1회 유지했지만 Candidate 5+가 12회로 늘면서 preservation rate는 0.1429에서 0.0833으로 낮아졌다. Final Top10에서는 Current의 5+ 1회를 보존하지 못했다.

P5_B와 P5_C는 Candidate 5+/6 증가가 Top100 5+로 한 번도 전달되지 않았다. P5_C의 Top100/Top10 4+ 증가는 성공 판정에 사용하지 않았다.

## Phase 4/4B frozen regression

| Period      | Decay Candidate | Pair Top100 | P4_OVERLAP_LIMIT |
| ----------- | --------------: | ----------: | ---------------: |
| Development |         54/14/1 |      13/0/0 |           24/2/0 |
| Historical  |          29/4/0 |       4/1/0 |           12/0/0 |

모든 동결 baseline이 Phase 4/4B 보고서와 정확히 일치했다.

## QA

### Leakage

- Candidate hypothesis builder는 number와 Current/Decay/Grid source rank만 입력받는다.
- 실제 winner, 현재 round outcome, future round를 Candidate score에 사용하지 않는다.
- Historical 결과를 사용한 weight, slot, threshold, source, normalization 변경은 없다.
- Locked 660–851과 Additional Blind 468–659의 실행 bound는 Phase 5 모듈에 존재하지 않는다.
- Locked/Blind accessed flag는 모두 false다.

### Reproducibility

- Fixed seed: 20260807
- 동일 input에서 세 Candidate Top20이 동일함을 테스트했다.
- Candidate ranking은 45개 unique number, Top20은 20개 unique number임을 테스트했다.
- 6 Opportunity마다 distance-1 조합이 정확히 84개임을 검증했다.
- 전체 384회 평가와 4-hit-only 보조 완전 열거 테스트가 통과했다.
- 보조 완전 열거 전후 Candidate, 5+/6, quality, LOO, decision은 동일하고 Top100/Top10 4+만 보충됐음을 비교했다.

### Regression and build

- Phase 5 boundary test 통과
- TypeScript no-emit build 통과
- ESLint 통과
- 전체 프로젝트 test: 20 files passed, 2 skipped; 87 tests passed, 15 skipped
- Production build 통과

## 필수 질문 답변

1. Candidate Recall은 개선됐는가?

   Development 5+는 Current 7회에서 P5_A 12회, P5_B 10회, P5_C 10회로 증가했다. 하지만 quality·LOO·delivery gate를 통과한 가설이 없어 유효 개선으로 채택하지 않는다.

2. 5+/6 Opportunity Quality도 같이 개선됐는가?

   안정적으로는 아니다. P5_A와 P5_B가 각각 2개 core metric을 개선했지만 LOO가 12/17과 1/15였고, P5_C는 개선 지표가 0개였다.

3. exact winner rank는 상위 영역으로 이동했는가?

   아니다. P5 exact Pair rank는 12,881–24,437이었다.

4. winner 주변 distance-1 basin이 형성됐는가?

   아니다. P5 D1 Pair median은 18,374–22,453이었고 Top500은 모두 0/84였다.

5. 여러 ranking의 ensemble floor가 개선됐는가?

   일관되게는 아니다. P5_A만 median이 개선됐지만 LOO가 불안정했고, P5_B는 악화, P5_C는 사전 0.02 기준 미달이었다.

6. Development 개선이 Historical에서도 같은 방향으로 재현됐는가?

   검증하지 않았다. Development gate에서 모든 P5 가설이 탈락했기 때문에 P5 Historical 실행은 허용하지 않았다. Historical baseline과 회귀만 재현했다.

7. Top100 전달력이 개선됐는가?

   아니다. P5_A는 5+ 1회를 유지했을 뿐 improvement가 없었고, P5_B/P5_C는 0회였다.

8. 개선이 특정 1–2회에 의존하는가?

   LOO stability gate를 통과한 가설이 없으므로 의존성을 배제할 수 없다.

9. 현재 Uriel v1을 계속 연구할 근거가 있는가?

   없다.

10. 최종 판정은 무엇인가?

    FAIL.

## 최종 해석

이번 FAIL은 구현 실패가 아니다.

현재 Uriel v1의 Candidate/Pair/Shape/Transition/Coverage 계열이 독립적인 기간으로 가져갈 만큼 안정적인 5+/6 Candidate landscape를 Development에서 만들지 못했다는 뜻이다.

따라서 다음을 수행하지 않는다.

- Phase 6 또는 Phase 7
- Candidate 추가 튜닝
- Combination 추가 튜닝
- Locked Holdout 실행
- Additional Blind Holdout 실행

Uriel v1 코드는 동결하고 결과를 보존한다. 다시 연구한다면 v1의 weight나 selector를 조금 수정하는 Phase 연장이 아니라 원리 수준에서 독립적인 `Uriel v2` 또는 `Uriel Experiment 2`로 시작해야 한다.

# Uriel Candidate Engine Phase 2 진단 및 실험 보고서

## 1. 결론

Phase 2의 운영 Candidate Engine은 **Current를 유지**한다.

Development 1044–1235회에서 Decay 순위는 Candidate Top20의 5+ Opportunity를
`7 → 14회`, 6 Opportunity를 `0 → 1회`로 늘려 Candidate Gate를 통과했다. 그러나
고정된 Phase 1 조합 파이프라인에 연결하면 5+/6 조합이 모두 Transition Top100에서
탈락했다.

| 전략               | Candidate 5+ | Candidate 6 | Top100 5+ | Top100 6 | Final Top10 5+ | Final Top10 6 | 결정          |
| ------------------ | -----------: | ----------: | --------: | -------: | -------------: | ------------: | ------------- |
| Current            |            7 |           0 |     **1** |        0 |          **1** |             0 | **운영 유지** |
| Tail Rescue        |           11 |           1 |         1 |        0 |              0 |             0 | 기각          |
| Temporal Stability |           11 |           1 |         0 |        0 |              0 |             0 | 기각          |
| Decay              |       **14** |       **1** |         0 |        0 |              0 |             0 | 기각          |

따라서 이번 Phase에서 Candidate 자체의 개선 가능성은 확인했지만, 최종 10게임의
5+/6 성능을 유지·개선하지 못했으므로 실제 알고리즘 변경으로 채택하지 않는다.
Historical Reference와 Locked Holdout은 Current가 동결된 상태로만 읽었으며,
두 구간 결과를 실험 선택이나 가중치 조정에 사용하지 않았다.

## 2. 평가 설계와 누수 방지

- Development: 1044–1235회, 192회
- Historical Reference: 852–1043회, 192회
- Locked Holdout: 660–851회, 192회
- Candidate Pool: Top20 고정
- 각 N회차는 1–N-1회 데이터로만 점수를 계산
- 본번호 6개만 평가, 보너스 번호 제외
- Seed: `20260807`
- Random Monte Carlo: 구간별 1,000회
- Development만 실험과 Gate 평가 허용
- Historical/Locked에서는 `tuningAllowed=false`로 실험 계산을 차단
- Candidate 개선안의 최종 채택 전 Phase 1의 Full Enumeration → Transition
  Top100 → Tail Coverage Top10을 그대로 재실행

실제 당첨번호는 회차별 Candidate 순위와 Top20을 확정한 뒤 Recall, r5, r6 및
Opportunity 평가에만 사용한다. 미래 회차 당첨번호를 바꿔도 해당 회차의 Candidate
순위와 점수가 바뀌지 않는 테스트를 추가했다.

## 3. 정확한 Random Top20 기준

45개 중 임의의 20개를 고를 때 당첨번호 6개 포함 수는 hypergeometric 분포다.

| 지표        | 정확한 기대값 | 192회 기대 횟수 |
| ----------- | ------------: | --------------: |
| 평균 Recall |      2.666667 |               — |
| 4+          |      23.0798% |          44.313 |
| 5+          |       5.2346% |          10.050 |
| 6           |       0.4759% |           0.914 |

Development의 1,000회 Random Monte Carlo도 정확한 기준과 일치했다.

| 지표        |   평균 |     P5 |    P50 |    P95 | Current |
| ----------- | -----: | -----: | -----: | -----: | ------: |
| 평균 Recall | 2.6644 | 2.5313 | 2.6615 | 2.7969 |  2.6094 |
| 4+ 횟수     | 44.488 |     35 |     45 |     54 |      42 |
| 5+ 횟수     |  9.939 |      5 |     10 |     15 |       7 |
| 6 횟수      |  0.879 |      0 |      1 |      3 |       0 |
| r6 중앙값   | 40.856 |     40 |     41 |     42 |      41 |
| Near6@22    |  1.736 |      0 |      2 |      4 |       1 |
| Near6@25    |  4.177 |      1 |      4 |      8 |       1 |

## 4. 동결 Current 재현

| 구간                  | Recall 분포 0–6    | 평균 Recall |  4+ |  5+ |   6 | r5 중앙값 | r6 평균 / 중앙값 | Near6@22 / 25 / 30 |
| --------------------- | ------------------ | ----------: | --: | --: | --: | --------: | ---------------: | -----------------: |
| Development 1044–1235 | 2/32/54/62/35/7/0  |      2.6094 |  42 |   7 |   0 |        33 |      39.354 / 41 |         1 / 1 / 13 |
| Historical 852–1043   | 9/25/59/55/36/8/0  |      2.5625 |  44 |   8 |   0 |        34 |      39.943 / 41 |         1 / 2 / 10 |
| Locked 660–851        | 7/18/61/60/30/16/0 |      2.7083 |  46 |  16 |   0 |        34 |      39.406 / 41 |         2 / 5 / 17 |

Random 대비 Current lift는 다음과 같다.

| 구간        | Recall Lift | 4+ Lift | 5+ Lift | 6 Lift |
| ----------- | ----------: | ------: | ------: | -----: |
| Development |       0.979 |   0.948 |   0.696 |      0 |
| Historical  |       0.961 |   0.993 |   0.796 |      0 |
| Locked      |       1.016 |   1.038 |   1.592 |      0 |

Locked의 5+ 16회는 Random Monte Carlo의 97.2 percentile이지만 48회 블록별
분포가 `1 / 4 / 2 / 9회`로 마지막 블록에 집중됐다. 긍정적인 관측이지만 안정적인
우위나 재현성의 증거로 해석하지 않으며, 이 결과로 알고리즘을 조정하지 않았다.

## 5. Cutoff Loss와 5-hit 누락 번호

Development에서 Current Top20 밖 실제 당첨번호의 순위 구간은 다음과 같다.

| 누락 유형                   | 21–25 | 26–30 | 31–35 | 36–45 |
| --------------------------- | ----: | ----: | ----: | ----: |
| 모든 누락 당첨번호          |   125 |   146 |   127 |   253 |
| 5-hit 회차의 여섯 번째 번호 |     1 |     3 |     2 |     1 |

| 회차 | 누락 번호 | Current 순위 |
| ---: | --------: | -----------: |
| 1044 |        28 |           33 |
| 1066 |        11 |           30 |
| 1072 |        43 |           39 |
| 1100 |        43 |           33 |
| 1102 |        22 |           26 |
| 1133 |        29 |           30 |
| 1199 |        25 |           22 |

5-hit의 마지막 한 번호가 21–30위에 4/7회, 31위 밖에 3/7회 있었다. 고정 Top20
경계 근처의 rescue가 일부 기회를 늘릴 수 있지만, 단순 Pool 확대는 조합 수와
후속 랭킹 손실을 함께 키우므로 이번 Phase에서는 Pool 크기를 변경하지 않았다.

## 6. Feature 진단

대표 Feature 평균은 당첨 여부보다 Top20 포함 여부에 따라 크게 갈렸다.

| 그룹              |  개수 | Number Score | Agreement |   Pair | Transition | Recency |
| ----------------- | ----: | -----------: | --------: | -----: | ---------: | ------: |
| 당첨 · Top20      |   501 |       0.6798 |    0.6447 | 0.4778 |     0.7024 |  0.5108 |
| 비당첨 · Top20    | 3,339 |       0.6752 |    0.6441 | 0.4830 |     0.6964 |  0.5192 |
| 당첨 · Top20 밖   |   651 |       0.3538 |    0.2883 | 0.4139 |     0.4779 |  0.4446 |
| 비당첨 · Top20 밖 | 4,149 |       0.3509 |    0.2841 | 0.4047 |     0.4726 |  0.4370 |

같은 cutoff 그룹 안에서는 당첨/비당첨의 평균 차이가 매우 작다. 현재 Feature가
“Top20다운 번호”를 구분하는 데는 쓰이지만, 그 안에서 실제 당첨번호를 추가로
분리하는 신호는 약하다는 뜻이다.

| 중복 Feature              | 상관계수 |
| ------------------------- | -------: |
| Number Score ↔ Grid Shape |   1.0000 |
| Frequency ↔ Cumulative    |   1.0000 |
| Recency ↔ Decay           |   1.0000 |
| Pair ↔ Triple             |   0.8758 |
| Pair ↔ Recency            |   0.8720 |

동일 신호의 별칭과 높은 상관을 확인했다. 이를 여러 번 가중하면 독립 정보가 늘어난
것처럼 보일 수 있으므로 새 합성식의 Feature 수 자체를 개선 근거로 사용하지 않았다.

## 7. Development 신호 비교

| 전략            | 평균 Recall |     4+ |     5+ |     6 | r6 중앙값 | Near6@25 | 비고                                |
| --------------- | ----------: | -----: | -----: | ----: | --------: | -------: | ----------------------------------- |
| Current         |      2.6094 |     42 |      7 |     0 |        41 |        1 | 기준선                              |
| Grid Transition |      2.7344 |     47 |      8 | **4** |        41 |    **9** | 4개 블록 각각 6 한 번, 5+ Gate 미달 |
| Circle Hybrid   |      2.6302 |     44 |      8 |     1 |        41 |        3 | 진단 신호                           |
| Pair            |      2.6823 |     49 |     10 |     0 |        41 |        3 | 블록 편중                           |
| Triple          |      2.7448 |     54 |      9 |     1 |        41 |        3 | 5+ Random 미달                      |
| Independent     |      2.7031 |     52 |     12 |     0 |        41 |        4 | 5+ 개선, 6 없음                     |
| Cumulative      |      2.6146 |     44 |      8 |     0 |        41 |        0 | 진단 신호                           |
| Decay           |  **2.7396** | **54** | **14** |     1 |        41 |        4 | Candidate Gate 승자                 |

Grid Transition은 6 Opportunity 4회를 네 블록에 하나씩 만들었지만 5+가 8회로
정확한 Random 기대 10.05회보다 낮았다. 6회처럼 희귀한 단일 지표만 보고 채택하면
선택 편향이 커지므로 사전 Gate를 유지했다.

## 8. 제한된 실험과 Candidate Gate

Gate는 다음을 모두 요구했다.

1. 평균 Recall 개선 또는 거의 같은 Recall에서 tail 개선
2. Current보다 많은 5+이며 정확한 Random 5+ 비율 초과
3. r6 분포 또는 Near6 개선
4. Current 및 Random 대비 5+ lift 개선
5. 48회 블록 4개 중 최소 3개 개선

| 실험                   | 평균 Recall |     4+ |     5+ |   6 | Near6@25 | 개선 블록 | Candidate Gate  |
| ---------------------- | ----------: | -----: | -----: | --: | -------: | --------: | --------------- |
| Rank Normalization     |      2.6563 |     48 |      9 |   0 |        2 |       2/4 | REJECT          |
| Rank Fusion            |      2.6146 |     39 |      7 |   0 |        4 |       2/4 | REJECT          |
| Tail Rescue            |      2.6667 |     38 |     11 |   1 |        6 |       4/4 | KEEP            |
| Multi-view             |      2.7135 |     39 |      8 |   4 |        6 |       3/4 | REJECT          |
| Conditional Transition |      2.6563 |     49 |      9 |   0 |        6 |       4/4 | REJECT          |
| Temporal Stability     |      2.6510 |     47 |     11 |   1 |        5 |       4/4 | KEEP            |
| Decay, half-life 36회  |  **2.7396** | **54** | **14** |   1 |        4 |       3/4 | **KEEP / 승자** |

Decay의 48회 블록별 5+는 `2 / 6 / 2 / 4회`로 Current의 `3 / 3 / 0 / 1회`보다
세 블록에서 개선됐다. Candidate-only 선택 기준에서는 가장 강했지만 최종 채택은
아래 end-to-end 결과로 결정했다.

## 9. Full Enumeration → Top100 → Top10 결과

| 전략               | 단계                   |     4+ |     5+ |     6 |
| ------------------ | ---------------------- | -----: | -----: | ----: |
| Current            | Candidate / Generation |     42 |      7 |     0 |
| Current            | Transition Top100      |      7 |      1 |     0 |
| Current            | Tail Coverage Top10    |      2 |  **1** |     0 |
| Tail Rescue        | Candidate / Generation |     38 |     11 |     1 |
| Tail Rescue        | Transition Top100      |      7 |      1 |     0 |
| Tail Rescue        | Tail Coverage Top10    |      3 |      0 |     0 |
| Temporal Stability | Candidate / Generation |     47 |     11 |     1 |
| Temporal Stability | Transition Top100      |     11 |      0 |     0 |
| Temporal Stability | Tail Coverage Top10    |      4 |      0 |     0 |
| Decay              | Candidate / Generation | **54** | **14** | **1** |
| Decay              | Transition Top100      |      9 |      0 |     0 |
| Decay              | Tail Coverage Top10    |      3 |      0 |     0 |

Full Enumeration은 Candidate Top20 안의 모든 6개 조합을 만들기 때문에
Candidate와 Generation의 4+/5+/6 Opportunity가 같다. 손실은 전부 고정된
Transition Top100에서 발생했다.

6-hit 추적 결과:

- Tail Rescue 1133회: 당첨번호 순위 `2/7/9/14/17/20`, Generation 포함,
  Top100 미진입
- Temporal Stability 1155회: `5/7/8/17/19/20`, Generation 포함,
  Top100 미진입
- Decay 1176회: `2/5/9/10/16/20`, Generation 포함, Top100 미진입

Decay의 Candidate→Generation 5+/6 전환율은 100%였지만 Generation→Top100은
둘 다 0%였다. Candidate 전략을 바꾸면서 Phase 1 조합 점수는 동결했기 때문에,
새 Candidate가 만든 기회와 기존 조합 Ranking Feature의 호환성이 낮아진 것으로
해석한다.

## 10. 변경 내용

- `candidatePhase2.ts`
  - exact hypergeometric Random 기준 및 결정적 Monte Carlo
  - Current/대체 신호별 Top20, Recall 분포, r5/r6, Near6
  - cutoff loss, 5-hit 누락 번호, Feature 그룹과 상관
  - Development-only 실험과 사전 Candidate Gate
  - Historical/Locked tuning 차단과 frozen strategy 구분
- `candidatePhase2EndToEnd.ts`
  - 임의 Candidate Top20 override를 Full Enumeration에 연결
  - Transition Top100과 Tail Coverage Top10 변환율
  - 6-hit Opportunity의 탈락 단계 추적
- `combination.ts`
  - Phase 1 Feature/점수식을 바꾸지 않는 Candidate 순위 override
  - 필요한 연구 전략만 계산하는 선택 옵션
- `candidates.ts`
  - board/circle별 basis cache 분리
  - 대규모 full sort 대신 결정적 Top-K heap 적용
- 테스트
  - 정확한 Random 기준, 동결 Current 재현, 미래 누수 방지
  - Candidate override가 `20C6=38,760`을 보존하는지 검증
  - Development/Historical/Locked 장시간 회귀 테스트
  - 선택 후보 3개의 192회 end-to-end 회귀 테스트

## 11. 최종 결정과 Phase 3 제안

Phase 2의 실제 Before/After는 동일하다.

| 운영 지표, Development 192회 | Before Current | After Phase 2 |
| ---------------------------- | -------------: | ------------: |
| Candidate 평균 Recall        |         2.6094 |        2.6094 |
| Candidate 4+                 |             42 |            42 |
| Candidate 5+                 |              7 |             7 |
| Candidate 6                  |              0 |             0 |
| Transition Top100 5+         |              1 |             1 |
| Final Top10 5+               |              1 |             1 |
| Final Top10 6                |              0 |             0 |

다음 Phase의 우선순위는 Candidate 가중치를 더 탐색하는 것이 아니라
**Candidate–Combination compatibility**를 진단하는 것이다.

1. Decay와 Grid Transition을 specialist Candidate branch로 분리한다.
2. 각 branch가 새로 만든 5+/6 조합의 Phase 1 Feature/순위 분포를 Current와 비교한다.
3. 당첨 결과를 직접 쓰지 않는 source-aware 조합 점수 또는 quota를 Development에서만
   제한적으로 실험한다.
4. Candidate Gate와 End-to-end Gate를 모두 통과한 단일안만 Historical Reference에
   한 번 적용하고, Locked Holdout은 마지막까지 봉인한다.

Phase 2의 핵심 발견은 “좋은 번호 후보를 더 많이 포함할 수 있다”와 “그 기회를
최종 10게임까지 보존할 수 있다”가 서로 다른 문제라는 점이다. 이번에는 전자는
개선됐지만 후자가 실패했으므로 Current 유지가 가장 보수적이고 재현 가능한 결정이다.

## 12. 재현 명령

```bash
# 빠른 단위/회귀 테스트
npm test -- --run tests/uriel-candidate-phase2.test.ts \
  tests/uriel-candidate-phase2-end-to-end.test.ts

# Candidate-only 3구간 전체 평가
URIEL_PHASE2_FULL=1 npm test -- --run \
  tests/uriel-candidate-phase2.test.ts

# Development 결과를 사용한 선택 후보 end-to-end 평가
URIEL_PHASE2_END_TO_END=1 \
URIEL_PHASE2_END_TO_END_RANKINGS=tail-rescue,temporal-stability,decay \
URIEL_PHASE2_DEVELOPMENT_RESULT=/tmp/uriel-phase2-development.json \
npm test -- --run tests/uriel-candidate-phase2-end-to-end.test.ts
```

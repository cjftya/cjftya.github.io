# Uriel Candidate–Combination Compatibility Phase 3 보고서

## 1. 결론

Phase 3에서도 운영 알고리즘은 **Current Candidate → Transition Top100 → Tail
Coverage Final Top10**을 그대로 유지한다.

Development 1044–1235회에서 Decay는 Candidate 5+를 `7 → 14회`, Grid
Transition은 Candidate 6을 `0 → 4회`로 늘렸지만, 11개 기존 Ranking과 4개
source-aware 변형 중 어느 것도 specialist 기회를 Transition Top100에 보존하지
못했다.

| Candidate source               | Candidate 4+/5+/6 | 5+/6 우선 대표 Top100 4+/5+/6 | 핵심 결과                                 | 결정     |
| ------------------------------ | ----------------: | ----------------------------: | ----------------------------------------- | -------- |
| Current                        |            42/7/0 |        **7/1/0** · Transition | 동결 운영 기준선                          | **유지** |
| Decay · half-life 36           |       **54/14/1** |      13/0/0 · pair 또는 shape | 5+와 6이 모두 Top100 밖                   | 기각     |
| Grid Transition                |        47/8/**4** |                14/2/0 · shape | 5+ 2회는 보존했으나 6은 0회               | 기각     |
| Grid Transition · source-aware |            47/8/4 |    14/1/0 · worst-member 0.10 | 6 rank 중앙값만 일부 개선, Top100 6은 0회 | 기각     |

따라서 Phase 3의 compatibility 가설은 진단적으로 확인됐지만 운영 개선으로는
전환되지 않았다. Gate를 통과한 단일안이 없으므로 Merged Research, Final Top10
재튜닝, Historical Reference, Locked Holdout은 실행하지 않았다. 이는 미완료가
아니라 사전 누수 방지 규칙에 따른 정상 종료다.

## 2. 평가 설계와 봉인 규칙

- 선택 구간: Development 1044–1235회, 192회
- Candidate Pool: Top20 고정
- Candidate source: Current, Decay half-life 36, Grid Transition
- Current Candidate 가중치와 Phase 1 조합 Feature/점수식은 동결
- 각 회차는 1–N-1회 데이터만 사용
- 실제 당첨번호는 Candidate와 조합 점수를 확정한 뒤 hit/rank 평가에만 사용
- Candidate recall 4+ 회차는 `20C6 = 38,760`개 조합을 전부 열거
- recall 0–3 회차는 score/feature 분포 진단에만 결정적 systematic sample 사용
- Random baseline: Candidate recall을 조건으로 한 exact 확률과 seed `20260807`,
  1,000회 Monte Carlo
- Historical Reference 852–1043회: Gate 통과 단일안에 한해 한 번만 허용
- Locked Holdout 660–851회: Historical까지 통과하고 전략을 동결한 뒤 한 번만 허용

이번 결과에서는 `selected=null`이므로 마지막 두 구간은 계속 봉인됐다.

## 3. Phase 3A Candidate × Ranking Matrix

아래 `Raw Top10`은 각 Ranking의 상위 10개를 그대로 자른 진단값이다. 운영
알고리즘의 Tail Coverage Final Top10과는 다른 지표다.

### Current Candidate

| Ranking            | Top100 4+/5+/6 | Raw Top10 4+/5+/6 | Best-4 rank 중앙값 | Best-5 rank 중앙값 | Best-6 rank 중앙값 |
| ------------------ | -------------: | ----------------: | -----------------: | -----------------: | -----------------: |
| number             |          4/0/0 |             0/0/0 |               1492 |               8633 |                  — |
| pair               |          8/0/0 |             1/0/0 |                581 |               4982 |                  — |
| pair-triple        |          8/0/0 |             1/0/0 |              542.5 |               5357 |                  — |
| shape              |          6/0/0 |             1/0/0 |               1036 |              11101 |                  — |
| transition         |      **7/1/0** |             1/0/0 |                624 |           **3301** |                  — |
| hybrid             |          9/0/0 |             1/0/0 |             1100.5 |              10221 |                  — |
| full-hybrid        |          9/0/0 |             1/0/0 |              776.5 |              11902 |                  — |
| full-no-pair       |         10/0/0 |             2/0/0 |              707.5 |              10651 |                  — |
| full-no-triple     |          9/0/0 |             1/0/0 |                640 |              11413 |                  — |
| full-no-shape      |         11/0/0 |             1/0/0 |                937 |              10498 |                  — |
| full-no-transition |          9/0/0 |             0/0/0 |                944 |              12232 |                  — |

Transition만 Current의 5+ Opportunity 한 번을 Top100에 보존했다. 다른 조합식이
4+를 더 많이 올리더라도 5+는 모두 잃었다.

### Decay Candidate

| Ranking            | Top100 4+/5+/6 | Raw Top10 4+/5+/6 | Best-4 rank 중앙값 | Best-5 rank 중앙값 | Best-6 rank 중앙값 |
| ------------------ | -------------: | ----------------: | -----------------: | -----------------: | -----------------: |
| number             |          4/0/0 |             1/0/0 |             2157.5 |            10229.5 |              21697 |
| pair               |         13/0/0 |             1/0/0 |                810 |               6967 |               7884 |
| pair-triple        |         11/0/0 |             3/0/0 |              679.5 |               7241 |           **6726** |
| shape              |         13/0/0 |             3/0/0 |          **376.5** |             9078.5 |              21340 |
| transition         |          9/0/0 |             3/0/0 |                407 |             8091.5 |              15143 |
| hybrid             |          9/0/0 |             3/0/0 |              602.5 |               6525 |              12235 |
| full-hybrid        |         11/0/0 |             4/0/0 |              395.5 |             6513.5 |              17832 |
| full-no-pair       |         12/0/0 |             3/0/0 |                496 |               8410 |              20370 |
| full-no-triple     |         11/0/0 |             3/0/0 |              465.5 |           **5056** |              19224 |
| full-no-shape      |         11/0/0 |             1/0/0 |                594 |             7632.5 |              16898 |
| full-no-transition |         12/0/0 |             5/0/0 |              638.5 |               8185 |              22901 |

Decay의 14개 5+ Opportunity와 한 개 6 Opportunity는 모든 Ranking에서 Top100
밖이었다. 6-hit의 가장 좋은 순위도 6,726위여서 단순 가중치 교체만으로 해결할
수 있는 경계 손실이 아니었다.

14개 5+ Opportunity의 best-rank 분포도 전 구간에 걸친 이동이 없음을 보여준다.

| Ranking            | Best-5 p25 | Best-5 중앙값 | Best-5 p75 | Best-5 p95 |
| ------------------ | ---------: | ------------: | ---------: | ---------: |
| number             |       3659 |       10229.5 |    17304.5 |    28281.1 |
| pair               |       1959 |          6967 |    8239.25 |    15516.1 |
| pair-triple        |    2337.25 |          7241 |       8633 |    15228.2 |
| shape              |     3603.5 |        9078.5 |   15333.25 |    20113.4 |
| transition         |    3704.75 |        8091.5 |   10162.75 |    18491.9 |
| hybrid             |    3025.75 |          6525 |   12527.75 |    18740.2 |
| full-hybrid        |     3970.5 |        6513.5 |   12198.25 |    21252.6 |
| full-no-pair       |    2933.25 |          8410 |   13725.25 |    20290.9 |
| full-no-triple     |    4277.25 |          5056 |   12811.75 |    20808.1 |
| full-no-shape      |    2691.25 |        7632.5 |    14193.5 |    23829.6 |
| full-no-transition |    4863.25 |          8185 |      18183 |    20359.6 |

### Grid Transition Candidate

| Ranking            | Top100 4+/5+/6 | Raw Top10 4+/5+/6 | Best-4 rank 중앙값 | Best-5 rank 중앙값 | Best-6 rank 중앙값 |
| ------------------ | -------------: | ----------------: | -----------------: | -----------------: | -----------------: |
| number             |          4/0/0 |             0/0/0 |               1860 |             5637.5 |              25212 |
| pair               |          9/1/0 |             5/0/0 |                986 |             3643.5 |              14875 |
| pair-triple        |          7/1/0 |             5/0/0 |                863 |               3684 |          **14717** |
| shape              |     **14/2/0** |             3/1/0 |                516 |             1008.5 |            25728.5 |
| transition         |         10/1/0 |             3/0/0 |            **422** |            **913** |              28218 |
| hybrid             |         10/1/0 |             3/0/0 |                737 |             1150.5 |            25525.5 |
| full-hybrid        |          9/1/0 |             2/0/0 |                775 |             1341.5 |              24330 |
| full-no-pair       |         14/1/0 |             3/0/0 |               1007 |               1656 |              25546 |
| full-no-triple     |         11/1/0 |             2/0/0 |                722 |             1380.5 |              24621 |
| full-no-shape      |          8/0/0 |             3/0/0 |                780 |             1983.5 |              23584 |
| full-no-transition |         11/1/0 |             3/0/0 |                584 |             1046.5 |              22637 |

Shape는 Grid의 5+를 2/8회 보존했지만 네 개 6 Opportunity는 모두 Top100 밖이었다.
6-hit rank 중앙값의 최선도 14,717위로, Gate B의 rank-shift 기준인 9,690위
(`38,760 / 4`)에 미달했다.

## 4. 6-hit Opportunity 추적

| Source          | 회차 | 당첨번호의 source rank | Transition rank | 11개 기존 Ranking 중 최선 |
| --------------- | ---: | ---------------------- | --------------: | ------------------------: |
| Grid Transition | 1066 | 5/14/16/18/19/20       |          17,479 |       3,835 · pair-triple |
| Grid Transition | 1123 | 2/3/4/6/9/13           |          22,165 |           11,614 · number |
| Grid Transition | 1164 | 13/14/16/17/18/19      |          38,668 |           26,044 · number |
| Decay           | 1176 | 2/5/9/10/16/20         |          15,143 |       6,726 · pair-triple |
| Grid Transition | 1228 | 1/3/9/12/16/18         |          34,271 |      16,251 · pair-triple |

완전일치 조합은 Full Enumeration에 실제로 존재했다. 손실 위치는 Candidate나
Generation이 아니라 Ranking이다. 다만 순위가 수천~수만 위이므로 Top100 quota를
소폭 늘리는 방식으로도 복구할 수 없다.

## 5. Feature 분포와 score calibration

각 source에서 회차별 512개, 총 98,304개 조합을 결정적으로 표본 추출했다.

| Source          |     Number |       Pair |     Triple | Grid shape | Shape transition | Frequency |    Recency | Range/Gap |    Sum | Density | Transition final |
| --------------- | ---------: | ---------: | ---------: | ---------: | ---------------: | --------: | ---------: | --------: | -----: | ------: | ---------------: |
| Current         |     0.6758 |     0.2212 |     0.1400 |     0.6767 |           0.3634 |    0.8849 |     0.9153 |    0.6049 | 0.7716 |  0.9222 |           0.4635 |
| Decay           | **0.5361** | **0.3189** | **0.2077** |     0.7036 |           0.3680 |    0.8277 | **0.7213** |    0.7398 | 0.7521 |  0.9301 |       **0.4452** |
| Grid Transition |     0.6031 |     0.2108 |     0.1324 |     0.6756 |       **0.4078** |    0.8812 |     0.9132 |    0.5917 | 0.7556 |  0.9144 |       **0.4805** |

Decay branch는 Current보다 Number/Recency가 낮고 Pair/Triple이 높다. 기존
Transition final의 평균도 `0.4635 → 0.4452`로 내려가므로 Current 중심 score가
Decay 조합을 구조적으로 낮게 두는 방향과 일치한다.

Opportunity 조합만 보면 더 직접적인 문제가 보인다.

| Opportunity group     | 조합 수 | Transition final 평균 |
| --------------------- | ------: | --------------------: |
| Current 4-hit         |   7,875 |                0.4467 |
| Current 5-hit         |     105 |                0.4344 |
| Decay 4-hit           |  12,990 |                0.4413 |
| Decay 5-hit           |     279 |                0.4298 |
| Decay 6-hit           |       1 |                0.4907 |
| Grid Transition 4-hit |  12,240 |                0.4549 |
| Grid Transition 5-hit |     396 |                0.4153 |
| Grid Transition 6-hit |       4 |            **0.3650** |

특히 Grid 전체 branch의 Transition final 평균은 0.4805인데 실제 6-hit 조합은
0.3650이다. Grid source가 만든 완전일치 조합일수록 기존 Transition 기준에서는
branch 중앙보다 훨씬 낮게 평가됐다.

Transition score calibration 자체도 source별로 이동했다.

| Source          |   평균 | 중앙값 |    p95 |
| --------------- | -----: | -----: | -----: |
| Current         | 0.4635 | 0.4582 | 0.6377 |
| Decay           | 0.4452 | 0.4403 | 0.6108 |
| Grid Transition | 0.4805 | 0.4825 | 0.6412 |

따라서 동일 raw score를 source 간 공통 cutoff처럼 해석하면 안 된다. Phase 3의
비교는 raw score가 아니라 source 내부 rank와 percentile을 함께 사용했다.

## 6. Candidate 조건부 Random baseline

Candidate 안에 k-hit 조합이 존재한다는 조건에서 38,760개 중 임의 Top100/Top10이
해당 hit를 보존할 정확한 평균 확률을 계산하고 Monte Carlo로 교차 확인했다.

| Source          | 조건부 기회 4+/5+/6 |      Random Top100 4+/5+/6 |      Random Top10 4+/5+/6 |
| --------------- | ------------------: | -------------------------: | ------------------------: |
| Current         |              42/7/0 |       34.818% / 3.802% / — |       4.727% / 0.386% / — |
| Decay           |             54/14/1 |  39.747% / 4.940% / 0.258% | 6.001% / 0.514% / 0.0258% |
| Grid Transition |              47/8/4 | 36.893% / 11.768% / 0.258% | 6.346% / 1.279% / 0.0258% |

- Current + Transition의 Top100 5+ 보존율은 `1/7 = 14.286%`, 조건부 Random
  대비 **3.758×**다.
- Decay의 Top100 5+/6은 모든 전략에서 0이므로 target lift도 0이다.
- Grid + shape의 Top100 5+ 보존율은 `2/8 = 25%`, 조건부 Random 대비
  2.124×지만 목표였던 6 보존은 0이다.
- Grid의 6 기회는 네 번뿐이므로 개별 전략의 0회만으로 강한 열위라고 단정할 수는
  없다. 그러나 사전에 정한 Gate를 통과할 실증적 보존도 없었다.

## 7. 제한된 source-aware 실험

당첨번호를 직접 쓰지 않고 source 내부 번호 순위만 prior로 추가했다.

- Mean Branch Rank Prior: Transition score + λ × 여섯 번호의 source percentile 평균
- Worst Member Protection: Transition score + 0.10 × 여섯 번호 중 최저 source
  percentile
- λ는 사전에 제한한 `0.05 / 0.10 / 0.20`만 사용

### Decay branch

| Experiment          | Top100 4+/5+/6 | Raw Top10 4+/5+/6 | Best-4 중앙값 | Best-5 중앙값 | Best-6 중앙값 | 개선 회차 4/5/6 | 결정   |
| ------------------- | -------------: | ----------------: | ------------: | ------------: | ------------: | --------------: | ------ |
| Transition baseline |          9/0/0 |             3/0/0 |           407 |        8091.5 |         15143 |           0/0/0 | 기준   |
| Mean prior 0.05     |          9/0/0 |             1/0/0 |         416.5 |        7759.5 |         15143 |          24/4/0 | REJECT |
| Mean prior 0.10     |          8/0/0 |             1/0/0 |         452.5 |          7857 |         15147 |          24/4/0 | REJECT |
| Mean prior 0.20     |          8/0/0 |             1/0/0 |         480.5 |          7989 |         15168 |          23/4/0 | REJECT |
| Worst member 0.10   |          8/0/0 |             2/0/0 |         429.5 |      **7523** |         15624 |          18/6/0 | REJECT |

5-hit rank가 일부 회차에서 개선돼도 Top100 5+는 계속 0회였고, 1176회의 6-hit
rank도 `15,143 → 15,624`로 악화됐다.

### Grid Transition branch

| Experiment          | Top100 4+/5+/6 | Raw Top10 4+/5+/6 | Best-4 중앙값 | Best-5 중앙값 | Best-6 중앙값 | 개선 회차 4/5/6 | 결정   |
| ------------------- | -------------: | ----------------: | ------------: | ------------: | ------------: | --------------: | ------ |
| Transition baseline |         10/1/0 |             3/0/0 |           422 |           913 |         28218 |           0/0/0 | 기준   |
| Mean prior 0.05     |         10/1/0 |             3/0/0 |       **410** |           888 |         27782 |          23/4/2 | REJECT |
| Mean prior 0.10     |         13/1/0 |             2/0/0 |           460 |           858 |       27378.5 |          22/4/2 | REJECT |
| Mean prior 0.20     |         13/1/0 |             2/0/0 |           576 |         876.5 |   **27328.5** |          20/4/2 | REJECT |
| Worst member 0.10   |     **14/1/0** |             3/0/0 |           469 |     **787.5** |       27340.5 |          18/4/2 | REJECT |

Grid 6-hit rank 중앙값은 약 3% 개선됐지만 여전히 27,000위대였고, 개별 네 회차는
최선 source-aware 설정에서도 모두 18,000위 밖이었다. Top100 6 보존이 0이므로
specialist preservation Gate를 통과하지 못했다.

## 8. Gate 판정과 단계 종료

기존 Ranking Matrix에는 다음을 동시에 요구했다.

1. Decay는 Top100 5+가 1회 이상이고 조건부 Random lift가 1 초과
2. Grid는 Top100 6이 1회 이상이거나 best-6 rank 중앙값이 9,690위 미만
3. Top100 4+가 같은 source의 Transition 기준선보다 1회 초과 감소하지 않음
4. 관련 Opportunity rank가 최소 두 회차에서 개선
5. specialist target의 조건부 Random lift가 1 초과
6. 48회 블록 여러 곳에서 같은 방향의 보존 또는 rank 개선

Source-aware 실험에는 specialist Top100 보존, 4+ guardrail, 관련 rank의 다중 회차
개선을 모두 요구했다. 결과는 다음과 같다.

| 단계                              | 결과                               | 다음 단계 실행 여부           |
| --------------------------------- | ---------------------------------- | ----------------------------- |
| 33개 Candidate × existing Ranking | KEEP 0, Current baseline 1         | source-aware 제한 실험만 실행 |
| 8개 source-aware 변형             | KEEP 0                             | Branch-local Top100 생성 중단 |
| Branch-local Top100               | Current + Transition 기준선만 유지 | specialist merge 미실행       |
| Merged Research                   | `null`                             | Final Top10 미실행            |
| Final Portfolio                   | `null`                             | Historical/Locked 미실행      |

48회 블록 안정성도 별도로 확인했다.

| Branch / Ranking          | Top100 4+ A/B/C/D | Top100 5+ A/B/C/D | Top100 6 A/B/C/D |
| ------------------------- | ----------------: | ----------------: | ---------------: |
| Current / Transition      |           3/1/0/3 |           1/0/0/0 |          0/0/0/0 |
| Decay / shape             |           4/4/3/2 |           0/0/0/0 |          0/0/0/0 |
| Grid / shape              |           6/4/3/1 |           0/1/1/0 |          0/0/0/0 |
| Decay / worst-member 0.10 |           1/3/1/3 |           0/0/0/0 |          0/0/0/0 |
| Grid / worst-member 0.10  |           5/5/1/3 |           0/0/0/1 |          0/0/0/0 |

4+는 여러 블록에서 유지되지만 specialist target은 Decay에서 전무하고 Grid 5+도
일부 블록에만 나타났다. Top100 6은 모든 블록에서 0이므로 Block Stability Gate도
통과하지 못했다.

기존 source를 섞은 Merged Research와 Final Top10 최적화는 앞 단계 Gate를 우회할 수
있으므로 실행하지 않았다. 운영 Final Top10은 Phase 1 Tail Coverage 기준
`4+/5+/6 = 2/1/0`으로 그대로다.

## 9. Before / After

| 운영 지표 · Development 192회   | Before Current | After Phase 3 |
| ------------------------------- | -------------: | ------------: |
| Current Candidate 4+            |             42 |            42 |
| Current Candidate 5+            |              7 |             7 |
| Current Candidate 6             |              0 |             0 |
| Decay Candidate 5+              |             14 |            14 |
| Decay Candidate 6               |              1 |             1 |
| Grid Candidate 6                |              4 |             4 |
| Transition Top100 4+            |              7 |             7 |
| Transition Top100 5+            |              1 |             1 |
| Transition Top100 6             |              0 |             0 |
| Decay Top100 5+                 |              0 |             0 |
| Decay Top100 6                  |              0 |             0 |
| Grid Top100 6                   |         미측정 |             0 |
| Tail Coverage Final Top10 4+    |              2 |             2 |
| Tail Coverage Final Top10 5+    |              1 |             1 |
| Tail Coverage Final Top10 6     |              0 |             0 |
| Top100 5+ 조건부 Random lift    |         3.758× |        3.758× |
| Specialist Top100 6 Random lift |              — |             0 |

진단 source의 Candidate 기회는 사라진 것이 아니라 채택되지 않은 연구 결과로 남는다.

| 진단 지표                        | Phase 2 발견 |           Phase 3 확인 |
| -------------------------------- | -----------: | ---------------------: |
| Decay Top100 5+/6 최선           |          0/0 |                    0/0 |
| Specialist Top100 5+ 조건부 lift |       미측정 | Decay 0× / Grid 2.124× |

## 10. 구현 변경

- `candidatePhase3.ts`
  - 세 Candidate source와 11개 Ranking의 Development matrix
  - Opportunity별 best/median rank, feature contribution, 48회 블록 진단
  - source 분포, opportunity 분포, score calibration
  - 조건부 exact/Monte Carlo Random baseline과 Gate 판정
- `candidatePhase3SourceAware.ts`
  - Mean Branch Rank Prior 3개와 Worst Member Protection 1개
  - specialist preservation, 4+ guardrail, 다중 rank 개선 Gate
- `candidatePhase2.ts`
  - Phase 3가 Current/Decay/Grid Transition만 정확히 재사용하는 동결 helper 공개
- `combination.ts`
  - 안정적인 Top-K heap과 결정적 feature sample helper
  - 기존 전체 정렬과 동일한 score/tie-break 보존
- 테스트
  - Decay 1176회 Top20 rank `2/5/9/10/16/20`과 38,760개 완전 열거 재현
  - 동결 Phase 3 helper와 전체 Phase 2 helper의 Candidate 순위 일치
  - Top-K heap과 기존 full sort의 결과 일치
  - Development 192회 matrix/source-aware 장시간 회귀 테스트

## 11. 검증과 재현

일상 회귀 검증:

```bash
npm test
npx tsc --noEmit
npm run lint
npm run build
```

- Vitest: 17 files, 82 tests 통과; 장시간 suite 2 files/10 tests는 기본 실행에서 skip
- TypeScript, ESLint, Vite production build 통과

Phase 3A 전체 Development 실행:

```bash
URIEL_PHASE3_FULL=1 \
URIEL_PHASE3_OUTPUT=/tmp/uriel-phase3-development.json \
NPM_CONFIG_CACHE=/tmp/uriel-npm-cache \
npm test -- --run tests/uriel-candidate-phase3.test.ts
```

- 실행 시간: 3,457.54초
- SHA-256: `5a7922cdf63a1b4f52ff116f3773656fee9c77f5633fd133214d43500c33046a`

Source-aware 전체 Development 실행:

```bash
URIEL_PHASE3_SOURCE_AWARE_FULL=1 \
URIEL_PHASE3_SOURCE_AWARE_OUTPUT=/tmp/uriel-phase3-source-aware-final-development.json \
NPM_CONFIG_CACHE=/tmp/uriel-npm-cache \
npm test -- --run tests/uriel-candidate-phase3-source-aware.test.ts
```

- 실행 시간: 1,384.75초
- SHA-256: `bac34cd9e3a217c2a36cd3fc673b266f745e290415505b2860cfabe6c9043497`

## 12. 최종 결정과 다음 연구 방향

Current 운영 성능을 바꾸지 않는다. Phase 3의 핵심 발견은 specialist Candidate가
만든 5+/6 조합이 기존 조합 Feature 공간의 약한 tail에 놓이며, source rank prior를
조금 더하는 방식으로는 Top100까지 이동하지 않는다는 점이다.

다음 연구를 연다면 λ 미세조정이나 기존 Feature의 추가 조합보다 **새로운
branch-local coverage/generation 가설**이 먼저다. 예를 들어 source 내부 rank band,
서로 다른 Candidate source 간 중복/비중복, worst-member 위치를 명시적 제약으로 둔
coverage 설계가 필요하다. 다만 새 가설도 Development-only Gate를 먼저 통과해야 하며,
그 전까지 Historical Reference와 Locked Holdout은 계속 봉인한다.

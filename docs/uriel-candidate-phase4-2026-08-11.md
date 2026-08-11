# Uriel Specialist Structured Coverage Phase 4 보고서

## 1. 결론

Phase 4는 **Development에서는 최소 성공을 만들었지만 Historical에서 재현되지
않았다.** 따라서 운영 알고리즘은 계속 **Current Candidate → Transition Top100 →
Tail Coverage Final Top10**으로 동결한다.

Development 1044–1235회에서 Decay의 `P4_OVERLAP_LIMIT`는 기존 Pair Top100의
`4+/5+/6 = 13/0/0`을 `24/2/0`으로 개선했다. 5+ 보존율은 `0% → 14.286%`,
조건부 단순 Random 대비 lift는 `2.892×`, number-balanced Random 대비 lift는
`3.040×`였고, 두 개의 48회 블록에서 5+를 한 번씩 보존해 사전 Gate를 모두
통과했다.

그러나 이 단일 전략을 수정 없이 Historical Reference 852–1043회에 적용하자
기존 Pair Top100의 `4/1/0`이 `12/0/0`이 됐다. 4+ coverage는 늘었지만 핵심인 5+
보존을 잃어 `REJECT`다. Historical 실패 시 Locked를 열지 않는 규칙에 따라 Locked
Holdout 660–851회는 실행하지 않았다.

| 단계                | Candidate 4+/5+/6 |        기존 Top100 |           Structured Top100 | 판정        |
| ------------------- | ----------------: | -----------------: | --------------------------: | ----------- |
| Development · Decay |           54/14/1 |      13/0/0 · Pair |  **24/2/0 · Overlap Limit** | Gate 통과   |
| Development · Grid  |            47/8/4 | **14/2/0 · Shape** |  최고 23/1/0, 모든 전략 6=0 | 전부 REJECT |
| Historical · Decay  |            29/4/0 |   **4/1/0 · Pair** | 12/0/0 · 동결 Overlap Limit | **REJECT**  |
| Locked · Decay      |                 — |                  — |                           — | 미실행      |

Phase 4의 가장 중요한 발견은 coverage 균등화가 4+ 회수에는 강하게 작동하지만,
그 자체로 희소한 5+/6 보존을 일반화하지는 않는다는 점이다. Development 성능만
보고 specialist branch를 운영 또는 merge에 넣으면 안 된다.

## 2. 평가 설계와 누수 방지

- Development: 1044–1235회, 192회
- Historical Reference: 852–1043회, 192회
- Locked Holdout: 660–851회, Historical 통과 시에만 한 번 허용
- 추가 Blind Holdout: 468–659회, 계속 봉인
- Candidate Pool: Top20 고정, bonus 제외
- Seed: `20260807`
- Decay: half-life 36 고정
- Grid Transition Candidate와 Current Candidate 가중치 고정
- 기존 대표 Ranking: Current=Transition, Decay=Pair, Grid=Shape
- Candidate recall 4+ Opportunity에서만 `20C6 = 38,760` 전체 조합 열거
- Random Top100과 number-balanced Random Top100: 회차별 1,000회 Monte Carlo
- selector는 실제 당첨번호를 입력받지 않으며 source rank 구조와 기존 branch-local
  score만 사용
- Development에서 사전 정의한 일곱 실험 중 하나를 선택한 뒤, Historical에서는
  source=`decay`, experiment=`P4_OVERLAP_LIMIT`, 제약, seed를 모두 동결
- Historical 결과를 본 뒤 constraint나 selector를 수정하지 않음

Structured selector는 매 선택 단계에서 기존 Ranking 상위 64개와 전 구간에
결정적으로 분산한 128개 표본을 비교하는 sampled-greedy다. 기존 score는 아주 약한
tie-break로만 쓰고 number, band, pair, rank profile, worst-rank quota, overlap을 실험별로
추가했다. 전 조합을 매 단계마다 재평가하는 전역 최적화는 아니므로 결과를
"최적 Top100"으로 해석하면 안 된다.

## 3. Candidate 기준 재현

Phase 2/3의 동결 기준을 Development 192회에서 그대로 재현했다.

| Candidate source     |     4+ |     5+ |     6 |
| -------------------- | -----: | -----: | ----: |
| Current              |     42 |      7 |     0 |
| Decay · half-life 36 | **54** | **14** |     1 |
| Grid Transition      |     47 |      8 | **4** |

Current 운영 기준도 변하지 않았다.

| 운영 단계                 |  4+ |  5+ |   6 |
| ------------------------- | --: | --: | --: |
| Current Candidate         |  42 |   7 |   0 |
| Transition Top100         |   7 |   1 |   0 |
| Tail Coverage Final Top10 |   2 |   1 |   0 |

## 4. 기존 Top100 Coverage 진단

아래 값은 각 source의 Candidate recall 4+ Opportunity에서 대표 Ranking Top100을
진단한 회차 평균이다. 따라서 전체 192회에 대한 무조건 평균이 아니다.

| Source · Ranking     | Opportunity | 고유 번호 / 20 | 번호 표준편차 | 번호 Gini | 고유 pair / 190 | pair Gini |
| -------------------- | ----------: | -------------: | ------------: | --------: | --------------: | --------: |
| Current · Transition |          42 |          19.79 |         20.00 |     0.356 |          159.52 |     0.563 |
| Decay · Pair         |          54 |      **18.67** |     **26.43** | **0.480** |      **123.07** | **0.712** |
| Grid · Shape         |          47 |          19.87 |         20.89 |     0.369 |          158.51 |     0.575 |

Decay Pair Top100이 가장 집중돼 있었다. 완전 균등이면 번호별 30회 등장해야 하지만
Decay의 번호별 평균 등장 횟수는 source rank 1–5에서 43.85–55.20회, rank
18–20에서 14.20–18.02회로 기울었다.

| Source · Ranking     |      A 1–5 | B 6–10 | C 11–15 |    D 16–20 | 고유 triple / 1,140 | 고유 band pattern | 고유 rank profile |
| -------------------- | ---------: | -----: | ------: | ---------: | ------------------: | ----------------: | ----------------: |
| Current · Transition |     25.25% | 23.88% |  24.99% |     25.87% |              531.14 |             26.48 |             38.17 |
| Decay · Pair         | **39.68%** | 27.64% |  17.90% | **14.78%** |          **352.96** |         **20.41** |         **30.09** |
| Grid · Shape         |     21.66% | 22.65% |  26.78% |     28.90% |              515.26 |             25.06 |             36.74 |

| Source · Ranking     | 조합 pair overlap ≥4 | overlap ≥5 |
| -------------------- | -------------------: | ---------: |
| Current · Transition |               21.84% |      4.90% |
| Decay · Pair         |           **45.81%** | **11.62%** |
| Grid · Shape         |               21.85% |      4.58% |

Decay baseline은 번호, pair, triple, band pattern 모두 coverage가 좁고 비슷한 조합의
반복이 많았다. 이 진단이 overlap 제한 실험의 개선 가능성을 설명하지만, 그 자체가
당첨 성능과의 인과관계를 뜻하지는 않는다.

## 5. Winner source-rank band 진단

Band는 A=1–5, B=6–10, C=11–15, D=16–20, X=Candidate Top20 밖이다.
Candidate recall 4+인 회차에는 실제 당첨번호 중 최대 두 개가 Top20 밖일 수 있으므로
패턴에 X가 포함된다.

| Source  | 4+ Opportunity | worst source rank 중앙값 | rank 평균의 회차 평균 | 상위 반복 패턴                            |
| ------- | -------------: | -----------------------: | --------------------: | ----------------------------------------- |
| Current |             42 |                       38 |                 17.46 | `A1-B0-C2-D1-X2`, `A2-B1-C1-D0-X2` 각 4회 |
| Decay   |             54 |                       37 |                 17.35 | `A1-B0-C1-D2-X2`, `A1-B1-C1-D1-X2` 각 6회 |
| Grid    |             47 |                       37 |                 16.99 | `A1-B1-C1-D1-X2` 5회                      |

5+/6 Opportunity만 좁혀도 단일 band 정답은 없었다.

| Source | 5+/6 기회 | A 포함 | B 포함 | C 포함 | D 포함 | Top20 밖 포함 |
| ------ | --------: | -----: | -----: | -----: | -----: | ------------: |
| Decay  |        14 |     12 |     10 |     12 | **10** |            13 |
| Grid   |         8 |      7 |      5 |      7 |  **6** |             4 |

Decay의 최빈 5+/6 패턴 `A2-B0-C1-D2-X1`도 3회뿐이다. Grid의 여덟 기회는 모두
서로 다른 패턴이었다. 특히 Grid의 네 6-hit은 각각
`A1-B0-C1-D4`, `A3-B2-C1-D0`, `A0-B0-C2-D4`, `A2-B1-C1-D2`였다.
따라서 winner pattern을 직접 rule로 복사하지 않았고, 여러 band를 표현하는 일반
coverage만 실험했다.

## 6. Random Top100 기준선

`Exact`는 Candidate recall 조건에서 100개를 균등 추출할 이론 확률이고,
`Coverage-aware MC`는 Top20 번호를 각각 정확히 30회 포함하는 100개 고유 조합의
1,000회 Monte Carlo 평균이다.

| Source  | 기회 4+/5+/6 | Exact Random Top100 4+/5+/6 |  Coverage-aware MC 4+/5+/6 |
| ------- | -----------: | --------------------------: | -------------------------: |
| Current |       42/7/0 |        34.818% / 3.802% / — |       35.271% / 4.014% / — |
| Decay   |      54/14/1 |   39.747% / 4.940% / 0.258% |  40.787% / 4.700% / 0.300% |
| Grid    |       47/8/4 |  36.893% / 11.768% / 0.258% | 37.232% / 11.988% / 0.200% |

Monte Carlo는 fixed seed로 재현되며 exact 확률과 대체로 일치했다. 희소한 6은 기회가
Decay 1회, Grid 4회뿐이므로 MC 차이를 일반 성능 차이로 해석하지 않았다.

## 7. Structured Coverage 실험

모든 실험은 winner를 모르는 상태에서 같은 Candidate Top20과 branch-local baseline
score를 사용했다.

### Decay

| 실험                  | Coverage 구성                            | Top100 4+/5+/6 |     5+ 보존 | Exact Random 5 lift | 안정 블록 | 판정     |
| --------------------- | ---------------------------------------- | -------------: | ----------: | ------------------: | --------: | -------- |
| `P4_BASELINE`         | Pair score Top100                        |         13/0/0 |          0% |                  0× |         0 | BASELINE |
| `P4_NUMBER_COVERAGE`  | Number                                   |         15/1/0 |      7.143% |              1.446× |         1 | REJECT   |
| `P4_NUMBER_BAND`      | Number + Band                            |         19/0/0 |          0% |                  0× |         0 | REJECT   |
| `P4_NUMBER_BAND_PAIR` | Number + Band + Pair                     |         20/1/0 |      7.143% |              1.446× |         1 | REJECT   |
| `P4_OVERLAP_LIMIT`    | Number + Band + Pair + overlap<5         |     **24/2/0** | **14.286%** |          **2.892×** |     **2** | **KEEP** |
| `P4_WORST_RANK_BAND`  | Number + Band + worst-rank quota         |         22/0/0 |          0% |                  0× |         0 | REJECT   |
| `P4_RANK_PROFILE`     | Number + Band + Pair + overlap + profile |         21/0/0 |          0% |                  0× |         0 | REJECT   |

Number만으로 한 번의 5+를 만들 수 있었지만 rank 개선과 block stability를 동시에
충족하지 못했다. Pair coverage까지 더해도 같은 한 회차에 머물렀다. overlap 5를
hard reject하고 overlap 4에 penalty를 준 설정만 5+ 두 회차를 서로 다른 블록에서
보존했다.

### Grid Transition

Grid Gate A는 5+ 증가가 아니라 **6-hit을 최소 한 번 보존**하는 것이다.

| 실험                  | Top100 4+/5+/6 |   5+ 보존 | 6 보존 | 판정 이유 |
| --------------------- | -------------: | --------: | -----: | --------- |
| `P4_BASELINE` · Shape |         14/2/0 |     25.0% |     0% | BASELINE  |
| `P4_NUMBER_COVERAGE`  |         17/3/0 |     37.5% |     0% | 6 미보존  |
| `P4_NUMBER_BAND`      |     **18/4/0** | **50.0%** |     0% | 6 미보존  |
| `P4_NUMBER_BAND_PAIR` |         15/1/0 |     12.5% |     0% | 6 미보존  |
| `P4_OVERLAP_LIMIT`    |     **23/1/0** |     12.5% |     0% | 6 미보존  |
| `P4_WORST_RANK_BAND`  |         18/2/0 |     25.0% |     0% | 6 미보존  |
| `P4_RANK_PROFILE`     |         17/3/0 |     37.5% |     0% | 6 미보존  |

Number+Band는 Grid 5+를 `2 → 4`로 늘렸지만 네 번의 6 기회를 모두 놓쳤다.
사전에 정한 specialist preservation Gate를 바꾸지 않았으므로 Grid selector는
`selected=null`이다.

## 8. Decay 채택안의 Coverage 변화

Development에서만 채택된 `P4_OVERLAP_LIMIT`는 coverage concentration을 크게
낮췄다.

| Coverage metric     | Pair baseline | Overlap Limit |     변화 |
| ------------------- | ------------: | ------------: | -------: |
| 고유 번호 / 20      |         18.67 |     **20.00** |    +1.33 |
| 번호 등장 표준편차  |         26.43 |      **1.50** |   -94.3% |
| 번호 Gini           |         0.480 |     **0.027** |   -94.3% |
| 번호 entropy        |         0.863 |    **0.9996** |   균등화 |
| 고유 pair / 190     |        123.07 |    **190.00** |   +66.93 |
| pair Gini           |         0.712 |     **0.102** |   -85.7% |
| pair entropy        |         0.814 |    **0.9967** |   균등화 |
| 고유 triple / 1,140 |        352.96 |  **1,062.54** |  +709.58 |
| 고유 band pattern   |         20.41 |     **57.22** |   +36.81 |
| 고유 rank profile   |         30.09 |     **71.13** |   +41.04 |
| 조합 overlap ≥4     |        45.81% |    **0.814%** | -45.00%p |
| 조합 overlap ≥5     |        11.62% |        **0%** |     제거 |

각 source rank 번호의 평균 출현은 29.61–30.43회였고, 네 band의 slot share도
25.21% / 25.05% / 24.95% / 24.79%로 거의 균등했다. 이 변화는 selector가 의도한
coverage 제약을 실제로 구현했음을 확인해 준다.

## 9. Development 5+/6 보존 상세

Decay Overlap Limit가 5+를 보존한 회차는 두 곳이다.

| 회차 | Candidate recall | winner ranks   | Pair scalar best-5 rank | Structured best-5 rank | 결과             |
| ---- | ---------------: | -------------- | ----------------------: | ---------------------: | ---------------- |
| 1135 |                5 | 1/3/4/6/14/X   |                     993 |                 **29** | 5 보존           |
| 1176 |                6 | 2/5/9/10/16/20 |                     920 |                 **93** | 5 보존, 6 미보존 |

Decay의 14개 5+ 기회에서 Pair scalar best-5 rank 중앙값은 6,967위였다. Structured
Top100이 보존한 두 회차의 rank는 29위와 93위다. 다만 이 두 개만으로 계산한
structured 중앙값 61을 전체 14회 분포의 개선처럼 해석하면 selection bias가 생긴다.
나머지 12회에는 structured best-5 rank가 없다.

1176회의 정확한 6-hit 조합은 Pair 전체 순위 7,884위였고 Structured Top100에도
들지 않았다. Phase 4는 Development에서도 6 보존에 실패했다.

## 10. Gate와 48회 Block Stability

Development의 Decay Overlap Limit는 사전 Gate 다섯 개를 모두 통과했다.

| Gate                        | 기준                         | 결과                   |
| --------------------------- | ---------------------------- | ---------------------- |
| A · Specialist preservation | Decay Top100 5+ > 0          | PASS · 2회             |
| B · 4+ guardrail            | 기존 13회 대비 큰 붕괴 없음  | PASS · 24회            |
| C · Rank distribution       | 여러 target 회차 rank 개선   | PASS · 2회             |
| D · Random lift             | 조건부 Random lift > 1       | PASS · 2.892× / 3.040× |
| E · Block stability         | 여러 48회 블록에서 같은 방향 | PASS · 2개 블록        |

| Development block | 범위      | Structured 4+/5+/6 | 5+ rank 개선 회차 |
| ----------------- | --------- | -----------------: | ----------------: |
| A                 | 1044–1091 |              5/0/0 |                 0 |
| B                 | 1092–1139 |             10/1/0 |                 1 |
| C                 | 1140–1187 |              5/1/0 |                 1 |
| D                 | 1188–1235 |              4/0/0 |                 0 |

효과가 단일 블록에만 몰리지는 않았지만 네 블록 중 두 곳에만 있었다. 따라서
Development KEEP은 Historical을 열 수 있는 연구 Gate이지 운영 채택이 아니다.

## 11. Historical Reference 동결 검증

Development 승자를 그대로 적용한 결과다.

| Historical 852–1043 | Candidate | Pair baseline Top100 | Frozen Overlap Limit Top100 |
| ------------------- | --------: | -------------------: | --------------------------: |
| 4+                  |        29 |                    4 |                      **12** |
| 5+                  |         4 |                **1** |                       **0** |
| 6                   |         0 |                    0 |                           0 |
| 5+ preservation     |         — |            **25.0%** |                      **0%** |

Historical의 네 5+ Opportunity 중 Pair baseline은 984회를 61위로 보존했다.
Structured selector는 네 회차 모두 5+가 없었고, 984회도 최대 hit가 4로 떨어졌다.
반면 4+는 `4 → 12`로 늘었다. 즉 coverage diversity가 넓은 4-hit 조합 회수에는
도움이 됐지만, 핵심 target인 5+ 보존에는 일반화되지 않았다.

| Historical block | 범위     | Structured 4+/5+/6 | 5+ rank 개선 회차 |
| ---------------- | -------- | -----------------: | ----------------: |
| A                | 852–899  |              6/0/0 |                 0 |
| B                | 900–947  |              0/0/0 |                 0 |
| C                | 948–995  |              3/0/0 |                 0 |
| D                | 996–1043 |              3/0/0 |                 0 |

Historical Gate 결과는 specialist preservation, rank distribution, Random lift,
block stability가 모두 실패했고 4+ guardrail만 통과했다. 최종 판정은 `REJECT`다.

## 12. Locked와 다음 단계

Historical이 실패했으므로 다음 작업은 실행하지 않았다.

- Locked Holdout 660–851회
- 추가 Blind Holdout 468–659회
- Current/Decay/Grid Research Pool merge
- branch percentile 기반 merge selector
- specialist Final Top10 slot
- 운영 알고리즘 변경

남은 병목은 "넓은 coverage"와 "희소한 5+/6 보존" 사이의 연결이 불안정하다는
점이다. Number/Pair/Overlap 균등화는 구조적으로는 성공했지만, 당첨 조합을 향한
식별 정보가 없기 때문에 Historical에서는 5+를 보존하지 못했다.

추천하는 다음 Phase는 **운영 배포가 아니라 실패 분석 전용 Phase 4B**다.

1. Locked와 추가 Blind는 계속 봉인한다.
2. Development와 이미 개봉한 Historical만 이용해 Pair baseline이 살린 5+와
   overlap selector가 살린 5+의 구조적 차이를 진단한다.
3. hit 결과를 직접 feature나 quota로 복사하지 않고, coverage가 4+만 올리는 이유를
   반사실적으로 분석한다.
4. 사전에 완전히 다른 단일 selector 가설을 정할 수 있을 때만 새 validation
   protocol을 설계한다. 현재 Locked를 Phase 4 재튜닝 검증에 재사용하지 않는다.

이 결과는 복권 번호의 미래 예측 우위를 입증하지 않는다. 작은 5+/6 표본에서 나온
탐색 결과이며, Historical 실패까지 포함한 현재 증거로는 운영 변경 근거가 없다.

## 13. Before / After

| Metric                             | Phase 3 Baseline |   Phase 4 Development | Historical 확인 |
| ---------------------------------- | ---------------: | --------------------: | --------------: |
| Current Candidate 5+               |                7 |                     7 |       운영 동결 |
| Current Top100 5+                  |                1 |                     1 |       운영 동결 |
| Decay Candidate 5+                 |               14 |                    14 |               4 |
| Decay Candidate 6                  |                1 |                     1 |               0 |
| Decay Top100 5+                    |                0 |                 **2** |           **0** |
| Decay Top100 6                     |                0 |                     0 |               0 |
| Grid Candidate 5+                  |                8 |                     8 |          미실행 |
| Grid Candidate 6                   |                4 |                     4 |          미실행 |
| Grid Best Top100 5+                |                2 |   최고 4, 채택안 없음 |          미실행 |
| Grid Top100 6                      |                0 |                     0 |          미실행 |
| Decay 5 Preservation               |               0% |           **14.286%** |          **0%** |
| Decay 6 Preservation               |               0% |                    0% |               — |
| Grid 5 Preservation                |              25% | 최고 50%, 채택안 없음 |               — |
| Grid 6 Preservation                |               0% |                    0% |               — |
| Decay Conditional Random 5 Lift    |               0× |            **2.892×** |          **0×** |
| Decay Coverage-aware Random 5 Lift |               0× |            **3.040×** |          **0×** |

최종 operating Before/After는 변화가 없다. Current Transition Top100 `7/1/0`과
Tail Coverage Final Top10 `2/1/0`을 계속 사용한다.

## 14. 구현 및 QA

새 `candidatePhase4Coverage.ts` 모듈에 다음을 분리했다.

- full Top20 enumeration과 frozen baseline 재사용
- winner rank-band 진단
- number/pair/triple/band/profile/overlap coverage 진단
- deterministic sampled-greedy structured selector
- simple Random 및 number-balanced Random Monte Carlo
- Opportunity 상세, preservation, rank distribution, 48회 block 집계
- Development Gate와 Historical/Locked 순차 실행 제어

회귀 테스트는 selector가 100개 고유 조합을 결정적으로 고르고, Number Coverage에서
각 번호가 27–33회 등장하며, Overlap/Rank Profile 전략에서 공통번호 5개인 조합 pair가
없고, selector API가 실제 당첨번호를 받지 않는 것을 확인한다.

입력 CSV는 1–1235회가 중복과 결측 없이 연속이고 모든 행 형식이 유효함을 확인했다.
Development 전체 평가와 Historical 동결 검증은 각각 별도 long-running 테스트로
실행했고, TypeScript typecheck 및 기존 Phase 3 회귀 테스트와 함께 검증했다.

공유 준비도는 **연구 결과로는 Ready**, 운영 변경안으로는 **Not ready**다. 수치와
Gate 판정은 재현 가능하지만 Historical 실패가 명확하고 5+/6 표본도 작기 때문이다.

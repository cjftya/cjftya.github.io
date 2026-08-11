# Uriel Phase 4B — 5+/6 Preservation Failure Analysis 보고서

## Executive Summary

Phase 4B의 최종 판정은 **INCONCLUSIVE**다.

1. **Pair와 Structured 성공 사례를 구분하는 관측 feature는 있었다.** 성공
   Opportunity는 두 기간 모두 더 높은 Pair score, 더 낮은 pair concentration,
   더 높은 ensemble 하한, 더 높은 Candidate score, 더 낮은 Pair Top100 novelty를
   보였다. 사전 기준상 21개 feature가 같은 방향과 중간 이상의 Cliff's delta를
   만족했다.
2. **그러나 일반화 가능한 combination signal로 인정할 수는 없다.** Development
   success는 2회, Historical success는 1회뿐이다. 984회를 제거하면 Historical
   success 표본이 0이 되어 21개 signal 모두 leave-one-opportunity-out에서
   실패했다.
3. **Historical 984 실패는 overlap 제한 때문이 아니었다.** Pair 61위 5-hit
   조합은 Structured의 100개 선택 단계 내내 hard-overlap 충돌 없이 후보로
   고려됐지만, 매 단계 coverage gain이 더 높은 다른 조합에 밀렸다. Structured는
   Pair Top100 중 3개만 유지하고 97개를 교체했다.
4. **4-hit 증가는 coverage 확장의 순효과였다.** Historical의 `4 → 12`는
   Structured가 9회를 새로 살리고 Pair-only 1회를 잃어 순증 8회가 된 결과다.
   반면 놓친 5+에는 이를 식별할 만큼 강한 별도 신호가 없었다.
5. **1176의 exact 6은 local basin도 약했다.** Exact 6은 Pair 7,884위,
   Transition 15,143위, Shape 21,340위, Number 21,697위였다. Distance-1의 84개
   one-swap 조합도 Pair 중앙값 11,406위였고 Structured가 선택한 것은 1개뿐이었다.
6. **Combination Engine을 바로 다시 설계할 근거는 부족하다.** Pair concentration과
   ensemble floor는 후속 가설 후보지만 현재 표본으로 selector를 만들면 984에
   과적합된다. 다음 중심 작업은 **Candidate Engine Phase 5**가 더 타당하다.

운영 경로 `Current Candidate → Transition Top100 → Tail Coverage Final Top10`은
변경하지 않았다. Locked Holdout `660–851`과 Additional Blind Holdout `468–659`는
실행하지 않았다.

## 1. Decision Gate

| Gate                       | 판정                    | 근거                                                            |
| -------------------------- | ----------------------- | --------------------------------------------------------------- |
| A · Observable Separation  | PASS · descriptive only | 21개 feature가 두 기간에서 같은 중간 이상 방향                  |
| B · Cross-period Direction | PASS · descriptive only | Development와 Historical 방향 일치                              |
| C · Winner Independence    | PASS                    | feature context는 winner/hit을 입력받지 않음                    |
| D · Stability              | **FAIL**                | 안정적으로 남은 feature 0개; 984 제거 시 Historical success 0개 |

따라서 `COMBINATION SIGNAL FOUND`가 아니라 **INCONCLUSIVE**다. Gate A/B는
가설 후보가 존재한다는 뜻일 뿐, 새로운 점수·quota·threshold를 만들 수 있다는
뜻이 아니다.

## 2. 분석 범위와 동결 조건

| 구분                     | 범위              | 사용       |
| ------------------------ | ----------------- | ---------- |
| Development              | 1044–1235 · 192회 | 사용       |
| Historical Reference     | 852–1043 · 192회  | 사용       |
| Locked Holdout           | 660–851           | **미실행** |
| Additional Blind Holdout | 468–659           | **미실행** |

동결값은 Candidate Top20, Decay half-life 36, seed `20260807`,
`greedySampleSize=128`, Pair Top100, `P4_OVERLAP_LIMIT` Top100이다. 운영 Current,
Transition, Tail Coverage와 Final Top10은 import·설정·가중치 모두 변경하지 않았다.

분석 단위는 조합 행이 아니라 **Opportunity 회차**다. Candidate Recall 5 회차는
15개의 5-hit 가능 조합, Recall 6 회차는 84개의 5-hit one-swap과 1개의 exact 6을
갖는다. Recall 6이 표본을 5.67배 과대 가중하지 않도록 각 회차에서 winner-related
조합 feature의 중앙값을 만든 뒤 회차 단위로 A/B/C/D를 비교했다.

Feature는 다음 순서로 분리했다.

1. 과거 데이터와 Candidate Top20만으로 `20C6 = 38,760`개 feature context 생성
2. Pair/Transition/Shape/Number rank와 Pair/Structured selection을 winner 없이 계산
3. 마지막에만 실제 번호를 결합해 hit와 A/B/C/D 결과 라벨 생성

따라서 winner는 selector, feature, score, quota, threshold에 사용되지 않았다.

## 3. Phase 4 회귀 재현

| 기간 · Decay | Candidate 4+/5+/6 | Pair Top100 | Structured Top100 |
| ------------ | ----------------: | ----------: | ----------------: |
| Development  |           54/14/1 |  **13/0/0** |        **24/2/0** |
| Historical   |            29/4/0 |   **4/1/0** |        **12/0/0** |

Phase 4의 네 핵심 수치를 모두 그대로 재현했다. 회귀값이 하나라도 달라지면
Phase 4B 결과 파일을 만들기 전에 실패하도록 강제했다.

## 4. Opportunity Table

`Pair best-5 rank`는 38,760개 Pair 전체 순위이고 `Structured best-5`는 선택된
Top100 안의 위치다. 두 값은 같은 조합의 trajectory를 의미하지 않는다.

|    Round | Source      | Recall | Pair max | Pair best-5 | Structured max | Structured best-5 | Winner source ranks | Band profile   | Class |
| -------: | ----------- | -----: | -------: | ----------: | -------------: | ----------------: | ------------------- | -------------- | ----- |
|      863 | Historical  |      5 |        4 |       8,493 |              4 |                 — | 1/3/7/10/18/33      | A2-B2-C0-D1-X1 | D     |
|      882 | Historical  |      5 |        2 |      21,268 |              4 |                 — | 1/2/6/13/20/29      | A2-B1-C1-D1-X1 | D     |
|  **984** | Historical  |      5 |    **5** |      **61** |              4 |                 — | 4/8/12/15/16/25     | A1-B1-C2-D1-X1 | **B** |
|     1035 | Historical  |      5 |        3 |      14,814 |              4 |                 — | 4/9/12/14/18/23     | A1-B1-C2-D1-X1 | D     |
|     1068 | Development |      5 |        3 |       6,621 |              3 |                 — | 2/8/9/13/14/41      | A1-B2-C2-D0-X1 | D     |
|     1083 | Development |      5 |        4 |         887 |              4 |                 — | 7/9/11/15/18/42     | A0-B2-C2-D1-X1 | D     |
|     1104 | Development |      5 |        3 |       7,313 |              4 |                 — | 3/7/10/12/15/35     | A1-B2-C2-D0-X1 | D     |
|     1111 | Development |      5 |        2 |      27,272 |              4 |                 — | 5/9/12/18/20/23     | A1-B1-C1-D2-X1 | D     |
|     1121 | Development |      5 |        3 |       8,022 |              4 |                 — | 10/13/18/19/20/37   | A0-B1-C1-D3-X1 | D     |
|     1125 | Development |      5 |        3 |       9,186 |              4 |                 — | 4/5/15/18/20/43     | A2-B0-C1-D2-X1 | D     |
| **1135** | Development |      5 |        4 |     **993** |          **5** |            **29** | 1/3/4/6/14/23       | A3-B1-C1-D0-X1 | **A** |
|     1136 | Development |      5 |        3 |       9,000 |              4 |                 — | 5/10/13/19/20/41    | A1-B1-C1-D2-X1 | D     |
|     1165 | Development |      5 |        4 |       8,293 |              4 |                 — | 1/4/15/17/20/28     | A2-B0-C1-D2-X1 | D     |
| **1176** | Development |  **6** |        4 |     **920** |          **5** |            **93** | 2/5/9/10/16/20      | A2-B2-C0-D2-X0 | **A** |
|     1189 | Development |      5 |        3 |       6,349 |              4 |                 — | 5/12/14/17/18/25    | A1-B0-C2-D2-X1 | D     |
|     1193 | Development |      5 |        3 |       4,551 |              4 |                 — | 4/5/7/12/14/31      | A2-B1-C2-D0-X1 | D     |
|     1210 | Development |      5 |        4 |       1,095 |              4 |                 — | 2/6/8/16/18/28      | A1-B2-C0-D2-X1 | D     |
|     1211 | Development |      5 |        4 |       8,078 |              4 |                 — | 1/4/13/16/18/27     | A2-B0-C1-D2-X1 | D     |

분류는 A 2회, B 1회, C 0회, D 15회다. Historical success가 984 한 회뿐이라는
점이 안정성 판정의 가장 큰 제한이다.

## 5. Feature Comparison

값은 Opportunity 회차별 median의 `median [Q1–Q3]`다. A는 2회, B는 1회,
D는 15회다. `Cross-period`는 Development success 대 D와 Historical success 대
D가 같은 방향이고 두 기간 모두 `|Cliff's delta| ≥ 1/3`인 경우다. LOO는 모든
feature가 실패했다.

| Feature                         |         A Structured Only |            B Pair Only |           D Both Failure | Cross-period | LOO  |
| ------------------------------- | ------------------------: | ---------------------: | -----------------------: | ------------ | ---- |
| rank.mean                       |       8.583 [7.625–9.542] | 10.833 [10.833–10.833] |    11.167 [9.583–12.167] | —            | FAIL |
| rank.median                     |       7.250 [6.125–8.375] | 11.000 [11.000–11.000] |    11.000 [9.750–12.000] | —            | FAIL |
| rank.std                        |       5.367 [5.058–5.675] |    4.655 [4.655–4.655] |      5.385 [4.529–6.066] | —            | FAIL |
| rank.range                      |    15.500 [14.250–16.750] | 12.000 [12.000–12.000] |   15.000 [12.000–16.500] | —            | FAIL |
| rank.worst                      |    17.000 [15.500–18.500] | 16.000 [16.000–16.000] |   18.000 [18.000–20.000] | —            | FAIL |
| rank.bandDCount                 |       1.000 [0.500–1.500] |    1.000 [1.000–1.000] |      2.000 [1.000–2.000] | —            | FAIL |
| pair.score                      |    0.3722 [0.3381–0.4062] |                 0.3826 |   0.3070 [0.2776–0.3264] | ↑            | FAIL |
| pair.gini                       |    0.3113 [0.3017–0.3210] |                 0.3096 |   0.3769 [0.3465–0.3957] | ↓            | FAIL |
| pair.entropy                    |    0.9388 [0.9352–0.9424] |                 0.9417 |   0.9136 [0.8986–0.9208] | ↑            | FAIL |
| pair.top1Share                  |    0.1302 [0.1242–0.1362] |                 0.1299 |   0.1560 [0.1390–0.1717] | ↓            | FAIL |
| pair.top3Share                  |    0.3604 [0.3515–0.3693] |                 0.3552 |   0.4072 [0.3763–0.4400] | ↓            | FAIL |
| pair.maxMeanRatio               |       1.953 [1.863–2.043] |                  1.948 |      2.340 [2.085–2.575] | ↓            | FAIL |
| candidate.mean                  |    0.7776 [0.7478–0.8073] |                 0.7564 |   0.6837 [0.6322–0.7160] | ↑            | FAIL |
| candidate.min                   |    0.6135 [0.5943–0.6327] |                 0.6557 |   0.5052 [0.4939–0.5887] | ↑            | FAIL |
| candidate.std                   |    0.1322 [0.1296–0.1348] |                 0.0987 |   0.1257 [0.0795–0.1458] | —            | FAIL |
| candidate.topShare              |    0.2113 [0.2052–0.2175] |                 0.2074 |   0.2314 [0.1972–0.2351] | —            | FAIL |
| ensemble.mean                   |    0.5443 [0.5375–0.5511] |                 0.7657 |   0.3919 [0.3581–0.4645] | ↑            | FAIL |
| ensemble.worst                  |    0.2437 [0.2037–0.2837] |                 0.3445 |   0.0965 [0.0659–0.1919] | ↑            | FAIL |
| ensemble.std                    |    0.2400 [0.2050–0.2749] |                 0.2153 |   0.1969 [0.1738–0.2406] | ↑            | FAIL |
| ensemble.top100Agreement        |                         0 |                      0 |                        0 | —            | FAIL |
| ensemble.oneSpecialistDominance |    0.1165 [0.1161–0.1169] |                 0.0700 |   0.1460 [0.0955–0.1869] | —            | FAIL |
| ensemble.pairHighShapeLow       |    0.3871 [0.2710–0.5033] |                 0.3897 |  0.0503 [-0.1726–0.2603] | ↑            | FAIL |
| ensemble.shapeHighPairLow       | -0.3871 [-0.5033–-0.2710] |                -0.3897 | -0.0503 [-0.2603–0.1726] | ↓            | FAIL |
| ensemble.transitionHighPairLow  | -0.4610 [-0.6098–-0.3123] |                -0.3825 |  0.0575 [-0.0910–0.2759] | ↓            | FAIL |
| novelty.numberRarity            |    0.0662 [0.0518–0.0806] |                 0.0280 |   0.0915 [0.0666–0.1691] | ↓            | FAIL |
| novelty.pairRarity              |    0.3050 [0.2289–0.3811] |                 0.1241 |   0.4435 [0.4150–0.5303] | ↓            | FAIL |
| novelty.tripleRarity            |    0.6596 [0.5811–0.7381] |                 0.3969 |   0.8125 [0.7446–0.8794] | ↓            | FAIL |
| novelty.bandRarity              |    0.2885 [0.1827–0.3942] |                 0.1000 |    0.5000 [0.2500–1.000] | ↓            | FAIL |
| distance.averageOverlap         |       1.865 [1.657–2.072] |                  2.470 |      1.580 [1.435–2.020] | —            | FAIL |
| distance.nearestOverlap         |                     4.000 |                  5.000 |      3.000 [3.000–4.000] | ↑            | FAIL |
| distance.bandProfile            |    0.7684 [0.6753–0.8615] |                 0.4228 |     1.015 [0.9117–1.370] | ↓            | FAIL |
| distance.rankProfile            |       2.069 [1.940–2.197] |                  1.357 |      3.545 [2.509–4.518] | ↓            | FAIL |

성공 회차의 landscape는 Pair score가 높고 pair score가 일부 pair에 덜 집중됐으며,
ensemble의 최저 percentile도 높았다. 동시에 `novelty.*`는 더 낮고 Pair Top100의
band/rank profile과 더 가까웠다. 이는 Structured novelty가 성공을 만들었다기보다,
**Candidate Top20 내부의 5+ 가능 조합들이 이미 Pair/ensemble 관점에서 더 강한
회차였음**을 시사한다.

다만 이 방향은 984 한 회가 Historical 전체를 대표한다. selector feature로 사용할
수 있는 안정적 신호로 보기는 어렵다.

## 6. Historical 984 — Pair 61위가 왜 제거됐는가

Pair가 보존한 5-hit 조합은 `3/13/23/35/36/37`, source rank는
`3/4/8/12/15/16`, band는 `A2-B1-C2-D1`이다.

| Feature                               |              값 |
| ------------------------------------- | --------------: |
| Pair rank / score                     |     61 / 0.4549 |
| Transition rank                       |           2,489 |
| Shape rank                            |          13,023 |
| Number rank                           |           3,431 |
| Pair Gini / entropy                   | 0.2168 / 0.9718 |
| Pair top3 share                       |          0.3041 |
| Candidate score mean / min            | 0.7896 / 0.6557 |
| Ensemble mean / worst percentile      | 0.8774 / 0.6640 |
| Pair Top100 average / nearest overlap |        2.95 / 6 |

Selection trace의 답은 명확하다.

- Pair rank 61이라 매 단계 baseline-head 후보에 포함됐다.
- 100개 Structured 선택 단계 모두에서 feasible했고 고려됐다.
- Hard overlap `≥5` 충돌은 한 번도 발생하지 않았다.
- 100개 단계 모두에서 선택된 다른 조합의 coverage gain이 더 높았다.
- 최종 Pair Top100과 Structured Top100의 공통 조합은 3개뿐이고 97개가 교체됐다.

| 984 counterfactual median   | Pair에서 제거된 97개 | 대신 들어온 97개 |
| --------------------------- | -------------------: | ---------------: |
| Pair score                  |           **0.4732** |           0.3104 |
| Pair Gini                   |           **0.2267** |           0.3536 |
| Pair entropy                |           **0.9617** |           0.9179 |
| Ensemble mean percentile    |           **0.7755** |           0.4981 |
| Top100 agreement            |                **1** |                0 |
| Number rarity               |               0.0256 |       **0.0912** |
| Pair rarity                 |               0.0676 |       **0.4116** |
| Triple rarity               |               0.1399 |       **0.7630** |
| Pair Top100 average overlap |             **2.85** |             1.77 |

즉 984 실패는 overlap 제한이 직접 잘라낸 것이 아니다. Number/Pair/Band novelty를
넓히는 greedy objective가 Pair와 ensemble에서 이미 강했던 5-hit 조합보다 희소한
coverage 조합을 계속 우선한 결과다.

## 7. Development 1135 — 993위가 29위로 올라간 것이 아니다

Phase 4 표의 `Pair best-5 993 → Structured best-5 29`는 동일 조합의 순위 변화가
아니다.

| 구분                 | Pair best-5     | Structured가 선택한 best-5 |
| -------------------- | --------------- | -------------------------- |
| 번호                 | 6/7/13/19/21/33 | 6/13/19/21/33/40           |
| Source ranks         | 1/3/4/6/7/14    | 1/3/4/6/11/14              |
| Pair 전체 rank       | **993**         | **3,518**                  |
| Structured position  | 미선택          | **29**                     |
| Pair score           | 0.4899          | 0.4631                     |
| Pair Gini            | 0.2921          | 0.2950                     |
| Candidate score mean | 0.8564          | 0.8388                     |

두 조합은 번호 5개를 공유하는 one-swap 이웃이다. Pair best-5 주변의 overlap-5
이웃은 84개였고, Pair Top100에는 2개, Structured Top100에는 1개만 들어갔다.
Structured는 Pair 993위 조합을 재랭킹한 것이 아니라 **Pair 3,518위의 다른 5-hit
이웃을 sampled-greedy 29번째에서 포착**했다.

이 성공은 넓은 coverage가 한 one-swap 변형을 살린 사례다. 그러나 neighborhood가
Top100 근처에 조밀하게 형성된 basin은 아니며, 같은 메커니즘을 984에 적용하면
오히려 Pair 61위 5-hit을 잃었다.

## 8. Development 1176 — Recall 6인데 exact 6이 전달되지 않은 이유

Exact 6은 `7/9/11/21/30/35`, source rank는 `2/5/9/10/16/20`이다.

| Ranking    | Exact 6 rank | Percentile |
| ---------- | -----------: | ---------: |
| Pair       |    **7,884** |     0.7966 |
| Transition |       15,143 |     0.6093 |
| Shape      |       21,340 |     0.4494 |
| Number     |       21,697 |     0.4402 |

Top100/Top500/Top1000 agreement는 모두 0이다. Pair가 상대적으로 가장 높지만 exact
6을 Top100으로 끌어올릴 수준은 아니고 다른 ranking도 이를 지지하지 않았다.

| Winner distance | 조합 수 | Pair rank median [Q1–Q3] | Pair best | Structured selected | Selection rate |
| --------------: | ------: | -----------------------: | --------: | ------------------: | -------------: |
|     0 · exact 6 |       1 |                    7,884 |     7,884 |                   0 |             0% |
|    1 · 5개 동일 |      84 |    11,406 [6,531–17,402] |       920 |                   1 |          1.19% |
|    2 · 4개 동일 |   1,365 |    15,075 [8,617–23,091] |        38 |                   3 |          0.22% |
|    3 · 3개 동일 |   7,280 |    18,103 [9,633–26,831] |        18 |                  14 |          0.19% |

Distance-1에서 Structured가 선택한 유일한 조합은 `9/11/21/30/34/35`다. 이 조합은
5-hit이고 Structured 93위였지만 Pair 전체 순위는 14,370위였다. Pair best-5
920위 조합과 또 다른 조합이다.

Exact 6 selection trace에서는 sampled candidate로 한 번 고려됐지만 더 높은 coverage
gain 조합에 밀렸다. 이후 93번째에 선택된 5-hit one-swap 조합과 번호 5개가 겹치며
hard-overlap 제한에 걸렸다. 다만 hard-overlap이 없었더라도 exact 6은 Pair 7,884위,
ensemble mean percentile 0.5739로 약했다. 핵심 병목은 마지막 overlap 하나보다
**exact 6에 대한 discriminative agreement 부재**다.

## 9. 4-hit vs 5-hit Boundary

Historical `Pair 4 → Structured 12`의 집합 차이는 다음과 같다.

- Structured-only 4+ 획득: 9회
  - 858, 868, 875, 882, 970, 986, 1021, 1022, 1035
- Pair-only 4+ 손실: 1회
- 순증: **8회**

최초 테스트는 순증 8을 Structured-only 8회로 잘못 가정했지만 full 결과가
`+9 / -1`임을 보여 줘 테스트 정의를 수정했다.

| Feature                 | Structured-only 4+ · n=9 | Structured가 놓친 5+ · n=16 |
| ----------------------- | -----------------------: | --------------------------: |
| rank.mean               |     9.333 [9.167–11.000] |       11.000 [9.625–12.083] |
| rank.worst              |   17.000 [16.000–19.000] |      18.000 [17.500–20.000] |
| pair.score              |   0.3254 [0.2897–0.3389] |      0.3128 [0.2795–0.3308] |
| pair.gini               |   0.3468 [0.3093–0.3688] |      0.3745 [0.3317–0.3938] |
| pair.entropy            |   0.9165 [0.9072–0.9374] |      0.9138 [0.9001–0.9260] |
| candidate.mean          |   0.7001 [0.6489–0.7754] |      0.6892 [0.6360–0.7231] |
| ensemble.mean           |   0.4593 [0.4061–0.5874] |      0.3964 [0.3584–0.5049] |
| ensemble.worst          |   0.2074 [0.1323–0.2666] |      0.1037 [0.0700–0.2315] |
| novelty.pairRarity      |   0.5395 [0.4365–0.6052] |      0.4432 [0.3994–0.5253] |
| distance.nearestOverlap |      3.000 [3.000–4.000] |         3.500 [3.000–4.000] |
| distance.rankProfile    |      2.882 [2.142–3.441] |         3.346 [2.307–4.488] |

방향상 추가 4+ 회차는 놓친 5+보다 source rank, Pair concentration, ensemble floor가
조금 더 좋다. 하지만 분포가 크게 겹치고 5+ 실패 표본은 16회뿐이다. 데이터가
지원하는 결론은 다음 수준까지다.

> 넓은 coverage는 여러 4-hit 조합 중 하나를 Top100에 넣을 확률 질량을 늘렸지만,
> 희소한 5-hit부터는 coverage만으로 대상 조합을 구별하지 못했다.

별도의 5+ discriminative signal이 필요하다는 가설은 지지되지만, 현재 feature 중
어느 것을 selector로 써야 하는지는 결정할 수 없다.

## 10. Leave-One-Opportunity-Out Sensitivity

Cross-period descriptive signal은 21개였다. 대표 방향은 다음과 같다.

- Pair score ↑
- Pair Gini/top1/top3/max-mean concentration ↓
- Pair entropy ↑
- Candidate mean/min score ↑
- Ensemble mean/worst percentile ↑
- Pair가 Shape/Transition보다 상대적으로 강함
- Number/Pair/Triple/Band rarity ↓
- Pair Top100 nearest overlap ↑
- Pair Top100 band/rank profile distance ↓

그러나 안정적으로 남은 signal은 **0개**다.

- 984 제거: Historical success가 0개가 되어 모든 cross-period 결론 불가능
- 1135 또는 1176 제거: 일부 Pair/concentration/ensemble 방향도 threshold 아래로
  내려감
- D 회차 하나 제거만으로도 경계값에 있던 signal 일부가 뒤집힘

따라서 이 21개는 rule이 아니라 **가설 후보 목록**이다. 이를 조합 점수나 quota로
바꾸면 Development 1135/1176과 Historical 984를 직접 학습하는 것과 같다.

## 11. Counterfactual 해석

Structured selector는 Pair Top100을 약간 보완한 것이 아니라 대부분 교체했다.

| Round | Pair-only | Structured-only | Common | 5-hit 결과                             |
| ----: | --------: | --------------: | -----: | -------------------------------------- |
|   984 |        97 |              97 |      3 | Pair 5-hit 제거                        |
|  1135 |        94 |              94 |      6 | 다른 one-swap 5-hit 추가               |
|  1176 |        97 |              97 |      3 | 다른 one-swap 5-hit 추가, exact 6 실패 |

같은 높은 교체율이 1135/1176에서는 5-hit 하나를 우연히 포착했고 984에서는 이미
강한 5-hit을 버렸다. 이 비대칭을 winner 없이 미리 구분하는 안정적 feature는 이번
표본에서 확인하지 못했다.

## 12. 최종 판정과 다음 단계

최종 판정은 **RESULT 2 — INCONCLUSIVE**다.

- Observable, winner-independent descriptive direction은 존재한다.
- Cross-period 방향도 일부 일치한다.
- 하지만 Historical success가 1회뿐이고 LOO 안정성이 전혀 없다.
- exact 6은 neighborhood basin과 ensemble support 모두 약하다.
- Locked/Blind를 소비해 이 가설을 고르는 것은 금지한다.

따라서 다음을 수행하지 않는다.

- 새로운 weighted combination score
- Pair concentration threshold
- ensemble floor quota
- Phase 4 selector 재튜닝
- Structured/Pair merge
- specialist slot 또는 Final Top10 변경
- Locked/Blind 실행

다음 중심 Phase는 **Candidate Engine Phase 5**가 적절하다.

목표는 Top20 안의 5+/6 Opportunity 수만 늘리는 것이 아니라, 다음 특성을 가진
Opportunity를 더 자주 만드는 것이다.

- 5+ 조합의 Pair score가 높음
- Pair support가 일부 pair에 과집중되지 않음
- 여러 ranking의 최저 percentile이 너무 낮지 않음
- Candidate number score의 mean/min이 높음
- Exact 6의 distance-1 basin이 Top100 근처에 실제로 형성됨

이는 이번 feature를 조합 selector에 넣자는 뜻이 아니다. Candidate Engine이 더
강한 Top20 landscape를 만들었는지 평가할 **진단 지표**로 먼저 사용해야 한다.

## 13. 제한과 QA

- 5+/6 Opportunity는 18회, success는 3회뿐이다.
- A는 2회, B는 1회, C는 0회라 A vs B 자체는 일반화 불가능하다.
- p-value, weight search, regression, classifier, optimization은 사용하지 않았다.
- Feature table은 winner-related 조합을 라벨링한 뒤 회차 중앙값으로 요약했지만,
  각 조합 feature 계산 자체에는 winner가 들어가지 않았다.
- `Pair best-5 rank`와 `Structured best-5 position`은 서로 다른 조합일 수 있다.
  1135/1176에서 실제로 다른 조합임을 확인했다.
- 기존 Phase 4 구현은 top-level seed가 같아도 Development에서는 experiment index 4,
  Historical frozen run에서는 index 1 offset을 사용한다. Phase 4B는 기존 결과를
  정확히 재현하기 위해 이를 바꾸지 않았고 방법론 caveat로 남긴다.
- Full run은 52분 34초가 걸렸으며 결과 JSON 생성과 핵심 회귀 assert는 성공했다.
  최초 full-test 실패는 분석 오류가 아니라 `net +8`을 `gained 8`로 가정한 테스트
  기대값 오류였고, 실제 `gained 9 / lost 1`에 맞게 수정했다.

## 14. 최종 질문에 대한 답

> Candidate Top20에 이미 들어온 5+/6 Opportunity를 winner를 보지 않고 Top100으로
> 전달할 수 있는 관측 가능한 구조적 signal이 실제로 존재하는가?

**관측상 후보는 있지만, 현재 데이터로는 존재한다고 확정할 수 없다.**

Pair concentration, Candidate score, ensemble floor, baseline proximity는 모두
두 기간에서 같은 방향을 보였다. 그러나 Historical 근거가 984 한 회뿐이어서 어느
signal도 leave-one-opportunity-out을 통과하지 못했다. 지금 이를 selector로 만들면
재현 가능한 combination signal이 아니라 984/1135/1176 사례 규칙이 된다.

따라서 Locked를 열지 않고 Combination 미세조정을 멈춘 채 Candidate Engine으로
돌아가는 것이 현재 증거에 가장 맞는 결정이다.

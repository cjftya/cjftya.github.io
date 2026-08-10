# Uriel 5+ Combination Diagnostic

## Scope

- Walk-forward rounds: 1044–1235 (192 rounds)
- Candidate pool: Top20
- Main numbers only; bonus number excluded
- Seed: `20260807`
- Monte Carlo runs: 32
- Ablation: enabled
- Full enumeration: `20C6 = 38,760` combinations per round

The winning numbers are used only after candidate generation and scoring finish.
They never participate in candidate selection, feature calculation, or ranking.

## Corrected baseline

The pre-schema-2 result reported eight Candidate 5 opportunities. Recomputing the
Candidate Top20 directly from the isolated metric path found seven. Round 1123
contains only four main numbers (`21, 24, 34, 35`) in Candidate Top20 and was the
false eighth opportunity.

| Metric                   | Previous JSON | Corrected baseline |
| ------------------------ | ------------: | -----------------: |
| Candidate Recall average |        2.5885 |             2.5833 |
| Candidate 4+             |            36 |                 36 |
| Candidate 5+             |             8 |                  7 |
| Candidate 6              |             0 |                  0 |
| Generation 4+            |  not measured |                 36 |
| Generation 5+            |  not measured |                  7 |
| Generation 6             |  not measured |                  0 |
| Transition Top100 5+     |             1 |                  1 |
| Final Top10 5+           |             0 |                  0 |
| Final Top10 6            |             0 |                  0 |

The Candidate Engine and accepted strategy weights were not changed, so the
corrected Candidate values are the new Before baseline for future comparisons.

## Candidate 5 opportunities

| Round | Candidate matches  | Generation max | Best strategy | Best 5-hit rank | Top100 5 | Top10 5 |
| ----: | ------------------ | -------------: | ------------- | --------------: | -------: | ------: |
|  1044 | 12, 17, 20, 26, 36 |              5 | Transition    |              77 |        1 |       0 |
|  1066 | 6, 16, 19, 21, 32  |              5 | Full Hybrid   |             402 |        0 |       0 |
|  1072 | 16, 18, 20, 23, 32 |              5 | Transition    |           3,301 |        0 |       0 |
|  1100 | 17, 26, 29, 30, 31 |              5 | Transition    |             685 |        0 |       0 |
|  1102 | 13, 14, 26, 37, 38 |              5 | Number        |           6,848 |        0 |       0 |
|  1133 | 13, 14, 20, 28, 34 |              5 | Pair          |             787 |        0 |       0 |
|  1199 | 16, 24, 30, 31, 32 |              5 | Pair + Triple |           1,658 |        0 |       0 |

Full enumeration produced Generation Max 5 in all seven rounds, proving that
Combination Generation itself is not losing the captured numbers. Six rounds
lose the 5-hit combination during Ranking before Top100. Round 1044 reaches
Transition rank 77 and is then lost during Top100-to-Top10 compression.

## Best 5-hit rank by strategy

| Strategy          |  1044 |   1066 |   1072 |   1100 |   1102 |   1133 |   1199 |
| ----------------- | ----: | -----: | -----: | -----: | -----: | -----: | -----: |
| Number            | 4,121 | 19,954 | 14,241 |  7,583 |  6,848 |  8,633 | 15,368 |
| Pair              | 4,982 |  2,003 | 11,525 | 12,361 | 21,733 |    787 |  2,241 |
| Pair + Triple     | 5,357 |  1,902 |  9,411 | 11,922 | 22,883 |  1,012 |  1,658 |
| Shape             | 1,900 |  1,081 | 11,101 | 11,826 |  7,438 | 12,979 | 22,395 |
| Transition        |    77 |  1,217 |  3,301 |    685 | 12,775 | 12,990 |  9,571 |
| Hybrid            | 1,822 |    609 | 10,221 |  8,889 | 15,236 | 14,873 | 27,869 |
| Full Hybrid       | 3,155 |    402 | 11,902 |  6,518 | 11,961 | 12,116 | 26,708 |
| Full − Pair       | 6,081 |    678 | 12,089 |  6,118 | 10,651 | 15,711 | 25,935 |
| Full − Triple     | 3,513 |    450 | 11,789 |  6,326 | 11,413 | 12,916 | 26,708 |
| Full − Shape      | 2,712 |    718 | 13,732 |  3,826 | 10,498 | 11,508 | 26,404 |
| Full − Transition | 4,819 |    596 | 12,697 | 12,232 |  7,819 | 13,737 | 27,560 |

## Feature findings

- Round 1044's Transition 5-hit combination receives most of its score from
  Transition (`0.4228`), followed by Shape (`0.1155`), Number (`0.0688`), and
  model agreement (`0.0550`). The signal is strong enough for Top100 but not
  Top10.
- Round 1066 is closest under Full Hybrid at rank 402. Removing Triple improves
  it only to rank 450, while removing Pair gives rank 678; neither reaches
  Top100.
- Round 1133 is primarily a Pair opportunity (rank 787). Pair + Triple lowers it
  to rank 1,012, so Triple does not improve this opportunity.
- Round 1199 improves from Pair rank 2,241 to Pair + Triple rank 1,658, showing
  that Triple is not uniformly harmful. Pair/Triple cannot be globally raised or
  removed based on these seven rounds.
- Number Score does not dominate the best strategies in most opportunities. A
  global cap alone is therefore unlikely to solve the ranking loss.

## Rejected experiment

A rank-percentile Tail Ensemble was evaluated without using winning numbers in
its score. It combined the three strongest ranks across Number, Pair, Triple,
Shape, Transition, Hybrid, and Full Hybrid.

It was rejected because it moved round 1044 from Transition rank 77 to Ensemble
rank 712, produced no new Top100 5-hit round, and produced no Final Top10 5-hit
round. The experiment is not included in production code.

## Random baseline

The accepted strategy scores did not change, so the existing Monte Carlo
baseline remains the direct comparison:

- Average Top10 max hit: `2.0955`
- Top10 3+: `22.0052%`
- Top10 4+: `1.5137%`
- Top10 5+: `0.1139%`
- Top10 6: `0%`

These rates are computed across 32 deterministic Monte Carlo portfolios per
round, not as seven or eight Candidate opportunity counts.

## Remaining bottleneck and next priority

The primary bottleneck is Combination Ranking, not Combination Generation:

1. Diagnose the 36 Candidate 4+ rounds as the larger supporting sample.
2. Compare score percentile and contribution distributions for exact 4-hit,
   3-hit, and random combinations without fitting the seven 5-hit rounds.
3. Test one general ranking change at a time against the complete 192-round
   walk-forward and ablations.
4. Keep a change only if it improves 5+ or consistently moves both 4+ and 5+
   ranks upward without materially damaging Top10 3+, Top10 4+, or the random
   comparison.
5. Do not start Candidate Engine Phase 2 until Final Top10 5-hit rises above
   zero under the fixed Candidate baseline.

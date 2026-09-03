# Uriel v3 research architecture

Uriel v3 generates candidate number sets rather than claiming to predict one six-number
winning combination. Its core flow is:

`Combination Space → Contrastive Test → Candidate Projection`

## Scientific boundary

- A draw is one six-number combination object.
- Per-number historical frequency, hot/cold labels, overdue duration and similar
  features are excluded.
- Every real and synthetic combination passes through the same representation.
- A combination score means structural similarity to a validated historical feature
  distribution. It is not a winning probability.
- Candidate scores are projections from retained combinations, not historical number
  weights.

## Representations

- Distance: adjacent gaps, ranked pair distances, range, gap distribution, entropy and
  spacing concentration.
- Distribution: location, ordered position ratios, dispersion, density, zone occupancy
  and entropy. Odd/high ratios are descriptors only.
- Geometry: replaceable circle or 7×7 coordinates, centroid, radii, polygon, edges,
  angles, symmetry, irregularity, dispersion and entropy.
- Advanced Lab: graph, topology and experimental registration slots exist, but no
  advanced method appears in the production menu before it receives its own validation.

## Contrastive selection

History is split chronologically into 60% Discovery, 20% Validation and 20% Final
Holdout. Holdout values do not select features or fit score profiles.

A feature is selected only when all of the following hold:

- absolute Discovery Cohen-style effect size is at least 0.12;
- absolute Validation effect size is at least 0.05 with the same direction;
- at least two of three Discovery time segments keep the direction;
- Benjamini–Hochberg adjusted mean-difference p-value is at most 0.05.

Diagnostics also report an independently seeded permutation p-value, KS statistic,
Wasserstein distance, Jensen–Shannon divergence, bootstrap mean-difference interval and
the isolated Holdout effect.

## Projection and reproducibility

Monte Carlo sizes are configurable at 100K, 500K, 1M and 2M. A two-pass histogram
filter finds the requested Top 10%, 5% or 1% without storing every generated
combination. The retained combination space is projected to all numbers 1–45 and
produces nested Candidate@10/15/20/25/30 sets.

Each result records the algorithm, full parameters, data range, candidate sizes, seed,
sample size, retained count, execution date and build git commit when available.

## Walk-forward evaluation

Every evaluated round uses only earlier rows. Primary metrics are Mean/Median Hit@K,
Hit≥3/4/5/6, recall and precision. For each K, 10,000 equal-size random candidate sets
provide a random mean, hit distribution, percentile, relative/absolute lift and
confidence interval. The Uriel mean receives a separate round bootstrap interval.

## Initial empirical result

Using official draws through round 1239 (2026-08-29), 20,000 synthetic null
combinations and 200 bootstrap/permutation iterations, zero Distance, Distribution or
Geometry features passed Discovery and Validation selection. Therefore all three
structural models and the equal-weight ensemble currently return a neutral structural
score rather than inventing a signal.

A 96-round Random Baseline smoke run with 10,000 sampled combinations per round was
classified as indistinguishable from random. Lift ranged from 0.977 to 1.034 across the
five candidate sizes, with overlapping confidence intervals. These values are a system
check, not evidence of predictive performance.

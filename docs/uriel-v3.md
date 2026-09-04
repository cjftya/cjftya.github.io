# Uriel v3 research architecture

Uriel v3 generates reproducible six-number candidate games. The UI exposes 5, 10 or 30
games per selected algorithm. Its core flow is:

`Combination Space → Contrastive Test → Candidate Game Selection`

## Scientific boundary

- A draw is one six-number combination object.
- Per-number historical frequency, hot/cold labels, overdue duration and similar
  features are excluded.
- Every real and synthetic combination passes through the same representation.
- A combination score means structural similarity to a validated historical feature
  distribution. It is not a winning probability.
- Candidate games are selected from the retained high-score combination space, not
  assembled from historical per-number weights.

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

## Game selection and reproducibility

Monte Carlo sizes are configurable at 100K, 500K, 1M and 2M. A two-pass histogram
filter finds the requested Top 10%, 5% or 1% without storing every generated
combination. A bounded deterministic reservoir is taken from that space, ranked by
structural similarity and filtered to avoid excessive overlap. It produces nested 5,
10 and 30-game lists, where every row is one valid six-number lottery game.

If no feature survives validation, structural filtering is skipped and the games are
generated directly from a seeded uniform random source. This avoids presenting Monte
Carlo sampling noise as a meaningful rank.

Each result records the algorithm, full parameters, data range, game counts, seed,
sample size, retained count, execution date and build git commit when available.

## Walk-forward evaluation

Every evaluated round uses only earlier rows. For 5, 10 and 30 games, the primary value
is the best hit achieved by any one game. Metrics include mean/median best hit and
Best Hit≥3/4/5/6. Equal-count random game batches use the same diversity rule and
provide a random mean, hit distribution, percentile, relative/absolute lift and
confidence interval. The Uriel mean receives a separate round bootstrap interval.

## Initial empirical result

Using official draws through round 1239 (2026-08-29), 20,000 synthetic null
combinations and 200 bootstrap/permutation iterations, zero Distance, Distribution or
Geometry features passed Discovery and Validation selection. Therefore all three
structural models and the equal-weight ensemble currently return a neutral structural
score rather than inventing a signal.

The earlier Candidate@K number-pool result is not comparable with the new game-level
metric and is retained only in git history. With no selected structural feature, the
current UI explicitly labels generated games as random-equivalent instead of turning
Monte Carlo noise into a per-number ranking.

A new 96-round smoke check over rounds 1144–1239 used the seeded Random Baseline and
10,000 equal-count random batches. Mean best-hit lift was 1.095 for 5 games, 1.074 for
10 games and 1.010 for 30 games. All 96 rounds had zero structural signals and the
Uriel/random 95% confidence intervals overlapped at every game count, so the result is
classified as indistinguishable rather than treating a lucky seed as predictive
evidence.

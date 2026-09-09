# Virus Sim v4.4 진행 기록

## Baseline

- master: `9ff516d07070ab2f733967dd9829debda66c8428`
- enveloped inventory: 23개
- generic-enveloped: 4개
- lint: 통과
- tests: 33 files, 175 cases 통과
- build: 통과
- Virus Sim JS: 207.35 kB, gzip 58.99 kB
- Virus Sim CSS: 10.14 kB, gzip 2.91 kB

## 구현 범위

- 23개 외피형 항목의 명시적 signature/fallback coverage
- Coronavirus 4개 subgroup profile과 crown-like S surface
- HBV·Alphavirus·Cystovirus 전용 builder
- HSV 두 surface class와 tegument/capsid 관계 강화
- VSV·Filovirus surface instancing
- HIV-2와 6개 Filovirus의 family-level 근거 정책
- 외피형 대표 8종의 surface·transparent·section·exploded·scanner 회귀
- History & Impact, dropdown, part/layer, high/low 회귀

## Generic 감사 결과

- 작업 전: HBV, Sindbis, SFV, Φ6
- 작업 후 활성 catalog: 0개
- `generic-enveloped` builder 자체는 과거 profile 호환용 fallback으로 유지
- Vaccinia MV는 이미 `vaccinia` 전용 builder이므로 명시적 signature만 추가

## 최종 검증

- lint: 통과
- tests: 34 files, 182 cases 통과
- build: 통과
- Virus Sim JS: 217.83 kB, gzip 61.47 kB
- Virus Sim CSS: 10.14 kB, gzip 2.91 kB
- v4.3 대비 JS: +10.48 kB, gzip +2.48 kB
- 23개 외피형 high/low: finite bounds, part/layer, source, profile 통과
- 대표 8종: surface·transparent·section·exploded·scanner flow 통과
- 공개 Pages smoke QA: 배포 후 기록

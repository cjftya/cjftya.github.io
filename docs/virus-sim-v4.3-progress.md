# Virus Sim v4.3 진행 기록

## Baseline

- master: `9663a475b6c001c5ad22a89dca680d765f7d4857`
- lint: 통과
- tests: 32 files, 168 cases 통과
- build: 통과
- Virus Sim JS: 156.81 kB, gzip 43.58 kB
- Virus Sim CSS: 9.00 kB, gzip 2.71 kB
- 기본 모델: 71개 high/low 생성·part/layer coverage 통과

## v4.3 완료 범위

- 71개 History & Impact entry와 별도 source registry
- compact `<details>` History UI와 선택 동기화
- 대표 8종 Structural Signature
- 외피·matrix·다중 표면 단백질·분절 RNP·원뿔 core 공용 컴포넌트
- SARS-CoV-2의 S/M/E형 표면 구성, Influenza A의 HA/NA/M2형 구성, HIV-1의 희소 Env와 이중 RNA 표현
- filovirus ID별 정적 중심선 variation
- coverage·source·finite bounds·high/low·exploded regression 테스트

## 최종 검증

- lint: 통과
- tests: 33 files, 175 cases 통과
- build: 통과
- Virus Sim JS: 207.26 kB, gzip 58.96 kB
- Virus Sim CSS: 10.14 kB, gzip 2.91 kB
- History: 71/71 entry, 중복·누락·미등록 source 없음
- 대표 8종: high/low 모델과 surface·transparent·section·exploded·scanner flow 통과

## 후속 버전

- v4.4: 나머지 enveloped family signature rollout
- v4.5: icosahedral·layered family rollout
- v4.6: filament·special geometry rollout
- v4.7: phage·remaining generic rollout
- v4.8: 71-entry uniformity와 최종 visual QA

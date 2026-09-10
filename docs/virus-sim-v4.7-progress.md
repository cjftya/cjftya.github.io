# Virus Sim v4.7 진행 기록

## Baseline

- 시작 master: `a629dbc9403d3216b9602ad54dabb0e61bdf94d1`
- catalog: 71개
- phage-tag inventory: 16개
- v4.7 head–tail rollout: 8개
- `generic-phage`: 5개
- lint: 통과
- tests: 36 files, 199 cases 통과
- build: 통과
- Virus Sim JS: 255.82 kB, gzip 70.38 kB
- Virus Sim CSS: 10.14 kB, gzip 2.91 kB

## 구현 범위

- T4, Lambda, T7 reference builder를 공용 phage signature/component system으로 이관
- Φ29, P22, HK97, T5, T1의 explicit family profile과 `phage-family` builder
- 독립 head/tail axis, ordered capsomer, portal, neck, contractile/noncontractile/short tail
- baseplate, tail fiber, tailspike와 packed genome의 part/layer/explosion 계약
- MS2, M13, ΦX174, Qβ, PRD1, Φ6, PM2, AP205의 기존 specialized builder 보존
- 모든 0-use generic builder와 legacy geometry field 제거
- exhaustive typed builder registry

## Generic 감사 결과

- `generic-icosahedral`: 0 → 삭제
- `generic-enveloped`: 0 → 삭제
- `generic-layered`: 0 → 삭제
- `generic-filament`: 0 → 삭제
- `generic-phage`: 5 → 0 → 삭제
- `generic-geminate`: 0 → 삭제
- `generic-spindle`: 0 → 삭제
- `generic-rod`: 0 → 삭제
- 남은 generic/fallback entry: 없음

## 최종 검증

- lint: 통과
- changed-file Prettier: 통과
- tests: 37 files, 207 cases 통과
- build: 통과
- Virus Sim JS: 253.34 kB, gzip 69.81 kB
- Virus Sim CSS: 10.14 kB, gzip 2.91 kB
- v4.6 대비 JS: -2.48 kB, gzip -0.57 kB
- 전체 71종 high/low: finite non-zero sane bounds, part/layer, source, History, signature 통과
- 전체 71종 low 재생성: dispose 후 재생성 통과
- geometry profile: 미참조 profile 0개
- 파지 8종: source, signature, portal, high/low identity marker와 render budget 통과
- 대표 파지 5종: surface·transparent·section·exploded·scanner flow 통과
- browser visual QA: cloud browser가 local preview 주소를 차단해 자동 geometry·interaction 테스트로 대체
- 공개본 smoke QA: master 반영 후 수행 예정

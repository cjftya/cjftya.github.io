# Virus Sim v4.5 진행 기록

## Baseline

- 시작 master: `c3d247adb6eee86c39bd4cbbcba2dbca1296b218`
- geometry-family inventory: Icosahedral 23개, Layered 8개
- rollout inventory: 30개(Vaccinia MV 기존 전용 모델 제외)
- generic-icosahedral: 21개
- generic-layered: 6개
- lint: 통과
- tests: 34 files, 182 cases 통과
- build: 통과
- Virus Sim JS: 217.83 kB, gzip 61.47 kB
- Virus Sim CSS: 10.14 kB, gzip 2.91 kB

## 구현 범위

- 30개 rollout 항목의 explicit capsid profile과 확장 Structural Signature
- subdivision-derived ordered direction, 12-vertex feature, dimple, pentamer, turret helper
- AAV/Parvovirus, Papilloma/Polyoma, Calici/Astro, plant icosahedral 구조 분화
- Rotavirus/Reovirus/Bluetongue/IBDV의 역할별 capsid와 분절 유전체
- PRD1/PM2/STIV의 capsid·internal membrane 관계
- high/low 구조 identity, part/layer, transparent/section/exploded/scanner 회귀

## Generic 감사 결과

- `generic-icosahedral`: 21 → 0
- `generic-layered`: 6 → 0
- fallback builder 자체는 향후 자료 부족 profile과 과거 호환을 위해 유지
- Vaccinia MV는 기존 `vaccinia` 전용 builder와 v4.4 signature 유지

## 최종 검증

- lint: 통과
- changed-file Prettier와 `git diff --check`: 통과
- tests: 35 files, 190 cases 통과
- build: 통과
- Virus Sim JS: 240.37 kB, gzip 66.49 kB
- Virus Sim CSS: 10.14 kB, gzip 2.91 kB
- v4.4 대비 JS: +22.54 kB, gzip +5.02 kB
- 30개 rollout high/low: finite bounds, part/layer, source, profile 통과
- 대표 구조 최대: 약 25.2K triangles, 29 draw-call-equivalent objects
- 대표 8종: surface·transparent·section·exploded·scanner flow 통과
- v4.4 외피형 대표 5종과 History & Impact mapping 회귀 통과
- UI/CSS와 stage sizing은 변경하지 않았으며 viewport 회귀는 기존 layout test와 bounds test로 보호
- cloud browser 제어 surface가 제공되지 않아 새 contact sheet와 수동 viewport 캡처는 생성하지 못함

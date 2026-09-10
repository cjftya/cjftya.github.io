# Virus Sim v4.6 진행 기록

## Baseline

- 시작 코드 tree: v4.5 release tree (`0d6b7f6`, 공개 master와 동일 tree)
- rollout inventory: 17개
- generic-filament: 3개
- generic-rod: 1개
- generic-spindle: 2개
- generic-geminate: 2개
- lint: 통과
- tests: 35 files, 190 cases 통과
- build: 통과
- Virus Sim JS: 240.37 kB, gzip 66.49 kB
- Virus Sim CSS: 10.14 kB, gzip 2.91 kB

## 구현 범위

- 17개 rollout 항목의 explicit helical/special geometry profile
- deterministic centerline과 parallel-transport-like frame
- centerline-following instanced helical coat, genome path, endpoint terminal helper
- TMV/M13 reference builder의 공용 구조 계약 이관
- PVX/PapMV/PVY family builder 및 filovirus frame 통합
- SIRV2 rod, SSV1/ATV spindle, MSV/TYLCV geminate family builder
- Vaccinia rounded layered brick와 기존 core/lateral-body 강화
- high/low identity, part/layer, transparent/section/exploded/scanner 회귀

## Generic 감사 결과

- `generic-filament`: 3 → 0
- `generic-rod`: 1 → 0
- `generic-spindle`: 2 → 0
- `generic-geminate`: 2 → 0
- fallback 함수 자체는 향후 자료 부족 profile과 과거 호환을 위해 유지

## 최종 검증

- lint: 통과
- changed-file Prettier: 통과
- tests: 36 files, 199 cases 통과
- build: 통과
- Virus Sim JS: 255.82 kB, gzip 70.38 kB
- Virus Sim CSS: 10.14 kB, gzip 2.91 kB
- v4.5 대비 JS: +15.45 kB, gzip +3.89 kB
- 17개 rollout high/low: finite bounds, part/layer, source, profile 통과
- 모든 대표 구조: 48 draw-call-equivalent, 250K triangles 예산 이내
- 대표 8종: surface·transparent·section·exploded·scanner flow 통과
- v4.4 외피형과 v4.5 capsid 대표 모델, History & Impact mapping 회귀 통과
- GitHub Actions `Validate and deploy GitHub Pages` run #89: 통과
- 공개본: v4.6 title/header, 71개 catalog option, v4.6 bundle과 핵심 special-geometry marker 확인
- 공개 desktop 1363×936: document scroll 유지, body 가로 overflow 없음, WebGL fallback UI 정상
- cloud browser는 sandbox에서 WebGL context가 비활성화되어 3D contact sheet와 지정 모바일
  viewport 수동 캡처는 수행할 수 없었고, 해당 범위는 geometry bounds와 view/scanner 자동
  회귀 테스트로 대체

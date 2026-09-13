# Virus Sim v4.8.5 진행 기록

## 기준선

- Base: `origin/master` at `3adb765`
- 변경 전 `npm run lint`, `npm run test`, `npm run build` 통과
- Catalog 95종, 기존 테스트 232개 통과 상태에서 시작

## 구현 배치

1. source scope와 component evidence 경계 정리
2. irregular/grid-like RNP core 및 surface organization helper 분리
3. Rubella·HCV·Orthoflavivirus renderer 교정
4. Nipah G / Measles H / Mumps HN profile 분리
5. CCHF / Hantaan profile·source 분리
6. v4.8.5 구조 정확성 회귀 테스트와 전수 감사 추가

## 중단 복구 지점

- 작업 브랜치: `codex/virus-sim-v4.8.5`
- 전용 테스트: `tests/virus-sim/v4.8.5-structural-accuracy.test.ts`
- 감사 요약: `docs/virus-sim-v4.8.5-accuracy-audit.md`
- 다음 게이트: 전체 lint / format / test / build, 브라우저 QA, diff 검토

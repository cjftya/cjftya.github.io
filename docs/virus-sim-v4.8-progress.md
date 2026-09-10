# Virus Sim v4.8 진행 기록

## Baseline

- 시작 master: `7f22a981daac3f2f61579c04f7b9969ab2bc4945`
- catalog: 71개
- generic builder: 0개
- lint: 통과
- tests: 37 files, 207 cases 통과
- build: 통과
- Virus Sim JS: 253.34 kB, gzip 69.81 kB
- Virus Sim CSS: 10.14 kB, gzip 2.91 kB

## 완료한 통합 작업

- 71-entry Fidelity Matrix와 family inventory 고정
- catalog/signature/dimensions/History/source exact coverage 검사
- 71종 high/low 142개 model의 resource budget과 low≤high triangle 검사
- 전체 surface·transparent·section·exploded, part, layer와 scanner 3축 전수 검사
- 모든 model-owned geometry/material의 exactly-once dispose 검사
- 외부 source link의 `noopener noreferrer` 정책 통일
- v4.8 상태·UI·문서 버전 갱신
- 제거된 비교 기능의 variant registry/type/test와 미사용 scanner/helper 계약 삭제
- 현재 모델링·generic 정책·known limitation 문서 통합

## 측정 결과

- 최대 objects: T4 33
- 최대 geometries: T4 29
- 최대 materials: Rotavirus/Reovirus 17
- 최대 triangles: PVY high 36,852
- 가장 느린 단일 build 관찰값: 약 32 ms (개발 컨테이너 1회 측정, 성능 보장값 아님)
- 모든 항목 low triangles ≤ high triangles

## 최종 로컬 검증

- lint: 통과
- tests: 38 files, 211 cases 통과
- build: 통과
- Virus Sim JS: 253.18 kB, gzip 69.78 kB
- Virus Sim CSS: 10.14 kB, gzip 2.91 kB
- v4.7 대비 JS: -0.16 kB, gzip -0.03 kB
- unrelated project bundle: 유지

## 남은 순서

1. master push와 GitHub Pages workflow 확인
2. 공개본 mobile/desktop·핵심 모델·mode·scanner·fallback smoke QA
3. 최종 SHA와 공개 QA 결과 기록

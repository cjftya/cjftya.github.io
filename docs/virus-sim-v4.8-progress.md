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

## 배포와 공개본 확인

- 구현 master: `b4954a980436b05b924d2ab6c0117fdc2c425acb`
- GitHub Pages workflow: run `34445273092`, success
- 공개 URL: <https://cjftya.github.io/projects/virus-sim/>
- 공개본 title/badge: v4.8 PASS
- native virus select: 71 options PASS
- desktop smoke: 1363×936, 수평 overflow 없음
- 정보 panel: 5개 details와 외부 source link 정책 PASS
- WebGL fallback: 안내·재시도 노출, 3D 의존 control 비활성화 PASS
- 공개 QA용 cloud browser는 WebGL이 비활성화되어 실제 GPU 렌더·mode·scanner·저장 조작은
  실행하지 못했다. 이 범위는 71종 high/low build, 모든 mode·part·layer, scanner 전수 검사와 dispose
  검사로 보완했다.

## 최종 상태

- 코드·catalog·문서·배포: 완료
- 자동 검증: PASS
- 공개 페이지와 WebGL fallback: PASS
- GPU 화면 육안 확인: QA 환경 제한으로 `NEEDS REVIEW`

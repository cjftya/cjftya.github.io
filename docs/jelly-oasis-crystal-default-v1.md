# Jelly Oasis — Crystal Detail 기본 전환 v1

2026-10-12 · 사용자 지시: 기존 Crystal A/B/C 상세 모델을 추가 모델링 없이 바로 기본 화면에 적용한다.

## 변경 범위

- 일반 `/projects/jelly-oasis/` 및 `?debug`는 기존 검증된 `crystal-accent-detail-v1/Crystal_Blockout_[A/B/C]_Detail_v1.glb`를 기본으로 로딩한다.
- 기존 `?debug&crystal=blockout`으로 구형 GLB를 비교한다. `?debug&crystal=detail`도 동일 상세 GLB다.
- `debug`가 없는 `?crystal=blockout` / `?crystal=detail`은 일반 기본 설정을 바꾸지 않는다.
- 기존 16개 모듈 앵커, 자산 파일, 접지·동선·지형·카메라 구도, GLB 원본, Blender, 물 관련 코드와 선택 플래그를 변경하지 않는다.
- GPGPU 호수 수면 및 낙하·수로는 사용자 최종 시각 검토까지 확정을 유보하고 기존 opt-in 후보 상태를 유지한다.

## 기존 자산 기준 예상 비용과 검증 범위

- 기존 QA: blockout 20,786 triangles → detail 20,894 triangles (+108); 기존 desktop 동일 조건 draw calls 99 → 117, 모바일 68 → 77. 이 값은 과거 후보 QA 기준이고 현재 WebGL 실기 측정이 아니다.
- 낮·밤/모바일 비교 및 화면 가독성은 기존 Crystal Accent QA를 재사용한다. 지금 기본값 전환으로 새로운 모델 자산을 만든 것은 아니다.
- 유닛 테스트에 기본 상세/디버그만 blockout 선택 회귀를 추가한다.
- 기존 브라우저 QA의 기본 triangle 수와 detail 자산 기대값을 최신 설정에 맞게 변경한다. QA 실행·CI 결과와 실제 WebGL 브라우저 시각 검증 여부는 별도 실행 근거에 따라 보고한다.

원래 Phase A 재검수: [modeling-integration-review-v2](jelly-oasis-modeling-integration-review-v2.md).

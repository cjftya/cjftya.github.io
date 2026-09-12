# Virus Sim v4.8.2 진행 기록

## 목표

v4.8.1에서 대표 8종에 적용한 구조 설명 체계를 전체 71종 catalog로 확장한다. 사용자가 선언된 part 또는 layer를 선택하면 해당 바이러스의 실제 구조명, 기능, 위치, 인접 관계, 현재 3D 표현, 단순화, 근거 수준과 출처를 확인할 수 있어야 한다.

## 완료 내용

- 최신 `master`의 v4.8.1 schema, registry, source 연결, detail UI와 fallback 동작 확인
- 71종의 모든 선언 part/layer를 자동 inventory하고 설명 범위를 교차 검증
- 전용 renderer가 있는 12개 builder에 family-level 구조 설명 추가
- 여러 생물학적 계열이 renderer를 공유하는 37종에 entry-specific profile 추가
- HIV-2의 p26 capsid core와 OC43/HKU1의 S·HE surface protein 차이를 선택 항목에 명시
- 실제로 별도 구조가 확인되지 않은 PVX/PapMV/PVY 말단 표식을 `conceptual`로 명시
- 설명마다 `actualName`, `role`, `location`, `relationships`, `modelRepresentation`, `simplification`, `evidence`, `sourceIds`를 제공
- source ID, 중복 registration, catalog에서 제거된 orphan target을 registry 초기화 시 검증
- RRV catalog에 존재하지 않던 기존 `capsomer` 설명 registration 제거
- 앱 표시 및 저장 상태 schema 버전을 `v4.8.2`로 갱신
- 렌더러, 카메라, 관찰 모드와 UI 배치는 변경하지 않음

## 설명 계층

조회 순서는 기존 계약을 유지한다.

1. `entry`: 바이러스별 차이가 있거나 renderer를 여러 계열이 공유하는 경우
2. `family`: 같은 builder 안에서 실제 구조 설명을 안전하게 공유할 수 있는 경우
3. `generic`: 안전망으로만 유지

전수 검사 결과 569개 유효 target 중 `entry` 345개, `family` 224개이며 `generic` 사용은 0개다. 바이러스별 상세 결과는 `virus-sim-v4.8.2-explanation-coverage.md`에 기록했다.

## 근거 수준 보정

- PDB·EMDB·구조 논문이 연결된 profile은 해당 자료가 직접 지지하는 범위에서 `observed`를 사용한다.
- ICTV 계열 설명만으로 작성한 구조는 `family-supported`로 낮춰 원자 구조가 직접 관찰된 것처럼 보이지 않게 했다.
- 현재 모델의 방향 표식이나 실제 독립 구조로 해석할 수 없는 요소는 `conceptual`로 표시했다.
- Alphavirus의 공유 nucleocapsid 설명은 Sindbis PDB를 다른 종에 그대로 확대하지 않도록 `family-supported`로 표시했다.

## 모델 불일치 방지 사례

- OC43/HKU1의 surface-protein 설명은 S와 HE가 함께 존재함을 밝히되, 현재 모델은 더 짧은 HE를 독립 기하로 구분하지 않는다고 명시한다.
- HIV-2 capsid는 p26으로 이름을 구분하되, 현재 원뿔형 core는 lentivirus 공통 family model이라고 명시한다.
- STIV turret는 C381 complex로 명명하고 현재 반복 꼭짓점 구조와 연결한다.
- PRD1의 capsid, 내부 막과 tape/vertex 단백질은 PDB 근거 범위를 벗어나 전체 원자 virion으로 설명하지 않는다.

## 검증 항목

- 71종 및 569개 선언 target coverage
- 설명 필수 필드의 비어 있지 않은 값
- source registry 해석 가능 여부
- entry/family registration 중복과 orphan target
- broad renderer 37종의 entry-specific 적용
- unavailable/unknown target의 `null` 반환
- v4.8.2 UI 표기와 접힘형 설명 surface 유지
- TypeScript, lint, 전체 test, production build

## 최종 검증 결과

- `npm run lint`: 통과
- `npm run test`: 통과 (40개 파일, 221개 테스트)
- `npm run build`: 통과
- 전체 71종 coverage 및 569개 target의 generic fallback 0개: 통과
- renderer와 설명 target 교차 검증, source resolution, duplicate/orphan 검사: 통과
- 기존 모바일 우선 접힘형 설명 UI와 회귀 테스트: 통과

## 제외 범위

History & Impact, 3D geometry, camera, comparison, Arena, 감염 simulation, 이미지 저장과 품질 토글 동작은 변경하지 않았다.

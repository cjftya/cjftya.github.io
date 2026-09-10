# Virus Sim v4.8.1 진행 기록

## 목표

기존 공통 부위 설명을 현재 선택한 바이러스의 실제 구조와 3D 모델 표현에 연결한다. 렌더링 기하나 관찰 모드는 추가하지 않는다.

## 완료 내용

- 최신 `master`의 71종 catalog, part/layer, source, evidence, UI lookup 구조 감사
- 독립적인 `catalog/explanations` schema와 registry 추가
- `entry → family → generic` fallback 구현
- 대표 8종의 모든 선언 part/layer에 전용 설명 작성
- 실제 구조명, 역할, 위치, 관계, 모델 표현, 단순화, 근거 수준, 출처 연결 연결
- 3D part picking과 부위 목록 선택을 동일 lookup으로 통합
- 레이어 토글 시 해당 바이러스의 레이어 설명을 표시하도록 연결
- 기존 선택 카드 안에 모바일 친화적인 접힘형 보조 정보 추가
- T4 baseplate·tail tube 구조 근거로 PDB 5IV5 등록
- v4.8.1 데이터 계약 및 fallback 회귀 테스트 추가

## 모델 불일치 방지 사례

- SARS-CoV-2 E 단백질은 실제 외피 구성 요소로 설명하되 현재 모델에는 독립 기하가 없음을 명시했다.
- HIV-1 nucleocapsid protein p7은 RNA와의 관계를 설명하되 현재 모델에는 별도 구조가 없음을 명시했다.
- Influenza A의 HA·NA·M2는 하나의 `spike` 선택 대상에 속하지만 모델에서 사용하는 세 가지 모양을 구분해 설명했다.
- 부분 구조 PDB는 전체 virion 원자 모델로 확대 해석하지 않았다.

## 검증

- 대표 8종 part/layer coverage: 통과
- sourceId 유효성, 중복 key, family/generic fallback, unknown target safety: 통과
- 전체 `npm run lint`: 통과
- 전체 `npm run test`: 통과 (39개 파일, 215개 테스트)
- 전체 `npm run build`: 통과

## 제외 범위

71종 전체 전용 설명은 v4.8.2에서 같은 schema와 작성 규칙을 사용해 확장한다. History & Impact schema, 3D geometry, camera, comparison, Arena, 감염 simulation은 변경하지 않았다.

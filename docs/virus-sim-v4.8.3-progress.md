# Virus Sim v4.8.3 진행 기록

## 목표

v4.8.2의 71종 구조 설명을 `ObservationDefinition → Structural Signature → 실제 등록 part/layer → 설명 → source/evidence` 순서로 전수 대조한다. 새 사용자 기능은 추가하지 않고 현재 3D 표현보다 강하거나 약한 문구, 근거 범위 과장, 끊어진 source 링크와 모바일 정보 밀도를 최종 정리한다.

## 반영 내용

- 71종, 569개 선택 target의 5-way consistency validator 추가
- catalog에 선언된 모든 part/layer와 low-budget 실제 모델 map의 양방향 일치 검사 추가
- 필수 설명 필드, generic fallback, evidence overclaim, source ID/URL, signature source 교집합과 120자 초과 문구 검사 추가
- SARS-CoV-2 설명을 실제 렌더러의 S·M·E 세 형상과 일치하도록 수정
- OC43/HKU1 설명을 실제 렌더러의 S·HE·M·E 네 형상과 일치하도록 수정
- OC43 HE(PDB 5N11), HKU1 HE cryo-EM, HIV-2 capsid lattice(EMD-29607) source 추가
- HIV-1 Env와 Ebola envelope의 근거 수준을 `family-supported`로 보수적으로 조정
- Alphavirus envelope를 매끈한 구형 막, E1/E2를 원뿔형 절차 기하로 정확히 기술
- IBDV의 `core-capsid` UI 영역이 닫힌 VP3 capsid의 직접 관찰을 뜻하지 않음을 명시
- PRD1 vertex/genome의 PDB 범위 밖 표현을 `family-supported`로 조정
- PVX/PapMV의 개념적 말단 cap을 structural signature에 명시
- ICTV만을 근거로 한 SIRV2·SSV1·ATV signature를 `family-supported`로 조정
- EMDB source URL이 `/undefined`로 생성되던 helper 오류 수정
- 앱 표기와 관찰 상태 schema를 `v4.8.3`으로 갱신

## 결과

| 검사                          | 결과 |
| ----------------------------- | ---: |
| Catalog entries               |   71 |
| Declared part/layer targets   |  569 |
| Entry-specific targets        |  345 |
| Family targets                |  224 |
| Generic targets               |    0 |
| Model part/layer mismatch     |    0 |
| Invalid source/evidence issue |    0 |
| Validator warning             |    0 |
| PASS entries                  |   71 |

상세 판정은 `virus-sim-v4.8.3-consistency-audit.md`, 작성 규칙은 `virus-sim-structural-explanation-style-guide.md`에 기록했다.

## 범위 제한

History & Impact, 카메라, 비교 모드, Arena, 감염 simulation과 큰 3D 모델링 변경은 하지 않았다. 기존 접힘형 설명 UI와 3D 우선 화면 구성을 유지했다.

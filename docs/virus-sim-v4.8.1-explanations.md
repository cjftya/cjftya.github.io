# Virus Sim v4.8.1 구조 설명 작성 규칙

## 목적

구조 설명은 공통 용어를 길게 반복하는 대신, 사용자가 선택한 부위가 현재 바이러스에서 실제로 무엇이며 3D 모델에 어떻게 대응하는지 알려준다.

## 데이터 계층

조회 우선순위는 다음과 같다.

1. `entry`: 특정 바이러스 전용 설명
2. `family`: 같은 `modelBuilder`를 공유하는 계열 설명
3. `generic`: 기존 부위 정의 또는 해당 바이러스의 레이어 이름에서 만드는 안전한 공통 설명

`getStructureExplanation(virusId, target)`은 바이러스에 선언되지 않은 부위·레이어와 알 수 없는 바이러스에는 `null`을 반환한다. 유효한 catalog 대상은 세 계층 중 하나에서 반드시 설명을 얻는다.

## 필드 의미

- `genericSummary`: 해당 구조의 짧은 공통 개념
- `actualName`: 선택한 바이러스에서 사용하는 실제 구조명
- `role`: 그 구조의 핵심 기능
- `location`: 입자 안에서의 위치
- `relationships`: 인접 구조 및 기능적 연결
- `modelRepresentation`: 현재 3D 모델에서 대응하는 기하 표현
- `simplification`: 모델이 생략하거나 줄인 실제 세부
- `evidence`: `observed`, `family-supported`, `conceptual` 중 하나
- `sourceIds`: 구조 근거 registry의 유효한 ID 목록
- `scope`: 조회 결과가 `entry`, `family`, `generic` 중 어느 계층에서 왔는지 표시

## 모델 대응 원칙

- 실제 바이러스에 존재해도 모델에 독립 기하가 없으면 보이는 것처럼 서술하지 않는다.
- 여러 실제 단백질이 하나의 선택 대상에 합쳐졌다면 모두 밝히고 3D에서의 구분 방식을 설명한다.
- `modelRepresentation`은 원자 구조가 아니라 현재 procedural model에서 실제로 선택되는 형태만 서술한다.
- 시각적 완성도와 evidence 수준을 혼동하지 않는다.

## 출처 원칙

- PDB·EMDB·ICTV와 peer-reviewed structural paper를 우선한다.
- 구조 설명의 `sourceIds`는 `STRUCTURE_SOURCES`에서 해석 가능해야 한다.
- 부분 구조 PDB를 전체 입자 원자 모델의 근거로 확대 해석하지 않는다.

## v4.8.1 대표 범위

- SARS-CoV-2
- Influenza A
- HIV-1
- HSV-1
- Ebola virus
- Human adenovirus 5
- Rotavirus RRV
- T4 bacteriophage

각 대표 바이러스는 catalog에 선언된 모든 part와 layer에 entry-specific 설명을 가진다. 나머지 catalog 항목은 family 또는 generic fallback으로 빈 패널 없이 동작한다.

## UI 원칙

선택 카드에는 실제 구조명, 공통 개념과 역할, 위치, 현재 3D 표현을 먼저 보여준다. 구조 관계·단순화·근거·출처는 접힌 보조 영역에 배치해 모바일에서 3D stage를 밀어내지 않는다.

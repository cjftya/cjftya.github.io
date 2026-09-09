# Virus Sim v4.5 Icosahedral & Layered 모델링

## 범위와 원칙

v4.5는 정이십면체를 더 매끈하게 만드는 작업이 아니라 capsid topology, 표면 domain,
vertex 구조와 층의 역할을 읽을 수 있게 만드는 작업이다. 원자 좌표나 정확한 capsomer
화학량론을 복제하지 않으며, PDB·EMDB·ICTV 근거를 화면용 절차 기하로 축약한다.

v4.4 master에서 자동 산출한 geometry-family inventory는 31개다.

| 범위        | 항목 수 | v4.5 rollout | 비고                                         |
| ----------- | ------: | -----------: | -------------------------------------------- |
| Icosahedral |      23 |           23 | MS2·Adenovirus 포함                          |
| Layered     |       8 |            7 | Vaccinia MV는 기존 전용 모델 회귀 보호       |
| 합계        |      31 |           30 | 모든 항목은 명시적 Structural Signature 보유 |

## Generic 감사

| Builder               | 작업 전 | 작업 후 활성 catalog |
| --------------------- | ------: | -------------------: |
| `generic-icosahedral` |      21 |                    0 |
| `generic-layered`     |       6 |                    0 |

두 fallback 함수는 과거 profile 호환과 자료가 부족한 향후 항목을 위해 남겨 두지만 현재
catalog에서는 사용하지 않는다. 기존 `vaccinia` 전용 builder는 v4.5 범위 밖이라 유지한다.

## 구조 계약

`StructuralSignature`에 아래 읽기 가능한 계약을 추가했다.

- shell faceting과 surface pattern
- T=1/T=3/pseudo-T=3/pentamer 중심 capsomer organization
- vertex feature 종류·개수·상대 길이·opening
- layered role, radius scale, faceting, surface pattern, opacity
- inner membrane과 genome segment count

`capsidProfiles.ts`가 30개 rollout 항목을 25개 family/subgroup profile(정이십면체 18,
layered 7)로 묶는다. 종별 수치
fork 대신 기존 `GeometryProfile`의 반지름·단위 수·돌출 길이와 구조 signature를 합성한다.

## 공통 기하

- `IcosahedronGeometry` subdivision vertex를 deduplicate한 deterministic direction set
- 정확한 12개 기본 꼭짓점 direction
- high/low에서 같은 구조 identity를 유지하는 ordered instancing
- faceting별 shell, pentamer, dimple ring, protruding domain, vertex turret helper
- 역할별 shell geometry·opacity·explosion direction
- 분절 유전체와 원형 DNA 표현

Fibonacci 분포는 다른 family의 비정렬 장식과 내부 packing에만 남겼다. v4.5 capsid 표면
단위와 vertex feature는 subdivision/vertex direction을 사용한다.

## Icosahedral 그룹

| 그룹               | 항목                                         | 읽을 수 있는 구조 차이                                  |
| ------------------ | -------------------------------------------- | ------------------------------------------------------- |
| Compact RNA        | MS2, Qβ, AP205, FHV                          | 조밀한 ordered shell, 필요 시 비대칭 maturation protein |
| Vertex-specialized | ΦX174, Adenovirus 5                          | 12개 vertex spike 또는 penton·fiber shaft·knob          |
| Dimple/channel     | AAV2, CPV, PCV2                              | recessed ring, fivefold channel, 작은 compact shell     |
| Pentameric         | HPV16, SV40, MPyV                            | 넓게 분리된 오각 표면 단위                              |
| Protruding         | Norwalk, RHDV, Astrovirus 1                  | raised P-domain 또는 radial star-feature                |
| Plant              | CCMV, BMV, CPMV, TBSV, STMV, CMV, TYMV, CaMV | soft, pseudo-T3, protruding, dense, rounded profile     |

Calicivirus와 Polyomavirus처럼 근거 있는 family 공통 구조는 profile을 공유한다. 색이나 임의의
species 수치만 바꾸는 차별화는 하지 않는다. Astrovirus의 별 모양은 모든 입자의 외곽이 별이라는
주장이 아니라 제한적인 표면 feature 인상으로 유지한다.

## Layered 그룹

| 그룹                | 항목                  | 층 관계와 표면 구조                                  |
| ------------------- | --------------------- | ---------------------------------------------------- |
| Triple dsRNA        | Rotavirus, Bluetongue | porous outer, faceted middle, dense core와 11/10분절 |
| Turreted dsRNA      | Reovirus T3D          | triple capsid와 12개 channelled turret, 10분절       |
| Double dsRNA        | IBDV                  | double capsid와 2분절                                |
| Membrane-containing | PRD1, PM2             | protein capsid 안쪽의 투명 internal membrane         |
| Archaeal turreted   | STIV                  | faceted shell, internal membrane, 넓고 속 빈 turret  |

outer/middle/core/membrane은 단순히 반지름과 색만 다른 구가 아니다. faceting, surface pattern,
opacity와 exploded direction이 서로 다르고, section/transparent에서 내부 관계를 유지한다.

## 표현 한계

- capsomer instance 수는 렌더 예산용 representative count다.
- dimple은 boolean subtraction이 아니라 recessed ring marker다.
- pentamer는 원자 조립체가 아닌 오각 표면 unit이다.
- 분절 유전체는 실제 folding이나 polymerase 배치를 재현하지 않는다.
- CaMV와 PM2의 제한된 고해상도 정보는 명시적 family-supported fallback이다.
- texture, GLTF/OBJ, post-processing과 자동 카메라는 추가하지 않았다.

## 검증 계약

`v4.5-capsids.test.ts`가 inventory, source ID, builder/profile 일치, deterministic direction,
high/low build, finite bounds, part/layer completeness, render budget, 핵심 구조 marker와
surface·transparent·section·exploded·scanner 회귀를 검사한다. v4.4 외피형 대표 모델과
History & Impact lookup도 함께 보호한다.

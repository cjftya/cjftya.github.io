# Virus Sim v4.6 Filament & Special Geometry 모델링

> 현재 generic builder 상태는 v4.7에서 모두 제거된 뒤 v4.8에서 재검증됐다.
> 최종 상태는 [`virus-sim-v4.8-generic-final-audit.md`](virus-sim-v4.8-generic-final-audit.md)를 따른다.

## 범위와 원칙

v4.6은 길쭉한 입자를 더 복잡한 원통으로 만드는 작업이 아니라 rigidity, centerline, helical
coat, channel, genome path, terminal structure와 특수 윤곽을 읽을 수 있게 만드는 작업이다.
형태 변화는 고정된 대표 입자 상태이며 자동 흔들림이나 근거 없는 종별 굽힘은 추가하지 않았다.

master catalog에서 geometry family와 전용 builder를 함께 조회한 rollout inventory는 17개다.

| 구조군                      | 항목                                |  수 |
| --------------------------- | ----------------------------------- | --: |
| Rigid/semi-flexible helical | TMV, M13                            |   2 |
| Plant filament              | PVX, PapMV, PVY                     |   3 |
| Filovirus                   | EBOV, SUDV, BDBV, TAFV, RESTV, BOMV |   6 |
| Archaeal rod                | SIRV2                               |   1 |
| Spindle                     | SSV1, ATV                           |   2 |
| Geminate                    | MSV, TYLCV                          |   2 |
| Pox-like complex            | Vaccinia MV                         |   1 |

## Generic 감사

| Builder            | 작업 전 | 작업 후 활성 catalog |
| ------------------ | ------: | -------------------: |
| `generic-filament` |       3 |                    0 |
| `generic-rod`      |       1 |                    0 |
| `generic-spindle`  |       2 |                    0 |
| `generic-geminate` |       2 |                    0 |

fallback 함수와 builder ID는 과거 profile 호환과 자료가 부족한 향후 항목을 위해 유지하지만,
현재 catalog의 v4.6 대상은 모두 명시적 family builder와 structural signature를 사용한다.

## 구조 계약

`StructuralSignature`에 아래 계약을 추가했다.

- rigidity: rigid, semi-flexible, flexible
- centerline archetype: straight, gentle-bend, flexible-s
- body length/radius/pitch/strand count
- helical coat organization과 unit shape
- central channel과 genome path
- start/end/both terminal structure의 종류·개수·상대 길이
- spindle, rod, geminate, brick body와 내부 구조

`specialGeometryProfiles.ts`는 17개 항목을 근거 범위에 맞는 11개 family/subgroup profile로
묶는다. Filovirus 6종과 Geminivirus 2종은 확인되지 않은 종별 외형 차이를 만들지 않고 각각
공통 profile을 공유한다. `evidenceStatus`와 기존 source ID는 시각 품질과 무관하게 유지한다.

## 공통 기하

- deterministic straight/gentle/flexible centerline 생성
- tangent·normal·binormal을 연속 전달하는 parallel-transport-like frame
- 굽은 centerline을 따르는 instanced helical coat
- helical/central/centerline-following genome path
- endpoint tangent에 맞춘 cap, protein cluster, fiber, tail
- lathe profile 기반 tapered spindle body
- subdivision direction 기반 geminate capsomer lattice
- subdivided box vertex를 둥글게 투영한 Vaccinia brick membrane

high/low는 sample, radial segment와 instance 수만 줄이며 핵심 구조는 유지한다. 모든 반복 배치는
결정적이며 `Math.random`을 사용하지 않는다.

## 구조군별 표현

| 구조군         | 읽을 수 있는 차이                                                                  |
| -------------- | ---------------------------------------------------------------------------------- |
| TMV            | 굵고 단단한 straight rod, ordered helical coat, 열린 중심 채널, coat 안쪽 RNA      |
| M13            | 매우 가는 semi-flexible filament, axial ssDNA, 서로 다른 양끝 단백질 assembly      |
| Plant filament | PVX의 넓은 flexible helix, PapMV의 굵은 ring-like coat, PVY의 가는 potyvirus helix |
| Filovirus      | 굽은 지질 외피, matrix, 내부 나선 RNP, centerline frame을 따르는 GP                |
| SIRV2          | rigid rod coat와 양끝 세 갈래 terminal fiber, 중심 선형 DNA                        |
| SSV1 / ATV     | tapered fusiform body와 한쪽 fiber crown / 양쪽 긴 tail                            |
| Geminivirus    | 두 faceted lobe, 공유 interface, 두 lobe에 연결된 원형 ssDNA 관계                  |
| Vaccinia       | rounded layered brick, dumbbell core wall, paired lateral bodies, core genome      |

## 상호작용과 성능

outer surface와 내부 genome/RNP에는 서로 다른 exploded direction을 사용한다. terminal structure는
긴 body axis에서 과도하게 멀어지지 않도록 제한한다. part/layer 등록은 transparent, section,
exploded, picking, genome/layer toggle과 scanner가 동일한 구조 계약을 사용하게 한다.

나선 피복과 GP는 `InstancedMesh`를 사용하고 body와 genome은 제한된 `TubeGeometry` segment를
사용한다. 독립 mesh 수가 filament 길이에 비례해 늘어나지 않도록 구성했다.

## 표현 한계

- 실제 contour length와 분자 반복 수는 화면 및 성능 예산에 맞춰 축약했다.
- flexibility는 정적 대표 centerline이며 물리 운동이나 종별 성질 예측이 아니다.
- Filovirus 6종은 family-level particle model을 공유한다.
- terminal protein과 fiber는 원자 구조가 아닌 방향·개수 관계 표현이다.
- Geminivirus lobe는 완전한 원자 capsomer lattice가 아닌 faceted family model이다.
- Vaccinia membrane의 둥근 능선과 내부층은 texture 없는 절차 기하다.

## 검증 계약

`v4.6-special-geometry.test.ts`가 inventory, source와 profile 연결, deterministic centerline,
frame 직교성, endpoint tangent, high/low build, finite bounds, part/layer completeness, 구조 marker,
render budget과 surface·transparent·section·exploded·scanner 흐름을 검사한다. v4.4 외피형과
v4.5 capsid 대표 모델, History & Impact mapping도 함께 보호한다.

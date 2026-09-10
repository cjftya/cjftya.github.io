# Virus Sim v4.7 Phage Family 모델링

## 범위와 inventory

v4.7은 파지의 장식 수를 늘리는 대신 head–tail architecture가 구조적 정체성을 설명하도록
고도화했다. `phage` morphology tag를 기준으로 한 전체 inventory는 16개다. 이 가운데 고전적
head–tail 구조 8개를 새 phage signature로 이관했고, 이미 전용 형태를 가진 8개는 기존 builder를
유지했다.

| 구분                   | 항목                                      |  수 |
| ---------------------- | ----------------------------------------- | --: |
| v4.7 head–tail rollout | T4, Lambda, T7, Φ29, P22, HK97, T5, T1    |   8 |
| 기존 특수형 유지       | MS2, M13, ΦX174, Qβ, PRD1, Φ6, PM2, AP205 |   8 |
| 합계                   | 전체 phage-tag catalog                    |  16 |

MS2·ΦX174·Qβ·AP205는 꼬리 없는 capsid 계열, M13은 filament, PRD1·PM2는 내부막 layered
capsid, Φ6는 외피형이다. 이들을 일반 head–tail builder로 되돌리지 않았다.

## Structural Signature

`PhageStructuralSignature`는 다음 구조를 독립된 계약으로 표현한다.

- head: isometric/prolate/elongated, 반경, 신장률, 표면 패턴, capsomer 수
- connector: portal 존재와 scale, simple/ringed/collar neck
- tail: contractile/long-noncontractile/short/minimal, 길이·반경·강성, sheath와 inner tube
- distal end: simple/hexagonal/contractile baseplate, tail fiber 또는 tailspike의 수·길이·분절

profile은 catalog 항목, builder, source-backed evidence와 직접 연결된다. HK97은 Head II 구조는
observed, 화면에 남긴 최소 꼬리는 conceptual로 분리해 근거 수준을 과장하지 않았다.

## 공용 구조 시스템

head와 tail은 같은 단일 scale에 묶지 않고 connector를 기준으로 별도 축과 길이를 계산한다.
head 표면은 v4.5의 ordered icosahedral direction과 faceted shell을 재사용하며, prolate 항목은
배치 좌표까지 head 신장률을 반영한다. 긴 비수축형 꼬리는 v4.6의 deterministic centerline과
parallel-transport-like frame을 재사용한다.

공용 컴포넌트는 다음을 생성한다.

- faceted isometric/prolate head와 ordered capsomer
- packed dsDNA 개념 곡선
- portal과 simple/ringed/collar neck
- instanced sheath ring과 독립 inner tube
- rigid/semi-flexible/flexible noncontractile tube
- compact short-tail nozzle
- simple hub, hexagonal plate, contractile baseplate
- 얇은 분절 tail fiber와 짧고 굵은 tailspike

반복 sheath와 capsomer는 `InstancedMesh`를 사용한다. high/low는 segment와 instance 수만 줄이고
head shape, tail type, portal, baseplate, receptor 종류는 유지한다. 모든 배치는 결정적이며
감염·DNA 주입·꼬리 수축 animation이나 물리 simulation은 추가하지 않았다.

## 구조군별 표현

| 구조군 | 화면에서 읽히는 핵심 차이                                                           |
| ------ | ----------------------------------------------------------------------------------- |
| T4     | prolate head, stacked contractile sheath, inner tube, 복합 baseplate, 긴 분절 fiber |
| Lambda | isometric head, 굽은 긴 비수축형 꼬리, 작은 distal hub와 fiber                      |
| T7     | 큰 head 바로 아래 portal, 짧은 nozzle과 짧은 fiber                                  |
| Φ29    | elongated/prolate head, 작은 portal과 가는 짧은 꼬리                                |
| P22    | 짧은 꼬리 허브와 여섯 개의 굵은 tailspike                                           |
| HK97   | 얇은 crosslinked capsid 표면 중심, 단순 collar와 최소 꼬리                          |
| T5     | 긴 semi-flexible tube, collar, hexagonal distal complex와 분절 fiber                |
| T1     | T5보다 작은 head와 가는 긴 tube, compact hub와 짧은 비분절 fiber                    |

색을 제외해도 contractile long-tail, flexible/noncontractile long-tail, short-tail,
tailspike-dominant, prolate-head 구조가 서로 다른 marker와 비율을 갖는다.

## 상호작용·성능·한계

head, connector, tail, baseplate, receptor, genome은 catalog part/layer 계약에 등록된다. 따라서
surface, transparent, section, exploded, genome/layer toggle, picking과 scanner가 같은 구조를
사용한다. head·tail·distal·genome은 서로 다른 exploded direction을 사용해 긴 축에서도 과도한
분리를 피했다.

모델은 원자 좌표 재현이 아니라 구조 근거를 보존한 절차적 관찰 모델이다. capsomer와 sheath
반복 수, 꼬리 길이 비율과 fiber domain은 화면·성능 예산에 맞춰 축약했다. P22 ejection protein,
T5/T1 distal 단백질의 분자 세부, HK97 꼬리의 세부는 표현하지 않는다.

자동 검증은 8개 rollout 항목의 source/signature 수치, portal 관계, 구조 marker, high/low bounds,
part/layer completeness와 48 draw-call-equivalent·250K triangle 예산을 검사한다. 대표 5종은
surface·transparent·section·exploded·scanner 흐름을 별도로 보호한다.

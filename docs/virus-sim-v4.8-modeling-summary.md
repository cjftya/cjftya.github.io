# Virus Sim v4.8 통합 모델링 요약

## 제품 경계

Virus Sim은 71개 바이러스 입자의 구조적 차이와 실제 맥락을 보여주는 절차적 3D 관찰 도구다.
원자 좌표 뷰어, 감염 simulation, 분자 동역학 또는 실제 크기 비교기는 아니다. v4.8은 새로운
형태군이나 mode를 추가하지 않고 v4.3~v4.7의 모델링 체계를 하나의 검증 계약으로 통합한다.

## 데이터에서 화면까지

```text
Catalog definition
  → Structural Signature / Geometry Profile
  → typed ModelBuilder registry
  → shared family components
  → ObservationModel part/layer contract
  → SpecimenView / ScannerRenderer
```

- Catalog는 identity, taxonomy 표시, 설명, part/layer, source와 표현 한계를 소유한다.
- Structural Signature는 외피·표면 단백질·캡시드 topology·층·유전체 조직·특수 구조를 설명한다.
- Geometry Profile은 화면용 기본 반경과 반복 예산을 제공하며 signature의 의미를 대신하지 않는다.
- Builder는 UI나 History를 import하지 않고 동일한 `ObservationModel` 계약을 만든다.
- History는 catalog ID와 source registry만 사용하며 Three.js에 의존하지 않는다.

## 구조군별 최종 상태

| Geometry family | 항목 수 | 핵심 표현                                                  |
| --------------- | ------: | ---------------------------------------------------------- |
| Enveloped       |      16 | 외피, 표면 단백질, matrix/tegument, capsid 또는 RNP        |
| Icosahedral     |      23 | faceting, ordered capsomer, vertex feature, surface domain |
| Layered         |       8 | 역할이 다른 다중 shell, 내부막, core와 분절 유전체         |
| Filament        |      11 | rigidity, centerline, helical coat, channel과 genome path  |
| Phage           |       8 | 독립 head·connector·tail·distal architecture               |
| Geminate        |       2 | 두 capsid lobe와 공유 interface                            |
| Spindle         |       2 | fusiform body와 한쪽/양쪽 terminal structure               |
| Rod             |       1 | rigid coat, 양끝 섬유와 축 방향 genome                     |
| 합계            |      71 | 모든 항목에 명시적 signature와 builder 존재                |

Vaccinia는 geometry inventory에서는 layered로 집계하지만 special brick builder를 사용한다.
MS2·ΦX174·Qβ·AP205 같은 꼬리 없는 파지는 phage tag를 가질 수 있어도 geometry family는
icosahedral이다. 분류 tag와 렌더 geometry family를 같은 값으로 해석하지 않는다.

## 근거 정책

- `observed`: 해당 입자 또는 직접 구조 자료가 핵심 표현을 지지한다.
- `conceptual`: 같은 계열의 형태와 제한된 종별 자료를 결합한다.
- 모델이 보기 좋아졌다는 이유로 evidence level을 올리지 않는다.
- family가 공유하는 실제 similarity는 유지하고, 출처 없는 종별 차이는 만들지 않는다.
- 모든 evidence component는 structure source ID를 가지며 UI에 표현 범위와 simplification을 함께 표시한다.

현재 71개 중 59개는 `observed`, 12개는 `conceptual`이다. conceptual 항목은 필로바이러스 5종,
HIV-2, SARS-CoV-2를 제외한 사람 코로나바이러스 6종이다.

## High / Low 품질

두 품질은 같은 structural identity, part와 layer를 유지한다. Low는 subdivision, tube segment와
instance 수만 낮춘다. 핵심 shell, genome, terminal structure 또는 family marker를 제거하지 않는다.
v4.8 회귀 상한은 모델 하나당 64 objects, 48 geometries, 32 materials, 75,000 triangles다.

측정된 high outlier는 PVY 36,852 triangles, M13 34,288, PapMV 32,400이다. 최대 object와 geometry는
T4의 33/29, 최대 material은 Rotavirus·Reovirus의 17이다. 모두 상한보다 충분히 낮고 low triangle
수는 같은 항목의 high 이하로 검증한다.

## Part / Layer / mode 계약

- Part는 picking과 설명의 단위이며 catalog 선언과 model registry가 정확히 일치한다.
- Layer는 visibility 단위이며 part와 목적을 구분한다.
- genome은 part이면서 genome layer에 등록되고 별도 toggle과 layer toggle을 모두 따른다.
- transparent는 outer surface의 depth write와 opacity를 일관되게 낮춘다.
- section과 scanner는 실제 model material에 clipping plane을 적용하고 반드시 원복한다.
- exploded는 object와 instance의 원점·방향·거리를 모델 계약에 보관한다.

## 성능과 자원 수명

반복 capsomer, spike, coat protein과 phage sheath는 가능한 경우 `InstancedMesh`를 사용한다.
geometry와 material은 model 내부에서 재사용하되 model 간 mutable resource는 공유하지 않는다.
종 또는 품질을 바꾸면 이전 `SpecimenView`가 소유한 고유 geometry와 material을 정확히 한 번
dispose한다. scanner render target, particle resource, listener와 renderer는 앱 종료 시 정리한다.

v4.8 자동 감사는 71종 × high/low 142개 빌드, 전체 mode·part·layer, scanner 3축의 양끝/중앙,
dispose event와 재생성을 한 번에 검사한다.

## 알려진 한계

- 실제 virion의 pleomorphism 가운데 대표 specimen 하나를 고정한다.
- capsomer와 표면 단백질 반복 수는 실제 화학량론이 아니라 브라우저 렌더 예산에 맞춘다.
- genome 곡선은 서열·원자 packing을 재현하지 않는다.
- 일부 종은 직접 whole-particle 구조가 없어 family-level conceptual model을 사용한다.
- WebGL이 비활성화된 환경에서는 catalog와 History shell을 유지하지만 3D 상호작용은 사용할 수 없다.

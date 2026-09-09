# Virus Sim v4.3 모델링 규격

## Structural Signature

`StructuralSignature`는 기존 `GeometryProfile` 위에 놓이는 구조 의미 계약이다. 반지름이나
돌기 수만으로 모델 정체성을 만들지 않고 다음 정보를 명시한다.

- 외피 형태와 구조 층
- 여러 종류의 표면 구성 요소와 상대 밀도
- 유전체·RNP 조직 방식
- 계열을 구별하는 특수 구조
- 구성 요소 근거 수준과 structure source ID

`ModelCollector`는 선택한 catalog ID의 signature를 읽고 root metadata에 ID를 기록한다.
History 데이터와 Three.js 모델은 서로 import하지 않는다.

## 재사용 컴포넌트

`rendering/models/components.ts`는 family builder가 공유하는 중간 크기 API를 제공한다.

- `createLipidEnvelope`: high/low tessellation을 보존하는 구형 외피
- `createMatrixShell`: 외피 안쪽 matrix shell
- `createSurfaceProteinInstances`: club·cone·knob·channel 표면 구성 요소
- `createSegmentedRnp`: 분절 RNP 묶음
- `createConicalCore`: lentivirus 성숙 core

반복 표면 단백질은 `InstancedMesh`로 만들고 기존 collector의 part/layer, clipping,
transparent, exploded lifecycle에 등록한다. 컴포넌트마다 별도 material을 무한 생성하거나
virus ID 조건문을 family builder에 누적하지 않는다.

## 대표 8종

| 바이러스      | 구조 시그니처                                            |
| ------------- | -------------------------------------------------------- |
| SARS-CoV-2    | S, 짧은 M형 돌기, 희소 E형 채널, matrix, helical N-RNA   |
| Influenza A   | HA, NA, 희소 M2, matrix, 8개 RNP                         |
| HIV-1         | 희소 Env, matrix, 원뿔형 capsid, 한 쌍의 RNA 표현        |
| Ebola virus   | 필라멘트 외피, GP, matrix, 중심선을 따르는 helical RNP   |
| Adenovirus 5  | capsomer, 12개 penton과 fiber, packed DNA                |
| Rotavirus RRV | outer·middle·core capsid, VP4형 돌기, 11개 RNA 분절      |
| T4 phage      | prolate head, neck, sheath, inner tube, baseplate, fiber |
| TMV           | rigid helical coat, central channel, coat 안쪽 RNA       |

## 품질·등록 규칙

- low에서도 계열을 구별하는 구성 요소를 제거하지 않고 instance와 segment 수만 줄인다.
- 모든 선택 가능 객체는 definition에 선언된 part와 layer에 등록한다.
- section clipping material, surface opacity, exploded origin과 genome toggle 계약을 유지한다.
- visible bounds는 finite·non-zero여야 하고 장식 객체는 camera bounds에서 제외한다.
- 새 시그니처의 evidence source ID는 structure source registry에 존재해야 한다.

## 이후 확장

v4.4 이후에는 family별 catalog entry에 signature를 추가하고 기존 컴포넌트를 조합한다.
새 builder는 실루엣이나 조립 관계가 근본적으로 다를 때만 만든다. 고폴리곤화, 외부 3D asset,
원자 좌표 전체 렌더링은 이 계약의 목표가 아니다.

# Virus Sim v4.5

Virus Sim은 71개 바이러스의 형태와 주요 구조를 한 화면에서 관찰하는 3D 구조 뷰어다.
바이러스를 native dropdown에서 선택하면 해당 표본을 stage 중앙에 다시 맞추고, 마우스와
터치 제스처로 직접 회전·이동·확대할 수 있다. 각 항목에는 발견 맥락, 숙주, 실제 영향과
현재 의미를 출처와 함께 제공한다.

## 현재 기능

- 71개 바이러스 구조와 항목별 근거 링크
- 71개 바이러스의 History & Impact 데이터와 별도 근거 링크
- 외관, 반투명, 단면, 분해 보기
- 유전체와 구조 레이어 표시 전환
- 3D picking과 부위 설명
- 정규화된 축·위치·두께를 사용하는 단층 scanner
- PNG 저장, 렌더 품질, 글자 크기 설정
- 작고 느린 단일 배경 입자 layer
- WebGL context 중단 안내와 복구
- 23개 외피형 항목 전체의 명시적 Structural Signature
- Coronavirus 4개 subgroup profile과 HBV·Alphavirus·Cystovirus 전용 builder
- 재사용 가능한 외피·표면 단백질·matrix·capsid·RNP 절차 컴포넌트
- 23개 정이십면체와 7개 layered 항목의 명시적 구조 topology
- subdivision 기반 ordered capsomer와 vertex-aware fiber·spike·turret 배치
- dimpled, pentameric, protruding-domain, plant T=3 계열 표면 profile
- 역할·표면·투명도가 다른 layered shell과 분절 유전체·내부 막 표현

## 앱 구조

```text
UI → ObservationStore → SceneRenderer → SpecimenView / Scanner / Particles
```

UI는 Three.js 객체를 직접 수정하지 않는다. `ObservationStore`가 직렬화 가능한 관찰 상태를
소유하고, `SceneRenderer`는 그 snapshot을 받아 단일 scene과 camera를 갱신한다. 렌더러는
stage의 실제 크기를 먼저 camera에 반영한 뒤 표본의 보이는 world bounds 중심과 bounding
sphere를 사용해 framing한다. 화면 방향이 바뀌면 새 aspect로 다시 맞춘다.

문서는 브라우저 body 하나만 스크롤한다. stage 내부 canvas만 크기를 제한하며 도구 panel이나
목록에는 별도의 세로 스크롤을 만들지 않는다.

History 데이터는 렌더링을 모르며 catalog ID로만 선택 항목과 연결된다. 구조 시그니처는
`GeometryProfile`을 대체하지 않고 표면 단백질 종류, 층 관계, 유전체 조직과 특수 구조를
상위 계약으로 보완한다.

## 구조 근거와 표현 한계

모델은 PDB·EMDB 구조 항목과 ICTV 형태 설명을 바탕으로 전체 윤곽, 층 관계와 대표 부위를
절차 기하로 재구성한다. 원자 좌표를 그대로 렌더링하거나 감염성·물성·변이 결과를 예측하지
않는다. 항목별 자료 범위는 UI의 `구조 근거와 표현 한계`와 아래 문서에 기록한다.

- [v2 구조 출처](virus-sim-v2-sources.md)
- [v2.5 확장 출처](virus-sim-v2.5-sources.md)
- [v4.3 History 출처](virus-sim-v4.3-history-sources.md)
- [v4.3 모델링 규격](virus-sim-v4.3-modeling.md)
- [v4.4 외피형 rollout](virus-sim-v4.4-modeling.md)
- [v4.5 Icosahedral·Layered rollout](virus-sim-v4.5-modeling.md)

## 검증

변경 전후에 `npm run lint`, `npm run test`, `npm run build`를 실행한다. 모바일은 360×800,
390×844, 412×915, 430×932에서 stage 중심, dropdown, document scroll과 control clipping을
확인하고, 데스크톱은 1366×768, 1440×900, 1920×1080에서 같은 흐름을 확인한다.

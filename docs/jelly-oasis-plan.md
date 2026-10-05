# Jelly Oasis — Astra High / Work 실행 계획

## 1. 프로젝트 목적

Jelly Oasis는 `cjftya.github.io` 안에 독립 경로로 배포하는 Three.js 기반 판타지 생태 공간입니다.

이번 작업 단계의 목표는 **환경 오브젝트를 만들기 전에 큰 지형 자체를 완성하는 것**입니다.  
태양의 시간 변화, 날씨, 구름, 폭포, 나무, 바위, 판타지 생물은 지형 승인 이후 별도 단계로 진행합니다.

경로:

- 개발 엔트리: `/projects/jelly-oasis/`
- 코드: `src/jelly-oasis/`
- 작업 브랜치: `feature/jelly-oasis-foundation`

## 2. 현재 고정 방향

- Three.js 사용.
- 기존 저장소의 Vite/TypeScript 빌드 체계를 그대로 사용.
- Blender MCP는 이후 나무, 바위, 절벽 모듈, 동굴, 판타지 생물 등 개별 자산 제작에 사용.
- 최종 결과는 GitHub Pages에서 실행.
- 스타일 방향은 My Oasis와 Tiny Glade 사이의 감성적인 판타지 자연 공간.
- 텍스처는 기본 표현 수단으로 남발하지 않음.
- geometry, material color, vertex color, shader를 우선하고 텍스처가 명백히 효율적인 경우만 제한적으로 사용.
- 지나친 high-poly 모델링 금지.
- 생물/충돌/AI는 현재 범위에서 제외.

## 3. 현재 지형 기준선

초기 terrain foundation은 다음 예산으로 시작합니다.

| 항목 | 기준 |
| --- | --- |
| 기본 월드 크기 | 320 × 320 world units |
| 지형 분할 | 80 × 80 |
| 지형 triangles | 약 12,800 |
| 지형 텍스처 | 없음 |
| 지형 생성 | deterministic procedural height |
| 중앙부 | 비교적 평탄 |
| 외곽부 | 완만한 고저차 |
| 런타임 재생성 | 하지 않음 |
| Renderer DPR | 기존 RendererManager 정책 사용 |
| Shadow map | 개발 기준 1024² |

이 수치는 최종 스펙이 아니라 **성능을 잃지 않고 형태를 논의하기 위한 시작점**입니다.

월드 면적을 확대할 때 세그먼트 수를 같은 비율로 올리지 않습니다.  
시각적으로 필요한 경우에만 geometry density를 늘립니다.

## 4. Astra High가 우선 수행할 작업

### Phase A — 현재 기반 검증

1. 저장소 구조와 기존 Three.js renderer 정책을 확인한다.
2. `/projects/jelly-oasis/`가 Vite 멀티 엔트리에서 독립적으로 빌드되는지 확인한다.
3. `npm ci`, `npm run build`, `npm run lint`, 관련 테스트를 실행한다.
4. 기존 Jelly Plants, Viola, Uriel, Virus Sim에 회귀가 없는지 확인한다.

### Phase B — 지형 형태 설계

지형을 곧바로 세밀하게 만들지 말고 큰 silhouette부터 결정한다.

우선순위:

1. 넓은 평탄 지역 확보.
2. 매우 완만한 고저차로 공간을 여러 영역으로 암시.
3. 향후 높은 지역, 폭포 시작점, 연못/분지, 동굴 지역을 넣을 수 있는 여유 확보.
4. 카메라를 낮춰도 horizon이 지나치게 단조롭지 않도록 큰 형태를 만든다.
5. 작은 노이즈로 표면을 거칠게 만드는 방식은 지양한다.

최종 목표는 “noise terrain”처럼 보이는 땅이 아니라 **의도적으로 조형된 자연 지형**입니다.

### Phase C — 지형 편집 구조

현재 procedural 생성 코드를 유지하되 다음 작업을 쉽게 만들 수 있게 한다.

- `TerrainConfig`에서 크기와 밀도를 독립적으로 변경 가능.
- deterministic seed 유지.
- 높이 생성 로직과 Three.js mesh 생성 책임 분리 가능성 검토.
- 필요해지면 수동 landmark 함수 또는 mask를 추가할 수 있는 구조 유지.
- 한 프레임마다 height를 다시 계산하지 않음.
- physics/navmesh dependency 추가 금지.

지형이 더 커져 실제 카메라 탐색 범위가 크게 확장될 경우에만 chunking을 검토합니다.  
처음부터 chunk system을 만들지 않습니다.

### Phase D — 카메라와 검수 도구

지형 판단을 위한 최소한의 카메라만 둡니다.

- orbit/pan/zoom 가능.
- 지형 밖으로 카메라가 과도하게 빠지지 않게 제한.
- 모바일 입력 지원.
- 필요하면 개발 전용 wireframe 또는 geometry stats 토글을 추가하되 사용자 UI로 굳히지 않음.

## 5. 명시적 비범위

지형 승인 전에는 다음을 구현하지 않습니다.

- 낮/밤 시간 시스템
- procedural sky
- 구름
- 비/눈/안개 등 날씨 시스템
- 물/강/폭포 shader
- Blender GLB 자산
- 나무/돌/바위/풀
- 동굴 세부 모델
- 생물
- 리깅/애니메이션
- 충돌/physics
- navmesh/pathfinding
- 저장 시스템
- 꾸미기 UI

지형 단계에서 미래 기능을 위한 대규모 추상화도 만들지 않습니다.

## 6. 최적화 원칙

### Geometry

- 큰 월드라는 이유만으로 polygon density를 높이지 않는다.
- 반복될 나무/바위/식생은 이후 Blender 자산 + instancing을 전제로 한다.
- 큰 지형 형태는 terrain이 담당하고, 복잡한 절벽/암벽 디테일은 이후 모듈 자산이 담당한다.
- 작은 표면 디테일을 geometry로 무리하게 표현하지 않는다.

### Material / Texture

- terrain foundation은 texture 0장을 유지한다.
- material 수를 최소화한다.
- 향후 색 변화는 vertex color 또는 shader를 우선 검토한다.
- 텍스처 사용은 효과 대비 비용이 명백히 유리할 때만 허용한다.

### Runtime

- 렌더 루프에서 terrain geometry를 재생성하지 않는다.
- 불필요한 매 프레임 객체 할당을 피한다.
- pixel ratio 상한을 유지한다.
- 그림자는 중요 오브젝트 중심으로 제한할 계획을 유지한다.
- 개발 단계부터 draw call과 triangle count를 확인할 수 있게 한다.

## 7. 완료 조건

지형 단계 완료로 판단하려면 아래를 모두 만족해야 합니다.

1. `/projects/jelly-oasis/`가 직접 접속 가능하다.
2. 데스크톱과 모바일 viewport에서 canvas가 정상 resize된다.
3. 콘솔 오류가 없다.
4. 지형이 넓게 느껴지지만 불필요하게 촘촘한 mesh가 아니다.
5. 넓은 평탄 공간과 완만한 고저차가 동시에 존재한다.
6. 이후 폭포/연못/동굴/숲을 배치할 공간이 읽힌다.
7. noise를 뿌린 것 같은 무작위 지형이 아니라 의도된 큰 형태를 갖는다.
8. 기본 terrain은 약 15k triangles 이하를 우선 목표로 한다.
9. texture 없이도 조명만으로 형태를 판단할 수 있다.
10. 기존 프로젝트의 빌드/페이지에 회귀가 없다.

## 8. 지형 승인 이후 순서

지형을 승인한 뒤에만 환경 시스템으로 이동합니다.

1. 태양과 시간대.
2. sky / atmosphere.
3. 구름.
4. 날씨 상태.
5. 안개와 원거리 대기감.
6. 물과 폭포.
7. Blender MCP 오브젝트 제작.
8. 판타지 생물.

## 9. Work에 줄 핵심 지시

Astra High는 한 번에 완성된 세계를 만들려고 하지 않습니다.

**지금은 지형 하나만 완성합니다.**

작업 중 새로운 기능 아이디어가 생기더라도 지형의 구조·성능·형태 완성에 직접 필요하지 않으면 구현하지 말고 후속 작업 항목으로 남깁니다. 특히 고해상도 terrain, 무거운 procedural 시스템, physics, 대규모 engine abstraction을 선제적으로 추가하지 않습니다.

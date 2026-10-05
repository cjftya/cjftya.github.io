# Jelly Oasis — Environment System / Astra High / Work 실행 계획

## 0. 이번 작업의 한 줄 목표

**지형 v1은 그대로 유지하고, 아무 오브젝트가 없어도 낮·노을·밤·구름·날씨 변화만으로 Jelly Oasis의 분위기가 살아나는 환경 시스템을 완성한다.**

이번 작업에서는 Blender를 사용하지 않는다.

---

## 1. 작업 기준

저장소:

- `https://github.com/cjftya/cjftya.github.io.git`
- 프로젝트 경로: `/projects/jelly-oasis/`
- 소스 경로: `src/jelly-oasis/`

현재 기준 지형:

- 320 × 320 world units
- 80 × 80 cells
- terrain surface 약 12,800 triangles
- cut edge 포함 약 13,440 triangles
- texture 0장
- vertex color 기반
- 중앙 평탄 지형 + 북쪽 고지대 + 서쪽 능선 + 동쪽 분지 + 남쪽 완만한 상승부
- `heightfield.ts`에서 deterministic height sampling
- `createTerrain.ts`에서 geometry / vertex color 생성

현재 `master`의 지형 foundation을 기준으로 시작한다.
작업 시작 전 반드시 최신 `master`를 다시 pull/fetch해서 기준 커밋이 바뀌었는지 확인한다.

권장 작업 브랜치:

`feature/jelly-oasis-environment`

검증 완료 후 `master` 반영을 준비한다.

---

## 2. 이번 단계의 핵심 방향

Jelly Oasis는 현실적인 기상 시뮬레이터가 아니다.

목표는:

- 물리적으로 완벽한 하늘보다 **감성적으로 좋은 하늘**
- 실제 천문 계산보다 **보기 좋은 태양 이동**
- volumetric cloud보다 **가볍고 스타일라이즈드한 구름**
- 복잡한 후처리보다 **색, 조명, 안개, 움직임의 조합**
- 고비용 효과보다 **웹에서 안정적으로 유지되는 표현**

스타일 방향:

- My Oasis의 편안하고 살아 있는 자연 공간
- Tiny Glade의 부드러운 조명과 대기감
- Jelly Plants에서 사용했던 geometry 중심 감성의 확장판
- texture에 의존하지 않는 스타일

기본 표현 우선순위:

1. geometry
2. vertex color
3. material color
4. procedural shader
5. 정말 필요한 경우에만 texture

---

## 3. 명시적 비범위

이번 환경 단계에서는 아래 작업을 하지 않는다.

- Blender MCP
- 나무
- 바위 / 절벽 모듈
- 풀 / 꽃 / 식생
- 동굴 세부 모델
- 강 / 연못 / 폭포
- 생물
- 리깅
- 생물 애니메이션
- 충돌
- physics
- navmesh
- pathfinding
- 꾸미기 시스템
- 저장 시스템
- volumetric cloud
- volumetric lighting
- 실시간 유체 시뮬레이션
- 실제 기상 데이터 연동
- 실제 위치 기반 천문 계산
- 대규모 post-processing stack

지형 형태 자체도 특별한 문제를 발견하지 않는 한 수정하지 않는다.

---

## 4. 환경 시스템의 단일 상태 모델

환경 기능을 서로 독립된 효과로 흩어놓지 않는다.

하나의 환경 상태를 기준으로:

- 태양
- 하늘
- ambient / hemisphere lighting
- fog
- 구름
- 비
- 별 / 밤 표현

이 함께 반응하도록 만든다.

권장 개념:

```ts
interface EnvironmentState {
  timeOfDay: number; // 0 <= value < 24
  weather: WeatherPreset;
  weatherBlend: number;
}
```

필요하면 내부적으로 파생 상태를 계산한다.

```ts
interface EnvironmentFrame {
  sunElevation: number;
  sunAzimuth: number;
  sunIntensity: number;
  sunColor: Color;

  skyZenithColor: Color;
  skyHorizonColor: Color;

  ambientIntensity: number;
  fogColor: Color;
  fogDensity: number;

  cloudCoverage: number;
  cloudBrightness: number;
  rainIntensity: number;
}
```

중요:

- `EnvironmentState`는 단순하고 직렬화 가능한 값 중심.
- Three.js 객체를 상태 객체 안에 넣지 않는다.
- 실제 `DirectionalLight`, `ShaderMaterial`, `Fog`, cloud mesh 등은 renderer/controller가 소유한다.
- 지금 단계에서 범용 게임 엔진식 abstraction은 만들지 않는다.

---

## 5. Phase A — 기존 기반 검증

작업을 시작하자마자 환경 구현부터 하지 않는다.

먼저:

1. 최신 `master` 확인.
2. `/projects/jelly-oasis/` 정상 실행 확인.
3. 기존 terrain debug 모드 확인.
4. 현재 triangle / draw call / DPR 기준 기록.
5. `npm ci`
6. `npm run lint`
7. `npm test`
8. `npm run build`
9. GitHub Pages용 build output에서 Jelly Oasis가 legacy copy에 의해 덮어써지지 않는지 확인.

기존 environment foundation을 깨뜨리지 않는 것이 우선이다.

---

## 6. Phase B — Time System

가장 먼저 `timeOfDay`를 만든다.

범위:

`0.0 ~ 24.0`

예:

- 05:00 전후: 새벽
- 07:00 전후: 아침
- 12:00: 낮
- 17:00~19:00: 노을
- 20:00 이후: 밤
- 00:00: 깊은 밤

실제 지구 천문 공식을 그대로 구현하지 않는다.

대신 keyframe / curve 기반으로:

- 태양 높이
- 태양 방향
- 태양 밝기
- 태양 색
- ambient 강도
- sky 색
- fog 색

을 결정한다.

### 필수 요구

- 시간은 자동 진행 가능.
- 개발 중에는 pause 가능.
- 개발 중에는 `timeOfDay`를 즉시 변경 가능.
- cycle speed는 config로 분리.
- 최종 cycle duration은 하드코딩된 게임 규칙으로 고정하지 말고 조정 가능하게 유지.
- `document.hidden` 상태에서는 불필요한 진행/렌더링을 줄인다.
- `prefers-reduced-motion` 사용자는 빠른 자동 변화가 강제되지 않게 한다.

시간 계산은 가능한 한 pure function으로 둔다.

---

## 7. Phase C — Sun / Lighting

현재 임시 `DirectionalLight`를 시간 시스템에 연결한다.

시간에 따라:

- elevation
- azimuth
- intensity
- color

변화.

낮:

- 따뜻하지만 과도하지 않은 sunlight
- 높은 태양
- 짧은 그림자

아침 / 노을:

- 낮은 태양
- 긴 그림자
- 따뜻한 금색 / 주황색 계열

밤:

- sunlight 거의 제거
- 완전한 검정 화면은 금지

밤에는 별도의 약한 moon/fill 역할을 둘 수 있다.

단:

- 두 개 이상의 무거운 shadow light를 동시에 사용하지 않는다.
- 밤에도 지형 실루엣과 고저차를 식별할 수 있어야 한다.
- 달은 실제 천문 모델이 아니라 분위기용으로 취급한다.

### 그림자

- 기본 shadow map은 1024² 수준에서 시작.
- 태양 directional light 한 개 중심.
- 고해상도 shadow map을 선제적으로 사용하지 않는다.
- shadow frustum은 terrain 전체를 무조건 과도하게 덮지 않는다.
- PC뿐 아니라 모바일 비용을 함께 본다.

---

## 8. Phase D — Procedural Sky

texture 기반 skybox를 기본 선택으로 사용하지 않는다.

우선 procedural sky를 만든다.

권장 표현:

- zenith color
- horizon color
- sun direction
- horizon glow
- night color

가능한 후보:

- 저폴리곤 sky dome + `ShaderMaterial`
- fullscreen/background shader
- Three.js Sky 예제의 필요한 부분만 참고

물리 기반 atmospheric scattering을 복잡하게 그대로 복제할 필요는 없다.

### 낮

- 밝고 부드러운 하늘색
- horizon은 약간 따뜻하고 밝게

### 노을

- horizon이 금색 / 주황 / 연분홍으로 이동
- zenith는 푸른색 / 보라색으로 연결

### 밤

- 남색 / 짙은 보라
- 완전한 검정 금지

banding이 심하면 procedural dithering을 검토할 수 있으나 noise texture 추가부터 선택하지 않는다.

---

## 9. Phase E — Stars / Night

밤 분위기를 위해 별을 추가한다.

texture 기반 별 배경 대신 우선:

- `Points`
- procedural point positions

를 검토한다.

성능 기준:

- 한 draw call 목표
- 수백 개 수준에서 시작
- 카메라에서 매우 멀리 존재
- 시간대에 따라 brightness 변화
- 낮에는 자연스럽게 사라짐

별자리, 은하수, 유성은 이번 범위가 아니다.

---

## 10. Phase F — Fog / Atmosphere

fog는 장식이 아니라 Jelly Oasis의 공간 디자인 도구로 사용한다.

목적:

- terrain 경계 완화
- 원거리 깊이감 강화
- 공간을 실제보다 조금 넓게 느끼게 함
- 날씨 분위기 강화
- 향후 오브젝트 density가 낮은 먼 영역 정리

`Fog` 또는 `FogExp2` 중 현재 카메라/terrain에 더 자연스러운 방식을 선택한다.

fog의 color와 density/near/far는 시간과 날씨 양쪽 영향을 받는다.

예:

- 맑은 낮: 매우 약함
- 아침: 약한 haze
- 노을: 따뜻한 색
- 밤: 어두운 청색
- 흐림: 조금 증가
- mist: 크게 증가
- rain: 중간 이상

과도한 fog로 지형 문제를 숨기지 않는다.

---

## 11. Phase G — Stylized Clouds

volumetric cloud는 사용하지 않는다.

Jelly Oasis에는 **low-poly / stylized geometry cloud**가 우선이다.

권장 방법:

- low-poly icosphere/sphere 계열 geometry
- 여러 puff를 조합해서 cloud cluster 구성
- shared geometry
- shared material
- 가능하면 `InstancedMesh`
- texture 0장

초기 예산 예시:

- cloud cluster 약 6~12개
- 전체 puff instance 약 30~80개
- 1~2 draw call 수준 목표

최종 숫자는 화면 결과와 실제 측정으로 결정한다.

### 구름 표현

맑음:

- 적은 수
- 밝고 부드러운 색

부분적으로 흐림:

- coverage 증가

흐림:

- coverage 증가
- 구름색 어두워짐
- sunlight 감소

비:

- 낮고 어두운 구름
- ambient 대비 감소

### 구름 이동

- 일정 방향으로 천천히 이동.
- 월드 끝을 지나면 재사용.
- geometry를 매 프레임 재생성하지 않는다.
- 객체를 계속 생성/삭제하지 않는다.
- matrix / position 업데이트 중심.

구름 자체가 매우 느리므로 모바일에서 반드시 60fps animation일 필요는 없다.

---

## 12. Phase H — Weather Presets

날씨는 preset 기반으로 구성한다.

최소 preset:

```ts
CLEAR
PARTLY_CLOUDY
OVERCAST
RAIN
MIST
```

각 preset은 목표 환경값을 정의한다.

```ts
interface WeatherProfile {
  cloudCoverage: number;
  cloudDarkness: number;
  sunlightMultiplier: number;
  ambientMultiplier: number;
  fogMultiplier: number;
  rainIntensity: number;
}
```

날씨 변경 순간 화면이 갑자기 바뀌지 않는다.

현재 상태에서 목표 상태로 일정 시간 interpolation 한다.

전환 duration도 config화한다.

---

## 13. Phase I — Rain

비는 texture 없이 구현하는 것을 우선한다.

후보:

- `LineSegments`
- 매우 간단한 `Points`

카메라 주변의 제한된 volume에서만 비를 재사용한다.

월드 전체 320 × 320에 실제 빗방울을 뿌리지 않는다.

초기 목표:

- 화면에서 충분히 비처럼 보임
- fog + cloud + light 변화가 분위기의 대부분을 담당
- precipitation geometry는 최소한으로 사용

금지:

- 수천 개의 독립 Mesh
- 빗방울별 object allocation
- 물리 충돌
- 지면 splash simulation
- 물웅덩이 simulation

rain particle 수는 desktop/mobile quality level에 따라 다르게 둘 수 있다.

---

## 14. Environment Controller

복잡한 엔진 계층을 만들지는 않지만 `main.ts` 하나에 환경 로직을 전부 몰아넣지도 않는다.

권장 구조 예:

```text
src/jelly-oasis/
├─ main.ts
├─ terrain/
│  ├─ createTerrain.ts
│  └─ heightfield.ts
└─ environment/
   ├─ EnvironmentController.ts
   ├─ environmentState.ts
   ├─ timeOfDay.ts
   ├─ weather.ts
   ├─ createSky.ts
   ├─ createClouds.ts
   └─ createRain.ts
```

정확한 파일 수는 구현하면서 조정 가능하다.

중요한 기준:

- pure calculation과 Three.js rendering responsibility를 가능한 한 분리
- 작은 파일을 무의미하게 수십 개로 쪼개지 않음
- 향후 water/vegetation/creature와 결합하기 쉬운 정도만 유지
- Jelly Oasis 전용 구현을 억지로 범용 engine으로 만들지 않음

---

## 15. 기존 Dirty Rendering 정책과 동적 환경

현재 Jelly Oasis는 정적 상태에서 불필요한 render를 건너뛰는 구조를 가지고 있다.

환경이 들어오면:

- time 진행
- cloud 이동
- weather transition
- rain

때문에 동적 render가 필요하다.

하지만 항상 최대 속도로 렌더링하도록 단순 변경하지 않는다.

### 환경이 정지된 경우

- 기존 dirty render 유지 가능.

### 시간이 자동 진행 중이거나 구름/비가 움직이는 경우

- animation loop 사용.
- desktop은 필요한 범위에서 부드럽게.
- mobile / reduced motion은 필요하면 update frequency를 낮출 수 있음.

### hidden page

- animation 중단 또는 최소화.

복잡한 scheduler framework는 만들지 않는다.

---

## 16. 개발용 Environment Debug UI

정식 게임 UI가 아니다.

`?debug` 또는 Vite dev mode에서만 보이는 환경 검수 도구를 만든다.

최소 기능:

- timeOfDay slider
- play / pause
- time speed 변경
- weather preset 선택
- FPS 또는 frame time
- draw call
- triangle count
- texture count
- DPR
- cloud instance count
- rain particle count

필요하면:

- shadow on/off
- clouds on/off
- fog on/off

도 디버그용으로 제공할 수 있다.

사용자용 UI 디자인에는 지금 시간 쓰지 않는다.

---

## 17. 성능 예산

현재 terrain:

- 약 13.4k triangles
- texture 0
- terrain/edge 2 meshes/materials

환경 추가 후에도 가볍게 유지한다.

### Texture

- environment core: 가능하면 0장
- texture는 필요성이 명확할 때만 추가

### Draw calls

지형 + 하늘 + 별 + 구름 + rain을 포함해도 환경 foundation 자체는 **낮은 두 자릿수 이하**를 목표로 한다.

가능하면 훨씬 낮게 유지한다.

### Clouds

- shared geometry/material
- instancing 적극 검토

### Rain

- 하나 또는 소수의 batched draw calls

### Shadow

- 주 shadow light 1개
- 1024²부터 시작
- 검증 없이 2048/4096로 올리지 않는다

### Geometry

환경 분위기를 위해 high-poly geometry를 추가하지 않는다.

### Allocation

렌더 루프 내부에서 새 `Vector3`, `Color`, arrays, mesh 등의 반복 생성을 피한다.

---

## 18. 모바일 우선 체크

GitHub Pages에서 휴대폰으로도 볼 수 있어야 한다.

필수 확인:

- 좁은 세로 화면
- 넓은 가로 화면
- high-DPR Android
- touch orbit/pan/zoom
- background → foreground 복귀
- orientation change
- WebGL context restore

환경 효과 때문에 기존 카메라 입력이 끊기면 안 된다.

비가 오는 동안에도 touch interaction이 정상이어야 한다.

---

## 19. 테스트

pure environment logic은 가능한 범위에서 Vitest로 테스트한다.

### Time

- `timeOfDay` wrapping
- sunrise/noon/sunset/night 주요 구간
- NaN/invalid value 방지
- keyframe interpolation continuity

### Weather

- preset 값 범위
- transition interpolation
- clear → rain → clear에서 값 폭주 없음

### Performance invariants

- cloud geometry count가 설정 이상으로 폭증하지 않음
- rain particle count 제한
- texture 사용 여부
- environment 생성 시 scene object count가 예상 범위

렌더링의 미적 품질 자체는 unit test로 판정하지 않는다.

---

## 20. 시각 QA

Work에서 브라우저를 사용할 수 있다면 반드시 실제 화면을 확인한다.

최소 검수 장면:

1. 새벽 / CLEAR
2. 아침 / CLEAR
3. 정오 / CLEAR
4. 노을 / PARTLY_CLOUDY
5. 밤 / CLEAR
6. 낮 / OVERCAST
7. 낮 / RAIN
8. 아침 또는 저녁 / MIST

각 장면에서 확인:

- terrain 실루엣이 읽히는가
- 색이 과포화되지 않는가
- 밤에 너무 어둡지 않은가
- fog가 지형을 과하게 가리지 않는가
- 구름이 장난감 덩어리처럼 지나치게 튀지 않는가
- 비가 화면을 덮어 시야를 망치지 않는가
- 기존 low-poly 감성이 유지되는가

---

## 21. 환경 단계 완료 조건

다음을 모두 만족해야 완료로 본다.

1. `/projects/jelly-oasis/`에서 정상 동작.
2. 기존 terrain 형태가 유지됨.
3. 24시간 시간 값을 자유롭게 확인할 수 있음.
4. 아침 / 낮 / 노을 / 밤이 확실히 구분됨.
5. 태양 방향, 밝기, 색이 시간에 따라 자연스럽게 변함.
6. 하늘이 texture 없이 시간대에 따라 자연스럽게 변함.
7. 밤에도 지형 형태가 읽힘.
8. 별이 밤에만 자연스럽게 나타남.
9. fog가 시간과 날씨에 연동됨.
10. stylized cloud가 존재하고 천천히 이동함.
11. CLEAR / PARTLY_CLOUDY / OVERCAST / RAIN / MIST가 구분됨.
12. 날씨 변경이 갑작스러운 jump 없이 transition 됨.
13. 비가 카메라 주변에서 가볍게 렌더링됨.
14. environment core가 texture에 의존하지 않음.
15. 불필요한 high-poly geometry 없음.
16. 모바일 viewport와 touch 입력 정상.
17. hidden page에서 불필요한 렌더링을 줄임.
18. console error 없음.
19. `npm run lint`, `npm test`, `npm run build` 통과.
20. 기존 Jelly Plants / Viola / Uriel / Virus Sim 빌드 회귀 없음.

---

## 22. 작업 후 보고서에 포함할 내용

Work 작업 완료 후 아래를 정리한다.

- 변경 파일
- 환경 시스템 구조
- time system 방식
- weather preset 목록
- sky 구현 방식
- cloud 구현 방식
- rain 구현 방식
- draw calls
- triangles
- textures
- shadow 설정
- desktop/mobile 차이
- 실행한 검증 명령
- 남아 있는 문제
- 다음 단계로 넘겨야 할 항목

---

## 23. 다음 단계 — 이번에는 구현하지 않음

환경 시스템 승인 후 다음 작업으로 이동한다.

우선 후보:

1. 물 표면 / 연못
2. 폭포
3. Blender MCP 기반 바위/절벽 모듈
4. 나무 / 식생
5. 동굴
6. 판타지 장식 요소
7. 생물
8. 생물 애니메이션 / 행동 / 충돌

순서는 환경 결과를 보고 다시 논의한다.

---

## 24. Astra High / Work 핵심 지시

이번 작업의 목표는 **기술적으로 복잡한 환경 엔진**이 아니다.

목표는:

> 현재의 저폴리곤 지형 위에서 아무 나무나 바위가 없어도
> 시간과 빛, 하늘, 구름, 안개, 날씨만으로
> “이 공간에 머물고 싶다”는 느낌을 만드는 것.

구현 중 선택이 필요하다면 다음 순서로 판단한다.

1. 시각적 효과가 충분한가?
2. Jelly Oasis 스타일과 맞는가?
3. 모바일 WebGL에서 가벼운가?
4. texture 없이 가능한가?
5. 코드가 이후 확장하기 쉬운가?
6. 정말 필요한 복잡성인가?

고급 기법이라는 이유만으로 volumetric effect, heavy post-processing, high-poly mesh, 다중 shadow light를 선택하지 않는다.

**간단한 방법으로 충분히 예쁘면 그 방법을 사용한다.**

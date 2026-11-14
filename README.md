# Jelly Plants

Jelly Plants는 프로젝트 목록을 작은 은하계로 보여 주는 `cjftya.github.io`의 새
루트 페이지예요. 각 프로젝트는 JSON 데이터와 재현 가능한 seed를 바탕으로 절차적으로
생성한 행성으로 표현합니다.

현재 단계는 데이터 검증과 Three.js 렌더링 기반 위에 프로젝트 탐색 흐름까지 구현한
상태입니다. 상단의 은하계 선택기로 독립 프로젝트와 GitHub Pages 아카이브를 오가며,
행성을 선택하면 카메라가 가까이 이동한 뒤 공전 위치를 따라가며, 드래그와 줌은 선택한
행성을 기준으로 동작합니다. 프로젝트 유형, 상태, 기술 스택과 선택적 GitHub 링크도
같은 JSON에서 관리합니다. 닫기, Esc, 빈 공간 선택, 브라우저 뒤로가기로 전체
행성계로 복귀합니다.

배경은 별과 우주 먼지를 각각 한 개의 point field로 렌더링합니다. 서로 다른 깊이와
아주 느린 회전으로 가벼운 시차를 만들며, 은하계별 색·밀도감·움직임은 JSON에서
관리합니다. 행성은 이미지 텍스처 대신 seed가 고르는 다섯 가지 절차형 표면 패턴과
조명으로 표현합니다. 행성 사이의 별자리 연결선, 궤도를 흐르는 광점, 생명광과 빛
입자, 작은 위성이 프로젝트를 살아 있는 천체처럼 보이게 하는 **우주 정원** 콘셉트를
만듭니다. 선택한 행성의 색은 라벨·상세 패널·연결선에도 이어집니다. 중심 항성은
은하계별 `starProfile`을 사용해 서로 다른 3단계 대류 무늬, 흐름 속도, 젤리 맥동과
seed 기반 광륜 실루엣을 가집니다.

## Jelly Garden

GitHub Pages 저장소 자체를 제외한 공개 저장소를 행성으로 표시합니다.

- Rainbow
- LLM Android Leak Checker
- Jelly Tracer
- Jelly Sim V1
- JellyMarkdown
- Callisto
- Storage Tracking

## Pages Archive

GitHub Pages에서 직접 실행되는 웹 프로젝트를 별도 은하계로 표시합니다.

- Viola
- Uriel
- Virus Sim
- Jelly Oasis

Pages Archive의 상세 패널은 등록된 `보기`와 GitHub 버튼을 모두 표시합니다. Jelly
Garden은 GitHub 버튼만 표시합니다. 기존 웹 프로젝트의 원본 정적 경로는 아래
레거시 프로젝트 규칙으로 그대로 유지합니다.

### Uriel

알고리즘 선택, 후보·구매 조합과 Worker 기반 백테스트를 제공해요.
화면·분석·Worker 구조와 공식 CSV 갱신 방법은 [Uriel 운영 안내](docs/uriel.md)를 확인해요.

은하계 정보, 프로젝트 링크와 행성 설정은 `public/data/projects.json`에서 관리합니다.

## 레거시 프로젝트

기존 프로젝트 파일은 수정하거나 이동하지 않습니다.

- `/projects/viola/`
- `/projects/weddingcard/`
- `/projects/uriel/`
- 두 프로젝트가 함께 사용하는 `/shared/`

`npm run build`는 루트·Viola·Uriel·Virus Sim·Jelly Oasis를 Vite 멀티 엔트리로
빌드하고, `copy-legacy.mjs`가 이 네 프로젝트를 제외한 `projects/`와 `shared/`를
같은 경로로 복사해요. Wedding Card의 원본 정적 파일과 기존 공개 URL을 유지해요.

## Virus Sim

`/projects/virus-sim/`에서 95종 바이러스의 3D 구조를 관찰하는 v4.9 뷰어예요.
기능 개발은 완료했으며 기존 콘텐츠와 동작의 회귀 방지를 중심으로 유지보수해요.
`npm run dev`로 실행하고 `npx vitest run tests/virus-sim`으로 관련 회귀 테스트를 확인해요.
코드 지도와 데이터·설정 보존 규칙은 [유지보수 안내](docs/virus-sim.md)를 참고해요.

## Jelly Oasis

`/projects/jelly-oasis/`에서 지형, 낮·밤·날씨와 Overgrown Oasis Ruin 랜드마크를
확인할 수 있습니다. `?debug`를 붙이면 후보 위치, 방향, 동선과 검수 카메라를 비교합니다.

- 진입점은 `src/jelly-oasis/main.ts`예요. 초기 URL 설정은 `startupOptions.ts`에서
  한 번 해석하며, 검수용 변형은 개발 모드 또는 `?debug`에서만 적용해요.
- `environment/`는 시간·날씨·하늘·후처리, `landmark/`는 세계수·호수·랜드마크,
  `terrain/`, `vegetation/`, `composition/`, `scenery/`, `meadow/`는 지형과 식생을 관리해요.
- [현재 운영·구조·기본값과 검증 방법](docs/jelly-oasis/README.md)
- [현재 렌더링 최적화와 검증 범위](docs/archive/jelly-oasis/jelly-oasis-performance-v1.md)
- [랜드마크 통합 보고서와 스크린샷](docs/archive/jelly-oasis/jelly-oasis-landmark-integration-v1.md)
- [Blender blockout 원본과 재현 방법](docs/archive/jelly-oasis/jelly-oasis-overgrown-ruin-blockout-v1.md)
- 로컬 서버 실행 후 `npm run qa:landmark`로 브라우저 검수를 재실행합니다(Microsoft Edge 필요).

## 기술 스택

- Vite 8
- TypeScript 6 strict mode
- Three.js
- Zod
- Vitest
- ESLint 10
- Prettier
- GitHub Actions 및 GitHub Pages

루트 탐색과 Jelly Oasis, Virus Sim은 Three.js와 DOM을 사용해요. Uriel은 React를
사용하며, 전체 의존성은 `package.json`을 기준으로 확인해요.

## 개발 환경

- Node.js 22.13 이상
- npm 10 이상
- WebGL을 지원하는 최신 브라우저

패키지 버전은 `package.json`과 `package-lock.json`에 고정되어 있습니다.

## 시작하기

```bash
npm ci
npm run dev
```

Vite가 출력한 로컬 주소를 브라우저에서 엽니다.

## 품질 검사와 빌드

```bash
npm run lint
npm run format:check
npm run test
npm run build
npm run preview
```

빌드 결과는 `dist/`에 생성됩니다. 결과물에는 새 루트 앱 외에 다음 경로도 포함됩니다.

```text
dist/
├── index.html
├── assets/
├── data/projects.json
├── projects/
└── shared/
```

## GitHub Pages 배포

`.github/workflows/deploy-pages.yml`은 `master`에 push되거나 수동 실행될 때 다음 순서로
동작합니다.

1. checkout 및 Node.js 설정
2. `npm ci`
3. lint, test, build
4. `dist/` Pages artifact 업로드
5. GitHub Pages 배포

Pull Request에서는 lint, test, build까지만 실행하며 실제 배포는 하지 않습니다. 이
저장소는 사용자 루트 Pages 저장소이므로 Vite `base`는 `/`입니다.

최초 병합 전에 저장소 **Settings → Pages → Build and deployment → Source**를
**GitHub Actions**로 설정해야 합니다. 자세한 전환과 롤백 절차는
[docs/migration.md](docs/migration.md)에 있습니다.

## 프로젝트 추가

프로젝트는 TypeScript 코드가 아니라 `public/data/projects.json`에 추가합니다.

1. 영구적으로 사용할 고유 `id`를 정합니다.
2. 프로젝트가 속할 `galaxyId`를 선택합니다.
3. 목록 순서는 배열 위치가 아니라 `order`로 정합니다.
4. 프로젝트 설명, 기술 스택과 `planet` 표현 설정을 입력합니다.
5. Pages Archive의 공개 페이지는 `links.page`에 내부 경로를 입력합니다.
6. `npm run test`로 스키마와 중복 ID를 검사합니다.
7. `npm run dev`로 은하계 전환, 행성과 링크를 확인합니다.

전체 필드와 예시는
[docs/project-data-schema.md](docs/project-data-schema.md)를 참고하세요.

작업별 수정 위치와 앱 간 의존성·빌드 규칙은 [유지보수 지도](docs/maintenance.md)에 있어요.

## 주요 디렉터리

```text
public/data/       배포 시 읽는 프로젝트 JSON
config/            HTML 빌드 진입점 (복사 제외 목록과 공유)
src/shared/        앱 사이의 공용 TypeScript 코드
src/app/           루트 앱 초기화와 생명주기 조정
src/core/          Three.js 장면·카메라·렌더러·입력 기반
src/data/          데이터 타입, 검증, 저장소 추상화
src/planets/       행성 geometry 생성과 결정적 노이즈
src/solar-system/  태양, 궤도, 행성의 장면 객체와 업데이트
src/ui/            HTML 상태 및 선택 패널
src/styles/        전역 스타일
tests/             프로젝트 계약, 렌더 자원, 데이터·알고리즘 회귀 테스트
scripts/           빌드 후 복사, 데이터 관리, QA·모델 제작 도구
docs/              현재 운영 안내와 보존한 검증 기록
projects/          Vite HTML 진입점과 원본 정적 프로젝트
shared/            기존 프로젝트의 공용 스크립트
```

구조와 객체 간 흐름은 [docs/architecture.md](docs/architecture.md)에 설명되어 있습니다.

현재 문서와 과거 검증 기록의 구분은 [문서 안내](docs/README.md)를 참고해요.

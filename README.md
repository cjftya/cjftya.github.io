# Jelly Plants

Jelly Plants는 프로젝트 목록을 작은 태양계로 보여 주는 `cjftya.github.io`의 새
루트 페이지예요. 각 프로젝트는 JSON 데이터와 재현 가능한 seed를 바탕으로 절차적으로
생성한 행성으로 표현합니다.

현재 단계는 데이터 검증과 Three.js 렌더링 기반 위에 프로젝트 탐색 흐름까지 구현한
상태입니다. 행성을 선택하면 카메라가 가까이 이동하고 프로젝트 설명과 GitHub 링크가
표시됩니다. 프로젝트 유형, 상태와 기술 스택도 같은 JSON에서 관리합니다. 닫기, Esc,
빈 공간 선택, 브라우저 뒤로가기로 전체 태양계로 복귀합니다.

배경은 별과 우주 먼지를 각각 한 개의 point field로 렌더링합니다. 서로 다른 깊이와
아주 느린 회전으로 가벼운 시차를 만들며, 드물게 한 개의 유성이 지나갑니다. 행성은
이미지 텍스처 대신 seed 기반 색 변화와 조명으로 표현합니다. 행성 사이의 별자리
연결선, 궤도를 흐르는 광점, 생명광과 빛 입자, 작은 위성이 프로젝트를 살아 있는
천체처럼 보이게 하는 **우주 정원** 콘셉트를 만듭니다.

## 전시 프로젝트

GitHub Pages 저장소 자체를 제외한 공개 저장소를 행성으로 표시합니다.

- Lottery Chart
- Rainbow
- LLM Android Leak Checker
- Jelly Tracer
- Jelly Sim V1
- JellyMarkdown

GitHub 링크와 행성 설정은 `public/data/projects.json`에서 관리합니다. 상세 패널은
프로젝트 설명 뒤에 GitHub 링크 하나만 제공합니다. Viola와 Wedding Card는 기존
URL만 보존하며 행성 목록에는 포함하지 않습니다.

## 레거시 프로젝트

기존 프로젝트 파일은 수정하거나 이동하지 않습니다.

- `/projects/viola/`
- `/projects/weddingcard/`
- 두 프로젝트가 함께 사용하는 `/shared/`

`npm run build`가 Vite 결과를 만든 뒤 `projects/`와 `shared/`를 원래 경로 그대로
`dist/`에 복사합니다. 따라서 기존 상대 경로와 공개 URL이 유지됩니다.

## 기술 스택

- Vite 8
- TypeScript 6 strict mode
- Three.js
- Zod
- Vitest
- ESLint 10
- Prettier
- GitHub Actions 및 GitHub Pages

UI 프레임워크는 사용하지 않습니다.

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
2. 목록 순서는 배열 위치가 아니라 `order`로 정합니다.
3. 프로젝트 설명, 기술 스택과 `planet` 표현 설정을 입력합니다.
4. `npm run test`로 스키마와 중복 ID를 검사합니다.
5. `npm run dev`로 행성과 링크를 확인합니다.

전체 필드와 예시는
[docs/project-data-schema.md](docs/project-data-schema.md)를 참고하세요.

## 주요 디렉터리

```text
public/data/       배포 시 읽는 프로젝트 JSON
src/app/           앱 초기화와 생명주기 조정
src/core/          Three.js 장면·카메라·렌더러·입력 기반
src/data/          데이터 타입, 검증, 저장소 추상화
src/planets/       행성 geometry 생성과 결정적 노이즈
src/solar-system/  태양, 궤도, 행성의 장면 객체와 업데이트
src/ui/            HTML 상태 및 선택 패널
src/styles/        전역 스타일
tests/             데이터 계층과 seed 결정성 테스트
scripts/           빌드 후 레거시 복사 작업
docs/              설계, 마이그레이션, 데이터 스키마 문서
projects/          수정하지 않은 기존 프로젝트
shared/            기존 프로젝트의 공용 스크립트
```

구조와 객체 간 흐름은 [docs/architecture.md](docs/architecture.md)에 설명되어 있습니다.

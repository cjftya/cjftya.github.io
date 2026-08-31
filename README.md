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

## Pages Archive

GitHub Pages에서 직접 실행되는 웹 프로젝트를 별도 은하계로 표시합니다.

- Viola
- Wedding Card
- Uriel

Pages Archive의 상세 패널은 등록된 `보기`와 GitHub 버튼을 모두 표시합니다. Jelly
Garden은 GitHub 버튼만 표시하고, Wedding Card는 두 버튼을 모두 숨깁니다. 기존 웹
프로젝트의 원본 정적 경로는 아래 레거시 프로젝트 규칙으로 그대로 유지합니다.

### Uriel 분석 엔진

Uriel은 후보 번호 생성과 6개 조합 평가를 분리합니다. 기존 수치·하이브리드·7×7 형태
전이 모델의 합의로 Top 10/12/15/18/20 Candidate Pool Recall을 측정하고, 기본 Top 15
안의 5,005개 조합을 Number·Pair·Triple·원형·번호표·형태 전이 Feature로 독립 평가해
Research Top 100을 만듭니다. 구매용 Top 10은 연구 순위만 복사하지 않고 점수,
번호 Coverage, 조합 간 Diversity, 4-number subset Coverage를 함께 최적화합니다.

화면의 Walk-forward 진단은 Candidate Recall, Oracle Max, Top-100 Max, Top-10 Max,
Oracle→Top-10 Conversion과 0~6 Hit Distribution을 전략별로 비교합니다. 기존 Uriel,
Number, Pair, Pair+Triple, Shape, Shape Transition, Hybrid, Full Hybrid 및 Ablation을 같은
과거 시점에서 검증하고, Random은 고정 seed로 32회 Monte Carlo 반복합니다. 계산은 Web
Worker에서 실행되며 최근 48/96/192/384회 범위를 선택할 수 있습니다. 모든 통계와
정규화는 예측 시점까지 알려진 기록만 사용합니다.

#### 당첨 데이터 갱신

앱의 원본은 `public/projects/uriel/data/draws.csv`예요. 엑셀에서도 열 수 있으며
형식은 `회차,추첨일,당첨번호 6개`로 유지해요. 별도 `.xlsx` 파일은 사용하지 않아요.

```bash
npm run data:check   # 공식 최신 회차와 누락 확인, CSV 변경 없음
npm run data:update  # 누락 회차를 검증한 뒤 CSV에 추가
```

[동행복권 공식 결과](https://www.dhlottery.co.kr/lt645/result)에서 발표된 최신
회차를 확인하고, 해당 페이지가 사용하는 결과 조회 응답에서 실제 당첨번호를
가져와요. 새 회차뿐 아니라 중간에 빠진 회차도 채워요. 이미 최신이면 파일을
다시 쓰지 않고, 기존 행의 날짜 표기와 줄바꿈도 유지해요. 보너스 번호는 검증만
하고 분석용 번호 6개에 포함하지 않아요.

GitHub Actions는 **한국시간 토요일 21:35, 일요일 09:35**에 확인해요. 일요일 실행은
발표 지연이나 일시적인 조회 실패에 대비한 재확인이에요. Actions의 **Validate and
deploy GitHub Pages → Run workflow**에서 `master`와 `update_data`를 선택해 수동
갱신할 수도 있어요. 예약 실행 시간은 GitHub 상황에 따라 지연될 수 있어요.

누락 데이터 조회 → 검증·테스트 → CSV만 커밋 → 해당 커밋 빌드·배포 순서로
진행해요. 자동 커밋은 별도 push 워크플로를 발생시키지 않으므로 같은 실행에서
새 커밋을 직접 배포해요. 브라우저는 페이지를 다시 열거나 새로고침하면 CSV를
재검증해 가져와요. 열어 둔 탭에서 실시간 갱신하거나 브라우저가 저장소에 쓰는
방식은 아니에요. 기존 `CSV 교체` 기능과 분석·실험의 고정 평가 구간은 유지해요.

조회 실패, 잘못된 회차·날짜·번호, 기존 기록과의 충돌이 있으면 **전체 갱신을
중단하고 원본을 보존**해요. 미래 번호를 추측해 넣거나 다른 사이트의 자료로
대체하지 않아요. 현재 조회 경로는 `/lt645/selectPstLt645InfoNew.do`이며
`srchDir=center`, `srchLtEpsd=회차`를 사용해요. 공식 사이트 구조나 주간 추첨
일정이 바뀌면 이 어댑터를 확인해야 해요. 브랜치 보호가 자동 커밋을 막는 경우에도
실패로 표시하며 보호 규칙을 우회하지 않아요.

은하계 정보, 프로젝트 링크와 행성 설정은 `public/data/projects.json`에서 관리합니다.

## 레거시 프로젝트

기존 프로젝트 파일은 수정하거나 이동하지 않습니다.

- `/projects/viola/`
- `/projects/weddingcard/`
- `/projects/uriel/`
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
2. 프로젝트가 속할 `galaxyId`를 선택합니다.
3. 목록 순서는 배열 위치가 아니라 `order`로 정합니다.
4. 프로젝트 설명, 기술 스택과 `planet` 표현 설정을 입력합니다.
5. Pages Archive의 공개 페이지는 `links.page`에 내부 경로를 입력합니다.
6. `npm run test`로 스키마와 중복 ID를 검사합니다.
7. `npm run dev`로 은하계 전환, 행성과 링크를 확인합니다.

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

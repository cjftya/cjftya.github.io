# GitHub Pages 마이그레이션

## 기준 상태

- 저장소: `cjftya/cjftya.github.io`
- 기본 브랜치: `master`
- 작업 전 최신 `master` SHA:
  `ec3386d3ba735d65b6fe857415e64bd86e21b1ee`
- 로컬 백업 태그: `pre-jelly-plants`
- 원격 백업 태그: 현재 Work 연결에는 tag ref 생성 기능이 없어 아직 만들지 않음
- 작업 브랜치: `feature/jelly-plants-foundation`

로컬 `pre-jelly-plants`는 위 SHA를 가리키며 기존 루트와 레거시 프로젝트를 복구하는
기준입니다. 병합 전에 원격 태그도 보존하려면 저장소 쓰기 인증이 있는 환경에서 다음을
실행합니다. 같은 원격 태그가 생겼다면 덮어쓰지 않습니다.

```bash
git ls-remote --tags origin refs/tags/pre-jelly-plants
git push origin refs/tags/pre-jelly-plants
```

## 기존 구조

기존 저장소는 정적 파일로 구성되어 있었습니다.

```text
index.html                 /projects/viola/로 즉시 redirect
projects/viola/            Viola 정적 페이지
projects/weddingcard/      Wedding Card 정적 페이지와 assets
shared/                    두 프로젝트의 공용 JavaScript
```

Viola와 Wedding Card는 프로젝트 내부 상대 경로와 `../../shared/` 참조를 사용합니다.
따라서 이번 마이그레이션에서는 세 레거시 디렉터리의 파일을 이동하거나 수정하지 않습니다.

## 루트 페이지 변경

기존 `index.html`의 meta refresh와 `window.location.replace()`를 제거하고 Vite 진입
페이지로 교체합니다. 이제 `/`는 Jelly Plants를 표시하며 Viola는 기존
`/projects/viola/`에서 계속 열립니다.

## 레거시 URL 보존

방식 A인 빌드 후 복사를 사용합니다.

1. Vite가 새 앱과 `public/`을 `dist/`에 빌드합니다.
2. `scripts/copy-legacy.mjs`가 원본 `projects/`와 `shared/`를 `dist/`의 같은 경로에
   복사합니다.
3. GitHub Pages는 `dist/` 전체를 배포합니다.

대규모 파일 이동이 없고 기존 상대 경로가 그대로 유지되는 방식입니다. 다음 URL은
변경되지 않습니다.

- `https://cjftya.github.io/projects/viola/`
- `https://cjftya.github.io/projects/weddingcard/`

## Pages 배포 방식 변경

기존 branch deployment 대신 `.github/workflows/deploy-pages.yml`이 만든 `dist`
artifact를 배포합니다. 워크플로는 `master` push와 수동 실행에서만 배포하고,
Pull Request에서는 lint, test, build까지만 실행합니다.

최초 병합 전 다음 설정을 확인해야 합니다.

1. GitHub 저장소의 **Settings → Pages**를 엽니다.
2. **Build and deployment → Source**를 **GitHub Actions**로 변경합니다.
3. 저장 후 `master`에 병합된 워크플로 실행이 `github-pages` environment에 배포할
   수 있는지 확인합니다.
4. environment protection rule을 별도로 사용 중이면 workflow의 `master` 배포를
   허용합니다.

설정이 branch deployment로 남아 있으면 Actions artifact가 새 루트를 배포하지
못하거나 기존 branch 결과가 계속 제공될 수 있습니다.

## 롤백

문제가 생기면 히스토리를 재작성하거나 force push하지 않습니다.

권장 롤백 절차:

1. Jelly Plants 병합 커밋을 `git revert`하는 새 PR을 만듭니다.
2. 필요하면 기존 방식과 동일한 redirect `index.html`을 복원합니다.
3. Pages Source를 이전 branch deployment 설정으로 되돌립니다.
4. `pre-jelly-plants` 또는 기록된 SHA와 diff를 비교해 레거시 파일이 동일한지
   확인합니다.

긴급 확인용 기준:

```bash
git show pre-jelly-plants:index.html
git diff pre-jelly-plants -- projects/ shared/
```

태그는 상태 확인과 새 롤백 PR의 기준으로 사용하며, `master`를 태그로 강제 이동하지
않습니다.

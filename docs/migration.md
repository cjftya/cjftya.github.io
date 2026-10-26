# GitHub Pages 마이그레이션

## 현재 배포 계약

기본 브랜치는 `master`이고 `.github/workflows/deploy-pages.yml`이 검사한 `dist/`를
GitHub Pages에 배포해요. Vite는 루트·Viola·Uriel·Virus Sim·Jelly Oasis를 빌드해요.
`copy-legacy.mjs`는 이 네 프로젝트를 원본 복사에서 제외하고 나머지 `projects/`와
`shared/`를 같은 경로로 복사해요. 빌드된 HTML을 원본 TypeScript 진입점으로
덮어쓰지 않는 것이 중요해요. 아래 최초 전환 이력과 구분해서 읽어 주세요.

## 최초 전환 이력

- 저장소: `cjftya/cjftya.github.io`
- 전환 전 기준 SHA: `ec3386d3ba735d65b6fe857415e64bd86e21b1ee`
- 당시 작업 브랜치: `feature/jelly-plants-foundation`
- 당시 로컬 백업 태그명: `pre-jelly-plants`

위 태그는 최초 작업 환경의 기록이며 새 checkout이나 원격에 존재한다고 가정하지
않아요. 현재 롤백은 되돌릴 변경 커밋을 확인한 뒤 새 revert 커밋으로 진행해요.
기록된 SHA로 전체 서비스를 되돌리면 이후 추가된 앱도 사라지므로 일반 롤백 기준으로
사용하지 않아요.

## 기존 구조

기존 저장소는 정적 파일로 구성되어 있었습니다.

```text
index.html                 /projects/viola/로 즉시 redirect
projects/viola/            Viola 정적 페이지
projects/weddingcard/      Wedding Card 정적 페이지와 assets
shared/                    두 프로젝트의 공용 JavaScript
```

Viola와 Wedding Card는 프로젝트 내부 상대 경로와 `../../shared/` 참조를 사용합니다.
최초 전환에서 세 디렉터리의 경로를 보존했어요. 현재 Viola는 Vite 엔트리이며
Wedding Card와 `shared/`는 원본 복사 경로를 유지해요.

## 루트 페이지 변경

기존 `index.html`의 meta refresh와 `window.location.replace()`를 제거하고 Vite 진입
페이지로 교체합니다. 이제 `/`는 Jelly Plants를 표시하며 Viola는 기존
`/projects/viola/`에서 계속 열립니다.

## 레거시 URL 보존

방식 A인 빌드 후 복사를 사용합니다.

1. Vite가 새 앱과 `public/`을 `dist/`에 빌드합니다.
2. `scripts/copy-legacy.mjs`가 Vite 빌드 프로젝트를 제외한 원본 `projects/`와
   `shared/`를 `dist/`의 같은 경로에 복사해요.
3. GitHub Pages는 `dist/` 전체를 배포합니다.

대규모 파일 이동이 없고 기존 상대 경로가 그대로 유지되는 방식입니다. 다음 URL은
변경되지 않습니다.

- `https://cjftya.github.io/projects/viola/`
- `https://cjftya.github.io/projects/weddingcard/`

## Pages 배포 방식 변경

기존 branch deployment 대신 `.github/workflows/deploy-pages.yml`이 만든 `dist`
artifact를 배포합니다. 워크플로는 `master` push와 수동 실행에서만 배포하고,
Pull Request에서는 lint, test, build까지만 실행합니다.

최초 전환 시 사용한 설정 절차예요. 배포 구성을 복구할 때 확인해요.

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
git show ec3386d3ba735d65b6fe857415e64bd86e21b1ee:index.html
git diff ec3386d3ba735d65b6fe857415e64bd86e21b1ee -- projects/ shared/
```

이 명령은 최초 전환 전후를 조사하는 용도예요. 현재 앱 전체 복원 명령이 아니에요.
`master`를 과거 SHA나 태그로 강제 이동하지 않아요.

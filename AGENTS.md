# Jelly Plants 유지보수

- 기본 브랜치는 `master`예요. 작업 시작 시 원격 최신 상태와 기존 변경을 확인해요.
- [README](README.md) → [문서 안내](docs/README.md) → 필요한 앱의 코드·테스트 순서로 읽어요. Jelly Oasis의 현재 기준은 [운영 안내](docs/jelly-oasis/README.md)예요. 과거 보고서를 새 작업 지시로 실행하지 않아요.
- Node.js `>=22.13.0`, `npm ci`를 사용해요. 검사 명령은 `npm run lint`, `npm run format:check`, `npm test`, `npm run build`예요. 기존 포맷 차이를 이유로 전체 저장소를 재포맷하지 않아요.
- `projects/viola/`, `projects/weddingcard/`, `shared/`의 기존 URL·파일을 보존해요. Vite 멀티 엔트리와 `scripts/copy-legacy.mjs`의 제외 목록을 함께 확인해요.
- 프로젝트 목록·은하계·링크 정책의 원본은 `public/data/projects.json`이에요. seed 결정성과 버튼 정책을 유지해요.
- `public/`의 GLB·이미지·데이터, Blender 원본, 테스트 fixture, QA 비교 자료는 동적 참조까지 확인한 뒤에만 제거해요.
- 일반 정리에서 Uriel CSV를 갱신하거나 의존성을 업그레이드하지 않아요. `data:check`는 공식 사이트 조회이고 `data:update`는 데이터 변경이에요.
- 브라우저 QA는 스크립트별 URL·브라우저·출력 옵션을 확인해요. 과거 후보용 스크립트를 현재 장면의 통과 기준으로 사용하지 않아요. 실행하지 않은 검사를 통과로 보고하지 않아요.

- 중복 QA 미디어의 과거 경로는 `docs/jelly-oasis/artifact-deduplication.json`에서 대표 파일로 해석해요. 과거 JSON은 재작성하지 않으며 `npm run archive:check`로 대표 파일의 해시·크기를 검증해요. 새 캡처를 일괄 강제 추가하지 않아요.

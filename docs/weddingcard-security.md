# Wedding Card 비밀번호 잠금 — 구현 및 전환 안내

2026-11-15. 상태: 구현 브랜치 / **실제 비밀번호를 이용한 데이터 전환·운영 배포 전**.
`master`와 현재 운영 사이트는 변경하지 않았어요. 이 브랜치는 암호화 데이터가 없으면
배포 검사가 실패해요. 아래 로컬 전환을 마친 뒤에만 병합하세요.

## 분석과 변경 범위

기존 사진 18개는 WCIMG1(AES-GCM) 형식이지만 Worker에 복호화 키가 포함되어 있었어요.
HTML 메타데이터에 이름과 날짜, 장면 초기화 코드에 계좌·주소·문구,
장면 코드에 날짜, 지도·교통 코드에 장소가 있었어요. 암호문과 키가 함께 공개되어
있었으므로 과거 사진도 공개된 것으로 보아야 해요.

기존 코드를 전체 재작성하지 않았어요. 개인정보가 있는 네 모듈은 기존 내용을
암호화된 content.bin에 넣고 인증 후 순서대로 실행해요. 현재 브랜치에서 그 공개 파일과
구형 이미지 암호문, 하드코딩 키 Worker를 제거했어요. 실제 콘텐츠는 아래에 고정한
Git 커밋에서 **로컬 메모리로 복원**해요. 카드를 삭제하거나 원본 이력을 재작성하지 않았어요.

| 경로                                                                       | 변경 이유                                                                    |
| -------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `projects/weddingcard/index.html`, `security/lock.{js,css}`                | 개인정보 없는 잠금 화면, 표시·숨김, Enter, 진행·오류 안내, 메모리 세션       |
| `security/crypto.js`, `security/unlock-worker.js`                          | 키 유도, 전체 콘텐츠·사진 인증, 키를 Worker 안에서만 사용                    |
| `scripts/common/util/framework/resourcemanger/resourceloader.js`           | 기존 이미지 로딩 흐름을 인증 완료 Worker에 연결, Blob URL 수명 보정          |
| 기존 `objectinitializer.js`, `mainscene.js`, `mapview.js`, `directions.js` | 소스 공개 대신 암호화 콘텐츠 내부에서 기존 클래스를 실행                     |
| `security/viewer.min.{js,css}`, `viewer-LICENSE.txt`                       | 기존 Viewer.js 1.3.7을 자체 호스팅하여 외부 스크립트의 콘텐츠 접근 경로 축소 |
| `scripts/weddingcard/{content,migrate,check}.mjs`                          | 안전한 로컬 복원·재암호화·교체·비밀번호 변경·검사                            |
| `config/weddingcard-public-files.json`                                     | 공개 파일별 SHA-256 허용 목록; 변경 시 코드 검토 후 갱신                     |
| `scripts/copy-legacy.mjs`, Pages workflow, `package.json`                  | 소스와 복사된 배포물 검사, 전환 전 배포 차단                                 |
| `vite.config.ts`                                                           | 프로덕션 Source Map 비활성화                                                 |
| `tests/weddingcard-security.test.mjs`                                      | 오입력·변조·파일 치환·회전·기존 사진 복원 회귀 검사                          |

## 암호화 포맷과 선택

- AES-256-GCM, 매 파일 CSPRNG 12바이트 IV, 128비트 인증 태그.
- PBKDF2-HMAC-SHA256 600,000회, 매 전환·회전 CSPRNG 16바이트 Salt.
- Argon2id는 Web Crypto 내장 기능이 아니므로 WASM 배포·추가 의존성·모바일 메모리
  튜닝이 필요해요. 이번 최소 변경에서는 브라우저 내장 PBKDF2를 택했어요.
  실제 저사양 모바일 성능 측정은 남아 있어요.
- 비밀번호는 UTF-8 그대로 사용해요. 대소문자·공백·하이픈을 자동 정규화하지 않아요.
- `protected/manifest.json`: 버전 2, KDF·Salt·이미지 경로 목록만 공개해요.
- `protected/content.bin`, `protected/assets/private/image/**/*.bin`: `WCP2` + IV + 암호문·태그.
  원래 이미지 식별 경로는 유지하며 실제 저장·요청은 protected 하위예요.
- 버전·KDF·Salt·전체 이미지 목록·파일 식별 경로를 AAD로 인증해요. 파일 치환이나
  메타데이터 변조도 실패해요. 구형 형식·평문 폴백은 없어요.
- 키는 추출 불가능한 CryptoKey로 Worker 안에 있어요. 모든 사진 인증 후 카드가 시작되고
  이미지 전달 후 Worker 캐시를 비워요. 페이지 종료 때 Worker와 Blob URL을 해제해요.
- 비밀번호·키는 storage/cookie/URL에 저장하지 않아요. 새로고침·BFCache 복귀는 재잠금해요.
  JavaScript 문자열과 GC 메모리의 완전한 물리적 삭제까지 보장하지는 않아요.

근거: [OWASP Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html),
[Web Crypto deriveKey](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/deriveKey).

## 사용자가 로컬에서 최초 비밀번호 설정하기

개인 PC의 신뢰할 수 있는 터미널에서 실행하세요. 비밀번호를 Work 대화나 명령행 인자,
환경변수, 클립보드 로그, GitHub Secrets에 넣지 마세요. 자동 테스트용 임시 암호화 데이터는
실제 릴리스에 포함하지 않아요.

```bash
git fetch origin
git switch security/weddingcard-password-lock
# shallow clone이면 복원 커밋 확보가 필요해요.
git fetch origin ee664cffa7c38cceadfa5f1d825dfb4ae10a0fe2
npm ci
npm run wedding:migrate
```

도구가 입력을 숨긴 채 새 패스프레이즈를 두 번 요구해요. 무작위 영어 단어 5개 이상,
전체 25자 이상으로 정하세요. 공백 또는 하이픈으로 구분할 수 있어요. 입력 형식 검사는
단어가 실제 무작위인지 보장하지 못하므로 직접 만든 짧은 문장은 피하세요.
비밀번호를 잃으면 새 암호문을 복구할 수 없어요.

도구는 고정 커밋의 기존 키를 메모리에서 읽어 사진을 복원하고, 네 개인정보 모듈과
원래 이미지 DOM을 콘텐츠로 묶어요. 모든 항목을 재암호화한 뒤 다시 복호화하여 원본 바이트와
비교하고, 검증된 암호화 파일만 protected 폴더로 교체해요. 평문 임시 파일은 만들지 않아요.
기존 protected 폴더가 있으면 최초 migrate는 거절하므로 rotate를 사용하세요.
`verified.json`은 로컬 왕복 검증을 마친 파일들의 SHA-256 목록이며 비밀은 없어요.
CI는 이 목록과 파일·헤더·IV·공개 파일 허용 목록을 검사해요. 비밀번호 없는 CI가
AES 인증 태그를 직접 검증하는 것은 아니에요.

```bash
npm run wedding:verify
npm run wedding:check
npm run lint
npm test
npm run build
npm run preview
```

PC와 실제 모바일에서 `/projects/weddingcard/`를 열어 올바른 암호, 틀린 암호, 빈 입력,
새로고침, 갤러리 확대와 전환, 계좌 복사, 드래그·터치를 확인하세요. 암호문 변조는
자동 테스트가 검증해요. 실제 개인정보가 들어간 암호문 검증과 실제 모바일 확인 전에는
완료·배포 상태로 표시하지 마세요.

검증이 끝나면 새로 생긴 `projects/weddingcard/protected/`만 추가 커밋하세요.
평문 비밀번호나 복원한 소스를 커밋하지 마세요. PR CI가 통과하면 master에 병합하고,
Pages workflow 성공 후 운영 URL에서 잠금·갤러리·복사를 다시 확인하세요.

## 비밀번호 변경

```bash
npm run wedding:rotate
npm run wedding:verify
npm run wedding:check
npm test
npm run build
```

기존 암호 한 번과 새 암호 두 번을 로컬 터미널에서 입력해요. 새 Salt·IV·키로 모든 데이터를
재암호화하고 왕복 검증해요. `protected/`의 변경 파일을 모두 한 커밋으로 반영해야 해요.
회전 중 중단되면 `.weddingcard-stage-*-backup`의 **암호문**이 남을 수 있으므로
검증 후 로컬에서 정리하세요. 그 폴더는 Git에서 제외하고 허용 목록 검사도 배포를 거절해요.

## 이력·캐시 정리 계획과 남은 위험

현재 트리에서 키와 개인정보를 제거해도 과거 커밋·PR diff·fork·클론·Pages artifact·외부
캐시에서 기존 자료를 회수하지는 못해요. 기존 키를 새 포맷에서 재사용하지 않아요.
새 암호문에도 오프라인 비밀번호 대입은 가능하므로 긴 무작위 패스프레이즈가 필요해요.
정적 사이트의 잠금은 이미 잠금 해제한 사람이 복사·저장·공유하는 것을 막지 못해요.
저장소/배포 권한이 탈취되면 잠금 코드를 바꿔 비밀번호를 수집할 수도 있어요.

추후 별도 승인을 받아 진행할 순서는 다음과 같아요.

1. 현재 로컬 전환 및 새 배포를 먼저 완료하고 필요한 원본을 사용자 로컬에 안전하게 보관해요.
2. 과거 브랜치·태그·PR·Actions/Pages artifact와 사진 원본의 존재 범위를 조사해요.
3. 사용자 승인 후 `git filter-repo` 범위와 영향을 확정하고 이력 재작성·강제 push를 진행해요.
   복원 기준 커밋도 없어지므로 최초 migrate 방식은 더 이상 사용할 수 없어요.
4. 협업자에게 재클론을 안내하고, 필요하면 GitHub 지원에 캐시된 민감 자료 삭제를 요청해요.
   외부 fork·다운로드·검색 캐시는 완전 삭제를 보장할 수 없어요.

이번 변경에서는 이력 재작성·강제 push·기존 공개 자료의 영구 삭제를 실행하지 않았어요.

## 검증 기록

- 전체 자동 테스트: 75개 파일 / 381개 테스트 통과(2026-11-15).
- 기존 실제 콘텐츠·사진 18개를 메모리 복원하고, 폐기할 임시 키로 암호화·복호화하여 전체 바이트 일치 확인. 임시 암호문은 검사 후 제거했어요.
- 합성 데이터로 재암호화·왕복 복호화·비밀번호 회전·오입력·변조·파일 치환·KDF 변조 검사.
- 전체 format:check는 기존 파일 156개의 포맷 차이로 실패했어요. 기존 파일 일괄 포맷은 하지 않았고 변경 파일 포맷은 별도 검사했어요.
- 린트 통과. 합성 콘텐츠로 전체 프로덕션 빌드 및 복사 후 보안 검사 통과.
- 브라우저: 합성 데이터로 잘못된 암호 거부, 빈 입력·표시 전환·Enter·재잠금, 기존 p5 카드 초기화·드래그와 갤러리 12장 디코딩 확인. 뷰어 조작·계좌 복사 완료 검증은 남아 있어요.
- 실제 비밀번호 설정/실제 데이터 재암호화, 실제 모바일, 운영 URL 재검증: 아직 미실행.
- 실제 전환 전 최종 브랜치 빌드는 의도적으로 실패해요. 실패를 우회해 배포하지 마세요.

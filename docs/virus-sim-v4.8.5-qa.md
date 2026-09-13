# Virus Sim v4.8.5 QA

## 자동 검증

| 게이트                 | 결과                       |
| ---------------------- | -------------------------- |
| `npm run lint`         | PASS                       |
| `npm run format:check` | PASS                       |
| `npm run test`         | PASS — 43 files, 241 tests |
| `npm run build`        | PASS                       |

v4.8.5 전용 테스트 9개가 다음 조건을 직접 고정한다.

- Catalog와 dimension/signature/source/explanation/history 95종 유지
- Rubella high/low의 E1/E2 row와 비정이십면체 grid-like core
- Orthoflavivirus 4종 high/low의 E/M raft와 irregular inner RNP
- HCV high/low의 불규칙 envelope, sparse E1/E2와 lipoprotein patch
- Yellow fever PDB 6IW4의 protein/X-ray source scope
- Nipah G / Measles H / Mumps HN component ID
- CCHF / Hantaan의 독립 profile·source와 보수적 geometry 공유
- 95종 high/low finite bounds와 part/layer contract

기존 전체 회귀에는 95종의 surface/transparent/section/exploded 상태 전환,
genome/layer visibility, scanner, native select와 모바일 레이아웃 계약이 포함된다.

## 브라우저 QA 제한

로컬 Vite 서버는 정상 시작했지만 원격 브라우저가 `127.0.0.1` 접근을
`ERR_BLOCKED_BY_CLIENT`로 차단해 실제 GPU/WebGL 화면의 육안 검증은 수행하지 못했다.
따라서 브라우저 자동화로 확인할 수 없었던 항목은 실제 기기에서의 미세한 겹침,
재질 인상과 프레임 성능이다. 모델 생성·전환·관찰 상태·리소스 계약은 자동 테스트와
프로덕션 빌드로 검증했다.

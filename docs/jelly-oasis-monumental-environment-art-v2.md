# Jelly Oasis — Monumental Environment Art v2 검수

> 2026-10-13 반영 기록: 사용자가 13:53 KST에 현재 작업본의 master 반영을 요청했고, 16:04 KST에 이미지 인코딩·전송 없이 재개하도록 지시했어요. 아래는 반영 전 검수 기록이에요. 미관 NEEDS_REVISION과 CPU 배치 비용 증가는 그대로 남아 있어요. 이미지·이미지 내장 HTML·대용량 캡처 JSON은 이번 반영에서 제외했어요. 이전 전체 검수 자료는 전달한 복원 ZIP에 보존돼 있어요.

**기술 QA는 통과했지만 미관 자기검수는 NEEDS_REVISION이에요. ART_USER_REVIEW는 PENDING이며, master에 반영하지 않았어요.**

- 기준: `1a74835b614097afb8fe7d358a1b93afd5791e23`
- 구현 커밋: `ad1113f0ceeba1fbe1e432a64a51daacf912f83e`
- 로컬 브랜치: `feat/jelly-oasis-monumental-art-v2`
- GitHub push: 자동 승인 검토가 외부 공개 저장소 게시에 대한 명시적 승인이 부족하다고 차단했어요. 원격 게시·Actions·배포는 수행되지 않았어요.
- 기존 배포 주소: https://cjftya.github.io/projects/jelly-oasis/ (이 작업본이 배포된 주소가 아니에요.)

## 채택한 방향과 변경

A안의 C자형 능선이 오아시스를 감싸는 구도를 채택했어요. B안은 두 암벽 사이 틈이 더 크고 동쪽 벽이 강해서 중심 공간의 연결감이 약했어요. A/B는 동일 카메라, 정오 CLEAR, DPR 1, 그림자 켜짐, 동작 줄이기로 비교했어요. Blockout은 작은 식생 그룹을 숨긴 실제 장면이며 원본 GLB는 남겼어요.

큰 구체형 ridge와 boulder 배치를 없애고 실제 heightfield에 연속 능선을 넣었어요. 60m 중심과 네 절단 경계는 기존 높이를 보존해요. 나무는 비대칭 넓은 수관·층층 침엽수·낮은 어린 나무로 나누고, 리본 형태 군락 안에서 수종을 번갈아 배치해요. 서쪽에는 진입 통로를 남겼어요. 꽃은 유기적인 지면 색면과 낮은 다발로 통합했어요. 첫 화면/Reset은 감상 구도이고 전체 보기 버튼은 무대 전체를 보여줘요.

16개 GLB와 호수 수면 크기, 호수 굴착, pond-only GPGPU/CPU 동작은 보존했어요. 타 프로젝트와 인덱스 리다이렉트는 수정하지 않았어요.

## 같은 조건에서 측정한 변화

| 지표 | 기준 | 작업본 |
| --- | ---: | ---: |
| 보조 나무 | 80 | 227 |
| 독립 ridge / boulder | 10 / 8 | 0 / 0 |
| 초원 인스턴스 | 445 | 142 |
| Draw calls | 67 | 65 |
| 렌더 삼각형 | 149233 | 210705 |
| Geometry / texture | 93 / 10 | 93 / 10 |
| CPU 배치 중앙값 (ms) | 281.8 | 825.6 |

초원 인스턴스는 꽃 개수와 같지 않아요. 작업본의 꽃 인스턴스는 5개 줄기를 묶은 다발이에요. 오브젝트 개수가 줄었다는 이유로 미관 개선을 판정하지 않았어요. CPU 값은 같은 Node 환경에서 실제 GLB/지면을 사용해 준비 1회 후 5회 배치한 중앙값이며, 모바일 프레임 성능이 아니에요. 배치는 로드/재배치 때만 실행해요. 이번 측정에서 배치 CPU 비용은 약 2.9배로 늘었어요. 나무 수 증가와 기울기/보호 구역 검사 비용을 포함하므로 성능 개선으로 보고하지 않아요. 실제 모바일 초기 로딩 영향은 추가 확인이 필요해요.

반복 재생성 3회의 리소스 계측은 모두 `{'geometries': 95, 'textures': 8, 'instances': 227}`로 동일해요. 이 계측은 그림자를 끈 별도 회귀 단계라 첫 화면 계측과 조건이 달라요.

## 기술 검증

- lint / TypeScript+Vite build: PASS.
- 기존 64개 파일 325개 테스트 + 신규 1개 파일 3개 테스트: 총 328개 PASS.
- 신규 지형 검사: 중심/경계 높이 보존, 연결된 능선, 모든 삼각형의 양의 면적/상향 방향, 실제 삼각형 중심과 배치 sampler 일치.
- 1440×900 / 390×844 / 360×780 / 844×390: 장면 QA PASS.
- 320 / 224 / 192m × 네 화면비: 재생성, 보호 루프·clearing·arch approach·passage, GLB 로딩 QA PASS.
- GPGPU 수면 파문 전파, 비/안개/맑음 전환, CPU fallback, context loss/restore, pagehide/pageshow, 로드 중 dispose, GLB 404 처리: PASS.
- 초기 구도 ↔ 전체 보기 ↔ Reset, 수동 회전 후 resize, portrait Reset: PASS.
- GLB 16종 SHA-256은 기준과 모두 일치해요.
- 소프트웨어 렌더러에서는 회전 감속과 날씨 전환이 기본 30초 대기 한도를 넘을 수 있어 QA의 대기 한도만 120초로 조정했어요. 앱의 속도·전환 로직은 바꾸지 않았어요.

## 미관 평가 — 평균점수로 통과시키지 않음

| 항목 | 기준 → 작업본 (0–5) | 관찰 | 근거 |
| --- | --- | --- | --- |
| 전체 실루엣 | 2 → 3 | 독립 암석이 연속 지형으로 통합됨. 중앙의 빈 바닥은 여전히 넓음. | overview |
| 지질 구조 | 1 → 2 | 실제 지형과 접지가 일치함. 동쪽 긴 사면의 반복 면은 미해결. | east-wide |
| 숲 형태 다양성 | 2 → 3 | 넓은 수관·침엽수·어린 나무가 구별됨. 능선의 수관 나열은 남음. | west-wide |
| 비율과 위계 | 2 → 3 | 초기·모바일에서 거목/호수/유적 관계가 읽힘. 고정 전체 보기의 중심은 작음. | medium |
| 공간 깊이 | 2 → 3 | 전경 숲, 중경 오아시스, 후경 능선의 층위가 생김. | presentation |
| 밀도와 리듬 | 2 → 3 | 혼합 수종과 서쪽 통로가 군락에 변화를 줌. 바닥과 숲 사이 연결은 더 필요함. | west |
| 색상·초원 연결 | 2 → 3 | 꽃을 낮은 다발과 지면 색면으로 통합함. 보라 계열 색면은 약함. | overview |
| 카메라·모바일 | 1 → 3 | 감상용/전체 보기 분리, 조작 회귀 없음. 기존 북쪽 근접 시점 가림은 미해결. | north |

**미해결 게이트:** 기존 북쪽 고정 카메라에서 절벽이 프레임을 지배해요. 동쪽의 긴 사면도 아직 규칙적인 벽처럼 보이는 부분이 있어요. 전체 보기에서 중앙의 존재감이 충분하다고 보기도 어려워요. 따라서 계획서의 미관 하드 블로커가 모두 해소됐다고 선언하지 않았어요.

북쪽/서쪽/동쪽의 넓은 시점도 기준과 동일 좌표로 추가 촬영했어요. 넓은 시점은 보조 근거이며, 기존 근접 시점의 문제를 대체하거나 숨기는 용도로 사용하지 않아요. 후속 수정은 북쪽 시선과 동쪽 단면을 함께 만족하는 비대칭 지형 단차/안부에 집중해야 해요. 카메라만 옮기거나 소품을 더 넣는 것으로 완료하지 않아요.

실제 Galaxy Fold FPS·발열·장시간 GPU 메모리는 NOT_TESTED예요. QA 환경의 한글 글리프 부재는 경관 결함과 별개예요.

## 재현

```bash
npm ci
npm run lint
npm test -- --maxWorkers=2
npm run build
OASIS_QA_OUTPUT=artifacts/jelly-oasis/monumental-art-v2/final/technical node scripts/monumental-browser-qa.mjs
OASIS_QA_OUTPUT=artifacts/jelly-oasis/monumental-art-v2/final/lifecycle node scripts/scenery-lifecycle-qa.mjs
node scripts/monumental-camera-qa.mjs
POND_QA_TIMEOUT=120000 POND_QA_OUTPUT=artifacts/jelly-oasis/monumental-art-v2/final/pond node scripts/pond-only-browser-qa.mjs
OASIS_QA_OUTPUT=artifacts/jelly-oasis/monumental-art-v2/final/rescale node scripts/map-rescale-browser-qa.mjs
OASIS_QA_OUTPUT=artifacts/jelly-oasis/monumental-art-v2/final/rescale node scripts/map-rescale-lifecycle-qa.mjs
OASIS_QA_OUTPUT=artifacts/jelly-oasis/monumental-art-v2/final node scripts/flower-meadow-failure-qa.mjs
```

Chromium 경로는 `OASIS_QA_BROWSER`/`POND_QA_BROWSER`로 지정할 수 있어요. 새 아트 캡처는 `node scripts/monumental-art-browser-qa.mjs`를 실행해요. 기준 캡처의 JSON에서 카메라를 읽고 좌표 오차 1e-8 이내를 검사해요. A/B는 `OASIS_ART_QUERY='&art=a&blockout'` 또는 `b`를 사용해요. CPU 비교 스크립트는 `scripts/monumental-placement-benchmark.mjs`예요. 저장소와 같은 상위 폴더의 `baseline`에 기준 커밋을 체크아웃하고 의존성을 설치한 뒤, 두 소스 트리의 TypeScript를 Node용 ESM으로 번들해 실행해요. 준비 1회와 측정 5회는 스크립트에 고정돼 있어요. 상세 결과는 `artifacts/jelly-oasis/monumental-art-v2/qa-summary.json`과 각 단계 JSON을 확인해 주세요.

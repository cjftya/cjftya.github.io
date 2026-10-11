# Jelly Oasis — Modeling & Scene Integration Review v2

2026-10-12 KST · Phase A 재검수 · 기준 `c56880bae07fb68a11dde0f57b4c48f5b9c7ec92`.

**결론: 기술 검수 PASS, 기존 미관 WARN 유지, 최신 실시간 시각 검수 NOT_TESTED.** 확인한 범위에서 신규 BLOCK은 발견하지 않았지만 최신 화면 전체에 BLOCK이 없다고 확정하지 않는다. 모델/물 시스템 구현은 수행하지 않았다. 사용자 “완료후 마스터에 반영” 지시에 따라 **이 보고서와 작은 JSON 계측 근거만** master 반영 대상으로 삼는다.

## 기준선과 보존

새 독립 clone에서 시작했다. HEAD/master/origin/master 및 `git ls-remote origin refs/heads/master`는 모두 위 SHA였고 시작 트리는 clean이었다. 기존 `/workspace/scratch/d2d6594632c7/repo`에는 PNG/MP4 미커밋 변경 2개가 있었으므로 그 트리에서 작업하지 않았다. 이번 환경에서 열린 Blender 프로세스는 확인되지 않았고, 사용자 PC의 live Blender·dirty 여부는 확인 불가다. Blender 파일을 열거나 종료·저장하지 않았다.

선행 5개 보고서를 읽고 재사용했다: [전수검수](jelly-oasis-modeling-review-before-crystal-v1.md), [Crystal 제작](jelly-oasis-crystal-accent-detail-v1.md), [미관 개선](jelly-oasis-aesthetic-improvement-execution-v1.md), [GPGPU 확정](jelly-oasis-gpgpu-pond-surface-prototype-v1.md), [폭포 후보](jelly-oasis-waterfall-flow-rebuild-v1.md).

현재 실제 기본 GLB 16개를 미관 개선 구현 완료 커밋 `0fde011caf89aae61d260e0ac1ae6d74880a2558`과 바이트 비교했고 **16/16 동일**했다. 로더의 파일 선택 분기도 유지되며, 이후 로더 변경은 InstancedMesh.dispose 추가다. 단, 장면 코드는 이후 물 후보·분지·카메라 제약 변경이 있으므로 자산 동일성을 최신 렌더 동일성으로 확대하지 않는다. `landmarkCamera.ts`는 polar angle 상한이 `Math.PI - 0.01`로 바뀌어 추가 회전 시 과거 시점 검증과 다르다.

## 기본값과 후보 매핑

공통 경로: `public/assets/jelly-oasis/landmarks/overgrown-ruin/`. 아래 16모듈 표가 실제 일반 기본 파일명이다.

| 조건                                                        | 실제 선택                                                                                          | 구분                                       |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| 일반 URL 또는 `?debug`                                      | tree/pond/cliff의 `aesthetic-improvement-v1/*_Refined_v1.glb`, 상세 유적·뿌리, 기존 rocks/crystals | 일반 기본; soft inspection 수면            |
| `?debug&aesthetic=baseline`                                 | Tree_Landmark_Detail_v1, PondEdge_Blockout_Detail_v2, Cliff_Waterfall_A_Detail_v1                  | 미관 개선 전 상세 비교                     |
| `?debug&tree=blockout` / `pond=blockout` / `cliff=blockout` | 각 모듈 원래 `모듈명.glb`                                                                          | blockout 비교                              |
| `?debug&tree=detail` / `pond=detail-v2` / `cliff=detail`    | 위 3개 기존 상세 GLB                                                                               | refined 기본과 별개                        |
| `?debug&crystal=detail`                                     | `crystal-accent-detail-v1/Crystal_Blockout_[A/B/C]_Detail_v1.glb`                                  | 이미 제작된 후보; 기본값 아님              |
| `?debug&waterfall=v8&surface=gpgpu-proto`                   | 기존 GLB + GPGPU 수면 후보                                                                         | 사용자가 방식 확정; production 활성화 별도 |
| 위 조건 + `flow=fall-v1`                                    | 기존 GLB + 낙하 film 후보                                                                          | 기술 검증·master 반영과 아트 승인 구별     |

`debug` 없는 후보 쿼리는 위 선택을 활성화하지 않는다. **일반 기본 화면에는 최신 GPGPU 호수/film 폭포가 자동 적용되지 않는다.** 이전 보고서의 “폭포 없음”을 현재 모든 후보 상태에 대한 진단으로 재사용하지 않았다.

통합 시 특히 주의할 차이: continuous v7/v8 또는 basinOnly 후보는 shore/bank role 메시 **2개를 숨기고** 지형을 굴착하며 수면 레벨을 별도로 정한다. 일반 기본은 원래 inspection 레벨을 유지한다. 따라서 기본 화면의 밝은 둑 WARN을 GPGPU 후보에서 그대로 보이는 결함으로 간주하거나, 후보의 숨김을 GLB 누락으로 판정하지 않는다. 최신 후보의 가림·겹침은 이번 WebGL 실패로 NOT_TESTED다.

## 16개 모듈 검사표

‘수치 PASS’는 실제 GLB 로딩/접지 알고리즘·동선 표본 재계산 결과다. 연속 표면 접촉이나 눈에 보이는 관통 부재의 증명은 아니다. 시각 의견은 **과거 캡처를 이번에 다시 열어 본 결과**이며 최신 HEAD 신규 캡처가 아니다. 표의 상대 이미지 이름은 미관 개선 artifacts 폴더 기준이다.

| 모듈                    | 실제 GLB                                                         | 기준선 대비 변경                                      | 실루엣              | 접지                       | 로우폴리 일관성      | 가독성            | 결함 정도                            | 근거                               | 다음 조치                  |
| ----------------------- | ---------------------------------------------------------------- | ----------------------------------------------------- | ------------------- | -------------------------- | -------------------- | ----------------- | ------------------------------------ | ---------------------------------- | -------------------------- |
| Cliff_Waterfall_A       | `aesthetic-improvement-v1/Cliff_Waterfall_A_Refined_v1.glb`      | 10/10 전수검수 이후 refined 적용; 미관 개선 이후 동일 | 단일 암벽·홈 유지   | 수치 PASS                  | Flat                 | 밝은 수평 띠      | WARN(과거 근거)                      | cliff/refined/cliff-front-noon.png | P3 보류                    |
| Rock_Large_A            | `Rock_Large_A.glb`                                               | 동일                                                  | 크기·폭 차등 유지   | 수치 PASS                  | Flat                 | 과거 PASS         | PASS(기술) / 시각 미검증             | 기존 전수 캡처·현재 JSON           | 유지                       |
| Rock_Large_B            | `Rock_Large_B.glb`                                               | 동일                                                  | 크기·폭 차등 유지   | 수치 PASS                  | Flat                 | 과거 PASS         | PASS(기술) / 시각 미검증             | 기존 전수 캡처·현재 JSON           | 유지                       |
| Rock_Large_C            | `Rock_Large_C.glb`                                               | 동일                                                  | 크기·폭 차등 유지   | 수치 PASS                  | Flat                 | 과거 PASS         | PASS(기술) / 시각 미검증             | 기존 전수 캡처·현재 JSON           | 유지                       |
| Rock_Large_D            | `Rock_Large_D.glb`                                               | 동일                                                  | 크기·폭 차등 유지   | 수치 PASS                  | Flat                 | 과거 PASS         | PASS(기술) / 시각 미검증             | 기존 전수 캡처·현재 JSON           | 유지                       |
| Rock_Large_E            | `Rock_Large_E.glb`                                               | 동일                                                  | 크기·폭 차등 유지   | 수치 PASS                  | Flat                 | 과거 PASS         | PASS(기술) / 시각 미검증             | 기존 전수 캡처·현재 JSON           | 유지                       |
| Ruin_Arch_A             | `Ruin_Arch_A_Detail_v1.glb`                                      | 동일                                                  | 석재 규칙성 유지    | 수치 PASS                  | Flat                 | 아치/벽 규칙적    | WARN(아치·벽) / BrokenWall 과거 PASS | 기존 arch/ground·현재 JSON         | P3 보류                    |
| Ruin_Wall_A             | `Ruin_Wall_A_Detail_v1.glb`                                      | 동일                                                  | 석재 규칙성 유지    | 수치 PASS                  | Flat                 | 아치/벽 규칙적    | WARN(아치·벽) / BrokenWall 과거 PASS | 기존 arch/ground·현재 JSON         | P3 보류                    |
| Ruin_BrokenWall_A       | `Ruin_BrokenWall_A_Detail_v1.glb`                                | 동일                                                  | 석재 규칙성 유지    | 수치 PASS                  | Flat                 | 아치/벽 규칙적    | WARN(아치·벽) / BrokenWall 과거 PASS | 기존 arch/ground·현재 JSON         | P3 보류                    |
| Tree_Landmark_Blockout  | `aesthetic-improvement-v1/Tree_Landmark_Blockout_Refined_v1.glb` | 10/10 전수검수 이후 refined 적용; 미관 개선 이후 동일 | 28m 수관·줄기 유지  | 수치 PASS                  | 11866/11866 Flat     | 추가 가지 끝 노출 | WARN(과거 근거)                      | tree/refined/tree-under-noon.png   | P2 국소 접점 후보          |
| Root_Large_A            | `Root_Large_A_Detail_v1.glb`                                     | 동일                                                  | 연결 구조 유지      | 수치 PASS                  | Flat; runtime 재계산 | 과거 접합 PASS    | PASS(기술) / 시각 미검증             | 기존 root-ruin·현재 JSON           | 유지                       |
| Root_Tree_Base_Blockout | `Root_Tree_Base_Blockout_Detail_v1.glb`                          | 동일                                                  | 연결 구조 유지      | 수치 PASS                  | Flat; runtime 재계산 | 과거 접합 PASS    | PASS(기술) / 시각 미검증             | 기존 root-ruin·현재 JSON           | 유지                       |
| PondEdge_Blockout       | `aesthetic-improvement-v1/PondEdge_Blockout_Refined_v1.glb`      | 10/10 전수검수 이후 refined 적용; 미관 개선 이후 동일 | 비대칭 둑 유지      | 수치 PASS; 연속접촉 미증명 | 720/1176 Flat        | 밝고 얇은 띠      | WARN(과거 근거)                      | pond/shore/pond-top-noon.png       | P3; 물 후보와 분리         |
| Crystal_Blockout_A      | `Crystal_Blockout_A.glb`                                         | 동일                                                  | A/B/C 동일 blockout | 수치 PASS                  | Flat                 | 분홍·보라 반복    | WARN(선택된 기본)                    | 기존 crystal QA·현재 JSON          | P2 기존 detail 재사용 검토 |
| Crystal_Blockout_B      | `Crystal_Blockout_B.glb`                                         | 동일                                                  | A/B/C 동일 blockout | 수치 PASS                  | Flat                 | 분홍·보라 반복    | WARN(선택된 기본)                    | 기존 crystal QA·현재 JSON          | P2 기존 detail 재사용 검토 |
| Crystal_Blockout_C      | `Crystal_Blockout_C.glb`                                         | 동일                                                  | A/B/C 동일 blockout | 수치 PASS                  | Flat                 | 분홍·보라 반복    | WARN(선택된 기본)                    | 기존 crystal QA·현재 JSON          | P2 기존 detail 재사용 검토 |

## 과거 WARN의 현재 상태

| 10/10 WARN          | 판정                         | 구분 근거                                                                                                                                                               |
| ------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 거목 Smooth·가지 끝 | 부분 개선                    | 현재 GLB의 모든 11,866 triangles가 Flat. 전체 Flat 및 한 곳 24정점 보정은 완료. 다른 노출 끝은 기존 refined 근접 캡처에서 잔존. Smooth 자체를 새 결함으로 지적하지 않음 |
| 절벽·유적 반복      | 잔존 / 부분 개선             | 절벽 98정점 국소 차등화 완료; 밝은 띠 인상은 과거 refined 화면에도 남음. 유적 풍화 후보는 폐기 완료, 다시 적용하지 않음                                                 |
| 얇고 밝은 물가      | 부분 개선 / 조건부           | 12정점·soil 보정 완료. 기본 shore의 기존 화면 WARN 유지. continuous 후보에서는 해당 메시 숨김으로 같은 평가를 적용할 수 없음                                            |
| Crystal blockout    | 조건부                       | 상세 A/B/C 제작·QA 완료. 기본 화면은 의도적으로 blockout이며 제작 누락 아님                                                                                             |
| 모바일 medium 잘림  | 개선 완료 기록 / 최신 미검증 | 390×844·360×780 구도 개선 및 기존 이미지 확인. 현행 카메라 제약 변경이 있어 최신 전체 회전·resize는 미검증                                                              |

## 이미지 근거와 미적 판단

이번에는 신규 3D 캡처를 만들지 못했다. 로컬 production build는 성공했으나 Playwright Chromium 설치가 잘못된 다운로드 내용으로 실패했다. 제공된 Cloud Browser는 로컬 서버에 접근할 수 없었고, 배포 `?debug` 진입에서도 “3D 화면을 시작하지 못했어요. WebGL을 지원하는 브라우저에서 다시 열어 주세요.”가 표시됐다. 이 현상을 프로젝트 회귀나 사용자 기기 장애로 확정하지 않는다.

다음 이미지는 **2026-10-10~11 보존 증거**다. 기본 GLB 바이트 보존을 확인했으므로 모델 형상 평가에 재사용했지만 현재 기상·물·카메라의 시각 PASS 근거는 아니다.

- [전체 정오](../artifacts/jelly-oasis/aesthetic-improvement-v1/integrated/desktop-refined-noon.png): 중심 랜드마크는 잘 읽히고 여백이 크다. 작은 오아시스 의도상 여백을 채우는 장식 추가를 추천하지 않는다.
- [나무 아래 정오](../artifacts/jelly-oasis/aesthetic-improvement-v1/tree/refined/tree-under-noon.png): 면의 명암은 주변 암석과 맞는다. 수관 아래 잘린 막대처럼 읽히는 여러 끝이 근접 문제의 주된 후보다.
- [절벽 정오](../artifacts/jelly-oasis/aesthetic-improvement-v1/cliff/refined/cliff-front-noon.png): 큰 띠의 반복이 남지만 전체 바위 재설계까지 필요한 근거는 없다.
- [물가 조감](../artifacts/jelly-oasis/aesthetic-improvement-v1/pond/shore/pond-top-noon.png): 일부 밝은 띠·급한 경계 변화가 보인다. non-flat shore 456 triangles는 의도한 지형 이음 처리로 유지한다.
- [390×844 medium](../artifacts/jelly-oasis/aesthetic-improvement-v1/camera/390x844-debug-medium.png): 주요 실루엣이 프레임 안에 들어오는 기존 개선 확인. 실제 휴대폰 FPS 근거가 아니다.
- Crystal A [기본](../artifacts/jelly-oasis/crystal-accent-detail-v1/blockout-Crystal_Blockout_A.png) / [상세](../artifacts/jelly-oasis/crystal-accent-detail-v1/detail-Crystal_Blockout_A.png), [상세 B](../artifacts/jelly-oasis/crystal-accent-detail-v1/detail-Crystal_Blockout_B.png), [상세 C](../artifacts/jelly-oasis/crystal-accent-detail-v1/detail-Crystal_Blockout_C.png): 기존 분홍빛보다 차분하고 군집별 기울기·비율 차이가 있다. A/B/C는 각각의 기존 앵커에 재사용할 가치가 있다. 한 종류를 세 위치에 복제하는 안은 추천하지 않는다.
- [Crystal 상세 자정](../artifacts/jelly-oasis/crystal-accent-detail-v1/detail-medium-night.png): 약한 glint가 과도한 발광으로 읽히지는 않지만 군집은 어둡고 작은 악센트가 된다. 밤 가독성 PASS로 확대하지 않는다.

기존 보고서의 ground·arch·root-ruin·RAIN/MIST 검수 이력은 유지한다. 이번에는 해당 모든 시점을 새로 측정하지 않았다. 픽셀 diff, 애니메이션 중 z-fighting, 현재 후보 폭포 측면·수면 가림, 최신 모바일 portrait/landscape 모두 NOT_TESTED다.

## 기술 계측과 회귀

[이번 계측 JSON](jelly-oasis-modeling-integration-review-v2-evidence.json)에 실제 파일명·SHA256·HTTP·triangles·primitives·runtime contact/audit를 기록했다.

| 현재 측정                                    | 결과                                                                        |
| -------------------------------------------- | --------------------------------------------------------------------------- |
| 로컬 production 자산 HTTP                    | 16/16 HTTP200; 응답 bytes와 실제 소스 GLB 일치                              |
| 실제 GLTFLoader + 현행 createOvergrownRuin   | 기본/detail 모두 16개 정상 파싱·배치·dispose; 렌더 검증 아님                |
| 기본 triangles                               | 20,786; 기본/detail 중복 집계 없음                                          |
| Crystal 상세 포함                            | 20,894 (+108); 후보별 102 triangles / 4 primitives / 4 materials / 이미지 0 |
| 이미지 텍스처                                | 기본 16개 전체 0                                                            |
| 비유한 좌표 / 0면적 triangle                 | 기본 16개와 상세 Crystal 3개 모두 0                                         |
| 거목 Flat                                    | 11,866/11,866; 과거 7,680/11,866과 구별                                     |
| Shore Flat                                   | 720/1,176; 의도한 non-flat 456 유지                                         |
| 순환로 / 공터 / 접근 / 아치 통과             | 기본/detail 모두 PASS; 각각 5,040 / 3,209 / 4,212 / 1,000 표본              |
| 아치 jamb / 통과 검사 폭                     | 4.620m / 4m; NavMesh·연속 충돌 보증 아님                                    |
| 기본 수면 레벨                               | -5.389069482748612m; 굴착 후보의 수면과 구별                                |
| 현재 renderer calls / GPU 메모리 bytes / FPS | NOT_TESTED; WebGL 불가                                                      |

기본 primitives 합계는 62개다. 이는 GLB primitive 구조 수이며 렌더 calls와 같지 않다. 카메라 culling·그림자·재질 교체·지형·수면 패스가 렌더 통계에 영향을 준다. renderer.info.memory의 객체 개수도 GPU 메모리 bytes 측정값이 아니다.

**과거 동일 조건 계측만** 비교 참고로 남긴다: desktop 정오 calls 99→117, mobile 68→77 (blockout→detail). 최신 calls로 재기록하지 않는다. 모바일 그림자 정책은 이후 변경되어 과거 mobile shadow-off 측정과 현행 비용을 동등 비교할 수 없다. +108 triangles만 보고 성능 영향이 없다고 판단하지 않는다.

| 이번 실행                                                                                                                                                              | 결과                                           |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `npm run lint`                                                                                                                                                         | PASS                                           |
| `npm run build`                                                                                                                                                        | PASS: TypeScript + Vite production build       |
| `npx vitest run tests/jelly-oasis-landmark.test.ts tests/jelly-oasis-basin.test.ts tests/jelly-oasis-terrain.test.ts tests/jelly-oasis-surface.test.ts --maxWorkers=2` | PASS: 4 files / 22 tests                       |
| 전체 suite / 기존 browser QA                                                                                                                                           | 이번 미실행; 이전 전수 기록은 선행 보고서 참고 |
| live Blender / 실기 모바일 / 장시간 GPU 누수                                                                                                                           | NOT_TESTED                                     |

basin test가 기존 `artifacts/jelly-oasis/basin-watercourse-v1/geometry-qa.json`을 재생성했다. 이번 독립 clean clone에서 해당 **테스트 생성 변경만** 시작 HEAD의 원래 내용으로 되돌려 반영 대상에서 제외했다. 사용자 파일은 수정하지 않았다.

## 잔여 후보 TOP 5와 다음 구현 추천

다음 우선순위는 현재 WebGL 시각 미검증을 전제로 하는 제안이다. P1을 요구하는 신규 심각한 결함은 확인하지 못했다.

| 순서 / 판정                   | 조건·영향                                                                              | 최소 다음 접근                                                                         | 효과 대비 작업량                                    | Blender/메모리 위험                                | 성능 영향·재사용                                                                                  |
| ----------------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 1 P2 / Crystal 기본 전환 검토 | 기본은 동일 blockout; detail은 기존 정오 비교에서 형태·색 차등화가 나음, 밤에는 어두움 | 기존 A/B/C를 재사용하고 primitive 비용 확인·최소 재질 결합 후보 비교 후 기본 전환 판단 | 형상 재제작 없이 작은 작업; 전체 장면 효과는 제한적 | GLB/코드 조사부터 가능, live Blender 불필요        | +108 triangles; 과거 +18 desktop calls. 앵커·지지점·색 유지하고 최신 낮밤/mobile A/B 통과 후 결정 |
| 2 P2 / 가지 끝 접점           | 나무 아래 가까운 시점에서 남은 막대 끝                                                 | 실제 거슬리는 끝 1~2곳만 수관 접점·끝 방향 보정                                        | 근접 효과 중간, 작업량 중간                         | 단일 컬렉션 background 읽기만; live 전수 열람 금지 | triangles/materials 증가 없이 가능; 기존 refined tree 재사용                                      |
| 3 P3 / 절벽 띠                | 정오 정면에서 3층 수평 반복                                                            | 일반 카메라에서도 영향이 크면 홈 밖 극소 구간 후보만 비교                              | 이전 변경 효과가 작아 우선순위 낮음                 | 국소 메시 작업; background 문서                    | 기존 자산 재사용; 물 경로/shared boundary 보존                                                    |
| 4 P3 / 기본 shore 띠          | 일반 기본 조감에서 밝은 경계                                                           | 최종 사용 화면에서 실제 보이는지 먼저 판정; 후보의 hidden shore는 대상에서 제외        | 효과 작고 수면 경계 영향 위험 대비 낮음             | 기존 shore 단독 조사                               | non-flat 유지; 물 메시·수로 변경 제외                                                             |
| 5 P3 / 유적 규칙성            | 아치·벽 근접의 균일 석재                                                               | 사용자 미감 선택 뒤 제한적 손상 후보만 비교                                            | 이전 미약한 풍화가 폐기되어 낮은 우선순위           | 독립 단일 자산만                                   | 기존 detail 재사용; 아치 4m 동선 보존                                                             |

**추천 하나: Crystal Detail 기본 전환을 위한 기존 후보 재사용·비용 검토.** 이미 A/B/C가 완성되어 있어 Blender 부담이 가장 낮다. 기본 전환이나 최적화 구현은 이번에 하지 않았다. 밤 가독성과 최신 동일 카메라 calls를 확인하지 못했으므로 지금 바로 승격하는 것은 보류한다. 재검수 환경을 확보한 다음 기존 detail A/B/C를 비교하고, 추가 호출이 허용되거나 형상/재질 외관을 보존한 primitive 정리가 검증될 때만 전환한다. 새 크리스탈 제작·추가 발광·새 텍스처는 필요하지 않다.

WONT_FIX: 이미 선택된 거목 Flat, non-flat shore, 넓은 여백, 단순 바위 계열, 낮은 장식 밀도. 호수 방식은 사용자 확정대로 유지하고 물 추가 작업은 중단 상태다. 이번 추천에 물 튜닝은 포함하지 않는다.

## 종료와 master 반영 범위

보고서 및 작은 계측 JSON만 변경한다. 코드·GLB·Blender·지형·환경·물 셰이더·debug 기본값 변화는 0이다. 신규 이미지/영상/대용량 binary를 제출하지 않는다. 보고서 커밋 직전 원격 HEAD를 다시 확인하고 일반 fast-forward push를 사용한다. 정확한 커밋 SHA/원격 일치는 완료 응답에서 확인한다. 문서 push로 기존 Pages workflow가 실행될 수 있지만 시각적 배포 검증을 수행했다고 주장하지 않는다.

이 실행은 **A0/A3 기술 재검수와 A4 잠정 우선순위 정리는 완료, A2 최신 화면 확인은 환경 제약으로 미완료**다. 이를 전체 비주얼 PASS로 표시하지 않는다. 후속 구현 전에 정상 WebGL 환경에서 정오·밤·RAIN/MIST·390×844·현재 물 후보 주변 가림을 최소 재검증해야 한다.

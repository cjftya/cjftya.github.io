# Jelly Oasis — 미관 개선 v1 실행 결과

2026-10-10~11 실행. **기술 검증 PASS, 메인 기본값 전환 완료.** 사용자 후속 지시에 따라 검증된 나무·연못·절벽 변경과 수면 soft 설정을 일반 화면에 적용하고 master에 반영한다. 유적 후보는 개선 효과가 불명확하여 폐기했다. 기존 미관 개선 제안서는 이 결과 보고서로 대체한다.

## ① 시작·종료 HEAD 및 브랜치

- 시작 HEAD / fetch 후 origin/master: `fd46b393cd796a72819e0a10424b00ba6dd348b3`.
- 구현 브랜치: `work/jelly-oasis-aesthetic-v1`. 구현 종료 HEAD: **`0fde011caf89aae61d260e0ac1ae6d74880a2558`**. 이 보고서·검수 근거·백업 생성 방지 설정을 후속 커밋으로 기록한다. 최종 master HEAD와 원격 일치는 최종 응답에 기재한다.
- 시작 전 미커밋 `pond-edge-detail-v2/jelly-oasis-pond-edge-detail-v2.blend`와 열린 미검증 Crystal `.blend`는 보존했다. 원본 verified Crystal 및 연못 소스의 SHA256도 동일하다.
- 기존 live Blender는 정상 응답했고 종료·저장·재시작하지 않았다. 8,193개 scene이 누적된 live 문서를 건드리지 않고 새 background 문서에서 컬렉션만 읽어 작업했다. 최종 소스는 **scene 1개**다.
- Crystal verified 소스에는 별도 `Tree_Detail_v1`·`PondEdge_Detail_v2` 컬렉션이 없어 연못 v2 소스에서 두 컬렉션을 보완했다. [실제 소스 차이](../artifacts/jelly-oasis/aesthetic-improvement-v1/source-audit.json)에는 누락된 컬렉션·메시와 해시를 기록했다.

## ② 단계별 판정

| 단계 | 판정 | 결과 |
|---|---|---|
| 0 기준선 | PASS | 실제 production 진입·Reset 및 debug overview/medium/ground를 1440×900, 390×844, 360×780, 844×390에서 구분했다. 일반 첫 화면은 월드 전체가 들어오며 잘림은 debug portrait medium에서 재현됐다. |
| 1 거목 | PASS / 일부 WARN | 기존 Smooth·전체 Flat·아래 줄기만 Flat을 비교했다. 전체 Flat은 다른 자산과 면의 스타일이 맞고, 국소 Flat은 명암 경계가 두드러져 제외했다. 기존 수관과 밑동을 유지하고 수관 아래 노출된 한 가지 끝의 24정점만 연결 방향으로 보정했다. 모든 가지 끝 문제를 해결했다고 주장하지 않는다. |
| 2 연못 | PASS / shore 미관 WARN | 남쪽 두 구간의 중간 band 12정점만 최대 수평 0.20m·높이 0.035m 보정하고 soil 색을 완화했다. 안쪽 두 열·바깥쪽 열·water guide는 동일하다. Shore 개선은 작다. 수면 soft/deep을 비교해 soft를 메인으로 선택했다. |
| 3 모바일 | PASS | debug medium만 실제 module bounds와 수평·수직 FOV로 portrait 거리를 계산한다. 일반 Reset과 desktop medium은 기존 구도를 유지한다. untouched medium은 resize에 대응하고 Orbit·줌 시작 이후에는 자동 구도 갱신을 해제한다. |
| 4 절벽 | WARN / 기술 PASS | 밝은 띠는 주로 면 방향과 조명에서 생긴다. 폭포 홈 바깥 98정점의 세 구간 ledge 높이를 국소 차등화했다. 전체 반복감 감소는 미세하며 재질·메시·triangles는 늘리지 않았다. 사용자 메인 전환 지시에 따라 적용했다. |
| 5 유적 | WARN · 판정 완료 | 아치 상단은 의도된 줄눈을 유지했다. 벽 바깥 모서리 12정점의 풍화 후보는 근접에서도 차이가 작아 폐기했다. 벽 형상을 정확한 기준선으로 복원하고 관련 자산·선택 플래그를 제거했다. |
| 6 통합 | PASS | 실제 main 자산·production 쿼리·404·reload·pagehide·그림자·동선·낮밤·비·안개·모바일 검증 완료. Crystal은 재모델링하지 않았다. |

## ③ 실제 개선 전후 근거

새 production build `http://127.0.0.1:4184`에서 검수했다. 기존/변경 비교는 위치·target·FOV·날씨·시간을 동일하게 고정했다. 모바일 전후 통합도 같은 reviewCamera를 사용했으며 제품에는 과거 QA의 1.55배 거리값을 복제하지 않았다.

일반 진입·Reset 기준선은 실제 기본 **10시 CLEAR**, debug 정오 및 대상별 정오 비교는 **12시 CLEAR**다.

| 장면 | 기존 | 변경 |
|---|---|---|
| 거목 아래 정오 | [Smooth](../artifacts/jelly-oasis/aesthetic-improvement-v1/tree/baseline/tree-under-noon.png) | [Flat·국소 접점](../artifacts/jelly-oasis/aesthetic-improvement-v1/tree/refined/tree-under-noon.png) |
| 거목 자정 | [기존](../artifacts/jelly-oasis/aesthetic-improvement-v1/tree/baseline/tree-under-night.png) | [변경](../artifacts/jelly-oasis/aesthetic-improvement-v1/tree/refined/tree-under-night.png) |
| 물가·수면 정오 | [기존](../artifacts/jelly-oasis/aesthetic-improvement-v1/pond/baseline/waterfall-facing-noon.png) | [soft 수면](../artifacts/jelly-oasis/aesthetic-improvement-v1/pond/soft/waterfall-facing-noon.png) |
| 수면 자정 | [기존](../artifacts/jelly-oasis/aesthetic-improvement-v1/pond/baseline/waterfall-facing-night.png) | [soft](../artifacts/jelly-oasis/aesthetic-improvement-v1/pond/soft/waterfall-facing-night.png) |
| Shore만 정오 | [기존](../artifacts/jelly-oasis/aesthetic-improvement-v1/pond/baseline/pond-top-noon.png) | [국소 물가 보정](../artifacts/jelly-oasis/aesthetic-improvement-v1/pond/shore/pond-top-noon.png) |
| Mobile 390×844 medium | [잘림 재현](../artifacts/jelly-oasis/aesthetic-improvement-v1/baseline/390x844-debug-medium.png) | [전체 실루엣](../artifacts/jelly-oasis/aesthetic-improvement-v1/camera/390x844-debug-medium.png) |
| Mobile 360×780 medium | [기존](../artifacts/jelly-oasis/aesthetic-improvement-v1/baseline/360x780-debug-medium.png) | [변경](../artifacts/jelly-oasis/aesthetic-improvement-v1/camera/360x780-debug-medium.png) |
| 절벽 근접 정오 | [기존](../artifacts/jelly-oasis/aesthetic-improvement-v1/cliff/baseline/cliff-front-noon.png) | [국소 띠 높이 차등](../artifacts/jelly-oasis/aesthetic-improvement-v1/cliff/refined/cliff-front-noon.png) |
| 폐기한 벽 풍화 | [기존](../artifacts/jelly-oasis/aesthetic-improvement-v1/ruin/baseline/root-ruin-noon.png) | [폐기 판단 근거](../artifacts/jelly-oasis/aesthetic-improvement-v1/ruin/refined/root-ruin-noon.png) |
| 통합 정오 | [기존](../artifacts/jelly-oasis/aesthetic-improvement-v1/integrated/desktop-baseline-noon.png) | [메인 설정](../artifacts/jelly-oasis/aesthetic-improvement-v1/integrated/desktop-refined-noon.png) |
| 통합 모바일 | [기존](../artifacts/jelly-oasis/aesthetic-improvement-v1/integrated/mobile-baseline-noon.png) | [메인 설정](../artifacts/jelly-oasis/aesthetic-improvement-v1/integrated/mobile-refined-noon.png) |

통합 RAIN/MIST·shadow-off와 전체 viewport·production 진입/Reset·회전·Ground 화면은 같은 검수 폴더에 있다. 큰 열린 틈·지형 부유·눈에 띄는 z-fighting은 검수 화면에서 발견하지 않았다. 연속 프레임 전체에 대한 무결함 보증은 아니다.

거목 높이 **28m**, 수관·밑동·뿌리 접점과 shadow 정책 유지. Shore Smooth **228 polygons / 456 triangles** 유지. 수면은 기존 MeshStandardMaterial만 사용한다: baseline `#639b9c / opacity 0.65`, soft **`#568f96 / 0.76`**, deep 비교 `#477f89 / 0.83`; roughness는 모두 **0.85**다. 새 물 엔진·굴절·반사·폭포 물줄기·파티클·Subdivision은 추가하지 않았다.

## ④ Triangles·draw calls·Crystal 조사

| 자산 | 기존 → 변경 triangles | 메인 GLB bytes |
|---|---:|---:|
| 거목 | 11,866 → 11,866 | 927,824 |
| 연못 물가 | 1,176 → 1,176 | 112,948 |
| 절벽 | 3,238 → 3,238 | 252,484 |
| 전체 16모듈 | **20,786 → 20,786** | 나머지 자산은 보존 |

| 동일 통합 카메라 | 기존 calls / rendered triangles | 변경 calls / rendered triangles |
|---|---:|---:|
| desktop 정오 CLEAR | 99 / 63,594 | 99 / 63,594 |
| desktop 자정 CLEAR | 100 / 63,594 | 100 / 63,594 |
| 390×844 touch 정오 | 68 / 38,864 | 68 / 38,864 |

[통합 계측](../artifacts/jelly-oasis/aesthetic-improvement-v1/integrated/browser-qa.json), [GLB 재수입](../artifacts/jelly-oasis/aesthetic-improvement-v1/roundtrip-audit.json), [소스 보존](../artifacts/jelly-oasis/aesthetic-improvement-v1/preservation-audit.json) 참조. Flat export 때문에 거목 정점·파일 크기는 늘어날 수 있으며 triangle 수와 draw calls 유지가 동일한 모든 GPU 비용을 보증하지는 않는다.

Crystal 기존 후보 재검수도 desktop **99→117 calls**, mobile **68→77 calls**다. 자산 triangles **20,786→20,894 (+108)**. 군집별 102 triangles, **4 primitives / 4 materials**, 세 군집 총 12 primitives다. 같은 재질 이름을 공유하는 것만으로 primitive별 렌더 호출이 합쳐지지는 않는다. 군집을 재질별로 합치려면 각각의 앵커·접지·선택·소유권을 고려한 별도 결합이 필요하므로 이번에는 조사만 기록했다. 성능 개선을 주장하지 않는다. [Crystal QA](../artifacts/jelly-oasis/aesthetic-improvement-v1/crystal-regression/browser-qa.json).

## ⑤ 실제 테스트 및 보존 계약

| 명령 / 검사 | 최종 결과 |
|---|---|
| `npm run lint` | PASS |
| `npm test -- --maxWorkers=2` | PASS · 52 files / **293 tests** |
| `npm run build` | PASS · TypeScript + Vite production build |
| `npm run qa:landmark` | PASS · 21 captures, 16모듈, errors=[] |
| `node scripts/pond-detail-browser-qa.mjs` | PASS · POND_QA_VERSION=v2, 14 captures, production 기본 GLB 확인 |
| `node scripts/crystal-detail-browser-qa.mjs` | PASS · 12 captures, blockout/detail 비용 및 production 경계 |
| `node scripts/cliff-detail-browser-qa.mjs` | PASS · 절벽 blockout/current 상세, 낮밤·기상·그림자·production panel·mobile layout |
| `node scripts/aesthetic-browser-qa.mjs` | PASS · 24 captures, 4 viewport, 재진입·Reset·Overview/Medium/Ground·resize·Orbit·줌 |
| `node scripts/aesthetic-integration-qa.mjs` | PASS · 낮밤/RAIN/MIST/shadow-off, main 자산 HTTP200, production 쿼리, 404, reload/pagehide |
| `aesthetic_roundtrip_v1.py` | PASS · 단일 scene, local origin, scale1, bounds·triangles·feet·guide 일치 |
| `aesthetic_preservation_v1.py` | PASS · 지정한 3메시만 변경, 다른 모든 메시·local transforms·원본 소스 해시 보존 |

브라우저 명령의 `LANDMARK_QA_URL`과 연못 `LANDMARK_QA_PRODUCTION_URL`은 모두 **4184**를 지정했다. QA 출력은 이 작업 폴더 하위에 분리했다. 절벽 전용 QA에는 과거 8,002/9,044 triangle 가정이 남아 있어 현재 거목·연못 + ruin blockout 구성 **18,944/19,986** 및 새 production 자산명으로 수정했다. 카메라 QA의 초기 실패는 부동소수점 미세 차이와 damping 잔여 움직임을 잘못 비교한 것으로, 좌표 허용오차와 안정화 대기를 적용한 최종 검수가 통과했다. 통합 404 검사도 실제 제품 오류 문구로 수정한 뒤 통과했다.

Z-up ↔ Y-up export/reimport, 바깥 경계·footprint·scale·origin을 검사했다. GLB에서 audit 전용 정점 welding 후 nonmanifold interior / winding / zero-area / loose 모두 0. 닫힌 거목·절벽의 boundary 0 및 signed volume 양수, 의도적으로 열린 shore의 boundary는 보존한다. 모든 삼각형의 self-intersection까지 보증하는 검사는 아니다.

월드 **320×320m**, 중심 **X70/Z58**, yaw **30°**, scale **1**, **16앵커**, BrokenWall runtime **X+4/Z+11** 유지. Loop 폭6m·5040표본, clearing 직경16m·3209표본, approach·4212표본, passage 폭4m·1000표본 모두 PASS. jamb 약 **4.62m**. 물 경계는 shore/수면/오버레이/동선에 동일 guide를 사용하며 수면 높이 **-5.389069482748612m**를 유지한다. NavMesh·연속 물리 충돌 검증은 아니다.

## ⑥ Production 기본값

사용자 지시로 **기존 기본값 유지 방침을 변경했다**. 일반 화면은 새 거목·물가·절벽 GLB와 soft 수면을 사용한다. 유적·뿌리·나머지 자산은 기존 기본값이며 Crystal은 계속 blockout이다. debug 없는 `?tree=blockout`, `?pond=detail`, `?water=deep`, `?crystal=detail` 같은 쿼리는 기본값을 바꾸지 않는다.

- 메인: `/projects/jelly-oasis/`.
- 기존 미관 비교: `?debug&aesthetic=baseline`.
- 기존 tree/pond/cliff blockout 비교는 그대로 지원한다. 명시적 debug `tree=detail`, `pond=detail-v2`, `cliff=detail`/`detail-v1`은 해당 기존 상세 GLB를 사용한다.
- 수면 비교: `?debug&water=baseline` 또는 `?debug&water=deep`.
- Crystal detail: 기존 `?debug&crystal=detail`만 사용한다.
- 최종 Blender 소스: [jelly-oasis-aesthetic-refined-v1.blend](../artifacts/jelly-oasis/aesthetic-improvement-v1/jelly-oasis-aesthetic-refined-v1.blend).

## ⑦ 정리 내역 및 남은 과제

사용자 요청으로 더 이상 사용하지 않는 `.blend1` 자동 백업 8개, 검증본으로 대체된 미검증 Crystal GLB, 기준선 임시 `.blend`, 완료된 Flat/유적 비교 GLB 및 public과 동일한 중간 GLB를 삭제했다. 구 미관 제안서도 이 실행 보고서로 대체했다. 합계 **17파일 / 16,723,928 bytes(약 16.0MiB)**를 정리했다. 파일별 경로·bytes·SHA256·삭제 이유는 [cleanup.json](../artifacts/jelly-oasis/aesthetic-improvement-v1/cleanup.json)에 기록했다. 현재 기능의 debug 비교·재현에 쓰이는 이전 GLB/소스/검수 보고서는 사용 중이므로 보존했다. 열려 있는 사용자 Crystal 파일과 기존 미커밋 pond 소스는 삭제하지 않았다.

남은 과제: 한 곳 외의 노출된 가지 끝, shore·절벽의 작은 미관 차이, 별도 유적 풍화 설계, Crystal primitive 결합 최적화. **실기 모바일 FPS·장시간 GPU 누수는 미측정**이다. 이번 실행 중 live Blender 응답 없음은 발생하지 않았다.

재현용 background 제작 스크립트에는 `save_version=0`을 설정해 임시 작업에서 `.blend1`이 다시 쌓이지 않도록 했다. 사용자의 열린 Blender 설정은 바꾸지 않았다. `aesthetic_audit_v1.py`가 필요할 때 baseline 사본을 다시 만들므로 완료 후 삭제한 중간 `.blend`가 검수 재현을 막지는 않는다.

## ⑧ Master 반영

사용자가 메인 설정과 master push를 명시적으로 승인했다. 검증한 자산·코드·검수 근거만 커밋하고, 기존 미커밋/미검증 Blender 파일은 커밋 대상에서 제외한다. 원격 최신 HEAD를 다시 확인한 후 fast-forward로 master에 반영하고 push한다. 최종 커밋과 원격 일치는 Git 완료 기록 및 최종 응답에 남긴다.

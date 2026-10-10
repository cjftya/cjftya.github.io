# Jelly Oasis — Crystal Accent Detail v1

상태: **Phase B 제작·통합·검증·보고 완료 — PASS.** Phase A WARN 게이트 이후 사용자 승인으로 진행했다. 후보 브라우저 QA까지 통과했다.

2026-10-10 후속 요청: 사용자 검토 후 이 변경과 검증 산출물의 commit/push가 승인되었다. 아래 HEAD·commit/push 없음 기록은 제작 종료 당시 상태다. 일반 기본값 전환은 이번 push 범위에 포함하지 않는다. 추가 미관 개선 범위는 [미관 개선 보고서](jelly-oasis-aesthetic-improvement-plan.md)에 정리했다.

- 기준 HEAD: `11324c15a7a5f28f4d7c612b52ef35c88baaafd3` (master, 원격 일치).
- 기존 통합 Blender 파일의 미커밋 변경 및 Phase A 산출물 보존.
- 범위: 수정 A/B/C 후보만 제작. 일반 기본값은 기존 blockout 유지.
- 후보 URL: `?debug&crystal=detail`, 비교: `?debug&crystal=blockout`.
- 일반 URL과 debug 없는 `?crystal=detail` 모두 기존 blockout 유지. 실제 production 브라우저 검사 통과.
- 중단 후 재개: 후보 blend와 `artifacts/jelly-oasis/crystal-accent-detail-v1/` 로그 확인. 통과 기록이 없는 QA를 완료로 간주하지 않는다.

체크포인트: 후보 세 군집 각 102 triangles, Flat 및 바닥 지지점 18개 보존 확인. 최종 blend는 `artifacts/jelly-oasis/crystal-accent-detail-v1/verified/jelly-oasis-crystal-accent-detail-v1.blend`. 검증된 GLB는 `public/assets/jelly-oasis/landmarks/overgrown-ruin/crystal-accent-detail-v1/`의 세 파일이다. 보호된 별도 경로를 사용하는 이유는 시간 초과된 live Blender 호출의 후속 쓰기와 분리하기 위해서다. `unverified-live-export.glb` 및 검수 폴더 바로 아래의 초기 blend는 최종 산출물이 아니다.

Blender source의 빈 scene 누적으로 live MCP 호출이 시간 초과되었다. 실제 원본 컬렉션만 독립 Blender의 새 문서에 읽어 해결했으며 원본은 변경하지 않았다. 자동 승인 검토가 기존 사용자 Blender 종료를 미저장 작업 손실 가능성으로 차단했고, 종료 허용 질문은 답변 대기 중이다. 제가 시작한 중복 background 프로세스는 명령행과 PID 확인 후 정리했다. 종료 승인은 후보 제작·검증을 진행하는 데 필요하지 않다.

## 최종 모델 및 검토

[후보 production preview](http://127.0.0.1:4183/projects/jelly-oasis/?debug&crystal=detail), [기존 비교](http://127.0.0.1:4183/projects/jelly-oasis/?debug&crystal=blockout), [최종 통합 Blender](../artifacts/jelly-oasis/crystal-accent-detail-v1/verified/jelly-oasis-crystal-accent-detail-v1.blend).

세 후보 GLB 파일명은 `Crystal_Blockout_A_Detail_v1.glb` 및 B/C 대응 이름이다. 경로는 위 public 하위 폴더이며 초기 live export와 분리했다. 최종 통합 blend는 원본의 실제 `JellyOasis_Landmark_v1` 컬렉션을 읽고 Phase A 숨김 상태를 복원했다. 원본 수정은 숨겨 보존했다. 첫 GLB에는8,193 scenes가 포함되었으나 최종 export는 활성 단일 scene만 포함한다.

| 군집 | local X/Z | 결정 높이(주/옆/뒤, m) | 주 성장 방향(Blender XY, m) | triangles 기존→후보 | bytes 기존→후보 |
| ---- | --------- | ---------------------- | --------------------------- | ------------------: | --------------: |
| A    | 15 / 19   | 3.25 / 1.78 / 1.16     | +0.24 / -0.13               |            66 → 102 |  5,144 → 11,128 |
| B    | -15 / 12  | 3.45 / 1.32 / 2.04     | -0.22 / +0.12               |            66 → 102 |  5,144 → 11,168 |
| C    | 9 / -20   | 3.10 / 2.44 / 1.00     | +0.16 / +0.17               |            66 → 102 |  5,144 → 11,144 |

접지 보존을 위해 바닥 육각 기반18점은 동일하고 상부 단면·어깨 높이·첨단·기울기를 차등화했다. 전체 Flat이며 GLB102개 삼각형 모두 면별 정점 법선 일치를 unit test로 확인했다. Smooth/Subdivision 없음. 불투명 재질4개(DeepIndigo/BlueViolet/CoolFacet/QuietGlint), roughness0.61 / metallic0.04, 이미지 텍스처0. 군집당3/102 triangles만 약한 emissive: Blender strength0.18, GLB emissiveFactor `[0.018,0.027,0.0756]`. 스스로 약하게 밝아지는 표면이며 주변을 비추는 광원은 아니다. Bloom·굴절·반투명·PointLight·파티클 추가 없음.

## 동일 카메라 비교 화면

| 장면          | 기존                                                                                        | 후보                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| A 단독        | [A 기존](../artifacts/jelly-oasis/crystal-accent-detail-v1/blockout-Crystal_Blockout_A.png) | [A 후보](../artifacts/jelly-oasis/crystal-accent-detail-v1/detail-Crystal_Blockout_A.png) |
| B 단독        | [B 기존](../artifacts/jelly-oasis/crystal-accent-detail-v1/blockout-Crystal_Blockout_B.png) | [B 후보](../artifacts/jelly-oasis/crystal-accent-detail-v1/detail-Crystal_Blockout_B.png) |
| C 단독        | [C 기존](../artifacts/jelly-oasis/crystal-accent-detail-v1/blockout-Crystal_Blockout_C.png) | [C 후보](../artifacts/jelly-oasis/crystal-accent-detail-v1/detail-Crystal_Blockout_C.png) |
| 정오 CLEAR    | [기존 낮](../artifacts/jelly-oasis/crystal-accent-detail-v1/blockout-medium-noon.png)       | [후보 낮](../artifacts/jelly-oasis/crystal-accent-detail-v1/detail-medium-noon.png)       |
| 자정 CLEAR    | [기존 밤](../artifacts/jelly-oasis/crystal-accent-detail-v1/blockout-medium-night.png)      | [후보 밤](../artifacts/jelly-oasis/crystal-accent-detail-v1/detail-medium-night.png)      |
| 390×844 touch | [기존 mobile](../artifacts/jelly-oasis/crystal-accent-detail-v1/blockout-mobile.png)        | [후보 mobile](../artifacts/jelly-oasis/crystal-accent-detail-v1/detail-mobile.png)        |

[Blender 사선 미리보기](../artifacts/jelly-oasis/crystal-accent-detail-v1/blender-candidates.png)는 Workbench 재질 색 렌더이며 발광의 판단은 Three.js 기준이다. 일부 뒤쪽 결정은 전면에서 가려지지만 사선에서3개를 확인할 수 있다. 후보는 기존보다 차분한 색과 좁은 발광 면적으로 주인공을 압도하지 않는다. 비교 화면에서 심한 부유·열린 틈·지형 교차는 발견하지 않았다. mobile 검수 카메라만 medium보다1.55배 멀리 두었고 제품 카메라는 수정하지 않았다.

## 검사 결과

| 검사                                       | 결과                                                                                     |
| ------------------------------------------ | ---------------------------------------------------------------------------------------- |
| Blender export/reimport                    | PASS: triangles·bounds 일치, signed volume >0                                            |
| topology                                   | PASS: nonmanifold/winding/loose vertex/zero-area 모두0                                   |
| GLB                                        | PASS: local origin·scale1·identity node transform·단일 scene·불투명·텍스처0              |
| 배치/접지                                  | PASS: 원본18점 및 전체16모듈 contact·placement 동일, 재배치 drift 없음                   |
| 보존                                       | PASS: 기존28개 tracked 파일, GLB SHA256 동일, layout JSON 내용 동일(Windows 줄바꿈 구분) |
| 원본 blend                                 | PASS: Phase A 보존 사본과 SHA256 동일, 기존 미커밋 변경 그대로                           |
| npm run lint                               | PASS                                                                                     |
| npm test -- --maxWorkers=2                 | PASS: 52 files / **291 tests**                                                           |
| npm run build                              | PASS                                                                                     |
| npm run qa:landmark                        | PASS: 기본값16모듈·20,786 triangles·errors=[]                                            |
| node scripts/audit-crystal-assets.mjs      | PASS                                                                                     |
| node scripts/crystal-detail-browser-qa.mjs | PASS: **12 비교 캡처**, 정상 GLB HTTP200·errors=[]                                       |

근거: [mesh-audit.json](../artifacts/jelly-oasis/crystal-accent-detail-v1/mesh-audit.json), [glb-audit.json](../artifacts/jelly-oasis/crystal-accent-detail-v1/glb-audit.json), [browser-qa.json](../artifacts/jelly-oasis/crystal-accent-detail-v1/browser-qa.json), [기본값 회귀](../artifacts/jelly-oasis/crystal-accent-detail-v1/landmark-regression/browser-qa.json).

QA URL은 새 production build를 제공하는 `http://127.0.0.1:4183`. 원격 Pages는 검증·변경하지 않았다. 검사 스크립트의 초기 오류 메시지 가정과 layout raw SHA 줄바꿈 비교를 기존 일반 오류 UI 및 JSON 내용 비교에 맞게 수정한 뒤 통과했다. 제품 오류 UI는 바꾸지 않았다.

폭6m 순환로·직경16m 공터·아치 접근부·중앙4m 통과의 동선 표본 전부 PASS, jamb 약4.62m 유지. NavMesh/물리 충돌 보증은 아니다. 연못 v2 경계·수면높이 `-5.389069482748612m`·bank displacement 및 다른 자산 contact 전후 동일. 정오 태양·자정 달 castShadow/map allocated·mobile shadow-off 확인. 후보B에404 주입 시 일반 오류 표시·실패 파일 콘솔 기록·지형 유지, unit test에서 늦게 성공한15모듈 자원 해제 확인. reload 선택 유지와 pagehide API 제거 통과. 실기 mobile FPS 및 장시간 GPU 누수는 측정하지 않았다.

## 렌더 비용 및 종료

| 동일 카메라 조건  | 기존 calls / rendered triangles | 후보 calls / rendered triangles |
| ----------------- | ------------------------------: | ------------------------------: |
| desktop 정오      |                     99 / 63,594 |                    117 / 63,810 |
| desktop 자정      |                    100 / 63,594 |                    118 / 63,810 |
| touch mobile 정오 |                     68 / 38,864 |                     77 / 38,972 |

총 자산 triangles **20,786 → 20,894 (+108)**. 재질4개의 primitive 분할로 desktop +18 calls(그림자 포함), mobile +9 calls. 성능이 동일하다고 주장하지 않는다.

브랜치 master, 위 HEAD 유지. 시작 전 blend 변경 및 Phase A 산출물 보존. 변경 코드: main.ts, loader, createOvergrownRuin, debug isolate 목록, 실제 GLB 회귀 테스트. 추가: 후보GLB/blend/보고서/QA/제작·렌더 스크립트. landmarkConfig/layout/기존GLB 변경, 일반 기본값 전환, commit/merge/push 없음. Phase A의 기존 나무·절벽·연못·카메라 WARN은 수정하지 않았다. 기존 Blender 종료 승인만 답변 대기이며 후보 작업은 완료했다.

재제작은 빈 source scene을 직접 열지 않는 아래 명령을 사용한다. verified-assets의3개 GLB를 검증 후 해당 public 하위 폴더로 복사한다.

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --factory-startup --background --python-exit-code 1 --python scripts/blender/detail_crystal_accent_v1.py
node scripts/audit-crystal-assets.mjs
$env:LANDMARK_QA_URL='http://127.0.0.1:4183'
node scripts/crystal-detail-browser-qa.mjs
```

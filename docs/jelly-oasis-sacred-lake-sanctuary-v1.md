# Jelly Oasis — Sacred Lake & Magical Sanctuary v1

기준: `df8b3faa794acc71df8b2e9f5594ee65ab46ea9e` / 작업 브랜치: `feat/jelly-oasis-sacred-lake-sanctuary-v1` / 2026-10-14 KST.

호수를 넓히고 실제 수심대와 수중 식생을 만들었으며, 기존 유적의 석재 스타일로 큰 야외 성소를 추가했다. 기존 16개 GLB, layout.json, 224m 다각형 섬은 유지했다. 원본 GLB/Blender 파일을 덮어쓰지 않았다. 성소는 재현 가능한 Three.js 메시 구성 그룹이며 별도 GLB나 Blender 파일은 필요하지 않는다.

## 실제 레퍼런스와 적용 범위

- [ChuckCG — Naiad’s Pond](https://blenderartists.org/t/naiad-s-pond/1590365): 원작 이미지 직접 확인. 물속 바위·뿌리 내린 수초, 투명한 얕은 영역과 깊은 청록색 중심의 관계를 참고했다. 물고기·사실적 텍스처는 추가하지 않았다.
- [Karthik Naidu — Altar of Sacred Water](https://karthiknaiduts.artstation.com/projects/Dvo46E): 낮 이미지 직접 확인. 열린 아치와 중앙 제단의 구성 관계를 참고했다. 페인팅 텍스처·빛나는 수반은 재현하지 않았다.
- [Terdpong Pangwong — Stylized Stone Arch Gate](https://terdcg.artstation.com/projects/WXwzyN): 대표 이미지 직접 확인. 큰 접합부와 선별된 모서리 손상을 참고했다. 세밀한 PBR 조각 표현은 현재 Jelly Oasis 스타일과 맞지 않아 제외했다.

## 호수의 실제 변화

| 항목                     |                이전 |                            이번 |
| ------------------------ | ------------------: | ------------------------------: |
| 공유 guide 면적, scale=1 |          348.4243m² |                      412.8784m² |
| 면적 증가                |                   — |                        18.4987% |
| 깊은 중심의 수심         |            약 1.93m |                            2.8m |
| 공유 경계                |           v2 / 57점 | v3 / 동일 57점·동일 인덱스 연결 |
| 수중 바위                | 별도 생태 군집 없음 |         기존 A~E를 재사용한 5개 |
| 수생식물                 |      별도 군집 없음 |                   넓은 잎 4군락 |
| 수면 잎                  |                없음 |              최종 유효 위치 6개 |

최초 균등 확대에서는 물가 돌이 기존 아치 접근로의 16개 검사 표본에 걸렸다. 이를 실제 테스트로 확인하고 동쪽 X를 유지하면서 서쪽 X 1.16배, Z 1.10배로 확장 방향을 조정했다. 동일 변환을 guide와 물가 자산 전체에 적용한다. 수면·굴착·솔버 마스크·식생 제외·QA는 바뀐 guide를 공유한다. 57점을 늘리거나 일부 소비자만 별도 경계로 교체하지 않았다.

바닥은 0.08m 가장자리에서 약 0.63m 식재대로 이어지고, 중앙 2.8m까지 내려간다. 기존 반사/굴절·흡수 셰이더가 실제 수심을 사용하므로 새로운 가짜 수면·데칼·수중 가림용 평면은 없다. 얕은 곳의 바위와 수초는 수면을 통과해 읽힌다. 깊은 중심은 비워 두었다. 바위는 원본 자산의 낮은 지지 정점들을 실제 바닥에 맞춰 재접지한다.

## 성소의 실제 크기와 구도

| 항목                          | 결과                               |
| ----------------------------- | ---------------------------------- |
| 배치                          | 랜드마크 로컬 X=47, Z=9 / yaw=-60° |
| 테라스 기준 치수              | 22×12m                             |
| 아치 높이, 테라스 위          | 15.1222m                           |
| 기존 아치 약 9.5m 대비        | 약 1.59배                          |
| 거목 28m 대비 아치 높이       | 약 54%                             |
| 기초·계단 포함 전체 구조 메시 | 22×18.0447×14.8495m                |
| 아치 안쪽 폭                  | 10.3m                              |
| 성소·연결길 메시              | 4,950 triangles / 재질 1개         |

메인 아치, 실제 경사면까지 내려가는 석조 기초, 넓은 계단, 중앙 제단과 작은 무발광 인레이, 높이가 다른 보조 기둥으로 구성한다. 전체 구조의 높이는 경사면 기초를 포함하므로 테라스 위 아치 높이와 구별했다.

큰 구조물과 높은 계단은 6m 순환로 밖에 두고, 물가 연결길은 지형에 낮게 매립했다. 연결길은 기존 Rock_Large_C를 돌아간다. 그 길의 윗면은 약 0.3m 간격으로 렌더 지형을 샘플링한다. 성소·길 footprint를 주변 나무/초원/바위 배치의 제외 구역에 포함했다. 기존 랜드마크 앵커를 재배치하지 않았다.

모바일 세로 기본 화면은 개별 랜드마크와 성소의 실제 bounds를 고려해 프레임을 맞춘다. 같은 16개 모듈과 성소가 세로 화면에 들어오며, 매체별로 성소 모델을 생략하지 않는다. 기본 원거리에서는 주변 숲이 테라스의 일부를 가린다. 가까운 카메라에서 아치·제단·계단을 검수했다.

## 스타일 일관성 검수

비교 기준은 실제 기본으로 로드되는 `Ruin_Arch_A_Detail_v1.glb`, `Ruin_Wall_A_Detail_v1.glb`, `Rock_Large_A~E.glb`, refined 거목·암벽·연못이다.

- 기존 아치의 WarmGray / LightStone / ShadowStone 선형 RGB 값을 직접 가져와 새 성소의 넓은 면 색에 사용했다. 금속성 0, roughness 0.85, 텍스처 0, flat 면 처리를 유지한다.
- 새 성소는 석재 단위의 닫힌 입체와 모서리 절단, 깊이 약 3m의 아치, 넓은 받침 및 비대칭 보조 기둥으로 구성한다. torus/문짝/얇은 평면을 성소로 사용하지 않는다. 작은 문양·다중 발광 재질·미세 몰딩은 없다.
- 수중 바위는 기존 메시 자체를 재사용하므로 노멀·면 밀도·팔레트가 동일하다. 식물은 기존 식생처럼 굵은 줄기와 넓은 면으로 읽히는 작은 군락이다.
- 동일 낮/밤과 카메라에서 기존 유적·암벽·거목·새 요소를 비교했다. 기존 유적과 새 성소의 faceted 석재 및 색 관계는 일관된다. 새 성소의 줄눈과 손상은 정돈된 편이며, 미세 풍화를 더하지 않았다.
- 호숫가는 가까이 보면 지형 삼각면이 읽힌다. 기존 로우폴리 표현의 일부로 남겼고 매끈한 사실적 바닥으로 바꾸지 않았다. Naiad’s Pond의 광학적 관계를 참고했으며 사실적 렌더 품질을 그대로 달성했다고 주장하지 않는다.

## 검증 결과

- `npm run lint`, `npm run build`, `git diff --check`: 통과.
- 관련 Vitest 5파일 / 11테스트: 통과. sacred lake integration, pond-only, GPGPU pond, polygon outline, basin.
- 순환로 5,040표본, 16m 공터 3,209표본, 접근로 4,212표본, 아치 통과 1,000표본: 간섭 없음. 성소의 실제 삼각형도 검사에 포함했다.
- 바닥 재생성 2회: 같은 정점 좌표와 식생 앵커, 이전 성소 geometry 해제, terrain 원본 복구·중복 dispose 통과.
- CPU fallback은 실제 원본 GLB를 읽은 통합 테스트에서 확인했다. 데스크톱/모바일 브라우저에서는 GPGPU가 활성화됐다.
- Playwright + Chromium SwiftShader: 전체, 중간, 호수 근접, 성소 근접, 밤, 비, 390×844 세로 낮/밤 확인. JavaScript/콘솔 오류 0. PNG는 브라우저 출력 그대로 내부 검수에 사용했다.
- 성소 석재와 잠긴 바위는 castShadow/receiveShadow, 식물은 receiveShadow를 설정했다. 낮빛·달빛을 사용하며 신규 조명·Bloom은 없다.

실제 Fold/S8 등 휴대폰의 FPS·배터리·GPU 메모리 bytes와 장시간 재생은 측정하지 않았다. SwiftShader의 렌더 시간과 draw calls를 실제 기기 성능으로 해석하지 않는다. 전체 테스트 suite를 반복 실행하지 않았다. 테스트가 재생성한 기존 basin geometry-qa.json은 변경 범위에서 제외했다.

## 주요 변경 파일과 재현

- `src/jelly-oasis/landmark/sacredLake.ts`: 공통 경계 변환·면적·수심대.
- `createLakeEcology.ts`: 지형에 뿌리 내린 식생과 원본 바위 재사용.
- `createMagicalSanctuary.ts`, `sanctuaryGeometry.ts`: 재현 가능한 닫힌 석재 메시·접지·배치·리소스 소유권.
- `createOvergrownRuin.ts`: place/isolate/refreshMaterials/dispose 생애주기 통합.
- `landmarkAudit.ts`, `landmarkCamera.ts`, `landmarkDebug.ts`, `loadLandmarkAssets.ts`: 검수·카메라·선택 연결.
- `terrain/excavateTerrain.ts`, `terrain/worldCamera.ts`, `main.ts`: 바닥·모바일 기본 프레임·프로덕션 적용.
- `tests/jelly-oasis-sacred-lake.test.ts`: 실제 GLB 기반 통합 검증.
- `scripts/sacred-lake-browser-qa.mjs`: 고정 카메라 브라우저 검수. `OASIS_QA_OUTPUT`, `OASIS_QA_BROWSER`로 출력·브라우저 경로 지정 가능.

일반 화면에서 새 구성을 사용한다. 비교용 기존 구성은 `?debug&sacred=baseline`으로 확인할 수 있다. `master` 반영과 실제 Pages 공개 배포는 별도 사용자 지시에 따른다.

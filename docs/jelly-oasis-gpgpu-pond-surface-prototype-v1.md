# GPGPU Pond Surface Prototype v1 — 검증 결과

## 사용자 결정: 호수 수면 확정

2026-10-12 사용자가 “호수는 이걸로 픽스”로 이번 GPGPU 호수 수면을 확정했다. 이후 호수 작업은 이 구현을 기준으로 진행한다. 아래 ITERATE는 구현 당시의 기술 검증 결과이며, 호수 표현의 선택은 완료했다. 기본 화면 활성화나 폭포·수로 변경은 이번 확정 기록에 포함하지 않는다.

## 기술 검증 결과: ITERATE

GPU 높이장과 실제 수면 정점 변위, 높이장에서 계산한 법선, 기존 반사·굴절의 연동을 구현했다. 가까운 저각에서 단일 충격의 마루와 골이 바깥으로 전파되는 모습을 중립 진단 재질과 기존 광학 재질에서 관찰했다. 프로덕션 기본 화면과 기존 v7/v8 진입은 그대로다. `surface=gpgpu-proto`를 명시한 v8 디버그 URL에서만 활성화한다. 구현 당시에는 디버그 후보로 배포했으며, 현재 활성화 범위도 동일하다.

저각 진단에서는 기존 v8보다 단일 충격의 이동이 명확하다. 다만 원거리 폭포 카메라의 가시성, 파동의 격자 방향성, 실제 저사양 장치 성능은 후속 평가가 필요하다. GPU라는 이유만으로 자연스러움이나 성능 우위를 확정하지 않는다.

- 기준 master: `6f3e6771245eb1f97dc4c33b4fa08f92535f49c2` (작업 중 재조회에서도 동일).
- 후보 커밋: 이 문서를 포함하는 `Add opt-in GPGPU pond surface prototype` 커밋. 정확한 SHA는 Git 기록/완료 보고에 제공한다.
- 폭포/수로 경로/굴착/GLB/랜드마크 16개/환경·날씨 변경 없음.
- 이미지 생성, Blender, 미디어 Git 업로드 없음. 시각 검증 PNG는 임시 경로에서만 확인했다.

## 진입과 조작

배포 여부는 이 문서의 URL 존재만으로 판단하지 않는다. 작업 완료 보고에서 해당 커밋의 Pages workflow 결과를 별도로 확인한다.

- 기존 v8 저각: https://cjftya.github.io/projects/jelly-oasis/?debug&waterfall=v8&view=pond-low
- GPU 중립: https://cjftya.github.io/projects/jelly-oasis/?debug&waterfall=v8&surface=gpgpu-proto&view=pond-low
- GPU 기존 광학: https://cjftya.github.io/projects/jelly-oasis/?debug&waterfall=v8&surface=gpgpu-proto&material=optics&view=pond-low
- GPU 상공: https://cjftya.github.io/projects/jelly-oasis/?debug&waterfall=v8&surface=gpgpu-proto&material=optics&view=pond-top
- 원래 폭포 카메라: 위 URL의 `view`를 `waterfall`로 설정.

왼쪽 아래 GPU 패널에서 유입 OFF → 수면 초기화 → 파동 충격 순서로 조작하면 한 번의 충격만 비교할 수 있다. 중립 재질, 와이어프레임, 일시정지, 높이 배율, 감쇠, 전파 속도, 유입 OFF/NORMAL/HIGH를 제공한다. 기본 화면에는 패널과 GPU 자원이 생성되지 않는다. Reduced motion에서는 자동 수면 갱신이 정지한다.

중립 재질은 반사·굴절 capture를 끄고 단색 수면에 간단한 진단 조명을 적용한다. 파동 모양/링/UV 애니메이션은 그리지 않는다. 법선에서 나오는 하이라이트로 표면 기울기를 확인한다. 완전한 무조명 단색으로는 내부 기울기를 볼 수 없으므로, 엄밀한 무조명 조건 대신 이 진단과 와이어프레임을 병행했다.

## 구현과 원인 진단

공식 Three.js GPGPU Water의 두 시점 높이와 네 이웃 셀 전파 방식을 기반으로 하되, 초당 60 고정 스텝과 2D CFL 제한을 사용했다. Float render target 지원 확인, HalfFloat ping-pong framebuffer completeness 검사, init/compute shader 오류 처리와 v8 폴백을 포함한다.

기존 메시의 성김과 재질의 약한 기울기 표현이 동시에 가시성을 제한한다. 전체 메시 5회 분할은 333,457 정점까지 증가했으므로 폐기했다. 긴 평면 수면 변만 일치하는 중점으로 나누는 conforming tessellation으로 줄였다. 경계와 용접 접합은 기존 동일 geometry에서 유지하며, 별도 사각형 수면을 추가하지 않았다.

GPU 영역은 원래 불규칙한 호수의 삼각형과 외곽 변으로 계산한다. 육지/마른 셀은 0, 외곽 0.8m와 접합 뒤 1m는 연속 감쇠한다. 정확한 외곽 정점은 변위를 고정한다. 채널은 GPU 파동 영역에서 제외하고 기존 절차적 흐름 표현을 유지한다. GPU 실행 중 CPU v8 solver의 update는 호출하지 않는다.

재구성 때 기존 material 프로그램이 이전 uniform owner를 참조하는 문제를 발견했다. 재구성/폴백 때 material 프로그램 캐시를 해제하고 새 uniform owner로 다시 컴파일하도록 수정했다. Context restore에서도 solver/geometry/capture를 재생성한다.

## 검증 구분

| 영역 | 판정 | 근거/한계 |
|---|---|---|
| 코드 | PASS | lint, TypeScript/Vite build, 기존 전체 56파일 305테스트 통과. 추가 tessellation 테스트와 핵심 9테스트 재검증 통과 |
| 파동 계산 | PASS | GPU readback에서 충격 에너지가 바깥 반경으로 이동, NaN/최대높이 clamp에 걸린 셀 없음 |
| 시각 저각 | PASS | 중립/광학 시간별 프레임에서 파동 반경과 반사 변형의 이동 확인 |
| 시각 원거리/자연스러움 | WARN | 가까운 진단 시점보다 변화가 약하고 격자 방향성이 남음. 정식 채택 판단 보류 |
| 경계/지형/랜드마크 | PASS | seam heightDifference=0, overlappingFaces=false, 16개 유지. 검사 화면에서 외곽 사각형/겹침/틈 없음 |
| 유입 | PASS | OFF/NORMAL/HIGH 높이 차이, 같은 reset 시 동일 pulse seed로 재현 |
| lifecycle | PASS | 일시정지/재개, 3회 rebuild, WebGL context loss/restore. rebuild 후 renderer 메모리 수 일정 |
| 폴백 | PASS | EXT_color_buffer_float를 비활성화한 브라우저에서 CPU v8 표시, GPU 없음, 페이지 로드 성공 |
| 390×844 | PASS/WARN | coarse pointer에서 64², 정상 표시·조작. 실제 Galaxy/저사양 GPU 성능 검증은 아님 |
| 성능 | WARN | headless SwiftShader 검증. GPU 시간/FPS의 실장치 우위는 확인하지 않음 |

### 수면 및 GPU 비용

| 항목 | 기존 v8 desktop | GPU desktop | GPU mobile |
|---|---:|---:|---:|
| 같은 연결 수면 정점 | 21,253 | 26,187 | 10,645 |
| 같은 연결 수면 삼각형 | 41,408 | 52,076 | 21,055 |
| 시뮬레이션 해상도 | CPU 128² | GPU 128² | GPU 64² |
| 높이 render targets | 없음 | 2 | 2 |
| 높이 target bytes (두 개 합) | 없음 | 262,144 | 65,536 |
| compute | CPU substeps | 1 pass/step, 최대 3 step/update | 동일 |
| reflection/refraction | 768² × 2 | 중립 0 capture, 광학 768² × 2 | 광학 256² × 2 |

Target bytes는 초기 Float texture, mask, CPU 폴백 texture를 포함하지 않는 높이 타깃 자체의 크기다. CPU update와 GPU dispatch의 벽시계 시간은 GPU 실행 시간과 다르다. readback은 진단 API 호출에서만 수행한다. 기본 일반 페이지에는 compute pass가 없다.

3회 rebuild 뒤 renderer textures=9, geometries=56으로 일정했다(중립 진단 세션). CPU 폴백 solver는 메모리에 존재하지만 GPU 후보에서 누적 시간/업데이트가 진행되지 않는다.

### 단일 충격 샘플 (높이 배율 1, 유입 OFF)

| 요청 경과 시간 | GPU min/max, m | 계산 스텝 | 주 에너지 반경 |
|---|---|---:|---|
| 0s | 0 / 0 | 0 | 없음 |
| 1s | -0.04199 / +0.03375 | 59 | 2–3m |
| 2s | -0.02730 / +0.01591 | 119 | 4–6m |
| 4s | -0.01945 / +0.02016 | 239 | 바깥으로 퍼진 후 감쇠/경계 반응 |

요청 시간과 정확한 계산 시간은 부동소수 누적에 따라 최대 한 스텝 차이가 있으며, 각 스텝은 1/60s다. 위 값은 GPU 높이장 extrema다. 실제 화면에서는 중립/광학 파동의 이동을 별도로 확인했다. CPU v8에는 동일한 사용자 충격 입력 API가 없어, baseline 비교는 같은 카메라/시간/기존 유입 조건이며 동일 impulse 수치의 정량 A/B라고 주장하지 않는다.

유입을 reset 후 2초 진행했을 때 OFF 최대 절댓값 0m, NORMAL 0.03381m, HIGH 0.10144m였다. 원래 v8의 유량 계산과 폭포 구조는 수정하지 않았다.

## 다음 판단

사용자 검토 후 원거리 가시성, 격자 분산/자연스러움과 실장치 frame time을 기준으로 정식 수면 채택 여부를 정한다. 폭포 자유낙하/암벽 재설계는 이번 커밋에 포함하지 않는다.

공식 참고: https://threejs.org/examples/webgl_gpgpu_water.html · https://github.com/mrdoob/three.js/blob/dev/examples/webgl_gpgpu_water.html · https://threejs.org/docs/pages/GPUComputationRenderer.html

### 실시간 자동 갱신의 제한

각 후보를 SwiftShader에서 벽시계 약 6초 동안 자동 갱신했다. CPU v8은 시뮬레이션 elapsed 약 1.93초, GPU 후보는 43 step(약 0.72초)이 진행됐다. 이 환경은 렌더 지연이 크며 프레임 시간 제한으로 실시간보다 느리게 진행됐다. 따라서 이 결과를 '실시간 속도 PASS' 또는 실제 모바일 FPS로 해석하지 않는다. 시간별 전파 검증은 고정 스텝을 명시적으로 진행한 별도 검사다.

동 세션의 CPU solver 평균 update 약 16.45ms, GPU dispatch 마지막 update 약 0.20ms였지만, GPU 실행 시간과 전체 프레임 성능의 우위를 의미하지 않는다. 후보는 최대 3 compute pass/update로 비용을 제한하므로 20FPS 미만 장치에서는 시간이 버려져 파동이 느려질 수 있다. 실장치 확인 전 정식 채택을 보류하는 이유다.

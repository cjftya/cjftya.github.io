# Virus Sim v4 QA 기록

## 자동 검증

2026-09-09 UTC의 현재 작업 트리에서 확인했다.

| 항목                          | 결과 | 근거                                                        |
| ----------------------------- | ---- | ----------------------------------------------------------- |
| lint                          | 통과 | `npm run lint`                                              |
| 전체 테스트                   | 통과 | 33개 파일, 186개 테스트                                     |
| TypeScript와 production build | 통과 | `npm run build`                                             |
| 배포 경로 산출물              | 통과 | `/`, Virus Sim, Uriel, Viola와 legacy copy 유지             |
| v4 물리 mapping               | 통과 | 71개 도감 항목의 명시 profile 검증                          |
| 정지·cadence·재현             | 통과 | paused snapshot 불변, 30/60/120Hz, seed+tick command replay |
| 형태·통로                     | 통과 | capsule 방향 폭, filament 길이/깊이, 전체 AABB 출구 통과    |
| 저장                          | 통과 | 정상 round trip, 손상 JSON 삭제, engine mismatch 사유 반환  |

마지막 build의 Virus Sim 산출물은 JS 약 265.37 kB(gzip 72.60 kB), CSS 약
20.21 kB(gzip 5.01 kB)였다. 이 크기는 네트워크/CPU 성능 측정값이 아니다.

## 레이아웃 계약

소스와 산출물에서 다음 구조를 확인했다.

- `html`, `body`, `#virus-sim-app`, `.virus-app`은 viewport 높이에 고정되고 body scroll을 막는다.
- grid 순서는 header, stage, 핵심 조작, tabs, `minmax(0, 1fr)` 패널이다.
- `.stage`와 `.viewport`는 panel 내용에 따라 늘어나지 않는다.
- `.tool-panel`만 `overflow-y: auto`를 갖는 주 세로 scroll 소유자다.
- 목표 stage 높이는 desktop 53dvh, 980px 이하 48dvh, 620px 이하 43dvh,
  높이 520px 이하 36dvh다.
- mode/tab 변경 때 DOM canvas를 옮기거나 새 WebGLRenderer를 만들지 않는다.

이는 정적 계약 확인이며 아래 공개 배포 브라우저 측정과 함께 기록한다.

## 브라우저 QA 상태

공개 `https://cjftya.github.io/projects/virus-sim/`를 원격 Chrome에서 확인했다. viewport는
1363×936, body의 `scrollHeight`와 `clientHeight`는 모두 936px이었다. 측정된 세로 구획은
header 73.16px, stage 496.08px, 핵심 조작 88.44px, tabs 57.16px, panel 221.17px이며 모두
viewport 안에 있었다.

이 환경은 GPU/WebGL을 비활성화해 `THREE.WebGLRenderer`가 context를 만들지 못했다. 앱은
설계된 3D context unavailable 안내를 stage 내부에 표시했고 body 무스크롤 계약을 유지했다.
따라서 fallback 경로는 확인했지만 정상 WebGL 화면과 상호작용 검증은 완료하지 않았다.

| 확인 대상                                      | 상태          |
| ---------------------------------------------- | ------------- |
| 1363×936 문서 무스크롤과 stage 치수            | 통과          |
| WebGL context unavailable fallback 실제 화면   | 통과          |
| 1440×900, 1366×768 추가 desktop viewport       | 미검증        |
| 390×844, 430×932 모바일 핵심 버튼·panel scroll | 미검증        |
| 높이 600px 이하와 130% 글자                    | 미검증        |
| WebGL 정상 렌더와 context loss 복구            | 환경상 미검증 |
| 관찰 A/B·scanner·variant·분해·PNG 회귀         | 환경상 미검증 |
| Lab 직선·전단·와류·장애물·구조 관찰 왕복       | 환경상 미검증 |
| 71개 외관 contact sheet                        | 환경상 미검증 |
| 4개·8개 표본의 실제 frame time·GPU 자원 안정성 | 환경상 미검증 |

자동 테스트와 build 성공, WebGL 비활성 환경의 fallback 성공을 WebGL 품질이나 실제 기기
성능의 증거로 사용하지 않는다.

## 수동 확인 절차

1. desktop과 mobile에서 페이지를 열고 body scrollTop이 0인 채 stage, 핵심 조작, tabs가
   보이는지 측정한다. 하단 긴 목록은 tool panel만 scroll한다.
2. 관찰실에서 71개 도감, A/B 실제/같은 크기, linked camera, scanner, variant, 분해 후 재조립,
   즐겨찾기, 글자 배율과 PNG를 확인한다.
3. Lab에서 실행/정지 시 tick 불변, 0.25~2×, 세 flow marker와 body 반응, 점성 감소,
   obstacle gap 안전 제한, 위치 교환, 선택/all trajectory를 확인한다.
4. selected specimen 구조 관찰에 들어가 A/B와 camera를 바꾼 뒤 돌아와 원래 관찰 state와
   동일 Lab pose·환경, paused 상태가 복원되는지 확인한다.
5. quality 전환, instance 추가/삭제, mode 전환과 scanner를 반복하고 console 오류 및
   renderer memory가 계속 증가하지 않는지 확인한다.

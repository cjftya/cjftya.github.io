# Virus Sim v4 QA 기록

## 자동 검증

2026-09-09 UTC의 현재 작업 트리에서 확인했다.

| 항목                          | 결과 | 근거                                                        |
| ----------------------------- | ---- | ----------------------------------------------------------- |
| lint                          | 통과 | `npm run lint`                                              |
| 전체 테스트                   | 통과 | 33개 파일, 181개 테스트                                     |
| TypeScript와 production build | 통과 | `npm run build`                                             |
| 배포 경로 산출물              | 통과 | `/`, Virus Sim, Uriel, Viola와 legacy copy 유지             |
| v4 물리 mapping               | 통과 | 71개 도감 항목의 명시 profile 검증                          |
| 정지·cadence·재현             | 통과 | paused snapshot 불변, 30/60/120Hz, seed+tick command replay |
| 형태·통로                     | 통과 | capsule 방향 폭, filament 길이/깊이, 전체 AABB 출구 통과    |
| 저장                          | 통과 | 정상 round trip, 손상 JSON 삭제, engine mismatch 사유 반환  |

마지막 build의 Virus Sim 산출물은 JS 약 248.25 kB(gzip 68.06 kB), CSS 약
19.04 kB(gzip 4.78 kB)였다. 이 크기는 네트워크/CPU 성능 측정값이 아니다.

## 레이아웃 계약

소스와 산출물에서 다음 구조를 확인했다.

- `html`, `body`, `#virus-sim-app`, `.virus-app`은 문서 scroll을 막지 않는다.
- grid 순서는 header, 제한된 stage, 핵심 조작, tabs, 자연 높이 panel이다.
- `.stage`와 `.viewport`는 panel 내용에 따라 늘어나지 않는다.
- `.tool-panel`은 내부 scroll container가 아니며 browser document가 세로 scroll을 소유한다.
- stage 높이는 desktop `clamp(300px, 53svh, 620px)`, 980px 이하
  `clamp(260px, 48svh, 520px)`, 620px 이하 `clamp(220px, 42svh, 390px)`, 높이 520px
  이하 `clamp(160px, 36svh, 260px)`다.
- mode/tab 변경 때 DOM canvas를 옮기거나 새 WebGLRenderer를 만들지 않는다.
- 종 선택은 새 표본을 외관·전체 layer로 만들고 camera를 다시 맞춘 뒤 stage로 이동한다.

이는 정적 계약 확인이며 아래 공개 배포 브라우저 측정과 함께 기록한다.

## 브라우저 QA 상태

기존 v4 공개본은 원격 Chrome 1363×936에서 body 무스크롤과 고정 workspace를 확인했다.
v4.1은 이 계약을 의도적으로 document scroll로 바꿨으므로, 기존 측정값은 현재 합격 근거로
사용하지 않는다. 새 배포에서 scroll 높이, stage 상한과 비교 UI 제거를 다시 측정한다.

이 환경은 GPU/WebGL을 비활성화해 `THREE.WebGLRenderer`가 context를 만들지 못했다. 앱은
원격 Chrome은 GPU/WebGL을 비활성화해 정상 3D 화면과 상호작용을 확인할 수 없다. context
unavailable 안내가 stage 내부에 머무르는 fallback 경로는 새 배포에서도 확인한다.

| 확인 대상                                      | 상태          |
| ---------------------------------------------- | ------------- |
| document scroll과 stage 높이 상한              | 배포 후 검증  |
| 비교 tab·A/B control 제거                      | 배포 후 검증  |
| WebGL context unavailable fallback 실제 화면   | 배포 후 검증  |
| 390×844, 430×932 모바일 선택과 document scroll | 미검증        |
| 높이 600px 이하와 130% 글자                    | 미검증        |
| WebGL 정상 렌더와 context loss 복구            | 환경상 미검증 |
| 단일 관찰·scanner·분해·PNG 회귀                | 환경상 미검증 |
| Lab 직선·전단·와류·장애물·구조 관찰 왕복       | 환경상 미검증 |
| 71개 외관 contact sheet                        | 환경상 미검증 |
| 4개·8개 표본의 실제 frame time·GPU 자원 안정성 | 환경상 미검증 |

자동 테스트와 build 성공, WebGL 비활성 환경의 fallback 성공을 WebGL 품질이나 실제 기기
성능의 증거로 사용하지 않는다.

## 수동 확인 절차

1. desktop과 mobile에서 페이지를 열고 document가 끝까지 scroll되는지, tool panel이 별도
   scroll을 만들지 않는지, stage가 viewport보다 커지지 않는지 측정한다.
2. 관찰실에서 pan·단면·layer 숨김 뒤 다른 종을 선택하고 외관·전체 layer와 다시 맞춘 camera로
   표시되는지 확인한다. 71개 도감, scanner, 분해 후 재조립, 즐겨찾기, 글자 배율과 PNG도 본다.
3. Lab에서 실행/정지 시 tick 불변, 0.25~2×, 세 flow marker와 body 반응, 점성 감소,
   obstacle gap 안전 제한, 위치 교환, 선택/all trajectory를 확인한다.
4. selected specimen 구조 관찰에 들어가 camera를 바꾼 뒤 돌아와 원래 단일 관찰 state와
   동일 Lab pose·환경, paused 상태가 복원되는지 확인한다.
5. quality 전환, instance 추가/삭제, mode 전환과 scanner를 반복하고 console 오류 및
   renderer memory가 계속 증가하지 않는지 확인한다.

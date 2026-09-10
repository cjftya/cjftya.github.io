# Virus Sim v4.8 Fidelity Matrix와 QA

## 판정 기준

- `PASS`: catalog·signature·source·History, high/low build, part/layer, bounds, mode, scanner와 예산을 통과했다.
- `NEEDS REVIEW`: 자동 구조 검증은 통과했지만 실제 GPU 화면 확인이 제한된 항목에만 사용한다.
- `FAIL`: 선택·빌드·정합성·상호작용 또는 주요 시각 구조가 깨진 상태다.

아래 matrix의 구조/상호작용/예산은 `v4.8-final-audit.test.ts` 전수 결과다. 동일 family 내 의도된
similarity는 결함으로 보지 않으며, 색상만으로 종 차이를 만든 항목은 없다.

## 71-entry Fidelity Matrix

| ID                  | Family      | Builder            | Evidence   | 구조·출처 | High/Low | Mode·Scanner | 예산 |
| ------------------- | ----------- | ------------------ | ---------- | --------- | -------- | ------------ | ---- |
| t4                  | phage       | t4                 | observed   | PASS      | PASS     | PASS         | PASS |
| lambda              | phage       | lambda             | observed   | PASS      | PASS     | PASS         | PASS |
| t7                  | phage       | t7                 | observed   | PASS      | PASS     | PASS         | PASS |
| ms2                 | icosahedral | ms2                | observed   | PASS      | PASS     | PASS         | PASS |
| tmv                 | filament    | tmv                | observed   | PASS      | PASS     | PASS         | PASS |
| m13                 | filament    | m13                | observed   | PASS      | PASS     | PASS         | PASS |
| adenovirus-5        | icosahedral | adenovirus         | observed   | PASS      | PASS     | PASS         | PASS |
| rotavirus-rrv       | layered     | rotavirus          | observed   | PASS      | PASS     | PASS         | PASS |
| hsv1                | enveloped   | hsv                | observed   | PASS      | PASS     | PASS         | PASS |
| influenza-a         | enveloped   | influenza          | observed   | PASS      | PASS     | PASS         | PASS |
| vsv-indiana         | enveloped   | vsv                | observed   | PASS      | PASS     | PASS         | PASS |
| vaccinia-mv         | layered     | vaccinia           | observed   | PASS      | PASS     | PASS         | PASS |
| phix174             | icosahedral | icosahedral-capsid | observed   | PASS      | PASS     | PASS         | PASS |
| qbeta               | icosahedral | icosahedral-capsid | observed   | PASS      | PASS     | PASS         | PASS |
| phi29               | phage       | phage-family       | observed   | PASS      | PASS     | PASS         | PASS |
| p22                 | phage       | phage-family       | observed   | PASS      | PASS     | PASS         | PASS |
| hk97                | phage       | phage-family       | observed   | PASS      | PASS     | PASS         | PASS |
| t5                  | phage       | phage-family       | observed   | PASS      | PASS     | PASS         | PASS |
| t1                  | phage       | phage-family       | observed   | PASS      | PASS     | PASS         | PASS |
| prd1                | layered     | layered-capsid     | observed   | PASS      | PASS     | PASS         | PASS |
| phi6                | enveloped   | cystovirus         | observed   | PASS      | PASS     | PASS         | PASS |
| pm2                 | layered     | layered-capsid     | observed   | PASS      | PASS     | PASS         | PASS |
| ap205               | icosahedral | icosahedral-capsid | observed   | PASS      | PASS     | PASS         | PASS |
| ccmv                | icosahedral | icosahedral-capsid | observed   | PASS      | PASS     | PASS         | PASS |
| bmv                 | icosahedral | icosahedral-capsid | observed   | PASS      | PASS     | PASS         | PASS |
| cpmv                | icosahedral | icosahedral-capsid | observed   | PASS      | PASS     | PASS         | PASS |
| tbsv                | icosahedral | icosahedral-capsid | observed   | PASS      | PASS     | PASS         | PASS |
| stmv                | icosahedral | icosahedral-capsid | observed   | PASS      | PASS     | PASS         | PASS |
| cmv-fny             | icosahedral | icosahedral-capsid | observed   | PASS      | PASS     | PASS         | PASS |
| tymv                | icosahedral | icosahedral-capsid | observed   | PASS      | PASS     | PASS         | PASS |
| pvx                 | filament    | plant-filament     | observed   | PASS      | PASS     | PASS         | PASS |
| papmv               | filament    | plant-filament     | observed   | PASS      | PASS     | PASS         | PASS |
| pvy                 | filament    | plant-filament     | observed   | PASS      | PASS     | PASS         | PASS |
| camv                | icosahedral | icosahedral-capsid | observed   | PASS      | PASS     | PASS         | PASS |
| maize-streak        | geminate    | geminate-capsid    | observed   | PASS      | PASS     | PASS         | PASS |
| tylcv               | geminate    | geminate-capsid    | observed   | PASS      | PASS     | PASS         | PASS |
| aav2                | icosahedral | icosahedral-capsid | observed   | PASS      | PASS     | PASS         | PASS |
| canine-parvovirus   | icosahedral | icosahedral-capsid | observed   | PASS      | PASS     | PASS         | PASS |
| pcv2                | icosahedral | icosahedral-capsid | observed   | PASS      | PASS     | PASS         | PASS |
| hpv16               | icosahedral | icosahedral-capsid | observed   | PASS      | PASS     | PASS         | PASS |
| sv40                | icosahedral | icosahedral-capsid | observed   | PASS      | PASS     | PASS         | PASS |
| murine-polyomavirus | icosahedral | icosahedral-capsid | observed   | PASS      | PASS     | PASS         | PASS |
| norwalk             | icosahedral | icosahedral-capsid | observed   | PASS      | PASS     | PASS         | PASS |
| rhdv                | icosahedral | icosahedral-capsid | observed   | PASS      | PASS     | PASS         | PASS |
| astrovirus-1        | icosahedral | icosahedral-capsid | observed   | PASS      | PASS     | PASS         | PASS |
| hbv                 | enveloped   | hbv                | observed   | PASS      | PASS     | PASS         | PASS |
| sindbis             | enveloped   | alphavirus         | observed   | PASS      | PASS     | PASS         | PASS |
| semliki-forest      | enveloped   | alphavirus         | observed   | PASS      | PASS     | PASS         | PASS |
| flock-house         | icosahedral | icosahedral-capsid | observed   | PASS      | PASS     | PASS         | PASS |
| ibdv                | layered     | layered-capsid     | observed   | PASS      | PASS     | PASS         | PASS |
| bluetongue          | layered     | layered-capsid     | observed   | PASS      | PASS     | PASS         | PASS |
| reovirus-t3d        | layered     | layered-capsid     | observed   | PASS      | PASS     | PASS         | PASS |
| ssv1                | spindle     | spindle-virus      | observed   | PASS      | PASS     | PASS         | PASS |
| sirv2               | rod         | archaeal-rod       | observed   | PASS      | PASS     | PASS         | PASS |
| stiv                | layered     | layered-capsid     | observed   | PASS      | PASS     | PASS         | PASS |
| atv                 | spindle     | spindle-virus      | observed   | PASS      | PASS     | PASS         | PASS |
| ebola-virus         | filament    | filovirus          | observed   | PASS      | PASS     | PASS         | PASS |
| sudan-virus         | filament    | filovirus          | conceptual | PASS      | PASS     | PASS         | PASS |
| bundibugyo-virus    | filament    | filovirus          | conceptual | PASS      | PASS     | PASS         | PASS |
| tai-forest-virus    | filament    | filovirus          | conceptual | PASS      | PASS     | PASS         | PASS |
| reston-virus        | filament    | filovirus          | conceptual | PASS      | PASS     | PASS         | PASS |
| bombali-virus       | filament    | filovirus          | conceptual | PASS      | PASS     | PASS         | PASS |
| hiv-1               | enveloped   | lentivirus         | observed   | PASS      | PASS     | PASS         | PASS |
| hiv-2               | enveloped   | lentivirus         | conceptual | PASS      | PASS     | PASS         | PASS |
| hcov-229e           | enveloped   | coronavirus        | conceptual | PASS      | PASS     | PASS         | PASS |
| hcov-nl63           | enveloped   | coronavirus        | conceptual | PASS      | PASS     | PASS         | PASS |
| hcov-oc43           | enveloped   | coronavirus        | conceptual | PASS      | PASS     | PASS         | PASS |
| hcov-hku1           | enveloped   | coronavirus        | conceptual | PASS      | PASS     | PASS         | PASS |
| sars-cov            | enveloped   | coronavirus        | conceptual | PASS      | PASS     | PASS         | PASS |
| mers-cov            | enveloped   | coronavirus        | conceptual | PASS      | PASS     | PASS         | PASS |
| sars-cov-2          | enveloped   | coronavirus        | observed   | PASS      | PASS     | PASS         | PASS |

## 자동 검증 결과

| 항목                                       | 결과                                     |
| ------------------------------------------ | ---------------------------------------- |
| Catalog / signature / dimensions / History | 71/71 exact coverage                     |
| High / low construction                    | 142/142 PASS                             |
| Declared and orphan part/layer             | 142/142 PASS                             |
| Surface / transparent / section / exploded | 71/71 PASS                               |
| Scanner x/y/z, 0/50/100%                   | 639/639 setup·restore PASS               |
| Dispose                                    | 모든 고유 geometry/material exactly once |
| Generic builder                            | 0                                        |
| Maximum objects / geometries / materials   | 33 / 29 / 17                             |
| Maximum triangles                          | 36,852 (PVY high)                        |

## Build 검증

- lint: 통과
- test: 38 files, 211 cases 통과
- production build: 통과
- Virus Sim JS: 253.18 kB, gzip 69.78 kB
- Virus Sim CSS: 10.14 kB, gzip 2.91 kB
- v4.7 대비 JS: -0.16 kB, gzip -0.03 kB

## 뷰포트와 접근성 계약

- mobile: 360×800, 390×844, 412×915, 430×932
- desktop: 1366×768, 1440×900, 1920×1080
- short-height: 600px 이하에서도 stage는 header 아래에 제한
- 130% font: mobile에서 2열 mode button과 1열 layer/history로 전환
- 문서 전체가 세로 scroll하며 stage만 `overflow: hidden`
- native virus select, 44px 이상 주요 control, visible focus ring과 semantic button 상태 유지
- 외부 source link는 `noopener noreferrer`를 사용

## 배포와 public smoke QA

| 항목                     | 결과                                                   |
| ------------------------ | ------------------------------------------------------ |
| 구현 master              | `b4954a980436b05b924d2ab6c0117fdc2c425acb`             |
| GitHub Pages workflow    | run `34445273092`, success                             |
| 공개 URL                 | <https://cjftya.github.io/projects/virus-sim/>         |
| title / version badge    | v4.8 / v4.8 PASS                                       |
| native virus select      | 71 options, T4 기본 선택 PASS                          |
| desktop layout           | 1363×936, 수평 overflow 없음                           |
| details / external links | 5 sections, 모든 새 창 link `noopener noreferrer` PASS |
| WebGL fallback           | 안내와 재시도 활성, 3D 의존 control 비활성화 PASS      |

공개 QA에 사용한 cloud browser는 `GL_VENDOR = Disabled`로 WebGL context를 만들 수 없었다. 따라서
실제 GPU의 대표 모델 육안 비교, mode·scanner 조작, 이미지 저장은 이 환경에서 `NEEDS REVIEW`로 남긴다.
기능 경로는 위 자동 검증의 142개 high/low build, 71종 mode, 639개 scanner setup·restore와 dispose
검사로 보완했다. 모바일 breakpoint와 130% font도 CSS 계약 및 회귀 테스트로 확인했지만 실제 mobile
device emulation은 같은 QA browser에서 제공되지 않았다.

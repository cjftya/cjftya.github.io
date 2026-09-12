# Virus Sim v4.8.3 정합성 감사

## 판정 기준

각 행은 catalog 선언, structural signature, 실제 low-budget model의 part/layer map, 최종 설명과 source/evidence를 함께 검사한 결과다. 필수 필드 누락·잘못된 source·근거 과장·model target 불일치는 `FAIL`, generic fallback·source/signature 분리·120자 초과 필드는 `REVIEW`다. 문제가 없으면 `PASS`다.

## 71-entry matrix

|   # | ID                    | targets | entry/family | 상태 |
| --: | --------------------- | ------: | -----------: | ---- |
|   1 | `t4`                  |      11 |         11/0 | PASS |
|   2 | `lambda`              |       9 |          0/9 | PASS |
|   3 | `t7`                  |       9 |          0/9 | PASS |
|   4 | `ms2`                 |       6 |          0/6 | PASS |
|   5 | `tmv`                 |       6 |          0/6 | PASS |
|   6 | `m13`                 |       6 |          0/6 | PASS |
|   7 | `adenovirus-5`        |       7 |          7/0 | PASS |
|   8 | `rotavirus-rrv`       |       9 |          9/0 | PASS |
|   9 | `hsv1`                |      11 |         11/0 | PASS |
|  10 | `influenza-a`         |       9 |          9/0 | PASS |
|  11 | `vsv-indiana`         |      10 |         0/10 | PASS |
|  12 | `vaccinia-mv`         |       8 |          0/8 | PASS |
|  13 | `phix174`             |       7 |          7/0 | PASS |
|  14 | `qbeta`               |       6 |          6/0 | PASS |
|  15 | `phi29`               |       9 |          9/0 | PASS |
|  16 | `p22`                 |       8 |          8/0 | PASS |
|  17 | `hk97`                |       8 |          8/0 | PASS |
|  18 | `t5`                  |       9 |          9/0 | PASS |
|  19 | `t1`                  |       9 |          9/0 | PASS |
|  20 | `prd1`                |       9 |          9/0 | PASS |
|  21 | `phi6`                |      10 |         0/10 | PASS |
|  22 | `pm2`                 |       9 |          9/0 | PASS |
|  23 | `ap205`               |       6 |          6/0 | PASS |
|  24 | `ccmv`                |       6 |          6/0 | PASS |
|  25 | `bmv`                 |       6 |          6/0 | PASS |
|  26 | `cpmv`                |       6 |          6/0 | PASS |
|  27 | `tbsv`                |       7 |          7/0 | PASS |
|  28 | `stmv`                |       5 |          5/0 | PASS |
|  29 | `cmv-fny`             |       6 |          6/0 | PASS |
|  30 | `tymv`                |       6 |          6/0 | PASS |
|  31 | `pvx`                 |       6 |          6/0 | PASS |
|  32 | `papmv`               |       6 |          6/0 | PASS |
|  33 | `pvy`                 |       6 |          6/0 | PASS |
|  34 | `camv`                |       6 |          6/0 | PASS |
|  35 | `maize-streak`        |       6 |          0/6 | PASS |
|  36 | `tylcv`               |       6 |          0/6 | PASS |
|  37 | `aav2`                |       7 |          7/0 | PASS |
|  38 | `canine-parvovirus`   |       7 |          7/0 | PASS |
|  39 | `pcv2`                |       6 |          6/0 | PASS |
|  40 | `hpv16`               |       6 |          6/0 | PASS |
|  41 | `sv40`                |       6 |          6/0 | PASS |
|  42 | `murine-polyomavirus` |       6 |          6/0 | PASS |
|  43 | `norwalk`             |       7 |          7/0 | PASS |
|  44 | `rhdv`                |       7 |          7/0 | PASS |
|  45 | `astrovirus-1`        |       7 |          7/0 | PASS |
|  46 | `hbv`                 |       9 |          0/9 | PASS |
|  47 | `sindbis`             |       9 |          0/9 | PASS |
|  48 | `semliki-forest`      |       9 |          0/9 | PASS |
|  49 | `flock-house`         |       6 |          6/0 | PASS |
|  50 | `ibdv`                |       7 |          7/0 | PASS |
|  51 | `bluetongue`          |       9 |          9/0 | PASS |
|  52 | `reovirus-t3d`        |      10 |         10/0 | PASS |
|  53 | `ssv1`                |       8 |          8/0 | PASS |
|  54 | `sirv2`               |       7 |          0/7 | PASS |
|  55 | `stiv`                |       9 |          9/0 | PASS |
|  56 | `atv`                 |       8 |          8/0 | PASS |
|  57 | `ebola-virus`         |      10 |         10/0 | PASS |
|  58 | `sudan-virus`         |      10 |         0/10 | PASS |
|  59 | `bundibugyo-virus`    |      10 |         0/10 | PASS |
|  60 | `tai-forest-virus`    |      10 |         0/10 | PASS |
|  61 | `reston-virus`        |      10 |         0/10 | PASS |
|  62 | `bombali-virus`       |      10 |         0/10 | PASS |
|  63 | `hiv-1`               |      10 |         10/0 | PASS |
|  64 | `hiv-2`               |      10 |          2/8 | PASS |
|  65 | `hcov-229e`           |      10 |         0/10 | PASS |
|  66 | `hcov-nl63`           |      10 |         0/10 | PASS |
|  67 | `hcov-oc43`           |      10 |          2/8 | PASS |
|  68 | `hcov-hku1`           |      10 |          2/8 | PASS |
|  69 | `sars-cov`            |      10 |         0/10 | PASS |
|  70 | `mers-cov`            |      10 |         0/10 | PASS |
|  71 | `sars-cov-2`          |      10 |         10/0 | PASS |

## 집중 검토 결과

| 계열                | 최종 확인                                                                             |
| ------------------- | ------------------------------------------------------------------------------------- |
| Coronavirus         | S·M·E와 Embecovirus HE의 실제 렌더 형상, N–RNA 관계, grouped selection을 설명에 반영  |
| Influenza           | HA·NA·M2, M1, 여덟 vRNP의 역할과 model marker 구분 유지                               |
| HIV                 | Env·MA·성숙 core·두 RNA를 구분하고 HIV-2 원뿔 core는 family model임을 명시            |
| HSV                 | glycoprotein·불균일 tegument·capsid·DNA의 층 관계 유지                                |
| Filovirus           | species-level 형상 차이를 만들지 않고 계열 근거와 절차적 filament를 구분              |
| Icosahedral/layered | capsomer·surface domain과 UI layer의 실제 단백질 의미를 연결; IBDV VP3 영역 과장 제거 |
| Helical/special/pox | coat·channel·genome path·말단 표식의 observed/conceptual 경계를 확인                  |
| Phage               | head·portal·neck·sheath·tube·baseplate·fiber/tailspike 용어와 T4 직접 source 정렬     |

## Fallback 보고

Generic fallback은 0개다. Family 설명 224개는 동일 renderer와 동일한 근거 범위를 안전하게 공유하는 target에만 남겼다. HIV-2와 OC43/HKU1처럼 종·아속 차이가 필요한 target은 entry override를 사용한다. 차이를 만들 근거가 없는 filovirus 5종, 사람 코로나바이러스 공통 구조 등은 의도적으로 family 설명을 공유해 가짜 차별화를 피했다.

## 자동 검증 계약

`auditStructureExplanations()`와 `tests/virus-sim/v4.8.3-consistency-audit.test.ts`가 이 표를 고정한다. 누락, generic, 빈 필드, 잘못된 source/URL, evidence overclaim, signature source 불일치와 긴 문장을 검사하고, 실제 생성 모델의 part/layer map도 catalog와 양방향 대조한다.

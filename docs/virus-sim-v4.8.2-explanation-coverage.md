# Virus Sim v4.8.2 구조 설명 커버리지

## 판정 기준

- `parts`와 `layers`는 catalog에 선언된 선택 target 수다.
- `entry`와 `family`는 실제 lookup 결과의 scope별 target 수다.
- 모든 target이 설명 필수 필드와 유효한 source ID를 가지며 `generic` fallback을 사용하지 않을 때 `PASS`다.
- 아래 표는 테스트가 사용하는 catalog와 동일한 registry에서 산출했다.

## 요약

| 항목                        | 결과 |
| --------------------------- | ---: |
| Catalog entries             |   71 |
| Declared part/layer targets |  569 |
| Entry-specific targets      |  345 |
| Family targets              |  224 |
| Generic targets             |    0 |
| PASS entries                |   71 |

## 전체 matrix

|   # | 바이러스                                          | builder              | 분류/형태                                            | parts | layers | entry | family | sources                                         | 상태 |
| --: | ------------------------------------------------- | -------------------- | ---------------------------------------------------- | ----: | -----: | ----: | -----: | ----------------------------------------------- | ---- |
|   1 | T4 파지 (`t4`)                                    | `t4`                 | 수축형 꼬리 파지<br>`phage`                          |     8 |      3 |    11 |      0 | `pdb-7vs5`<br>`pdb-2bsg`                        | PASS |
|   2 | 람다 파지 (`lambda`)                              | `lambda`             | 비수축형 긴 꼬리 파지<br>`phage`                     |     6 |      3 |     0 |      9 | `pdb-8iyd`<br>`pdb-8xqb`                        | PASS |
|   3 | T7 파지 (`t7`)                                    | `t7`                 | 짧은 꼬리 파지<br>`phage`                            |     6 |      3 |     0 |      9 | `pdb-3j7v`<br>`pdb-7ey7`                        | PASS |
|   4 | MS2 파지 (`ms2`)                                  | `ms2`                | 꼬리 없는 작은 RNA 파지<br>`polyhedron`              |     4 |      2 |     0 |      6 | `pdb-5tc1`                                      | PASS |
|   5 | 담배모자이크바이러스 (`tmv`)                      | `tmv`                | 단단한 나선형 막대<br>`filament`                     |     4 |      2 |     0 |      6 | `pdb-2tmv`                                      | PASS |
|   6 | M13 파지 (`m13`)                                  | `m13`                | 긴 필라멘트 파지<br>`filament`                       |     4 |      2 |     0 |      6 | `pdb-2mjz`                                      | PASS |
|   7 | 인간 아데노바이러스 5형 (`adenovirus-5`)          | `adenovirus`         | 꼭짓점 섬유를 가진 다면체<br>`polyhedron`            |     5 |      2 |     7 |      0 | `pdb-4v4u`                                      | PASS |
|   8 | 로타바이러스 RRV (`rotavirus-rrv`)                | `rotavirus`          | 삼중 캡시드 입자<br>`polyhedron`                     |     5 |      4 |     9 |      0 | `pdb-4v7q`                                      | PASS |
|   9 | 단순포진바이러스 1형 (`hsv1`)                     | `hsv`                | 외피·tegument·캡시드 복합형<br>`envelope`            |     6 |      5 |    11 |      0 | `pdb-6odm`<br>`ictv-herpes`                     | PASS |
|  10 | 인플루엔자 A 바이러스 (`influenza-a`)             | `influenza`          | 외피 보유 분절 RNA 바이러스<br>`envelope`            |     5 |      4 |     9 |      0 | `ictv-influenza`<br>`influenza-quant`           | PASS |
|  11 | 수포성구내염바이러스 VSV (`vsv-indiana`)          | `vsv`                | 총알형 외피 바이러스<br>`bullet`                     |     5 |      5 |     0 |     10 | `emd-26603`                                     | PASS |
|  12 | 백시니아바이러스 (`vaccinia-mv`)                  | `vaccinia`           | 벽돌형 복합 바이러스<br>`brick`                      |     4 |      4 |     0 |      8 | `ictv-pox`<br>`pnas-vaccinia`                   | PASS |
|  13 | ΦX174 파지 (`phix174`)                            | `icosahedral-capsid` | 꼭짓점 돌기형 소형 파지<br>`polyhedron`              |     4 |      3 |     7 |      0 | `pdb-2bpa`                                      | PASS |
|  14 | Qβ 파지 (`qbeta`)                                 | `icosahedral-capsid` | 작은 T=3 RNA 파지<br>`polyhedron`                    |     4 |      2 |     6 |      0 | `pdb-1qbe`                                      | PASS |
|  15 | Φ29 파지 (`phi29`)                                | `phage-family`       | 길쭉한 머리·짧은 꼬리 파지<br>`phage`                |     6 |      3 |     9 |      0 | `pdb-6qvk`                                      | PASS |
|  16 | P22 파지 (`p22`)                                  | `phage-family`       | tailspike 보유 짧은 꼬리 파지<br>`phage`             |     5 |      3 |     8 |      0 | `pdb-5uu5`<br>`pdb-8tvr`                        | PASS |
|  17 | HK97 파지 (`hk97`)                                | `phage-family`       | 얇은 T=7 성숙 캡시드 파지<br>`phage`                 |     5 |      3 |     8 |      0 | `pdb-2ft1`                                      | PASS |
|  18 | T5 파지 (`t5`)                                    | `phage-family`       | 긴 비수축형 꼬리 파지<br>`phage`                     |     6 |      3 |     9 |      0 | `pdb-8zvi`                                      | PASS |
|  19 | T1 파지 (`t1`)                                    | `phage-family`       | 긴 비수축형 꼬리 파지<br>`phage`                     |     6 |      3 |     9 |      0 | `pdb-9l01`                                      | PASS |
|  20 | PRD1 파지 (`prd1`)                                | `layered-capsid`     | 내부 막 보유 다면체 파지<br>`polyhedron`             |     5 |      4 |     9 |      0 | `pdb-1w8x`                                      | PASS |
|  21 | Φ6 파지 (`phi6`)                                  | `cystovirus`         | 외피·다층 코어 RNA 파지<br>`envelope`                |     5 |      5 |     0 |     10 | `ictv-cystoviridae`                             | PASS |
|  22 | PM2 파지 (`pm2`)                                  | `layered-capsid`     | 내부 막 보유 다면체 파지<br>`polyhedron`             |     5 |      4 |     9 |      0 | `ictv-corticoviridae`                           | PASS |
|  23 | AP205 파지 (`ap205`)                              | `icosahedral-capsid` | 작은 T=3 RNA 파지<br>`polyhedron`                    |     4 |      2 |     6 |      0 | `pdb-5jzr`                                      | PASS |
|  24 | 동부콩 퇴록얼룩바이러스 (`ccmv`)                  | `icosahedral-capsid` | T=3 구형 식물 바이러스<br>`polyhedron`               |     4 |      2 |     6 |      0 | `pdb-1cwp`                                      | PASS |
|  25 | 브롬모자이크바이러스 (`bmv`)                      | `icosahedral-capsid` | T=3 구형 식물 바이러스<br>`polyhedron`               |     4 |      2 |     6 |      0 | `pdb-1js9`                                      | PASS |
|  26 | 동부콩모자이크바이러스 (`cpmv`)                   | `icosahedral-capsid` | pseudo T=3 구형 식물 바이러스<br>`polyhedron`        |     4 |      2 |     6 |      0 | `pdb-1ny7`<br>`pdb-5a33`                        | PASS |
|  27 | 토마토덤불위축바이러스 (`tbsv`)                   | `icosahedral-capsid` | 돌출 도메인형 T=3 식물 바이러스<br>`polyhedron`      |     4 |      3 |     7 |      0 | `pdb-2tbv`                                      | PASS |
|  28 | 위성담배모자이크바이러스 (`stmv`)                 | `icosahedral-capsid` | 매우 작은 T=1 위성바이러스<br>`polyhedron`           |     3 |      2 |     5 |      0 | `pdb-1a34`                                      | PASS |
|  29 | 오이모자이크바이러스 Fny (`cmv-fny`)              | `icosahedral-capsid` | T=3 구형 식물 바이러스<br>`polyhedron`               |     4 |      2 |     6 |      0 | `pdb-1f15`                                      | PASS |
|  30 | 순무황화모자이크바이러스 (`tymv`)                 | `icosahedral-capsid` | 조밀한 T=3 식물 바이러스<br>`polyhedron`             |     4 |      2 |     6 |      0 | `pdb-1auy`                                      | PASS |
|  31 | 감자바이러스 X (`pvx`)                            | `plant-filament`     | 유연한 나선형 식물 바이러스<br>`filament`            |     4 |      2 |     6 |      0 | `emd-pvx`                                       | PASS |
|  32 | 파파야모자이크바이러스 (`papmv`)                  | `plant-filament`     | 유연한 나선형 식물 바이러스<br>`filament`            |     4 |      2 |     6 |      0 | `pdb-4dox`<br>`ictv-alphaflexiviridae`          | PASS |
|  33 | 감자바이러스 Y (`pvy`)                            | `plant-filament`     | 가늘고 유연한 potyvirus<br>`filament`                |     4 |      2 |     6 |      0 | `pdb-6hxx`                                      | PASS |
|  34 | 콜리플라워모자이크바이러스 (`camv`)               | `icosahedral-capsid` | 구형 pararetrovirus<br>`polyhedron`                  |     4 |      2 |     6 |      0 | `ictv-caulimoviridae`                           | PASS |
|  35 | 옥수수줄무늬바이러스 (`maize-streak`)             | `geminate-capsid`    | 쌍둥이형 geminivirus<br>`geminate`                   |     4 |      2 |     0 |      6 | `ictv-geminiviridae`                            | PASS |
|  36 | 토마토황화잎말림바이러스 (`tylcv`)                | `geminate-capsid`    | 쌍둥이형 geminivirus<br>`geminate`                   |     4 |      2 |     0 |      6 | `ictv-geminiviridae`                            | PASS |
|  37 | 아데노연관바이러스 2형 (`aav2`)                   | `icosahedral-capsid` | 작은 parvovirus형 캡시드<br>`polyhedron`             |     5 |      2 |     7 |      0 | `pdb-1lp3`                                      | PASS |
|  38 | 개 파보바이러스 (`canine-parvovirus`)             | `icosahedral-capsid` | 작은 비외피 다면체 바이러스<br>`polyhedron`          |     5 |      2 |     7 |      0 | `pdb-2cas`                                      | PASS |
|  39 | 돼지써코바이러스 2형 (`pcv2`)                     | `icosahedral-capsid` | 매우 작은 원형 ssDNA 바이러스<br>`polyhedron`        |     4 |      2 |     6 |      0 | `pdb-3jci`                                      | PASS |
|  40 | 인유두종바이러스 16형 (`hpv16`)                   | `icosahedral-capsid` | 72 capsomer 다면체 바이러스<br>`polyhedron`          |     4 |      2 |     6 |      0 | `pdb-7kzf`                                      | PASS |
|  41 | 시미안바이러스 40 (`sv40`)                        | `icosahedral-capsid` | polyomavirus 오각 capsomer 입자<br>`polyhedron`      |     4 |      2 |     6 |      0 | `pdb-1sva`                                      | PASS |
|  42 | 쥐 폴리오마바이러스 (`murine-polyomavirus`)       | `icosahedral-capsid` | polyomavirus 오각 capsomer 입자<br>`polyhedron`      |     4 |      2 |     6 |      0 | `pdb-1sie`                                      | PASS |
|  43 | 노워크바이러스 (`norwalk`)                        | `icosahedral-capsid` | 돌출 P-domain 캘리시바이러스<br>`polyhedron`         |     4 |      3 |     7 |      0 | `pdb-1ihm`                                      | PASS |
|  44 | 토끼출혈병바이러스 (`rhdv`)                       | `icosahedral-capsid` | 돌출 P-domain 캘리시바이러스<br>`polyhedron`         |     4 |      3 |     7 |      0 | `pdb-3j1p`                                      | PASS |
|  45 | 사람 아스트로바이러스 1형 (`astrovirus-1`)        | `icosahedral-capsid` | 성숙 spike 보유 아스트로바이러스<br>`polyhedron`     |     4 |      3 |     7 |      0 | `pdb-5ewn`                                      | PASS |
|  46 | B형간염바이러스 (`hbv`)                           | `hbv`                | 외피·코어 보유 간염바이러스<br>`envelope`            |     5 |      4 |     0 |      9 | `pdb-6htx`<br>`ictv-hepadnaviridae`             | PASS |
|  47 | 신드비스바이러스 (`sindbis`)                      | `alphavirus`         | 정렬된 glycoprotein 외피 alphavirus<br>`envelope`    |     5 |      4 |     0 |      9 | `pdb-6imm`                                      | PASS |
|  48 | 셈리키숲바이러스 (`semliki-forest`)               | `alphavirus`         | 정렬된 glycoprotein 외피 alphavirus<br>`envelope`    |     5 |      4 |     0 |      9 | `emd-sfv`<br>`ictv-togaviridae`                 | PASS |
|  49 | 플록하우스바이러스 (`flock-house`)                | `icosahedral-capsid` | T=3 곤충 nodavirus<br>`polyhedron`                   |     4 |      2 |     6 |      0 | `pdb-4ftb`                                      | PASS |
|  50 | 감염성F낭병바이러스 (`ibdv`)                      | `layered-capsid`     | 비외피 이중층 birnavirus<br>`polyhedron`             |     4 |      3 |     7 |      0 | `pdb-2df7`                                      | PASS |
|  51 | 블루텅바이러스 (`bluetongue`)                     | `layered-capsid`     | 다층 orbivirus<br>`polyhedron`                       |     5 |      4 |     9 |      0 | `pdb-2btv`                                      | PASS |
|  52 | 포유류 오르토레오바이러스 T3D (`reovirus-t3d`)    | `layered-capsid`     | 다층 reovirus<br>`polyhedron`                        |     5 |      5 |    10 |      0 | `pdb-1ej6`                                      | PASS |
|  53 | Sulfolobus 방추형 바이러스 1 (`ssv1`)             | `spindle-virus`      | 고세균 방추형 바이러스<br>`spindle`                  |     4 |      4 |     8 |      0 | `ictv-fuselloviridae`                           | PASS |
|  54 | Sulfolobus islandicus 막대형 바이러스 2 (`sirv2`) | `archaeal-rod`       | 고세균 막대형 바이러스<br>`rod`                      |     4 |      3 |     0 |      7 | `ictv-rudiviridae`                              | PASS |
|  55 | Sulfolobus turreted icosahedral virus (`stiv`)    | `layered-capsid`     | 고세균 turret형 다면체 바이러스<br>`polyhedron`      |     5 |      4 |     9 |      0 | `pdb-3j31`                                      | PASS |
|  56 | Acidianus 양꼬리바이러스 (`atv`)                  | `spindle-virus`      | 고세균 양꼬리 방추형 바이러스<br>`spindle`           |     4 |      4 |     8 |      0 | `ictv-bicaudaviridae`                           | PASS |
|  57 | 에볼라 바이러스 (`ebola-virus`)                   | `filovirus`          | 필로바이러스 · 에볼라 계열<br>`filament`             |     5 |      5 |    10 |      0 | `ictv-orthoebolavirus`                          | PASS |
|  58 | 수단 바이러스 (`sudan-virus`)                     | `filovirus`          | 필로바이러스 · 에볼라 계열<br>`filament`             |     5 |      5 |     0 |     10 | `ictv-orthoebolavirus`                          | PASS |
|  59 | 분디부교 바이러스 (`bundibugyo-virus`)            | `filovirus`          | 필로바이러스 · 에볼라 계열<br>`filament`             |     5 |      5 |     0 |     10 | `ictv-orthoebolavirus`                          | PASS |
|  60 | 타이포레스트 바이러스 (`tai-forest-virus`)        | `filovirus`          | 필로바이러스 · 에볼라 계열<br>`filament`             |     5 |      5 |     0 |     10 | `ictv-orthoebolavirus`                          | PASS |
|  61 | 레스턴 바이러스 (`reston-virus`)                  | `filovirus`          | 필로바이러스 · 에볼라 계열<br>`filament`             |     5 |      5 |     0 |     10 | `ictv-orthoebolavirus`                          | PASS |
|  62 | 봄발리 바이러스 (`bombali-virus`)                 | `filovirus`          | 필로바이러스 · 에볼라 계열<br>`filament`             |     5 |      5 |     0 |     10 | `ictv-orthoebolavirus`                          | PASS |
|  63 | 사람면역결핍바이러스 1형 (`hiv-1`)                | `lentivirus`         | Lentivirus · 성숙 원뿔형 코어<br>`envelope`          |     5 |      5 |    10 |      0 | `ictv-retroviridae`<br>`pdb-3j3q`               | PASS |
|  64 | 사람면역결핍바이러스 2형 (`hiv-2`)                | `lentivirus`         | Lentivirus · 계열 공통 구조<br>`envelope`            |     5 |      5 |     2 |      8 | `ictv-retroviridae`<br>`nih-hiv2`               | PASS |
|  65 | 사람 코로나바이러스 229E (`hcov-229e`)            | `coronavirus`        | Alphacoronavirus · 사람 코로나바이러스<br>`envelope` |     5 |      5 |     0 |     10 | `cdc-human-coronavirus`<br>`ictv-coronaviridae` | PASS |
|  66 | 사람 코로나바이러스 NL63 (`hcov-nl63`)            | `coronavirus`        | Alphacoronavirus · 사람 코로나바이러스<br>`envelope` |     5 |      5 |     0 |     10 | `cdc-human-coronavirus`<br>`ictv-coronaviridae` | PASS |
|  67 | 사람 코로나바이러스 OC43 (`hcov-oc43`)            | `coronavirus`        | Betacoronavirus · 사람 코로나바이러스<br>`envelope`  |     5 |      5 |     2 |      8 | `cdc-human-coronavirus`<br>`ictv-coronaviridae` | PASS |
|  68 | 사람 코로나바이러스 HKU1 (`hcov-hku1`)            | `coronavirus`        | Betacoronavirus · 사람 코로나바이러스<br>`envelope`  |     5 |      5 |     2 |      8 | `cdc-human-coronavirus`<br>`ictv-coronaviridae` | PASS |
|  69 | SARS 코로나바이러스 (`sars-cov`)                  | `coronavirus`        | Betacoronavirus · 사람 코로나바이러스<br>`envelope`  |     5 |      5 |     0 |     10 | `cdc-human-coronavirus`<br>`ictv-coronaviridae` | PASS |
|  70 | MERS 코로나바이러스 (`mers-cov`)                  | `coronavirus`        | Betacoronavirus · 사람 코로나바이러스<br>`envelope`  |     5 |      5 |     0 |     10 | `cdc-human-coronavirus`<br>`ictv-coronaviridae` | PASS |
|  71 | SARS-CoV-2 (`sars-cov-2`)                         | `coronavirus`        | Betacoronavirus · 사람 코로나바이러스<br>`envelope`  |     5 |      5 |    10 |      0 | `cdc-human-coronavirus`<br>`ictv-coronaviridae` | PASS |

## 자동 검증 계약

`tests/virus-sim/v4.8.2-full-catalog-explanations.test.ts`가 이 matrix의 핵심 조건을 고정한다. catalog 수, 모든 target의 non-generic coverage, 필수 필드, source resolution, entry ID와 registration key 중복, broad-builder entry profile, unknown/orphan target 안전성을 검사한다.

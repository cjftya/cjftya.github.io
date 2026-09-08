# Virus Sim v2.5 구조 출처와 표현 한계

확인일: 2026-09-08

도감은 PDB·EMDB의 구조 항목과 ICTV 형태 설명을 이용해 **종 정체성, 참고한 입자
상태, 전체 윤곽, 층 관계와 구별 가능한 대표 부위**를 확인한 뒤 절차 기하로 다시 만든다.
구조가 VLP, empty capsid, 단백질 부분 또는 국소 재구성인 경우 이를 완전한 자연 virion의
원자 모델로 확대 해석하지 않는다.

앱의 각 출처 링크에는 적용 범위가 함께 저장돼 있다. 아래 표의 출처 ID는
`src/virus-sim/catalog/sources.ts`의 URL·범위 기록과 일치한다.

## 기존 12개

| ID              | 도감 항목·상태         | 주요 출처                           | 표현 경계                                                            |
| --------------- | ---------------------- | ----------------------------------- | -------------------------------------------------------------------- |
| `t4`            | T4 성숙 입자           | `pdb-7vs5`, `pdb-2bsg`              | 7VS5 머리와 fibritin 부분을 조합하며 전체 꼬리 원자 좌표로 보지 않음 |
| `lambda`        | 람다 성숙 입자         | `pdb-8iyd`, `pdb-8xqb`              | tail cap·머리-꼬리 연결 근거, 긴 꼬리 반복 축약                      |
| `t7`            | T7 성숙 입자           | `pdb-3j7v`, `pdb-7ey7`              | capsid와 짧은 꼬리 복합체를 저밀도 부품으로 재구성                   |
| `ms2`           | MS2 RNA 보유 입자      | `pdb-5tc1`                          | 비대칭 성숙 단백질과 RNA를 개념 기하로 축약                          |
| `tmv`           | TMV 나선 조립체        | `pdb-2tmv`                          | 조립 단위를 화면 길이로 반복, 원자 표면 미사용                       |
| `m13`           | M13 capsid 모델        | `pdb-2mjz`                          | NMR·모델링 기반 capsid, 완전한 말단 좌표를 주장하지 않음             |
| `adenovirus-5`  | HAdV-5 capsid          | `pdb-4v4u`                          | penton·fiber와 shell을 저밀도 반복으로 축약                          |
| `rotavirus-rrv` | Simian RRV 삼중층 입자 | `pdb-4v7q`                          | 사람 균주로 바꾸지 않고 세 capsid 층만 표현                          |
| `hsv1`          | HSV-1 층 구성          | `pdb-6odm`, `ictv-herpes`           | 6ODM 국소 비대칭 단위를 전체 입자 좌표로 사용하지 않음               |
| `influenza-a`   | 구형 예시 virion       | `ictv-influenza`, `influenza-quant` | 다형성 중 구형을 선택, 표면 단백질 비율은 정량 재현 아님             |
| `vsv-indiana`   | VSV Indiana            | `emd-26603`                         | 국소 재구성과 총알형 전체 형태를 분리해 해석                         |
| `vaccinia-mv`   | Vaccinia mature virion | `ictv-pox`, `pnas-vaccinia`         | MV 상태로 고정, 다른 입자 단계와 혼합하지 않음                       |

세부 설명과 직접 링크는 [v2 출처 기록](virus-sim-v2-sources.md)도 함께 보존한다.

## 세균 바이러스 신규 11개

| ID        | 도감 항목·상태                  | 주요 출처              | 화면에 반영한 범위                                                   |
| --------- | ------------------------------- | ---------------------- | -------------------------------------------------------------------- |
| `phix174` | ΦX174 성숙 capsid               | `pdb-2bpa`             | T=1 shell과 12개 꼭짓점 spike                                        |
| `qbeta`   | Qβ capsid·RNA 비대칭 참고       | `pdb-1qbe`             | T=3 표면과 비대칭 부위, RNA 접힘은 생략                              |
| `phi29`   | phi29 성숙 입자                 | `pdb-6qvk`             | prolate head와 짧은 꼬리·말단 부속                                   |
| `p22`     | P22 procapsid·tail machine 자료 | `pdb-5uu5`, `pdb-8tvr` | tailspike와 짧은 꼬리 장치, 두 상태를 단일 원자 모델로 병합하지 않음 |
| `hk97`    | HK97 성숙 capsid                | `pdb-2ft1`             | 얇은 성숙 head 표면과 짧은 말단                                      |
| `t5`      | T5 성숙 입자                    | `pdb-8zvi`             | head·connector·긴 tail tube와 tail tip                               |
| `t1`      | T1 head-tail 입자               | `pdb-9l01`             | T=7 head, connector와 긴 유연 tail 구성                              |
| `prd1`    | PRD1 내부막 보유 입자           | `pdb-1w8x`             | 단백질 shell과 내부막, 꼭짓점 영역                                   |
| `phi6`    | phi6 외피 dsRNA 입자            | `ictv-cystoviridae`    | 외부 막, 내부 capsid와 dsRNA 층 관계                                 |
| `pm2`     | PM2 내부막 보유 입자            | `ictv-corticoviridae`  | 외부 capsid와 내부막의 두 층                                         |
| `ap205`   | AP205 조립 capsid               | `pdb-5jzr`             | compact capsid의 피복 단위 배열                                      |

## 식물 바이러스 신규 13개

| ID             | 도감 항목·상태                         | 주요 출처                            | 화면에 반영한 범위                                      |
| -------------- | -------------------------------------- | ------------------------------------ | ------------------------------------------------------- |
| `ccmv`         | native compact CCMV                    | `pdb-1cwp`                           | 팽창 상태와 섞지 않은 compact T=3 shell                 |
| `bmv`          | native compact BMV                     | `pdb-1js9`                           | CCMV와 공유되는 T=3 원리와 얕은 표면 골                 |
| `cpmv`         | genome-containing CPMV, empty VLP 비교 | `pdb-1ny7`, `pdb-5a33`               | 큰·작은 피복 단위의 pseudo T=3 관계                     |
| `tbsv`         | TBSV 성숙 virion                       | `pdb-2tbv`                           | shell 위의 돌출 domain                                  |
| `stmv`         | STMV 성숙 위성 입자                    | `pdb-1a34`                           | 작은 T=1 shell, TMV 막대와 구별                         |
| `cmv-fny`      | CMV Fny strain                         | `pdb-1f15`                           | 선택 균주의 T=3 피복 배열                               |
| `tymv`         | TYMV 성숙 virion                       | `pdb-1auy`                           | 조밀한 T=3 표면과 RNA 공간                              |
| `pvx`          | PVX helical virion                     | `emd-pvx`                            | EMD-4740·fitted 6R7G의 유연한 filament와 나선 피복      |
| `papmv`        | PapMV coat protein 기반                | `pdb-4dox`, `ictv-alphaflexiviridae` | 단백질 구조와 계열 filament 형태, 전체 원자 virion 아님 |
| `pvy`          | PVY helical virion                     | `pdb-6hxx`                           | 가늘고 긴 potyvirus 나선 피복                           |
| `camv`         | CaMV 공식 형태 설명                    | `ictv-caulimoviridae`                | isometric capsid 윤곽, 내부 패킹은 개념도               |
| `maize-streak` | MSV geminate virion                    | `ictv-geminiviridae`                 | 두 capsid 엽과 연결부                                   |
| `tylcv`        | TYLCV geminate virion                  | `ictv-geminiviridae`                 | 공유 geminate 원리와 더 좁은 접합 비율                  |

## 동물·곤충 바이러스 신규 16개

| ID                    | 도감 항목·상태             | 주요 출처                         | 화면에 반영한 범위                                         |
| --------------------- | -------------------------- | --------------------------------- | ---------------------------------------------------------- |
| `aav2`                | AAV2 capsid                | `pdb-1lp3`                        | 3회축 돌출부와 5회축 채널 위치                             |
| `canine-parvovirus`   | CPV empty capsid           | `pdb-2cas`                        | 빈 shell의 5회축 원통·표면 고리, DNA는 별도 개념도         |
| `pcv2`                | PCV2 VLP capsid            | `pdb-3jci`                        | VLP T=1 shell, 원형 ssDNA는 실측 배치가 아님               |
| `hpv16`               | HPV16 VLP·capsid           | `pdb-7kzf`                        | 오각 L1 capsomer 배열, 유전체는 개념도                     |
| `sv40`                | SV40 capsid                | `pdb-1sva`                        | VP1 오각 capsomer 배치                                     |
| `murine-polyomavirus` | Murine polyomavirus capsid | `pdb-1sie`                        | SV40과 공유 구조, 낮은 표면 융기만 구분                    |
| `norwalk`             | Norwalk VLP capsid         | `pdb-1ihm`                        | S-domain shell과 돌출 P-domain, RNA는 개념도               |
| `rhdv`                | RHDV capsid 원자 모델      | `pdb-3j1p`                        | 더 넓게 벌어진 calicivirus P-domain                        |
| `astrovirus-1`        | HAstV-1 성숙 capsid 단백질 | `pdb-5ewn`                        | capsid 단백질 근거를 저밀도 전체 shell·spike로 확장        |
| `hbv`                 | Dane particle 층 구성      | `pdb-6htx`, `ictv-hepadnaviridae` | HBV core 구조와 외피·부분 dsDNA 관계, HBsAg 빈 입자와 구분 |
| `sindbis`             | Sindbis 성숙 virion        | `pdb-6imm`                        | 정렬된 외피 glycoprotein과 내부 core 대응                  |
| `semliki-forest`      | SFV 성숙 virion            | `emd-sfv`, `ictv-togaviridae`     | EMD-39616·fitted 8YVY의 조밀한 spike lattice               |
| `flock-house`         | FHV RNA 보유 입자          | `pdb-4ftb`                        | T=3 capsid와 내부 RNA 밀도 관계                            |
| `ibdv`                | IBDV 성숙 이중층 입자      | `pdb-2df7`                        | 두 단백질층과 두 dsRNA 분절                                |
| `bluetongue`          | BTV 다층 입자              | `pdb-2btv`                        | outer shell·중간층·전사 core 관계                          |
| `reovirus-t3d`        | Reovirus T3D virion        | `pdb-1ej6`                        | 다층 capsid와 꼭짓점 turret                                |

## 고세균 바이러스 신규 4개

| ID      | 도감 항목·상태          | 주요 출처             | 화면에 반영한 범위                    |
| ------- | ----------------------- | --------------------- | ------------------------------------- |
| `ssv1`  | SSV1 성숙 방추형 입자   | `ictv-fuselloviridae` | 방추형 몸체와 단일 극성 말단          |
| `sirv2` | SIRV2 성숙 막대형 입자  | `ictv-rudiviridae`    | 강체 막대 피복과 양끝 세 갈래 섬유    |
| `stiv`  | STIV 성숙 turret형 입자 | `pdb-3j31`            | 다면체 capsid, 꼭짓점 turret와 내부막 |
| `atv`   | ATV 세포 밖 양꼬리 상태 | `ictv-bicaudaviridae` | 방추형 몸체와 양끝에 발달한 꼬리      |

## 공통 표현 등급

- `verified`: 항목 정체성과 위 자료 범위를 확인해 공개 도감에 포함했다는 제품 상태다.
  모든 원자·입자 상태가 한 개의 구조 항목에서 완성됐다는 뜻은 아니다.
- `source-informed-procedural`: 구조 파일을 직접 렌더하지 않고 확인된 형태 관계를
  저밀도 Three.js geometry로 다시 만들었다는 뜻이다.
- 유전체 선의 접힘·두께, 색, 자동 움직임, 분해 거리와 투어 카메라는 관찰용 연출이다.
- 앱은 실행 중 외부 구조 데이터를 요청하지 않는다. 링크는 근거 확인 경로이며 모델
  표시 실패를 외부 서비스 상태에 의존시키지 않는다.

# Virus Sim v3.5 출처와 자료 범위

확인일: 2026-09-08

이 문서는 v3.5에서 추가한 기본 항목, 실제 크기 환산과 비교 표본의 근거 범위를
정리한다. 기존 56개 항목의 개별 PDB·EMDB·ICTV 목록은
[`virus-sim-v2.5-sources.md`](virus-sim-v2.5-sources.md)에 있고, 런타임에서 사용하는
정확한 URL과 적용 범위는 `src/virus-sim/catalog/sources.ts`가 단일 원천이다.

## 근거 단계

| 단계          | 의미                                                                      |
| ------------- | ------------------------------------------------------------------------- |
| `observed`    | 해당 입자 또는 표시 부위에 직접 연결할 수 있는 공개 구조·형태 자료가 있음 |
| `conceptual`  | identity는 확인되지만 세부 3D는 계열 공통 구조를 절차적으로 표현함        |
| `unavailable` | 현재 연결한 자료로는 구조를 표현할 수 없어 임의 형상을 만들지 않음        |

`observed`도 원자 좌표의 직접 복제를 뜻하지 않는다. PDB가 단백질·domain·capsid 일부만
다루면 그 범위만 근거로 쓰고, 전체 입자 모델의 반복 수와 내부 포장은 단순화로 밝힌다.

## 신규 기본 항목 15개

| 계열                | 기본 항목                                       | 단계       | 주 출처와 적용 범위                                                                   |
| ------------------- | ----------------------------------------------- | ---------- | ------------------------------------------------------------------------------------- |
| Orthoebolavirus     | EBOV                                            | observed   | ICTV: 필라멘트 형태, 96–98 nm 폭, 길이 범위, 외피·matrix·RNP                          |
| Orthoebolavirus     | SUDV, BDBV, TAFV, RESTV, BOMV                   | conceptual | ICTV 계열 공통 층과 폭. 종별 미확인 세부는 공통 모델                                  |
| Lentivirus          | HIV-1                                           | observed   | ICTV Retroviridae profile: 입자 범위·층, PDB 3J3Q: 성숙 capsid 모델                   |
| Lentivirus          | HIV-2                                           | conceptual | Retroviridae 계열 구조와 NIH의 HIV-2 identity. HIV-1 세부를 종별 사실로 전용하지 않음 |
| 사람 코로나바이러스 | HCoV-229E, NL63, OC43, HKU1, SARS-CoV, MERS-CoV | conceptual | CDC: 사람 감염 7개 identity, ICTV: 외피·표면 돌기·RNA-단백질 계열 구조                |
| 사람 코로나바이러스 | SARS-CoV-2                                      | observed   | ICTV 전체 계열 설명과 공개 spike 부분 구조. 변이 PDB는 전체 virion 좌표가 아님        |

### 핵심 링크

- [ICTV Orthoebolavirus](https://ictv.global/report/chapter/filoviridae/filoviridae/orthoebolavirus)
- [ICTV Retroviridae profile](https://pmc.ncbi.nlm.nih.gov/articles/PMC8744268/)
- [PDB 3J3Q — HIV-1 capsid](https://www.rcsb.org/structure/3J3Q)
- [NIH HIV-2 guidance](https://clinicalinfo.hiv.gov/en/guidelines/hiv-clinical-guidelines-adult-and-adolescent-arv/special-populations-hiv-2-infection)
- [CDC Human Coronavirus Types](https://www.cdc.gov/human-coronaviruses/php/types/index.html)
- [ICTV Coronaviridae](https://ictv.global/report/chapter/coronaviridae/coronaviridae)

## 실제 크기 데이터

`catalog/dimensions.ts`에는 기본 항목 71개 모두에 다음 필드가 있다.

- 측정 기준: diameter, axial length, contour length 또는 width
- 대표값과 가능한 범위(nm)
- 성숙 입자·VLP·계열 공통 범위 등 입자 상태
- 표면 돌기 포함 여부와 보충 설명
- 해당 값을 뒷받침하는 source ID

실제 크기 비교는 두 항목의 `representativeNm`만 공통 nm-per-pixel 환산에 사용한다.
분해 거리, procedural `displayLength`, 현재 카메라 거리와 bounding box는 기준 치수를
변경하지 않는다.

### 대표값 해석 주의

| 항목                      | 사용 값                                   | 주의                                                    |
| ------------------------- | ----------------------------------------- | ------------------------------------------------------- |
| EBOV                      | 805 nm contour length, 805–20,000 nm 범위 | 매우 다형적인 길이 가운데 대표 표시값이며 폭은 96–98 nm |
| SUDV·BDBV·TAFV·RESTV·BOMV | 97 nm width                               | 종별 전체 길이가 아니라 ICTV 계열 공통 폭               |
| HIV-1                     | 100 nm diameter, 80–120 nm 표시 범위      | 약 100 nm 성숙 입자 자료와 계열 범위를 함께 사용        |
| HIV-2                     | 90 nm diameter, 80–100 nm 범위            | 종별 직접 측정치가 아니라 Retroviridae 계열 대표 범위   |
| 사람 코로나바이러스 7개   | 100 nm diameter, 80–120 nm 범위           | 종·계통별 고정 직경이 아니라 계열 공통 대표 범위        |
| M13·PVX·PapMV·PVY         | contour length                            | 휘어진 표본의 끝점 직선거리가 아님                      |

자료가 `conceptual`인 항목의 대표값은 비교 UI에 그 상태와 함께 표시한다. 숫자가 있다는
이유로 종별 정밀 측정이 완료됐다고 해석하지 않는다. 현재 기본 항목 중 치수 필드가
비어 있는 항목은 없지만, 위 계열 공통값은 종별 직접값과 명확히 구분한다.

## 비교 표본 16개

| 기본 항목  | 표본                                                                        | 종류            | 자료 범위                                           |
| ---------- | --------------------------------------------------------------------------- | --------------- | --------------------------------------------------- |
| EBOV       | Mayinga 1976, Makona C15                                                    | isolate         | ICTV identity와 Makona GP A82V 연구                 |
| HIV-1      | group M subtype B, subtype C                                                | subtype         | Env 다양성과 V3 영역 연구                           |
| HIV-2      | group A, group B                                                            | subtype         | NIH identity·임상 분류; 직접 외형 차이 없음         |
| SARS-CoV-2 | Wuhan-Hu-1 기준, Alpha, Beta, Gamma, Delta, BA.1, BA.2, BA.5, XBB.1.5, JN.1 | isolate/lineage | WHO의 역사적 변이 명명; Delta·BA.1은 spike PDB 추가 |

SARS-CoV-2 목록은 역사적 비교용이며 현재 유행 순위나 최신 변이를 뜻하지 않는다.
표본 순서는 직접 조상·후손 관계를 나타내지 않는다.

## 근거가 있는 구조 차이 3쌍

| 비교 쌍                   | 표시 부위                             | 출처                                                                                             | 표현 한계                                                            |
| ------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| EBOV Mayinga ↔ Makona C15 | GP receptor-binding region, A82V 위치 | [Marzi et al. 2018](https://pmc.ncbi.nlm.nih.gov/articles/PMC5969531/)                           | 영역 강조이며 procedural 표면의 점은 원자 좌표가 아님                |
| HIV-1 subtype B ↔ C       | Env gp120 V3 region                   | [Lynch et al.](https://pmc.ncbi.nlm.nih.gov/articles/PMC2853864/)                                | Env 영역 차이를 성숙 virion 전체 형상 변화로 확대하지 않음           |
| SARS-CoV-2 Delta ↔ BA.1   | Spike receptor-binding domain         | [PDB 7TOV](https://www.rcsb.org/structure/7TOV), [PDB 7T9J](https://www.rcsb.org/structure/7T9J) | 실험 상태·결합 파트너가 다른 부분 구조를 동일 조건으로 가정하지 않음 |

그 밖의 표본 조합은 같은 기본 모델을 사용할 수 있지만, UI에서 `대응 구조 차이 자료가
부족`하다고 표시한다. 자료가 없는 차이를 색·돌기·파티클로 꾸며내지 않는다.

## 미확인·보류 항목

- 신규 15개 가운데 `conceptual`로 표시한 종의 종별 완전한 virion 3D 세부
- HIV-2 group A/B의 신뢰할 수 있는 전체 입자 외형 차이
- SARS-CoV-2 계통 전체를 같은 실험 조건에서 비교한 완전한 virion 구조
- 모든 71개 모델의 실제 브라우저 contact sheet 시각 점검

마지막 항목은 현재 실행 환경의 원격 브라우저가 로컬 주소를 차단해 수행하지 못했다.
정적 모델 생성·부위·레이어·렌더 예산 테스트로 시각 검증을 대체했다고 간주하지 않는다.

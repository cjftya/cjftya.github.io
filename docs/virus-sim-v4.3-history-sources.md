# Virus Sim v4.3 History & Impact 출처

검증일은 모두 `2026-09-09`다. 최초 확인은 진화적 기원이 아니라 최초 분리·기술·유행 인식 중
무엇을 뜻하는지 문장에 적었다. 피해 수치를 출처보다 정밀하게 단정하지 않았고, 직접 피해가
없는 파지·고세균 바이러스는 연구·생태적 의미를 설명한다.

## Coverage

| 묶음        | catalog ID                                                                                                                                                              | 주요 History source ID                                                                      | 주의점                                                           |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| 사람·신종   | adenovirus-5, rotavirus-rrv, hsv1, influenza-a, vsv-indiana, vaccinia-mv                                                                                                | cdc-adenovirus, who-influenza, who-hsv, ictv-report                                         | vaccinia 기원과 rotavirus 연구주를 질병 유행과 구분              |
| Filovirus   | ebola-virus, sudan-virus, bundibugyo-virus, tai-forest-virus, reston-virus, bombali-virus                                                                               | who-ebola, ictv-filoviridae                                                                 | reservoir·사람 병원성이 미확정인 종은 불확실성 명시              |
| HIV         | hiv-1, hiv-2                                                                                                                                                            | who-hiv, ictv-report                                                                        | 최초 분리와 계통학적 종간 전파를 구분                            |
| Coronavirus | hcov-229e, hcov-nl63, hcov-oc43, hcov-hku1, sars-cov, mers-cov, sars-cov-2                                                                                              | cdc-human-coronavirus-history, who-mers, who-covid, ictv-report                             | 최초 확인 장소를 진화적 기원으로 표현하지 않음                   |
| 동물·사람   | aav2, canine-parvovirus, pcv2, hpv16, sv40, murine-polyomavirus, norwalk, rhdv, astrovirus-1, hbv, sindbis, semliki-forest, flock-house, ibdv, bluetongue, reovirus-t3d | who-hbv, cdc-hpv, cdc-norovirus, woah-rhd, woah-ibd, woah-bluetongue, animal-virus-taxonomy | 사람 질환, 동물 질환, 연구 모델을 같은 피해 척도로 취급하지 않음 |
| 식물        | tmv, ccmv, bmv, cpmv, tbsv, stmv, cmv-fny, tymv, pvx, papmv, pvy, camv, maize-streak, tylcv                                                                             | tmv-history, plant-virus-review, ictv-report                                                | 지역·품종·복합감염에 따라 작물 피해가 달라 정량 과장 금지        |
| 파지        | t4, lambda, t7, ms2, m13, phix174, qbeta, phi29, p22, hk97, t5, t1, prd1, phi6, pm2, ap205                                                                              | phage-history, virus-model-research, ictv-report                                            | 사람 직접 피해 대신 숙주 세균과 연구·산업 의미 설명              |
| 고세균      | ssv1, sirv2, stiv, atv                                                                                                                                                  | archaeal-virus-review, ictv-report                                                          | 온천 분리 장소와 진화적 기원을 구분                              |

## Source registry 정책

History source는 `catalog/history/sources.ts`, 구조 source는 `catalog/sources.ts`에 둔다.
History·event·host의 모든 source ID는 자동 테스트로 검증한다. WHO·CDC·WOAH·ICTV를 우선하고,
공식 자료가 특정 역사·연구 의미를 충분히 다루지 않을 때 PubMed/PMC review를 사용한다.

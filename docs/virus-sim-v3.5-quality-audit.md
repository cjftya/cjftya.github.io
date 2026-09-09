# Virus Sim v3.5 모델 품질 점검표

확인일: 2026-09-09

이 문서는 기본 항목 71개가 공통 관찰 계약을 구현하는지 확인한 결과와 아직 남은 시각
검증을 분리해 기록한다. 자동 테스트 통과를 사람이 본 contact sheet 통과로 바꾸어
말하지 않는다.

## 자동 점검 결과

| 점검                                      | 범위                               | 결과 |
| ----------------------------------------- | ---------------------------------- | ---- |
| identity·치수·출처 참조 무결성            | 기본 항목 71개                     | 통과 |
| high 모델 생성                            | 기본 항목 71개                     | 통과 |
| low 모델 생성                             | 기본 항목 71개                     | 통과 |
| 선언한 부위와 실제 selectable object 연결 | high/low 각 71개                   | 통과 |
| 선언한 레이어와 실제 object 연결          | high/low 각 71개                   | 통과 |
| high 모델 draw 대상                       | 모델당 150 이하                    | 통과 |
| high 모델 triangle                        | 모델당 250,000 이하                | 통과 |
| 신규 morphology builder                   | filovirus, lentivirus, coronavirus | 통과 |

## 전체 항목 적용 범위

| 그룹                    |  수 | 확인한 ID                                                                                                                                                                                                                                         | 자동 계약 | 시각 contact sheet |
| ----------------------- | --: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ------------------ |
| 세균 바이러스           |  16 | t4, lambda, t7, ms2, m13, phix174, qbeta, phi29, p22, hk97, t5, t1, prd1, phi6, pm2, ap205                                                                                                                                                        | 통과      | 미실시             |
| 식물 바이러스           |  14 | tmv, ccmv, bmv, cpmv, tbsv, stmv, cmv-fny, tymv, pvx, papmv, pvy, camv, maize-streak, tylcv                                                                                                                                                       | 통과      | 미실시             |
| 기존 동물·곤충 바이러스 |  22 | adenovirus-5, rotavirus-rrv, hsv1, influenza-a, vsv-indiana, vaccinia-mv, aav2, canine-parvovirus, pcv2, hpv16, sv40, murine-polyomavirus, norwalk, rhdv, astrovirus-1, hbv, sindbis, semliki-forest, flock-house, ibdv, bluetongue, reovirus-t3d | 통과      | 미실시             |
| 고세균 바이러스         |   4 | ssv1, sirv2, stiv, atv                                                                                                                                                                                                                            | 통과      | 미실시             |
| 에볼라 계열             |   6 | ebola-virus, sudan-virus, bundibugyo-virus, tai-forest-virus, reston-virus, bombali-virus                                                                                                                                                         | 통과      | 미실시             |
| HIV                     |   2 | hiv-1, hiv-2                                                                                                                                                                                                                                      | 통과      | 미실시             |
| 사람 코로나바이러스     |   7 | hcov-229e, hcov-nl63, hcov-oc43, hcov-hku1, sars-cov, mers-cov, sars-cov-2                                                                                                                                                                        | 통과      | 미실시             |

> 그룹 표기는 탐색 편의를 위한 것이며 ICTV의 현재 species 수를 뜻하지 않는다. 정확한
> 71개 identity 목록은 `tests/virus-sim/v3.5-catalog.test.ts`의 기존 56개·신규 15개
> 고정 목록이 검증한다.

## 구현 품질 개선

- 공통 key/fill/rim 조명을 파티클 scene과 분리해 장식을 꺼도 표면과 깊이를 읽을 수
  있게 했다.
- 기존 전용 builder는 유지하고, 반복형 모델은 인스턴싱과 품질별 subdivisions·반복
  밀도를 사용한다.
- 신규 filovirus는 굽은 외피·matrix·나선 RNP, lentivirus는 외피 안의 비대칭 원뿔형
  capsid, coronavirus는 외피·spike·matrix·RNP의 층 관계를 구분한다.
- 외관·반투명·단면·분해·재조립·부위 선택과 스캐너가 같은 `ObservationModel`
  계약을 사용한다.
- `전체 보기` bounds에서 장식 파티클, 선택 marker와 단면 guide를 제외하고 분해된 실제
  부품 위치는 포함한다.
- 파티클 정지·끄기 상태에서는 particle uniform과 불필요한 WebGL 재렌더를 중단한다.

## 시각 점검 기준과 현재 제한

contact sheet와 직접 조작에서는 다음을 확인해야 한다.

1. 외피·capsid·RNP·genome의 앞뒤 겹침과 투명도 정렬
2. 단면에서 내부 층이 잘리고 바깥층만 남지 않는지
3. 분해 시 작은 부품이 본체 안에 묻히거나 지나치게 멀어지지 않는지
4. 선택 marker가 보이는 부위에 놓이고 카메라를 움직이지 않는지
5. filovirus의 곡선 tube와 나선 RNP, HIV cone, coronavirus spike silhouette
6. Standard 두 표본과 Performance 모바일에서 실제 frame time·WebGL 메모리

현재 원격 검증 브라우저는 로컬 `127.0.0.1` 페이지를 `ERR_BLOCKED_BY_CLIENT`로
차단했다. 따라서 동일 구도 71개 썸네일, 데스크톱·모바일 스크린샷, 실제 fps와 메모리는
미측정이다. 로컬 페이지에 접근 가능한 브라우저에서 이 항목을 마친 뒤 시각 완료로
표시해야 한다.

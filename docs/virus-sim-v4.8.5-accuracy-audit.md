# Virus Sim v4.8.5 구조 정확성 감사

## 판정 범위

Virus Sim은 원자 좌표 재구성이 아닌 절차적 교육 모델이다. 이번 감사는 silhouette,
외피 유무, capsid/RNP/core 조직, 층 순서, 주요 표면 단백질, genome 조직과 입자
이질성을 기준으로 판정했다. 화면 반복 수·색상·원자 화학량론은 정확성 판정에서
제외했다.

## 교정 결과

| 항목                      | 결과                                                                       |
| ------------------------- | -------------------------------------------------------------------------- |
| Rubella                   | 정이십면체 core 제거, 다형성 외피·E1/E2 row·grid-like capsid–RNA 조직 적용 |
| Orthoflavivirus           | 외부 E/M raft shell과 비정이십면체 내부 capsid–RNA 개념 영역 분리          |
| HCV                       | 정이십면체 core 제거, 이질적 envelope·sparse E1/E2·lipoprotein patch 적용  |
| Yellow fever source       | PDB 6IW4를 soluble E protein의 X-ray 부분 구조로 교정                      |
| Paramyxovirus             | Nipah G / Measles H / Mumps HN 및 공통 F component ID 분리                 |
| CCHF / Hantaan            | profile·출처·근거를 분리하고 확인되지 않은 종별 외형 차이는 만들지 않음    |
| Marburg / Orthoebolavirus | 공통 필라멘트 renderer 유지, 근거 없는 곡률 차이 미적용                    |

## Component evidence 경계

- Dengue와 Zika의 E/M shell은 whole-particle 자료를 직접 근거로 둔다.
- Yellow fever와 West Nile의 whole-particle 형상은 계열 공통 근거로 제한한다.
- Orthoflavivirus 내부 capsid–RNA는 네 종 모두 개념 표현으로 표시한다.
- PDB 6IW4는 Yellow fever E protein 부품 설명에만 참고하며 전체 입자 근거가 아니다.
- HCV 내부 RNP는 concept/family 범위를 넘지 않는다.
- Hantaan은 whole-particle cryo-ET 근거를 별도 연결하고 CCHF에는 전이하지 않는다.

## 의도적으로 공유하는 모델

- SARS-CoV / SARS-CoV-2
- Influenza A(H1N1)pdm09 / Influenza A(H5N1)
- HIV-1 / HIV-2
- VZV / EBV
- Ebola / Sudan / Bundibugyo / Taï Forest / Reston / Bombali virus
- HCoV-229E / HCoV-NL63
- HCoV-OC43 / HCoV-HKU1

이 묶음은 현재 관찰 해상도에서 확인되지 않은 외형 차이를 임의로 추가하지 않는다.

## 결과 요약

| 항목                              |                                값 |
| --------------------------------- | --------------------------------: |
| Catalog                           |                                95 |
| Physical dimensions               |                             95/95 |
| Structural signatures             |                             95/95 |
| Corrected core models             | Rubella, HCV, Orthoflavivirus 4종 |
| Species labels separated          |      Nipah G, Measles H, Mumps HN |
| Reviewed and conservatively split |                     CCHF, Hantaan |

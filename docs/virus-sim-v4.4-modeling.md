# Virus Sim v4.4 외피형 모델링 rollout

## Inventory 결과

`morphologyTags`의 `enveloped` 또는 외피형 전용 builder를 기준으로 23개 항목을
산출했다. 작업 전 `generic-enveloped` 사용 항목은 4개였고, HBV·Alphavirus·Cystovirus
전용 builder로 이관한 뒤 활성 catalog 사용처는 0개다. Vaccinia MV는 이미 별도 복합형
builder를 사용하므로 v4.4 전면 개편 대상에서는 제외하고 명시적 fallback signature만
연결했다.

| ID               | 이름        | 계열             | builder     | geometry profile             | 근거       | 표현(축약)      | source                                    | 현재 단순화                      |
| ---------------- | ----------- | ---------------- | ----------- | ---------------------------- | ---------- | --------------- | ----------------------------------------- | -------------------------------- |
| hsv1             | HSV-1       | Herpesvirus      | hsv         | hsv1                         | observed   | source-informed | pdb-6odm, ictv-herpes                     | tegument 입자층·국소 capsid 근거 |
| influenza-a      | Influenza A | Orthomyxovirus   | influenza   | influenza-a                  | observed   | source-informed | ictv-influenza, influenza-quant           | 구형 표본·HA/NA 비율 개념화      |
| vsv-indiana      | VSV         | Rhabdovirus      | vsv         | vsv-indiana                  | observed   | source-informed | emd-26603                                 | 국소 재구성·표면 수 축약         |
| vaccinia-mv      | Vaccinia MV | Poxvirus         | vaccinia    | vaccinia-mv                  | observed   | source-informed | ictv-pox, pnas-vaccinia                   | MV 상태·미세 능선 축약           |
| phi6             | Φ6          | Cystovirus       | cystovirus  | enveloped-phi6               | observed   | source-informed | ictv-cystoviridae                         | 완만한 외피·3분절 개념선         |
| hbv              | HBV         | Hepadnavirus     | hbv         | enveloped-hbv-dane           | observed   | source-informed | pdb-6htx, ictv-hepadnaviridae             | Dane particle·중간체 생략        |
| sindbis          | Sindbis     | Alphavirus       | alphavirus  | enveloped-alphavirus-sindbis | observed   | source-informed | pdb-6imm                                  | E1/E2 반복 단위·RNA 패킹 개념화  |
| semliki-forest   | SFV         | Alphavirus       | alphavirus  | enveloped-alphavirus-sfv     | observed   | source-informed | emd-sfv, ictv-togaviridae                 | 계열 유사성 유지·밀도만 구분     |
| ebola-virus      | EBOV        | Filovirus        | filovirus   | filovirus-v3.5               | observed   | family-concept  | ictv-orthoebolavirus                      | 대표 필라멘트·계열 공통 층       |
| sudan-virus      | SUDV        | Filovirus        | filovirus   | filovirus-v3.5               | conceptual | family-concept  | ictv-orthoebolavirus                      | 종별 미확인 세부 생략            |
| bundibugyo-virus | BDBV        | Filovirus        | filovirus   | filovirus-v3.5               | conceptual | family-concept  | ictv-orthoebolavirus                      | 계열 공통 필라멘트               |
| tai-forest-virus | TAFV        | Filovirus        | filovirus   | filovirus-v3.5               | conceptual | family-concept  | ictv-orthoebolavirus                      | 계열 공통 층·근거 한계 명시      |
| reston-virus     | RESTV       | Filovirus        | filovirus   | filovirus-v3.5               | conceptual | family-concept  | ictv-orthoebolavirus                      | 계열 공통 필라멘트               |
| bombali-virus    | BOMV        | Filovirus        | filovirus   | filovirus-v3.5               | conceptual | family-concept  | ictv-orthoebolavirus                      | 확인된 공통 층만 표현            |
| hiv-1            | HIV-1       | Lentivirus       | lentivirus  | lentivirus-v3.5              | observed   | source-informed | ictv-retroviridae, pdb-3j3q               | capsid 근거·Env/RNA 수 축약      |
| hiv-2            | HIV-2       | Lentivirus       | lentivirus  | lentivirus-v3.5              | conceptual | family-concept  | ictv-retroviridae, nih-hiv2               | HIV 계열 공통 성숙 구조          |
| hcov-229e        | HCoV-229E   | Alphacoronavirus | coronavirus | coronavirus-v3.5             | conceptual | family-concept  | cdc-human-coronavirus, ictv-coronaviridae | 계열 공통 입자                   |
| hcov-nl63        | HCoV-NL63   | Alphacoronavirus | coronavirus | coronavirus-v3.5             | conceptual | family-concept  | cdc-human-coronavirus, ictv-coronaviridae | 계열 공통 입자                   |
| hcov-oc43        | HCoV-OC43   | Embecovirus      | coronavirus | coronavirus-v3.5             | conceptual | family-concept  | cdc-human-coronavirus, ictv-coronaviridae | 계열 공통 입자·HE형 성분         |
| hcov-hku1        | HCoV-HKU1   | Embecovirus      | coronavirus | coronavirus-v3.5             | conceptual | family-concept  | cdc-human-coronavirus, ictv-coronaviridae | 계열 공통 입자·HE형 성분         |
| sars-cov         | SARS-CoV    | Sarbecovirus     | coronavirus | coronavirus-v3.5             | conceptual | family-concept  | cdc-human-coronavirus, ictv-coronaviridae | subgroup 공통 입자               |
| mers-cov         | MERS-CoV    | Merbecovirus     | coronavirus | coronavirus-v3.5             | conceptual | family-concept  | cdc-human-coronavirus, ictv-coronaviridae | subgroup 공통 입자               |
| sars-cov-2       | SARS-CoV-2  | Sarbecovirus     | coronavirus | coronavirus-v3.5             | observed   | family-concept  | cdc-human-coronavirus, ictv-coronaviridae | subgroup 공통 입자·수량 축약     |

## Signature와 profile 계층

23개 항목 모두 `StructuralSignature`를 가진다. 공통 계열 정보는
`EnvelopedSignatureProfile`에 두고 바이러스 ID가 profile을 참조한다.

- Coronavirus: `alpha-human`, `beta-embeco`, `beta-sarbeco`, `beta-merbeco`
- Lentivirus: HIV-1 observed와 HIV-2 family-supported를 분리하되 같은 성숙 구조 사용
- Filovirus: 6종 모두 하나의 family profile을 사용해 근거 없는 종별 곡률 차이를 제거
- Vaccinia: 기존 전용 builder를 보존하는 명시적 poxvirus fallback

Coronavirus의 subgroup 차이는 외피 비율, S-like 밀도, 내부 RNP 묶음, Embecovirus의
HE-like 보조 성분처럼 계열 근거가 있는 범위에만 둔다. 229E/NL63, OC43/HKU1,
SARS-CoV/SARS-CoV-2는 각각 같은 subgroup 기본값을 공유한다.

## 전용 builder와 공용 component

- `hbv`: compact Dane particle, 짧은 HBsAg, 정이십면체 HBc core, 부분 이중가닥 원형 DNA
- `alphavirus`: 정돈된 E1/E2 표면 배열, 지질 외피, 정이십면체 nucleocapsid, RNA core
- `cystovirus`: 외피와 부착 단백질, 두 겹 core shell, 3분절 dsRNA
- HSV: 긴·짧은 glycoprotein 두 class와 불균일 tegument, capsid를 분리
- VSV: 총알형 외피와 matrix, 방향성 나선 RNP를 유지하면서 G 단백질을 instancing
- Filovirus: 곡면 GP 반복을 instancing으로 바꾸고 계열 공통 중심선을 사용

재사용 component에는 crown-like surface geometry, lipid envelope, matrix shell,
icosahedral shell, capsomer array, segmented RNP, conical core, 부분 이중가닥 원형 DNA가
포함된다. 반복 표면 단백질은 `InstancedMesh`로 만들며 직접 `Math.random`을 사용하지 않는다.

## 근거 수준

`observed`, `family-supported`, `conceptual`을 component evidence에 유지한다. PDB·EMDB가
국소 단백질이나 capsid만 제공하는 경우 전체 입자 좌표로 확대 해석하지 않는다. 종별 전체
입자 자료가 부족한 Coronavirus·HIV-2·Filovirus는 family model임을 signature와 기존 UI의
표현 한계에서 함께 밝힌다.

## 로컬 성능 표본

Node/Vite SSR에서 첫 warm-up을 제외하고 각 모델을 5회 생성한 평균이다. 렌더 호출 수는
실제 GPU 프레임이 아니라 scene graph 기준 draw object 상한이다.

| 모델(high)  | 평균 생성 | object | geometry | material | draw object | triangle |
| ----------- | --------: | -----: | -------: | -------: | ----------: | -------: |
| SARS-CoV-2  |   3.60 ms |     11 |        9 |        9 |           9 |   18,840 |
| Influenza A |   3.42 ms |     16 |       14 |       14 |          14 |   16,988 |
| HIV-1       |   2.09 ms |      9 |        7 |        7 |           7 |   16,616 |
| HSV-1       |   1.72 ms |      9 |        8 |        8 |           8 |   15,948 |
| VSV         |   1.26 ms |      6 |        5 |        5 |           5 |    6,872 |
| HBV         |   1.39 ms |      9 |        7 |        7 |           7 |    9,196 |
| Sindbis     |   1.42 ms |      7 |        6 |        6 |           6 |    9,852 |
| Φ6          |   1.74 ms |     10 |        8 |        8 |           8 |   10,048 |
| Ebola       |   2.00 ms |      6 |        5 |        5 |           5 |   15,992 |

## 다음 버전 경계

v4.5의 Icosahedral·Layered 전체 rollout은 이번 변경에 포함하지 않는다. v4.4가 추가한
profile 계층과 공용 shell/component 계약을 재사용하되, 아데노·로타 계열은 v4.3 대표
상태를 유지한다.

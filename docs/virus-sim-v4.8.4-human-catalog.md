# Virus Sim v4.8.4 사람 바이러스 확장 카탈로그

기존 71종 뒤에 아래 24종을 지정 순서로 추가했다.

| ID                       | 표시명                      | 계열             | 구조 표현                     |
| ------------------------ | --------------------------- | ---------------- | ----------------------------- |
| `marburg-virus`          | 마르부르크 바이러스         | Filoviridae      | 굽은 필라멘트·나선 RNP        |
| `rabies-virus`           | 광견병 바이러스             | Rhabdoviridae    | 총알형 외피·나선 RNP          |
| `dengue-virus`           | 뎅기 바이러스               | Flaviviridae     | 매끈한 E/M 외피·RNA core      |
| `zika-virus`             | 지카 바이러스               | Flaviviridae     | 매끈한 E/M 외피·RNA core      |
| `yellow-fever-virus`     | 황열 바이러스               | Flaviviridae     | 매끈한 E/M 외피·RNA core      |
| `west-nile-virus`        | 웨스트나일 바이러스         | Flaviviridae     | 계열 근거 E/M 외피·RNA core   |
| `nipah-virus`            | 니파 바이러스               | Paramyxoviridae  | 다형성 외피·나선 RNP          |
| `lassa-virus`            | 라싸 바이러스               | Arenaviridae     | 외피·2분절 RNP                |
| `cchf-virus`             | 크리미안콩고출혈열 바이러스 | Nairoviridae     | 외피·3분절 RNP                |
| `measles-virus`          | 홍역 바이러스               | Paramyxoviridae  | 다형성 외피·나선 RNP          |
| `rsv`                    | 호흡기세포융합바이러스      | Pneumoviridae    | F/G 표면·나선 RNP             |
| `poliovirus-1`           | 폴리오바이러스 1형          | Picornaviridae   | 비외피 정이십면체 capsid      |
| `mpox-virus`             | 엠폭스 바이러스             | Poxviridae       | 벽돌형 막·core·lateral body   |
| `variola-virus`          | 천연두 바이러스             | Poxviridae       | 벽돌형 막·core·lateral body   |
| `hepatitis-c-virus`      | C형간염 바이러스            | Flaviviridae     | 보수적 lipoviroparticle 개념  |
| `hantaan-virus`          | 한탄바이러스                | Hantaviridae     | 외피·3분절 RNP                |
| `varicella-zoster-virus` | 수두대상포진바이러스        | Herpesviridae    | 외피·tegument·capsid          |
| `epstein-barr-virus`     | 엡스타인-바 바이러스        | Herpesviridae    | 외피·tegument·capsid          |
| `influenza-a-h1n1pdm09`  | 인플루엔자 A(H1N1)pdm09     | Orthomyxoviridae | HA/NA 외피·8개 RNP            |
| `influenza-a-h5n1`       | 인플루엔자 A(H5N1)          | Orthomyxoviridae | HA/NA 외피·8개 RNP            |
| `mumps-virus`            | 유행성이하선염 바이러스     | Paramyxoviridae  | 다형성 외피·나선 RNP          |
| `rubella-virus`          | 풍진 바이러스               | Matonaviridae    | E1/E2 외피·RNA core           |
| `chikungunya-virus`      | 치쿤구니야 바이러스         | Togaviridae      | E1/E2 lattice·정이십면체 core |
| `hepatitis-a-virus`      | A형간염 바이러스            | Picornaviridae   | 비외피 정이십면체 capsid      |

## Renderer 배치

- 신규 `human-rnp`: flavivirus 4종, paramyxovirus 3종, RSV, Lassa, CCHF, Hantaan, HCV, Rubella
- 기존 renderer 재사용: Marburg, Rabies, Poliovirus 1, Mpox, Variola, VZV, EBV, H1N1pdm09, H5N1, Chikungunya, HAV

공유 renderer는 생물학적 동일성을 뜻하지 않는다. 각 항목은 별도 catalog definition, geometry profile, structural signature, dimensions, explanation, history와 source 연결을 갖는다.

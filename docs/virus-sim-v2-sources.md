# Virus Sim v2 구조 출처와 표현 한계

확인일: 2026-09-08

Virus Sim v2의 도감은 공개 구조 자료에서 **전체 실루엣, 층 관계, 종을 구별하는
특징 부품**을 확인한 뒤 Three.js 절차 기하로 다시 만든다. PDB 비대칭 단위나 국소
재구성을 전체 바이러스 원자 모델로 확대 해석하지 않는다. 외부 구조 파일과 참고
이미지는 저장소에 복제하지 않았으며, 화면 색은 구조 구분용이다.

## 종별 기록

| 도감 항목               | 자료의 종·상태와 범위                                                                                                                                                                                    | 구현에서 확인한 특징                                                  | 단순화한 부분                                                                                                      |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| T4 파지                 | [PDB 7VS5](https://www.rcsb.org/structure/7VS5)의 확장된 T4 머리와 [PDB 2BSG](https://www.rcsb.org/structure/2BSG)의 fibritin 부분 구조                                                                  | 길쭉한 머리, 수축형 꼬리집과 내부 관, 기저판, 긴 섬유                 | 머리와 꼬리 반복 단백질 수를 줄였다. 2BSG를 전체 꼬리 좌표로 취급하지 않았다.                                      |
| 람다 파지               | [PDBj 8IYD](https://pdbj.org/mine/summary/8iyd)의 tail cap과 [PDB 8XQB](https://www.rcsb.org/structure/8XQB)의 성숙 입자 연결 부위                                                                       | 다면체 머리, 길고 가는 유연한 비수축형 꼬리, 작은 말단 섬유           | 꼬리 단백질 반복을 연속 곡선과 표면 링으로 축약했다.                                                               |
| T7 파지                 | [PDB 3J7V](https://www.rcsb.org/structure/3J7V)의 캡시드와 [PDB 7EY7](https://www.rcsb.org/structure/7EY7)의 꼬리 복합체                                                                                 | 머리에 비해 짧은 꼬리 복합체, 포털 인접 연결부, 머리 아래 섬유        | 꼬리 복합체의 여러 단백질을 세 기하 그룹으로 줄였다.                                                               |
| MS2 파지                | [PDB 5TC1](https://www.rcsb.org/structure/5TC1)의 입자·유전체·전달 장치                                                                                                                                  | 꼬리 없는 작은 다면체, RNA, 한쪽 비대칭 성숙 단백질                   | RNA 접힘과 성숙 단백질 표면을 개념 곡선·돌출부로 줄였다.                                                           |
| 담배모자이크바이러스    | [PDB 2TMV](https://www.rcsb.org/structure/2TMV)의 단백질-RNA 나선 조립                                                                                                                                   | 단단한 막대, 중심 채널, 나선 피복 안쪽의 RNA                          | PDB 조립 단위를 화면 길이로 반복했고 원자 표면은 만들지 않았다.                                                    |
| M13 파지                | [PDB 2MJZ](https://www.rcsb.org/structure/2MJZ)의 NMR 제약·Rosetta 기반 캡시드 모델                                                                                                                      | 매우 가늘고 긴 필라멘트, 축 방향 ssDNA, 구별되는 두 말단              | 실제 길이를 화면에 맞게 줄였다. 자료에 없는 완전한 말단 좌표를 주장하지 않는다.                                    |
| 인간 아데노바이러스 5형 | [PDB 4V4U](https://www.rcsb.org/structure/4V4U)의 5형 캡시드 준원자 모델                                                                                                                                 | 각진 캡시드, 면의 반복 단위, 꼭짓점 penton과 긴 fiber                 | hexon 수와 fiber 굽힘을 렌더 예산에 맞게 줄였다.                                                                   |
| 로타바이러스 RRV        | [PDB 4V7Q](https://www.rcsb.org/structure/4V7Q)의 Simian rotavirus A strain RRV 감염성 입자                                                                                                              | 바깥·중간·코어의 세 캡시드 층, 바깥 돌기, 분절 dsRNA                  | 각 층의 단백질 격자를 저해상도 표면으로 줄였고 내부 효소는 생략했다. 인간 균주로 바꿔 표기하지 않는다.             |
| 단순포진바이러스 1형    | [PDB 6ODM](https://www.rcsb.org/structure/6ODM)의 포털 인접 capsid/CATC 비대칭 단위와 [ICTV Orthoherpesviridae](https://ictv.global/report/chapter/orthoherpesviridae/orthoherpesviridae)의 전체 층 구성 | 당단백질 외피, 불균일한 tegument, 다면체 캡시드, 내부 dsDNA           | 6ODM을 전체 입자 좌표로 사용하지 않았다. tegument는 불균일한 입자층이다.                                           |
| 인플루엔자 A            | [ICTV Orthomyxoviridae](https://ictv.global/report_9th/RNAneg/Orthomyxoviridae)의 외피·다형성 설명과 [입자 구조 정량 연구](https://www.sciencedirect.com/science/article/pii/S0969212622000508)          | 구형 예시, 서로 다른 두 표면 단백질, matrix, 여덟 분절 RNP            | 구형 입자를 기본 형태로 선택했다. 표면 단백질 비율과 RNP 접힘은 정량 재현하지 않았다. 다면체 캡시드를 넣지 않았다. |
| VSV Indiana             | [EMDB EMD-26603 / PDB 7UML](https://www.ebi.ac.uk/emdb/EMD-26603)의 Indiana 바이러스 국소 재구성과 연결된 전체 형태                                                                                      | 둥근 끝과 평평한 바닥의 총알형 외피, matrix, 내부 나선 뉴클레오캡시드 | 국소 재구성을 전체 원자 모형으로 확대하지 않았다. 표면 돌기 수를 줄였다.                                           |
| 백시니아바이러스        | [ICTV Poxviridae](https://ictv.global/report/chapter/poxviridae/poxviridae)와 [성숙 입자 cryo-ET 연구](https://www.pnas.org/doi/10.1073/pnas.0409825102)                                                 | 벽돌형 성숙 입자 MV, 막, 아령 모양 코어 벽, 두 측면체                 | MV 상태로 고정했다. 다른 입자 상태의 추가 외막과 혼합하지 않았고 미세 능선을 줄였다.                               |

## 구현 등급

- `source-informed-procedural`: 위 자료로 실루엣과 층 관계를 대조한 절차 재구성이다.
- 실제 단백질 개수, T-number, 좌표 단위와 원자 표면은 geometry 개수로 해석하지 않는다.
- 유전체 선의 두께와 일부 특징 부품의 크기는 확대 관찰을 위해 과장했다.
- 각 종은 화면에 맞춰 따로 프레이밍한다. 화면 크기는 실제 나노미터 상대 크기가 아니다.
- 앱 실행에 외부 데이터베이스 요청이 필요하지 않다. 출처 링크는 사용자가 근거를
  확인하기 위한 경로다.

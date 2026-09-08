export interface StructureSource {
  readonly id: string;
  readonly label: string;
  readonly url: string;
  readonly scope: string;
  readonly checkedOn: string;
}

export const V2_STRUCTURE_SOURCES: readonly StructureSource[] = [
  {
    id: 'pdb-7vs5',
    label: 'PDB 7VS5',
    url: 'https://www.rcsb.org/structure/7VS5',
    scope: '확장된 T4 파지 머리의 cryo-EM 구조',
    checkedOn: '2026-09-08',
  },
  {
    id: 'pdb-2bsg',
    label: 'PDB 2BSG',
    url: 'https://www.rcsb.org/structure/2BSG',
    scope: 'T4 fibritin 부분 구조. 전체 꼬리 좌표가 아님',
    checkedOn: '2026-09-08',
  },
  {
    id: 'pdb-8iyd',
    label: 'PDBj 8IYD',
    url: 'https://pdbj.org/mine/summary/8iyd',
    scope: '람다 파지의 길고 유연한 꼬리 구조 연구',
    checkedOn: '2026-09-08',
  },
  {
    id: 'pdb-8xqb',
    label: 'PDB 8XQB',
    url: 'https://www.rcsb.org/structure/8XQB',
    scope: '람다 파지 성숙 입자의 머리-꼬리 연결 부위',
    checkedOn: '2026-09-08',
  },
  {
    id: 'pdb-3j7v',
    label: 'PDB 3J7V',
    url: 'https://www.rcsb.org/structure/3J7V',
    scope: 'T7 파지 캡시드 구조',
    checkedOn: '2026-09-08',
  },
  {
    id: 'pdb-7ey7',
    label: 'PDB 7EY7',
    url: 'https://www.rcsb.org/structure/7EY7',
    scope: 'T7 파지의 짧은 꼬리 복합체',
    checkedOn: '2026-09-08',
  },
  {
    id: 'pdb-5tc1',
    label: 'PDB 5TC1',
    url: 'https://www.rcsb.org/structure/5TC1',
    scope: 'MS2 입자, RNA와 비대칭 성숙 단백질 부위',
    checkedOn: '2026-09-08',
  },
  {
    id: 'pdb-2tmv',
    label: 'PDB 2TMV',
    url: 'https://www.rcsb.org/structure/2TMV',
    scope: 'TMV 단백질-RNA 나선 조립 단위',
    checkedOn: '2026-09-08',
  },
  {
    id: 'pdb-2mjz',
    label: 'PDB 2MJZ',
    url: 'https://www.rcsb.org/structure/2MJZ',
    scope: 'NMR 제약과 모델링에 기반한 M13 캡시드 모델',
    checkedOn: '2026-09-08',
  },
  {
    id: 'pdb-4v4u',
    label: 'PDB 4V4U',
    url: 'https://www.rcsb.org/structure/4V4U',
    scope: '인간 아데노바이러스 5형 캡시드 준원자 모델',
    checkedOn: '2026-09-08',
  },
  {
    id: 'pdb-4v7q',
    label: 'PDB 4V7Q',
    url: 'https://www.rcsb.org/structure/4V7Q',
    scope: 'Simian rotavirus A RRV 다층 입자',
    checkedOn: '2026-09-08',
  },
  {
    id: 'pdb-6odm',
    label: 'PDB 6ODM',
    url: 'https://www.rcsb.org/structure/6ODM',
    scope: 'HSV-1 포털 인접 캡시드와 CATC 비대칭 단위',
    checkedOn: '2026-09-08',
  },
  {
    id: 'ictv-herpes',
    label: 'ICTV Orthoherpesviridae',
    url: 'https://ictv.global/report/chapter/orthoherpesviridae/orthoherpesviridae',
    scope: 'HSV 입자의 외피·tegument·캡시드 층 구성',
    checkedOn: '2026-09-08',
  },
  {
    id: 'ictv-influenza',
    label: 'ICTV Orthomyxoviridae',
    url: 'https://ictv.global/report_9th/RNAneg/Orthomyxoviridae',
    scope: '인플루엔자 바이러스의 다형성 외피 입자 형태',
    checkedOn: '2026-09-08',
  },
  {
    id: 'influenza-quant',
    label: 'Influenza virion structure study',
    url: 'https://www.sciencedirect.com/science/article/pii/S0969212622000508',
    scope: '인플루엔자 입자의 구조 성분과 정량 형태 연구',
    checkedOn: '2026-09-08',
  },
  {
    id: 'emd-26603',
    label: 'EMDB EMD-26603 / PDB 7UML',
    url: 'https://www.ebi.ac.uk/emdb/EMD-26603',
    scope: 'VSV Indiana 입자의 국소 재구성과 총알형 전체 형태 연구',
    checkedOn: '2026-09-08',
  },
  {
    id: 'ictv-pox',
    label: 'ICTV Poxviridae',
    url: 'https://ictv.global/report/chapter/poxviridae/poxviridae',
    scope: '폭스바이러스 성숙 입자의 막·코어·측면체 구성',
    checkedOn: '2026-09-08',
  },
  {
    id: 'pnas-vaccinia',
    label: 'Vaccinia cryo-ET study',
    url: 'https://www.pnas.org/doi/10.1073/pnas.0409825102',
    scope: '백시니아 성숙 입자의 cryo-electron tomography 전체 형태',
    checkedOn: '2026-09-08',
  },
] as const;

import type { StructureSource } from '../model/structureSources';

const checkedOn = '2026-09-13';

const ictv = (
  id: string,
  label: string,
  chapter: string,
  scope: string,
): StructureSource => ({
  id,
  label,
  url: `https://ictv.global/report/chapter/${chapter}/${chapter}`,
  scope,
  checkedOn,
});

const pdb = (id: string, scope: string): StructureSource => ({
  id: `pdb-${id.toLowerCase()}`,
  label: `PDB ${id.toUpperCase()}`,
  url: `https://www.rcsb.org/structure/${id.toUpperCase()}`,
  scope,
  checkedOn,
});

export const HUMAN_EXPANSION_STRUCTURE_SOURCES: readonly StructureSource[] = [
  ictv(
    'ictv-filoviridae-structure',
    'ICTV Filoviridae',
    'filoviridae',
    'Marburgvirus를 포함한 필로바이러스 입자와 유전체 구성',
  ),
  ictv(
    'ictv-rhabdoviridae',
    'ICTV Rhabdoviridae',
    'rhabdoviridae',
    'Lyssavirus의 총알형 외피 입자와 나선형 RNP',
  ),
  ictv(
    'ictv-flaviviridae',
    'ICTV Flaviviridae',
    'flaviviridae',
    'Flavivirus와 Hepacivirus의 외피·단백질·RNA 구성',
  ),
  ictv(
    'ictv-paramyxoviridae',
    'ICTV Paramyxoviridae',
    'paramyxoviridae',
    'Nipah·홍역·유행성이하선염 바이러스의 외피와 나선형 RNP',
  ),
  ictv(
    'ictv-pneumoviridae',
    'ICTV Pneumoviridae',
    'pneumoviridae',
    'RSV의 외피, 표면 단백질과 나선형 RNP',
  ),
  ictv(
    'ictv-arenaviridae',
    'ICTV Arenaviridae',
    'arenaviridae',
    'Lassa virus의 외피와 2분절 ambisense RNA',
  ),
  ictv(
    'ictv-nairoviridae',
    'ICTV Nairoviridae',
    'nairoviridae',
    'CCHF virus의 외피와 3분절 음성가닥 RNA',
  ),
  ictv(
    'ictv-hantaviridae',
    'ICTV Hantaviridae',
    'hantaviridae',
    'Hantaan virus의 외피와 3분절 음성가닥 RNA',
  ),
  ictv(
    'ictv-picornaviridae',
    'ICTV Picornaviridae',
    'picornaviridae',
    'Poliovirus와 hepatitis A virus의 비외피 정이십면체 capsid',
  ),
  ictv(
    'ictv-matonaviridae',
    'ICTV Matonaviridae',
    'matonaviridae',
    'Rubella virus의 외피, E1/E2와 RNA-capsid 구성',
  ),
  pdb('3J27', '성숙 dengue virus 입자의 cryo-EM 기반 구조'),
  pdb('5IRE', '성숙 Zika virus 입자의 cryo-EM 기반 구조'),
  pdb(
    '6IW4',
    'Yellow fever virus 17D의 soluble envelope E protein prefusion X-ray 구조. 전체 입자 구조가 아님',
  ),
  pdb('1HXS', 'Poliovirus type 1 capsid 구조'),
  pdb('4QPI', 'Hepatitis A virus capsid 구조'),
  pdb('6NK5', 'Chikungunya virus-like particle의 E1/E2-capsid 구조'),
  {
    id: 'flavivirus-imperfect-symmetry',
    label: 'Therkelsen et al. 2018',
    url: 'https://www.pnas.org/doi/10.1073/pnas.1809304115',
    scope:
      'Dengue·Zika whole-particle 비대칭 재구성에서 외부 E/M shell의 질서와 내부 capsid-RNA의 비정이십면체·불확실성을 구분한 연구',
    checkedOn,
  },
  {
    id: 'hcv-particle-review',
    label: 'HCV particle structure review',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6017186/',
    scope: 'HCV lipoviroparticle의 이질성과 구조 근거 한계',
    checkedOn,
  },
  {
    id: 'hcv-ultrastructure',
    label: 'Catanese et al. 2013',
    url: 'https://www.pnas.org/doi/10.1073/pnas.1307527110',
    scope:
      '세포 배양 HCV 입자의 40–100 nm 크기 이질성과 표면 돌기를 관찰한 ultrastructure 연구',
    checkedOn,
  },
  {
    id: 'rubella-cryo-et',
    label: 'Battisti et al. 2012',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3457135/',
    scope:
      'Rubella whole-particle cryo-ET: 다형성 입자, E1/E2 표면 row와 정이십면체 대칭이 없는 내부 nucleocapsid',
    checkedOn,
  },
  {
    id: 'rubella-helical-structure',
    label: 'Prasad et al. 2017',
    url: 'https://journals.plos.org/plospathogens/article?id=10.1371/journal.ppat.1006377',
    scope:
      'Rubella 입자의 E1/E2 및 capsid organization을 보여 주는 cryo-ET 기반 helical reconstruction',
    checkedOn,
  },
  {
    id: 'hantaan-cryo-et',
    label: 'Battisti et al. 2011',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3020021/',
    scope:
      'Hantaan whole-particle cryo-ET와 단입자 cryo-EM에서 관찰한 다형성 외피와 Gn/Gc 표면 격자',
    checkedOn,
  },
];

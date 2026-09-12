import type { StructureSource } from '../model/structureSources';

const checkedOn = '2026-09-12';

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
  pdb('6IW4', '성숙 yellow fever virus 입자의 cryo-EM 기반 구조'),
  pdb('1HXS', 'Poliovirus type 1 capsid 구조'),
  pdb('4QPI', 'Hepatitis A virus capsid 구조'),
  pdb('6NK5', 'Chikungunya virus-like particle의 E1/E2-capsid 구조'),
  {
    id: 'hcv-particle-review',
    label: 'HCV particle structure review',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6017186/',
    scope: 'HCV lipoviroparticle의 이질성과 구조 근거 한계',
    checkedOn,
  },
];

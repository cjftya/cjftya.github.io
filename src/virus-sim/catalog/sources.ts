import { V2_STRUCTURE_SOURCES, type StructureSource } from '../model/structureSources';

const checkedOn = '2026-09-08';

function pdb(id: string, scope: string): StructureSource {
  const normalized = id.toUpperCase();
  return {
    id: `pdb-${id.toLowerCase()}`,
    label: `PDB ${normalized}`,
    url: `https://www.rcsb.org/structure/${normalized}`,
    scope,
    checkedOn,
  };
}

function emdb(id: string, label: string, scope: string): StructureSource {
  return {
    id,
    label,
    url: `https://www.ebi.ac.uk/emdb/${label.split(' ')[1]}`,
    scope,
    checkedOn,
  };
}

function ictv(
  id: string,
  label: string,
  chapter: string,
  scope: string,
): StructureSource {
  return {
    id,
    label,
    url: `https://ictv.global/report/chapter/${chapter}/${chapter}`,
    scope,
    checkedOn,
  };
}

const EXPANDED_STRUCTURE_SOURCES: readonly StructureSource[] = [
  pdb('2BPA', 'PhiX174의 T=1 capsid와 표면 spike 구조'),
  pdb('1QBE', '박테리오파지 Qβ T=3 capsid 구조'),
  pdb('6QVK', '박테리오파지 phi29의 prolate head와 짧은 꼬리 구조'),
  pdb('5UU5', '박테리오파지 P22 procapsid의 비대칭 재구성'),
  pdb('8TVR', '박테리오파지 P22 tail machine 구조'),
  pdb('2FT1', 'HK97 성숙 capsid 구조'),
  pdb('8ZVI', '성숙 박테리오파지 T5의 head·connector·tail tube·tail tip 구조'),
  pdb('9L01', '박테리오파지 T1의 portal-adaptor와 전체 head-tail 구성 연구'),
  pdb('1W8X', 'PRD1의 내부막을 포함한 다층 capsid 구조'),
  ictv(
    'ictv-cystoviridae',
    'ICTV Cystoviridae',
    'cystoviridae',
    'phi6형 외피 dsRNA 파지의 층 구성',
  ),
  ictv(
    'ictv-corticoviridae',
    'ICTV Corticoviridae',
    'corticoviridae',
    'PM2형 내부막 보유 다면체 파지의 입자 구성',
  ),
  pdb('5JZR', 'AP205 bacteriophage capsid 구조'),
  pdb('1CWP', 'Cowpea chlorotic mottle virus capsid 구조'),
  pdb('1JS9', 'Brome mosaic virus capsid 구조'),
  pdb('1NY7', 'Cowpea mosaic virus capsid 구조'),
  pdb('5A33', 'Cowpea mosaic virus empty virus-like particle 구조'),
  pdb('2TBV', 'Tomato bushy stunt virus T=3 capsid 구조'),
  pdb('1A34', 'Satellite tobacco mosaic virus capsid 구조'),
  pdb('1F15', 'Cucumber mosaic virus Fny strain capsid 구조'),
  pdb('1AUY', 'Turnip yellow mosaic virus capsid 구조'),
  emdb('emd-pvx', 'EMD-4740', 'Potato virus X helical virion 지도와 fitted PDB 6R7G'),
  pdb('4DOX', 'Papaya mosaic virus coat protein 기반 filament 모델'),
  ictv(
    'ictv-alphaflexiviridae',
    'ICTV Alphaflexiviridae',
    'alphaflexiviridae',
    'Potexvirus·PapMV 계열의 유연한 나선형 입자 형태',
  ),
  pdb('6HXX', 'Potato virus Y의 helical virion 구조'),
  ictv(
    'ictv-caulimoviridae',
    'ICTV Caulimoviridae',
    'caulimoviridae',
    'Cauliflower mosaic virus의 비외피 준구형 입자와 dsDNA-RT 유전체',
  ),
  ictv(
    'ictv-geminiviridae',
    'ICTV Geminiviridae',
    'geminiviridae',
    '쌍둥이형 geminate capsid와 원형 ssDNA 유전체',
  ),
  pdb('1LP3', 'AAV2 capsid의 축별 표면 구조'),
  pdb('2CAS', 'Canine parvovirus empty capsid 구조'),
  pdb('3JCI', 'Porcine circovirus 2 virus-like particle 구조'),
  pdb('7KZF', 'HPV16 virus-like particle capsid 구조'),
  pdb('1SVA', 'SV40 capsid 구조'),
  pdb('1SIE', 'Murine polyomavirus capsid 구조'),
  pdb('1IHM', 'Norwalk virus-like particle capsid 구조'),
  pdb('3J1P', 'Rabbit hemorrhagic disease virus capsid 원자 모델'),
  pdb('5EWN', 'Human astrovirus 1 성숙 capsid 단백질 구조'),
  pdb('6HTX', 'Hepatitis B virus core capsid 구조'),
  ictv(
    'ictv-hepadnaviridae',
    'ICTV Hepadnaviridae',
    'hepadnaviridae',
    'Dane particle의 외피·core·부분 이중가닥 DNA 구성',
  ),
  pdb('6IMM', 'Sindbis 성숙 virion의 외피 glycoprotein과 core 구조'),
  emdb(
    'emd-sfv',
    'EMD-39616',
    'Semliki Forest virus 성숙 virion 지도와 fitted PDB 8YVY',
  ),
  ictv(
    'ictv-togaviridae',
    'ICTV Togaviridae',
    'togaviridae',
    'Alphavirus의 외피 spike와 nucleocapsid 층 구성',
  ),
  pdb('4FTB', 'Flock House virus의 RNA 보유 capsid 구조'),
  pdb('2DF7', 'Infectious bursal disease virus capsid 구조'),
  pdb('2BTV', 'Bluetongue virus core 구조'),
  pdb('1EJ6', 'Mammalian orthoreovirus T3D virion 구조'),
  ictv(
    'ictv-fuselloviridae',
    'ICTV Fuselloviridae',
    'fuselloviridae',
    'SSV1형 방추형 고세균 바이러스 입자와 단일 극 꼬리',
  ),
  ictv(
    'ictv-rudiviridae',
    'ICTV Rudiviridae',
    'rudiviridae',
    'SIRV2형 막대형 고세균 바이러스와 말단 섬유',
  ),
  pdb('3J31', 'Sulfolobus turreted icosahedral virus capsid 구조'),
  ictv(
    'ictv-bicaudaviridae',
    'ICTV Bicaudaviridae',
    'bicaudaviridae',
    'ATV형 방추형 입자와 양끝 꼬리 형태',
  ),
];

export const STRUCTURE_SOURCES: readonly StructureSource[] = [
  ...V2_STRUCTURE_SOURCES,
  ...EXPANDED_STRUCTURE_SOURCES,
];

const STRUCTURE_SOURCE_BY_ID = new Map(
  STRUCTURE_SOURCES.map((source) => [source.id, source]),
);

export function getStructureSource(id: string): StructureSource | undefined {
  return STRUCTURE_SOURCE_BY_ID.get(id);
}

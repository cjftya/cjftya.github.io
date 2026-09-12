import { V2_STRUCTURE_SOURCES, type StructureSource } from '../model/structureSources';

const checkedOn = '2026-09-12';

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
  const accession = label.match(/EMD-\d+/i)?.[0]?.toUpperCase() ?? label;
  return {
    id,
    label,
    url: `https://www.ebi.ac.uk/emdb/${accession}`,
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
  {
    id: 'ictv-orthoebolavirus',
    label: 'ICTV Orthoebolavirus',
    url: 'https://ictv.global/report/chapter/filoviridae/filoviridae/orthoebolavirus',
    scope: '필라멘트 형태, 96–98 nm 폭, 길이 범위와 외피·matrix·RNP 구성',
    checkedOn,
  },
  {
    id: 'ictv-retroviridae',
    label: 'ICTV Retroviridae profile',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8744268/',
    scope: '80–100 nm 외피 입자와 성숙 core의 계열 구조',
    checkedOn,
  },
  pdb('3J3Q', 'HIV-1 성숙 capsid의 원뿔형 구조 모델. 전체 외피 입자 좌표가 아님'),
  emdb(
    'emd-hiv2-capsid',
    'EMD-29607',
    'HIV-2 immature Gag capsid lattice. 성숙 입자의 원뿔형 core 전체 좌표가 아님',
  ),
  {
    id: 'nih-hiv2',
    label: 'NIH HIV-2 guidance',
    url: 'https://clinicalinfo.hiv.gov/en/guidelines/hiv-clinical-guidelines-adult-and-adolescent-arv/special-populations-hiv-2-infection',
    scope: 'HIV-2 정체성과 HIV-1과의 구분. 세부 3D 구조 자료가 아님',
    checkedOn,
  },
  {
    id: 'hiv-particle-review',
    label: 'HIV particle review',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4924471/',
    scope: '약 100 nm 성숙 HIV 입자와 외피·matrix·원뿔형 capsid 설명',
    checkedOn,
  },
  {
    id: 'cdc-human-coronavirus',
    label: 'CDC Human Coronavirus Types',
    url: 'https://www.cdc.gov/human-coronaviruses/php/types/index.html',
    scope: '사람 코로나바이러스 7개 정체성',
    checkedOn,
  },
  {
    id: 'ictv-coronaviridae',
    label: 'ICTV Coronaviridae',
    url: 'https://ictv.global/report/chapter/coronaviridae/coronaviridae',
    scope: '코로나바이러스 외피, 표면 돌기와 양성가닥 RNA-단백질 복합체의 계열 설명',
    checkedOn,
  },
  pdb('7TOV', 'SARS-CoV-2 Delta spike 부분 구조. 전체 입자 좌표가 아님'),
  pdb('7T9J', 'SARS-CoV-2 Omicron spike 복합체. 실험 상태 차이에 주의'),
  pdb('5N11', 'HCoV-OC43 hemagglutinin-esterase 구조'),
  {
    id: 'hku1-he-cryoem',
    label: 'Hurdiss et al. 2020',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7495468/',
    scope: 'HCoV-HKU1 hemagglutinin-esterase cryo-EM 구조와 Embecovirus HE 맥락',
    checkedOn,
  },
  {
    id: 'ebola-makona-a82v',
    label: 'Marzi et al. 2018',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5969531/',
    scope:
      'EBOV Makona GP의 A82V 위치와 수용체 결합 영역 연구. 전체 입자 외형 자료가 아님',
    checkedOn,
  },
  {
    id: 'hiv-env-diversity',
    label: 'Lynch et al. HIV-1 Env diversity',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC2853864/',
    scope: 'HIV-1 아형 사이 Env 다양성과 V3 영역. 전체 입자 형상 차이 자료가 아님',
    checkedOn,
  },
  {
    id: 'who-sars-variants',
    label: 'WHO SARS-CoV-2 variant tracking',
    url: 'https://www.who.int/activities/tracking-SARS-CoV-2-variants',
    scope: 'SARS-CoV-2 변이 명명과 역사적 계통 식별',
    checkedOn,
  },
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

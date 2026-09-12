import type { HistorySource } from './types';

const checkedOn = '2026-09-12';

const publicHealth = (
  id: string,
  label: string,
  url: string,
  scope: string,
): HistorySource => ({ id, label, url, kind: 'public-health', scope, checkedOn });

export const HUMAN_EXPANSION_HISTORY_SOURCES: readonly HistorySource[] = [
  publicHealth(
    'who-marburg',
    'WHO Marburg virus disease',
    'https://www.who.int/news-room/fact-sheets/detail/marburg-virus-disease',
    '마르부르크병의 역사와 현재 대응',
  ),
  publicHealth(
    'who-rabies',
    'WHO Rabies',
    'https://www.who.int/news-room/fact-sheets/detail/rabies',
    '광견병의 숙주와 보건 영향',
  ),
  publicHealth(
    'who-dengue',
    'WHO Dengue',
    'https://www.who.int/news-room/fact-sheets/detail/dengue-and-severe-dengue',
    '뎅기 유행과 공중보건 영향',
  ),
  publicHealth(
    'cdc-zika',
    'CDC About Zika',
    'https://www.cdc.gov/zika/about/index.html',
    '지카 감염과 임신 관련 위험',
  ),
  publicHealth(
    'who-yellow-fever',
    'WHO Yellow fever',
    'https://www.who.int/news-room/fact-sheets/detail/yellow-fever',
    '황열과 예방접종',
  ),
  publicHealth(
    'cdc-west-nile',
    'CDC About West Nile virus',
    'https://www.cdc.gov/west-nile-virus/about/index.html',
    '웨스트나일 감염과 매개 생태',
  ),
  publicHealth(
    'who-nipah',
    'WHO Nipah virus',
    'https://www.who.int/news-room/fact-sheets/detail/nipah-virus',
    '니파 감염과 자연 숙주',
  ),
  publicHealth(
    'who-lassa',
    'WHO Lassa fever',
    'https://www.who.int/news-room/fact-sheets/detail/lassa-fever',
    '라싸열의 숙주와 지역 영향',
  ),
  publicHealth(
    'who-cchf',
    'WHO Crimean-Congo haemorrhagic fever',
    'https://www.who.int/news-room/fact-sheets/detail/crimean-congo-haemorrhagic-fever',
    'CCHF의 진드기 매개와 유행',
  ),
  publicHealth(
    'who-measles',
    'WHO Measles',
    'https://www.who.int/news-room/fact-sheets/detail/measles',
    '홍역의 질병 부담과 백신',
  ),
  publicHealth(
    'cdc-rsv',
    'CDC About RSV',
    'https://www.cdc.gov/rsv/about/index.html',
    'RSV의 호흡기 질환 부담',
  ),
  publicHealth(
    'who-polio',
    'WHO Poliomyelitis',
    'https://www.who.int/news-room/fact-sheets/detail/poliomyelitis',
    '소아마비 박멸 현황',
  ),
  publicHealth(
    'who-mpox',
    'WHO Mpox',
    'https://www.who.int/news-room/fact-sheets/detail/mpox',
    '엠폭스 유행과 관리',
  ),
  publicHealth(
    'who-smallpox',
    'WHO Smallpox',
    'https://www.who.int/health-topics/smallpox',
    '천연두 박멸의 역사',
  ),
  publicHealth(
    'who-hepatitis-c',
    'WHO Hepatitis C',
    'https://www.who.int/news-room/fact-sheets/detail/hepatitis-c',
    'C형간염의 세계 보건 영향',
  ),
  publicHealth(
    'cdc-hantavirus',
    'CDC About Hantavirus',
    'https://www.cdc.gov/hantavirus/about/index.html',
    '한타바이러스 숙주와 사람 질환',
  ),
  publicHealth(
    'cdc-chickenpox',
    'CDC About Chickenpox',
    'https://www.cdc.gov/chickenpox/about/index.html',
    'VZV 감염과 예방접종',
  ),
  publicHealth(
    'cdc-ebv',
    'CDC About Epstein-Barr virus',
    'https://www.cdc.gov/epstein-barr/about/index.html',
    'EBV 감염과 질환 범위',
  ),
  publicHealth(
    'cdc-h1n1-2009',
    'CDC 2009 H1N1 Pandemic',
    'https://archive.cdc.gov/www_cdc_gov/flu/pandemic-resources/2009-h1n1-pandemic.html',
    '2009 H1N1 대유행',
  ),
  publicHealth(
    'who-avian-influenza',
    'WHO Avian influenza',
    'https://www.who.int/news-room/fact-sheets/detail/influenza-(avian-and-other-zoonotic)',
    'H5N1 등 동물유래 인플루엔자',
  ),
  publicHealth(
    'cdc-mumps',
    'CDC About Mumps',
    'https://www.cdc.gov/mumps/about/index.html',
    '유행성이하선염과 예방접종',
  ),
  publicHealth(
    'who-rubella',
    'WHO Rubella',
    'https://www.who.int/news-room/fact-sheets/detail/rubella',
    '풍진과 선천풍진증후군',
  ),
  publicHealth(
    'who-chikungunya',
    'WHO Chikungunya',
    'https://www.who.int/news-room/fact-sheets/detail/chikungunya',
    '치쿤구니야 유행과 모기 매개',
  ),
  publicHealth(
    'who-hepatitis-a',
    'WHO Hepatitis A',
    'https://www.who.int/news-room/fact-sheets/detail/hepatitis-a',
    'A형간염의 전파와 예방',
  ),
] as const;

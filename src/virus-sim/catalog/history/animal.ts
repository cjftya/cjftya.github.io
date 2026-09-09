import { defineHistory } from './shared';

const taxonomy = ['animal-virus-taxonomy', 'ictv-report'] as const;

export const ANIMAL_HISTORY = [
  defineHistory({
    virusId: 'aav2',
    discovery: {
      dateLabel: '1960년대',
      place: '미국의 아데노바이러스 연구',
      context: '아데노바이러스 배양물에 의존적으로 증식하는 작은 바이러스로 발견됐다.',
    },
    primaryHosts: ['사람'],
    impactSummary:
      '자연 감염이 뚜렷한 사람 질환과 연결되지 않은 바이러스다. 낮은 병원성과 안정적 유전자 전달 특성 때문에 유전자치료 벡터의 핵심 기반이 됐다.',
    currentStatus: '여러 승인 유전자치료제와 임상 연구에서 변형 AAV 벡터가 사용된다.',
    uncertainty: ['자연 감염의 장기적 임상 의미는 완전히 규명되지 않았다.'],
    sourceIds: ['virus-model-research', 'ictv-report'],
  }),
  defineHistory({
    virusId: 'canine-parvovirus',
    discovery: {
      dateLabel: '1970년대 후반',
      place: '유럽·북미를 포함한 여러 지역',
      context:
        '개에서 급성 위장염과 심근염을 일으키는 새로운 파보바이러스로 거의 동시에 인식됐다.',
    },
    primaryHosts: ['개와 개과 동물'],
    impactSummary:
      '백신이 없는 어린 개에서 심한 구토·설사·탈수와 높은 폐사 위험을 일으켰다. 전 세계 반려동물 방역과 예방접종 관행에 큰 영향을 줬다.',
    currentStatus:
      '효과적인 백신이 있지만 환경 저항성이 높아 미접종 집단에서 계속 문제가 된다.',
    sourceIds: taxonomy,
  }),
  defineHistory({
    virusId: 'pcv2',
    discovery: {
      dateLabel: '1990년대',
      place: '캐나다 양돈 농장',
      context: '이유자돈 전신소모성 질환과 관련된 새로운 돼지써코바이러스로 확인됐다.',
    },
    primaryHosts: ['돼지'],
    impactSummary:
      '성장 지연·폐사·번식 장애를 포함하는 PCV 관련 질환을 일으켜 세계 양돈업에 큰 경제적 손실을 줬다.',
    currentStatus:
      '백신이 질병 부담을 크게 낮췄지만 바이러스는 돼지 집단에 널리 존재한다.',
    sourceIds: taxonomy,
  }),
  defineHistory({
    virusId: 'hpv16',
    discovery: {
      year: 1983,
      place: '독일',
      context:
        '자궁경부암 조직에서 HPV16 유전체가 분리되며 특정 HPV형과 암의 인과관계 연구가 진전됐다.',
    },
    primaryHosts: ['사람'],
    impactSummary:
      '고위험 HPV형으로 자궁경부암과 여러 항문생식기·두경부암의 중요한 원인이다.',
    currentStatus: '예방접종과 선별검사가 암 발생을 줄이는 핵심 수단이다.',
    sourceIds: ['cdc-hpv', 'ictv-report'],
  }),
  defineHistory({
    virusId: 'sv40',
    discovery: {
      year: 1960,
      place: '미국',
      context:
        '붉은털원숭이 신장세포 배양과 초기 소아마비 백신 생산 과정에서 발견됐다.',
    },
    primaryHosts: ['붉은털원숭이와 다른 영장류'],
    impactSummary:
      '오염된 초기 소아마비 백신 로트로 사람에게 노출된 역사가 있으며, 종양 바이러스학과 세포주기 연구의 중요한 모델이 됐다. 사람 암의 원인이라는 주장은 확정되지 않았다.',
    currentStatus:
      '현재 백신 생산에서는 관리되며 주된 의미는 연구 모델과 역사적 생물안전 사례다.',
    uncertainty: ['사람 종양 발생에 대한 직접적 인과관계는 확립되지 않았다.'],
    sourceIds: ['virus-model-research', 'ictv-report'],
  }),
  defineHistory({
    virusId: 'murine-polyomavirus',
    discovery: {
      year: 1953,
      place: '미국',
      context: '생쥐에서 여러 종류의 종양을 유발하는 여과성 인자로 발견됐다.',
    },
    primaryHosts: ['생쥐'],
    impactSummary:
      '자연 상태의 사람 질병 원인은 아니지만 DNA 종양바이러스, 세포 변형, 면역 반응을 이해하는 데 중요한 실험 모델이다.',
    currentStatus:
      '실험동물 시설에서는 감염 통제가 필요하고 기초 종양학 연구에 계속 쓰인다.',
    sourceIds: ['virus-model-research', 'ictv-report'],
  }),
  defineHistory({
    virusId: 'norwalk',
    discovery: {
      dateLabel: '1968년 유행·1972년 바이러스 확인',
      place: '미국 오하이오주 노워크',
      context: '학교 위장관염 유행 검체에서 면역전자현미경으로 원인 입자가 확인됐다.',
    },
    primaryHosts: ['사람'],
    impactSummary:
      '노로바이러스는 전 세계 급성 위장관염과 음식·시설 집단발생의 가장 흔한 원인 가운데 하나다. 감염량이 적고 환경 전파가 쉬워 통제가 어렵다.',
    currentStatus: '백신 없이 위생·환경 소독·환자 격리가 주요 대응 수단이다.',
    sourceIds: ['cdc-norovirus', 'ictv-report'],
  }),
  defineHistory({
    virusId: 'rhdv',
    discovery: {
      year: 1984,
      place: '중국',
      context: '유럽토끼의 급성 고치명성 질환 원인으로 확인됐다.',
    },
    primaryHosts: ['유럽토끼와 일부 산토끼류'],
    impactSummary:
      '야생·사육 토끼에 급성 간염과 대량 폐사를 일으켜 사육 산업과 생태계에 영향을 준다.',
    currentStatus:
      '백신과 이동·방역 관리가 사용되지만 RHDV2 등 새로운 계통이 여러 대륙으로 확산했다.',
    sourceIds: ['woah-rhd', 'ictv-report'],
  }),
  defineHistory({
    virusId: 'astrovirus-1',
    discovery: {
      year: 1975,
      place: '영국 스코틀랜드',
      context: '소아 위장염 검체에서 별 모양 입자가 전자현미경으로 관찰됐다.',
    },
    primaryHosts: ['사람'],
    impactSummary:
      '주로 영유아의 설사를 일으키며 고령자와 면역저하자에서도 질병 부담이 있다. 대개 자가 제한적이지만 집단시설 전파가 가능하다.',
    currentStatus: '진단과 위장관염 감시에서 다른 바이러스와 함께 관리된다.',
    sourceIds: taxonomy,
  }),
  defineHistory({
    virusId: 'hbv',
    discovery: {
      dateLabel: '1965–1970년대',
      place: '미국을 포함한 국제 연구',
      context:
        '오스트레일리아 항원 발견과 바이러스 입자 확인을 통해 B형간염 원인이 규명됐다.',
    },
    primaryHosts: ['사람'],
    impactSummary:
      '급성·만성 간염, 간경변, 간암을 일으키는 세계적 보건 문제다. 수직감염과 혈액·체액 전파가 중요하다.',
    currentStatus:
      '효과적인 백신과 항바이러스 치료가 있지만 완전한 기능적 완치는 제한적이다.',
    sourceIds: ['who-hbv', 'ictv-report'],
  }),
  defineHistory({
    virusId: 'sindbis',
    discovery: {
      year: 1952,
      place: '이집트 신드비스 마을',
      context: '모기에서 분리되며 알파바이러스 연구의 기준 바이러스가 됐다.',
    },
    reservoir: '조류-모기 전파 주기가 주된 자연 유지 경로다.',
    primaryHosts: ['조류', '모기', '사람은 우발 숙주'],
    impactSummary:
      '사람에서 발열·발진·관절통을 일으킬 수 있고 북유럽 등에서 산발적 유행이 발생한다. 분자바이러스학 연구 모델로도 중요하다.',
    currentStatus: '모기 매개 감염 감시와 알파바이러스 연구에서 다뤄진다.',
    sourceIds: taxonomy,
  }),
  defineHistory({
    virusId: 'semliki-forest',
    discovery: {
      year: 1942,
      place: '우간다 셈리키 숲',
      context: '모기에서 분리된 알파바이러스다.',
    },
    primaryHosts: ['모기', '야생 척추동물'],
    impactSummary:
      '사람 질환 보고는 드물지만 실험동물에서 신경침습성 연구와 바이러스 벡터 개발에 널리 사용됐다.',
    currentStatus: '주된 의미는 알파바이러스 생물학과 벡터 연구다.',
    sourceIds: ['virus-model-research', 'ictv-report'],
  }),
  defineHistory({
    virusId: 'flock-house',
    discovery: {
      dateLabel: '1980년대',
      place: '뉴질랜드',
      context: 'Flock House 연구소 인근 풀풍뎅이에서 분리됐다.',
    },
    primaryHosts: ['곤충'],
    impactSummary:
      '사람 질병과 관련되지 않으며, 작은 RNA 바이러스의 복제·조립과 RNA 간섭을 연구하는 모델로 가치가 크다.',
    currentStatus: '곤충·세포 기반 기초연구에서 활용된다.',
    sourceIds: ['virus-model-research', 'ictv-report'],
  }),
  defineHistory({
    virusId: 'ibdv',
    discovery: {
      year: 1957,
      place: '미국 델라웨어주 검보로',
      context: '어린 닭에서 새로운 급성 질환이 보고되며 감보로병으로 알려졌다.',
    },
    primaryHosts: ['어린 닭'],
    hostNote:
      '다른 조류에서도 감염이 가능하지만 뚜렷한 임상 질병은 주로 어린 닭에서 나타난다.',
    impactSummary:
      'F낭의 림프조직을 손상해 폐사와 면역억제를 일으키고, 2차 감염·백신 실패로 양계업에 지속적인 손실을 준다.',
    currentStatus:
      '백신과 농장 생물보안이 사용되지만 고병원성·변이 계통 감시가 필요하다.',
    sourceIds: ['woah-ibd', 'ictv-report'],
  }),
  defineHistory({
    virusId: 'bluetongue',
    discovery: {
      dateLabel: '19세기 말–20세기 초',
      place: '남아프리카',
      context:
        '수입 양에서 알려진 질병이 조사되고 바이러스성·곤충매개 질환으로 규명됐다.',
    },
    primaryHosts: ['양', '소와 여러 반추동물'],
    reservoir: '반추동물 집단에서 유지되며 Culicoides 등에모기가 전파한다.',
    impactSummary:
      '특히 양에서 발열·부종·구강 병변·폐사를 일으키고 가축 이동 제한과 생산 손실을 초래한다.',
    currentStatus:
      '기후·매개체 분포 변화와 함께 발생 지역이 달라져 국제 동물보건 감시 대상이다.',
    sourceIds: ['woah-bluetongue', 'ictv-report'],
  }),
  defineHistory({
    virusId: 'reovirus-t3d',
    discovery: {
      dateLabel: '1950년대',
      place: '미국의 사람 호흡기·장관 검체 연구',
      context: '뚜렷한 질병과 연결되지 않은 호흡기·장관 고아 바이러스군으로 분리됐다.',
    },
    primaryHosts: ['여러 포유류', '사람'],
    impactSummary:
      '사람 감염은 대개 무증상 또는 경증이며, T3D는 이중가닥 RNA 바이러스의 진입·전사·종양용해 가능성을 연구하는 표준 실험주다.',
    currentStatus: '임상 피해보다 기초연구와 종양용해 바이러스 개발에서 의미가 크다.',
    sourceIds: ['virus-model-research', 'ictv-report'],
  }),
] as const;

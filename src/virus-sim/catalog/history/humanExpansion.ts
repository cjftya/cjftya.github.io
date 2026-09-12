import { defineHistory } from './shared';

export const HUMAN_EXPANSION_HISTORY = [
  defineHistory({
    virusId: 'marburg-virus',
    discovery: {
      year: 1967,
      place: '독일 마르부르크·프랑크푸르트와 세르비아 베오그라드',
      context: '아프리카산 녹색원숭이와 관련된 실험실 집단발생에서 처음 확인됐다.',
    },
    reservoir: '과일박쥐가 자연 숙주로 알려져 있다.',
    primaryHosts: ['사람', '비인간 영장류'],
    impactSummary:
      '중증 출혈열을 일으키며 의료기관과 가족 내 전파가 지역 보건체계에 큰 부담을 줄 수 있다.',
    currentStatus:
      '발생 지역의 조기 진단·접촉자 추적·지지 치료와 후보 백신 연구가 이어진다.',
    sourceIds: ['who-marburg'],
  }),
  defineHistory({
    virusId: 'rabies-virus',
    discovery: {
      year: 1885,
      place: '프랑스',
      context: '파스퇴르 연구진의 노출 후 예방접종 성공이 광견병 예방의 전환점이 됐다.',
    },
    reservoir: '지역에 따라 개와 야생 포유류가 주요 저장·전파 숙주다.',
    primaryHosts: ['사람', '개', '박쥐와 여러 포유류'],
    impactSummary:
      '증상 발현 뒤에는 거의 항상 치명적이지만 신속한 상처 처치와 노출 후 예방으로 막을 수 있다.',
    currentStatus: '개 예방접종과 사람 노출 후 예방 접근성 확대가 핵심이다.',
    sourceIds: ['who-rabies'],
  }),
  defineHistory({
    virusId: 'dengue-virus',
    discovery: {
      dateLabel: '20세기 초',
      context: '모기 매개 전파와 바이러스성 원인이 실험적으로 확립됐다.',
    },
    reservoir: '도시 전파에서는 사람과 Aedes 모기가 주된 순환 고리를 이룬다.',
    primaryHosts: ['사람'],
    impactSummary:
      '열성 질환에서 중증 뎅기까지 일으키며 열대·아열대 도시의 의료 부담을 크게 높인다.',
    currentStatus: '매개체 관리, 임상 감시와 지역별 백신 정책이 병행된다.',
    sourceIds: ['who-dengue'],
  }),
  defineHistory({
    virusId: 'zika-virus',
    discovery: {
      year: 1947,
      place: '우간다 지카 숲',
      context: '황열 감시 중 원숭이에서 처음 분리됐다.',
    },
    reservoir: 'Aedes 모기와 영장류 사이의 순환이 알려져 있다.',
    primaryHosts: ['사람', '비인간 영장류'],
    impactSummary:
      '대개 경증이지만 임신 중 감염은 선천성 이상 위험과 연결돼 큰 보건 우려를 낳았다.',
    currentStatus: '임신 관련 예방과 모기 노출 감소, 유행 감시가 중요하다.',
    sourceIds: ['cdc-zika'],
  }),
  defineHistory({
    virusId: 'yellow-fever-virus',
    discovery: {
      dateLabel: '1900년대 초',
      context: '모기 매개 전파가 입증되고 황열 바이러스가 분리됐다.',
    },
    reservoir:
      '원숭이와 모기가 산림 순환을 유지하며 도시에서는 사람-모기 순환이 가능하다.',
    primaryHosts: ['사람', '비인간 영장류'],
    impactSummary:
      '중증 황달·출혈성 질환을 일으킬 수 있으나 효과적인 백신으로 예방 가능하다.',
    currentStatus: '위험 지역의 예방접종과 매개체 감시가 유행 억제의 중심이다.',
    sourceIds: ['who-yellow-fever'],
  }),
  defineHistory({
    virusId: 'west-nile-virus',
    discovery: {
      year: 1937,
      place: '우간다 웨스트나일 지역',
      context: '열성 질환 환자에서 처음 분리됐다.',
    },
    reservoir: '조류-모기 순환이 자연 전파를 유지한다.',
    primaryHosts: ['조류', '사람과 말은 우발 숙주'],
    impactSummary: '대부분 무증상이지만 일부에서 신경침습성 질환을 일으킨다.',
    currentStatus: '모기와 조류 감시, 개인 방제가 주요 예방 수단이다.',
    sourceIds: ['cdc-west-nile'],
  }),
  defineHistory({
    virusId: 'nipah-virus',
    discovery: {
      year: 1999,
      place: '말레이시아',
      context: '돼지 농장과 관련된 뇌염 집단발생의 원인으로 확인됐다.',
    },
    reservoir: 'Pteropus 과일박쥐가 자연 숙주다.',
    primaryHosts: ['사람', '돼지', '과일박쥐'],
    impactSummary:
      '중증 뇌염과 호흡기 질환을 일으키며 사람 간 전파도 가능해 고위험 신종감염병으로 관리된다.',
    currentStatus: '남아시아의 발생 감시와 노출 차단, 백신·치료제 연구가 진행 중이다.',
    sourceIds: ['who-nipah'],
  }),
  defineHistory({
    virusId: 'lassa-virus',
    discovery: {
      year: 1969,
      place: '나이지리아 라싸',
      context: '출혈열 환자와 의료인 감염 조사에서 확인됐다.',
    },
    reservoir: 'Mastomys 설치류가 주요 자연 숙주다.',
    primaryHosts: ['사람', '다유방쥐류'],
    impactSummary:
      '서아프리카에서 반복되는 급성 바이러스성 출혈열로 임신부와 중증 환자에게 큰 위험을 준다.',
    currentStatus: '설치류 노출 감소, 의료기관 감염관리와 조기 치료가 중요하다.',
    sourceIds: ['who-lassa'],
  }),
  defineHistory({
    virusId: 'cchf-virus',
    discovery: {
      dateLabel: '1944–1969',
      place: '크림반도와 중앙아시아',
      context: '크림 출혈열과 콩고에서 분리된 바이러스가 같은 원인체로 연결됐다.',
    },
    reservoir: 'Hyalomma 진드기와 여러 가축·야생동물이 전파 생태에 관여한다.',
    primaryHosts: ['사람', '가축', '진드기'],
    impactSummary: '진드기나 감염 동물·환자 체액 노출로 중증 출혈열을 일으킬 수 있다.',
    currentStatus: '직업 노출 예방과 의료기관 감염관리, 진드기 감시가 핵심이다.',
    sourceIds: ['who-cchf'],
  }),
  defineHistory({
    virusId: 'measles-virus',
    discovery: {
      year: 1954,
      place: '미국 보스턴',
      context: '환자 검체에서 홍역 바이러스가 분리됐다.',
    },
    primaryHosts: ['사람'],
    impactSummary:
      '전염성이 매우 높고 폐렴·뇌염 같은 합병증을 일으킬 수 있지만 백신으로 예방 가능하다.',
    currentStatus:
      '접종 공백이 생긴 지역에서 재유행하므로 높은 2회 접종률 유지가 필요하다.',
    sourceIds: ['who-measles'],
  }),
  defineHistory({
    virusId: 'rsv',
    discovery: {
      year: 1956,
      place: '미국',
      context: '침팬지의 호흡기 질환에서 분리된 뒤 사람 영아 감염과 연결됐다.',
    },
    primaryHosts: ['사람'],
    impactSummary:
      '영유아와 고령자에서 세기관지염·폐렴의 주요 원인이며 계절성 의료 부담이 크다.',
    currentStatus: '예방 항체와 고령자·임신부 백신을 포함한 예방 선택지가 확대됐다.',
    sourceIds: ['cdc-rsv'],
  }),
  defineHistory({
    virusId: 'poliovirus-1',
    discovery: {
      year: 1908,
      place: '오스트리아',
      context:
        '환자 조직 여과액으로 영장류에 질환을 재현해 바이러스성 원인이 입증됐다.',
    },
    primaryHosts: ['사람'],
    impactSummary:
      '드물게 비가역적 마비를 일으키며 백신 도입 전 세계적으로 큰 소아 질병 부담을 남겼다.',
    currentStatus:
      '야생 1형은 소수 지역에서 전파가 이어져 세계 박멸 사업의 핵심 대상이다.',
    sourceIds: ['who-polio'],
  }),
  defineHistory({
    virusId: 'mpox-virus',
    discovery: {
      year: 1958,
      place: '덴마크',
      context:
        '연구용 원숭이 집단의 질병에서 처음 확인됐고 1970년 사람 사례가 보고됐다.',
    },
    reservoir:
      '정확한 자연 저장소는 확정되지 않았으며 여러 아프리카 소형 포유류가 관련된다.',
    primaryHosts: ['사람', '여러 포유류'],
    impactSummary:
      '피부 병변과 전신 증상을 일으키며 2022년 이후 여러 지역에서 지속 전파가 확인됐다.',
    currentStatus: '감시·검사·접촉 관리와 위험군 예방접종이 시행된다.',
    uncertainty: ['자연 저장소와 종별 기여도는 완전히 규명되지 않았다.'],
    sourceIds: ['who-mpox'],
  }),
  defineHistory({
    virusId: 'variola-virus',
    discovery: {
      dateLabel: '고대부터 알려진 질환, 20세기 바이러스학적 확립',
      context: '천연두는 오랜 역사적 질병이며 예방접종과 세계 감시로 박멸됐다.',
    },
    primaryHosts: ['사람'],
    impactSummary:
      '수세기 동안 막대한 사망과 흉터를 남겼고 1980년 WHO가 세계 박멸을 선언했다.',
    currentStatus: '자연 발생은 없으며 제한된 공식 보관과 대비 체계가 유지된다.',
    sourceIds: ['who-smallpox'],
  }),
  defineHistory({
    virusId: 'hepatitis-c-virus',
    discovery: {
      year: 1989,
      context: '비-A·비-B형 간염의 원인 바이러스 유전체가 분자생물학적으로 확인됐다.',
    },
    primaryHosts: ['사람'],
    impactSummary: '만성 간염·간경변·간암의 주요 원인이며 주로 혈액 노출로 전파된다.',
    currentStatus:
      '직접작용 항바이러스제로 대부분 완치 가능하지만 진단·치료 접근성 격차가 남아 있다.',
    sourceIds: ['who-hepatitis-c'],
  }),
  defineHistory({
    virusId: 'hantaan-virus',
    discovery: {
      year: 1976,
      place: '대한민국 한탄강 유역',
      context: '한국형 출혈열 환자와 설치류에서 원인 바이러스가 분리됐다.',
    },
    reservoir: '등줄쥐가 주요 자연 숙주다.',
    primaryHosts: ['설치류', '사람은 우발 숙주'],
    impactSummary:
      '신증후군출혈열을 일으키며 설치류 배설물 에어로졸 노출이 주요 위험이다.',
    currentStatus: '설치류 노출 예방과 유행지역 감시가 중요하다.',
    sourceIds: ['cdc-hantavirus'],
  }),
  defineHistory({
    virusId: 'varicella-zoster-virus',
    discovery: {
      dateLabel: '20세기 중반',
      context:
        '수두와 대상포진 병변에서 같은 바이러스가 확인되며 두 질환의 연관이 확립됐다.',
    },
    primaryHosts: ['사람'],
    impactSummary: '초감염은 수두를, 잠복 뒤 재활성화는 대상포진을 일으킨다.',
    currentStatus: '수두와 대상포진 백신, 항바이러스제가 질병 부담을 낮춘다.',
    sourceIds: ['cdc-chickenpox'],
  }),
  defineHistory({
    virusId: 'epstein-barr-virus',
    discovery: {
      year: 1964,
      context: '버킷림프종 세포의 전자현미경 관찰에서 처음 확인됐다.',
    },
    primaryHosts: ['사람'],
    impactSummary:
      '매우 흔한 잠복감염 바이러스로 전염성 단핵구증과 일부 암에 관련된다.',
    currentStatus: '예방 백신은 없으며 면역저하자의 관련 질환 감시가 중요하다.',
    sourceIds: ['cdc-ebv'],
  }),
  defineHistory({
    virusId: 'influenza-a-h1n1pdm09',
    discovery: {
      year: 2009,
      place: '북아메리카에서 초기 확인',
      context:
        '새로운 돼지 유래 재분절 H1N1 계통이 사람 간 확산하며 대유행을 일으켰다.',
    },
    primaryHosts: ['사람', '돼지'],
    impactSummary: '2009년 세계 대유행 뒤 계절성 인플루엔자 계통으로 정착했다.',
    currentStatus: '계절 백신 구성과 세계 감시 대상에 포함된다.',
    sourceIds: ['cdc-h1n1-2009'],
  }),
  defineHistory({
    virusId: 'influenza-a-h5n1',
    discovery: {
      year: 1997,
      place: '홍콩',
      context: '고병원성 조류 H5N1의 첫 알려진 사람 감염 집단이 확인됐다.',
    },
    reservoir: '야생 수생 조류와 가금류가 바이러스 생태의 중심이다.',
    primaryHosts: ['조류', '사람과 여러 포유류의 산발 감염'],
    impactSummary:
      '가금류에 큰 피해를 주고 사람 감염 시 중증 위험이 있어 세계적 인수공통감염 감시 대상이다.',
    currentStatus: '동물 발생과 종간 전파를 추적하며 후보 백신과 대비 계획을 갱신한다.',
    sourceIds: ['who-avian-influenza'],
  }),
  defineHistory({
    virusId: 'mumps-virus',
    discovery: {
      year: 1945,
      context: '유행성이하선염 환자 검체에서 바이러스가 분리됐다.',
    },
    primaryHosts: ['사람'],
    impactSummary:
      '이하선염과 드문 신경계·생식계 합병증을 일으키며 밀집 환경에서 집단발생할 수 있다.',
    currentStatus: 'MMR 2회 접종과 유행 시 감시·격리가 중요하다.',
    sourceIds: ['cdc-mumps'],
  }),
  defineHistory({
    virusId: 'rubella-virus',
    discovery: {
      year: 1962,
      context: '풍진 바이러스가 세포배양에서 독립적으로 분리됐다.',
    },
    primaryHosts: ['사람'],
    impactSummary:
      '대개 경증이지만 임신 초 감염은 유산과 선천풍진증후군을 일으킬 수 있다.',
    currentStatus: '높은 MMR 접종률로 임신부와 태아를 보호하는 것이 핵심이다.',
    sourceIds: ['who-rubella'],
  }),
  defineHistory({
    virusId: 'chikungunya-virus',
    discovery: {
      year: 1952,
      place: '당시 탕가니카',
      context: '발열·심한 관절통 유행에서 처음 분리됐다.',
    },
    reservoir: '지역에 따라 사람-모기와 영장류-모기 순환이 존재한다.',
    primaryHosts: ['사람', '비인간 영장류'],
    impactSummary:
      '급성 발열과 오래 지속될 수 있는 관절통을 일으키며 Aedes 모기 확산과 함께 유행 지역이 넓어졌다.',
    currentStatus: '매개체 관리, 여행·유행 감시와 지역별 예방 정책이 중요하다.',
    sourceIds: ['who-chikungunya'],
  }),
  defineHistory({
    virusId: 'hepatitis-a-virus',
    discovery: {
      year: 1973,
      context: '환자 분변에서 면역전자현미경으로 A형간염 바이러스 입자가 확인됐다.',
    },
    primaryHosts: ['사람'],
    impactSummary: '오염된 음식·물과 밀접 접촉으로 전파되는 급성 간염을 일으킨다.',
    currentStatus: '안전한 물·위생과 효과적인 백신으로 예방할 수 있다.',
    sourceIds: ['who-hepatitis-a'],
  }),
] as const;

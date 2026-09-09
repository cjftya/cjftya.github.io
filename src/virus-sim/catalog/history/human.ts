import { defineHistory } from './shared';

const ictv = ['ictv-report'] as const;
const commonCoronavirus = ['cdc-human-coronavirus-history', 'ictv-report'] as const;

export const HUMAN_HISTORY = [
  defineHistory({
    virusId: 'adenovirus-5',
    discovery: {
      year: 1953,
      place: '미국',
      context:
        '아데노이드 조직 배양에서 새로운 세포변성 인자로 분리되며 사람 아데노바이러스 연구가 시작됐다.',
    },
    primaryHosts: ['사람'],
    impactSummary:
      '호흡기·결막·위장관 질환을 일으킬 수 있고, 군부대·의료시설처럼 밀집된 환경에서 집단발생이 문제가 된다. 5형은 유전자 전달 벡터 연구에도 널리 쓰인다.',
    currentStatus:
      '대부분 경증이지만 면역저하자에서는 중증 위험이 있어 감염 관리와 감시가 이어진다.',
    sourceIds: ['cdc-adenovirus', 'ictv-report'],
  }),
  defineHistory({
    virusId: 'rotavirus-rrv',
    discovery: {
      year: 1973,
      place: '호주 멜버른',
      context:
        '소아 위장염 환자의 십이지장 조직에서 사람 로타바이러스 입자가 확인됐다. RRV는 붉은털원숭이 유래 연구 균주다.',
    },
    primaryHosts: ['붉은털원숭이', '사람 로타바이러스의 주요 숙주는 사람'],
    impactSummary:
      '로타바이러스는 영유아 중증 설사의 중요한 원인이었고 백신 도입 뒤 입원과 사망 부담이 크게 감소했다. RRV 자체는 구조·백신 연구에서 사용된 실험 균주다.',
    currentStatus:
      '백신 접종과 감시가 핵심이며, 표시 모델은 사람 유행주가 아닌 RRV 연구 균주임을 구분해야 한다.',
    sourceIds: ictv,
  }),
  defineHistory({
    virusId: 'hsv1',
    discovery: {
      dateLabel: '20세기 초',
      place: '유럽의 임상·실험 연구',
      context:
        '헤르페스 병변의 전염성이 실험적으로 확인되고 바이러스가 분리되면서 현대 HSV 연구가 확립됐다.',
    },
    primaryHosts: ['사람'],
    impactSummary:
      '주로 구강 헤르페스를 일으키며 드물게 각막염·뇌염·신생아 감염처럼 심각한 질환을 일으킨다. 잠복감염 때문에 완전 제거가 어렵다.',
    currentStatus:
      '항바이러스제로 증상과 전파 위험을 줄일 수 있지만 예방 백신은 아직 없다.',
    uncertainty: ['HSV의 진화적 기원은 최초 임상 인식 시점과 동일하지 않다.'],
    sourceIds: ['who-hsv', 'ictv-report'],
  }),
  defineHistory({
    virusId: 'influenza-a',
    discovery: {
      year: 1933,
      place: '영국',
      context:
        '사람 인플루엔자 A 바이러스가 환자 검체에서 분리되며 원인 바이러스가 확정됐다.',
    },
    reservoir: '야생 수생 조류가 인플루엔자 A 다양성의 주요 자연 저장소다.',
    primaryHosts: ['사람', '조류', '돼지와 여러 포유류'],
    impactSummary:
      '계절성 유행과 간헐적 대유행을 일으킨다. 1918·1957·1968·2009년 대유행은 세계적 사망과 사회·경제적 혼란을 남겼다.',
    currentStatus:
      '세계 감시망이 유행주와 동물 유래 신종 바이러스를 추적하고 매년 백신 구성을 갱신한다.',
    sourceIds: ['who-influenza', 'who-influenza-history'],
    events: [
      {
        period: '1918–2009',
        title: '네 차례의 주요 대유행',
        summary:
          '서로 다른 인플루엔자 A 계통이 세계적으로 확산해 큰 보건 피해를 일으켰다.',
        impactType: 'human-health',
      },
    ],
  }),
  defineHistory({
    virusId: 'vsv-indiana',
    discovery: {
      dateLabel: '1920년대',
      place: '미국 인디애나',
      context: '가축의 수포성 구내염 유행에서 Indiana 혈청형이 분리·구분됐다.',
    },
    primaryHosts: ['소', '말', '돼지'],
    hostNote: '사람 감염은 드물며 대개 직업적 노출과 관련된다.',
    impactSummary:
      '가축에서 구제역과 비슷한 수포성 질환을 일으켜 생산과 방역에 부담을 준다. 실험실에서는 RNA 바이러스와 벡터 연구의 대표 모델이다.',
    currentStatus:
      '미주 지역에서 가축 질병 감시 대상이며, 발생 시 감별진단이 중요하다.',
    sourceIds: ['animal-virus-taxonomy', 'virus-model-research'],
  }),
  defineHistory({
    virusId: 'vaccinia-mv',
    discovery: {
      dateLabel: '18–20세기',
      place: '유럽과 여러 백신 생산 계통',
      context:
        '우두 접종 전통에서 유래한 천연두 백신 바이러스로 사용됐고, 현대 vaccinia 계통의 정확한 기원은 복합적이다.',
    },
    primaryHosts: ['실험동물', '사람은 백신 접종 시 감염 가능'],
    impactSummary:
      '천연두 박멸을 가능하게 한 백신 바이러스이며, 현재도 폭스바이러스 연구와 백신 벡터에 중요하다. 면역저하자 등에서는 접종 합병증 위험이 있다.',
    currentStatus:
      '일반 접종은 중단됐지만 특정 직업군과 비상 대비, 백신 벡터 연구에서 관리된다.',
    uncertainty: [
      'vaccinia의 직접 조상과 역사적 백신주 사이의 계통 관계는 완전히 확정되지 않았다.',
    ],
    sourceIds: ictv,
  }),
  defineHistory({
    virusId: 'ebola-virus',
    discovery: {
      year: 1976,
      place: '당시 자이르(현재 콩고민주공화국)',
      context:
        '수단과 자이르에서 발생한 중증 출혈열 유행을 조사하며 처음 인식·분리됐다.',
    },
    reservoir:
      '과일박쥐가 유력한 자연 숙주로 여겨지지만 전파 생태에는 미확정 부분이 있다.',
    primaryHosts: ['사람', '비인간 영장류'],
    impactSummary:
      '높은 치명률의 에볼라 질환을 일으키며, 2014–2016년 서아프리카 유행은 의료체계와 지역사회에 광범위한 피해를 남겼다.',
    currentStatus:
      '백신과 치료제가 사용되지만 조기 발견, 접촉자 추적, 안전한 진료가 계속 중요하다.',
    uncertainty: [
      '정확한 자연 저장소와 최초 사람 감염 경로가 모든 유행에서 확정된 것은 아니다.',
    ],
    sourceIds: ['who-ebola', 'ictv-filoviridae'],
    events: [
      {
        period: '2014–2016',
        place: '서아프리카',
        title: '대규모 에볼라 유행',
        summary:
          '기니·라이베리아·시에라리온을 중심으로 가장 큰 에볼라 유행이 발생했다.',
        impactType: 'human-health',
      },
    ],
  }),
  defineHistory({
    virusId: 'sudan-virus',
    discovery: {
      year: 1976,
      place: '수단 남부',
      context: '자이르 유행과 같은 해 별개의 에볼라 질환 유행에서 확인됐다.',
    },
    primaryHosts: ['사람', '자연 숙주는 확정되지 않음'],
    impactSummary:
      '수단과 우간다에서 반복적으로 중증 에볼라 질환 유행을 일으켰다. 승인된 종 특이 백신·치료 선택지가 제한적이라는 점이 대응을 어렵게 한다.',
    currentStatus: '유행 감시와 후보 백신·치료제 연구가 계속된다.',
    uncertainty: ['자연 저장소는 확정되지 않았다.'],
    sourceIds: ['who-ebola', 'ictv-filoviridae'],
  }),
  defineHistory({
    virusId: 'bundibugyo-virus',
    discovery: {
      year: 2007,
      place: '우간다 분디부교',
      context: '새로운 에볼라 질환 유행의 원인으로 확인됐다.',
    },
    primaryHosts: ['사람', '자연 숙주는 확정되지 않음'],
    impactSummary:
      '우간다와 콩고민주공화국에서 중증 유행을 일으켰으며, 발생 지역의 의료·공중보건 자원에 부담을 줬다.',
    currentStatus: '드물지만 재출현 가능성이 있어 필로바이러스 감시 대상이다.',
    uncertainty: ['자연 저장소와 유행 사이의 연결 고리는 충분히 규명되지 않았다.'],
    sourceIds: ['who-ebola', 'ictv-filoviridae'],
  }),
  defineHistory({
    virusId: 'tai-forest-virus',
    discovery: {
      year: 1994,
      place: '코트디부아르 타이 국립공원',
      context: '감염된 침팬지 부검에 참여한 연구자의 단일 중증 사례에서 확인됐다.',
    },
    primaryHosts: ['사람에서 확인된 사례는 매우 적음', '비인간 영장류'],
    impactSummary:
      '알려진 사람 감염은 극히 제한적이지만 야생동물-사람 경계에서의 필로바이러스 노출 위험을 보여줬다.',
    currentStatus: '대규모 유행은 보고되지 않았고 생태와 숙주 범위에 불확실성이 크다.',
    uncertainty: ['자연 저장소와 실제 유행 가능성은 확정되지 않았다.'],
    sourceIds: ['ictv-filoviridae'],
  }),
  defineHistory({
    virusId: 'reston-virus',
    discovery: {
      year: 1989,
      place: '미국 버지니아주 레스턴',
      context: '필리핀에서 수입된 원숭이 집단의 질병 조사 중 확인됐다.',
    },
    primaryHosts: ['필리핀산 원숭이', '돼지'],
    impactSummary:
      '비인간 영장류에서 치명적 질병을 일으켰고 사육시설 방역에 큰 영향을 줬다. 사람 감염 증거는 있으나 사람에서 중증 질환을 일으킨 사례는 확립되지 않았다.',
    currentStatus: '동물과 사람의 접점에서 감시되는 인수공통감염 후보 바이러스다.',
    uncertainty: ['사람에 대한 병원성과 자연 저장소는 충분히 규명되지 않았다.'],
    sourceIds: ['ictv-filoviridae'],
  }),
  defineHistory({
    virusId: 'bombali-virus',
    discovery: {
      year: 2018,
      place: '시에라리온 봄발리 지역',
      context:
        '박쥐 시료의 유전체 감시에서 발견됐으며 사람 환자 유행에서 분리된 것은 아니다.',
    },
    reservoir: '식충박쥐에서 유전물질이 검출됐다.',
    impactSummary:
      '현재 사람 질환이나 실제 유행이 확인되지 않았다. 에볼라 계열 바이러스의 자연 다양성과 선제 감시의 중요성을 보여준다.',
    currentStatus: '병원성·전파 가능성을 평가하는 연구 단계다.',
    uncertainty: ['감염성 바이러스의 숙주 범위와 사람 병원성은 알려져 있지 않다.'],
    sourceIds: ['ictv-filoviridae'],
  }),
  defineHistory({
    virusId: 'hiv-1',
    discovery: {
      dateLabel: '1983–1984',
      place: '프랑스와 미국',
      context:
        'AIDS 환자 검체에서 새로운 레트로바이러스가 분리되고 AIDS의 원인으로 확립됐다.',
    },
    primaryHosts: ['사람'],
    hostNote:
      '계통학적으로 중앙아프리카의 영장류 바이러스에서 여러 차례 종간 전파된 것으로 이해된다.',
    impactSummary:
      '전 세계 HIV 감염의 대부분을 차지하며 치료 전에는 면역결핍과 기회감염·암을 일으켰다. 항레트로바이러스 치료는 생존과 전파 위험을 크게 개선했다.',
    currentStatus:
      '관리 가능한 만성 감염이 됐지만 완치 백신은 없고 접근성 격차가 남아 있다.',
    uncertainty: [
      '최초 인체 감염의 정확한 시점과 경로는 직접 관찰이 아니라 계통학적으로 추정한다.',
    ],
    sourceIds: ['who-hiv', 'ictv-report'],
  }),
  defineHistory({
    virusId: 'hiv-2',
    discovery: {
      year: 1986,
      place: '서아프리카 환자 검체',
      context: 'HIV-1과 구별되는 인간 면역결핍 바이러스로 분리·보고됐다.',
    },
    primaryHosts: ['사람'],
    hostNote: '서아프리카의 검댕망가베이 SIV와 관련된 종간 전파가 기원으로 이해된다.',
    impactSummary:
      '주로 서아프리카에 분포하며 HIV-1보다 전파력과 진행 속도가 낮은 편이지만 AIDS를 일으킬 수 있다. 약제 감수성이 달라 정확한 진단이 중요하다.',
    currentStatus: 'HIV-1보다 드물지만 지역별 검사와 맞춤 치료가 필요하다.',
    sourceIds: ['who-hiv', 'ictv-report'],
  }),
  ...[
    [
      'hcov-229e',
      '1960년대',
      '미국과 영국의 감기 연구',
      '감기 환자 검체에서 분리된 초기 사람 코로나바이러스 가운데 하나다.',
      '주로 가벼운 상기도 감염을 일으키지만 영유아·고령자·면역저하자에서는 중증 하기도 감염이 가능하다.',
    ],
    [
      'hcov-nl63',
      '2004년',
      '네덜란드',
      '호흡기 질환 소아 검체에서 새로운 사람 코로나바이러스로 확인됐다.',
      '전 세계에서 소아 크루프와 호흡기 감염을 일으키며 취약군에서는 중증화할 수 있다.',
    ],
    [
      'hcov-oc43',
      '1960년대',
      '미국의 감기 연구',
      '사람 호흡기 검체에서 배양·분리되며 알려졌다.',
      '계절성 감기의 흔한 원인 가운데 하나이며 드물게 취약군의 중증 하기도·신경계 질환과 관련된다.',
    ],
    [
      'hcov-hku1',
      '2005년',
      '홍콩',
      '폐렴 환자 검체의 유전체 분석에서 확인됐다.',
      '계절성 호흡기 감염을 일으키고 고령자나 기저질환자에서 폐렴과 관련될 수 있다.',
    ],
  ].map(([virusId, dateLabel, place, context, impactSummary]) =>
    defineHistory({
      virusId: virusId!,
      discovery: { dateLabel, place, context: context! },
      primaryHosts: ['사람'],
      impactSummary: impactSummary!,
      currentStatus: '계절성 사람 코로나바이러스로 전 세계에서 계속 순환한다.',
      uncertainty: ['진화적 기원은 최초 분리 장소와 동일한 뜻이 아니다.'],
      sourceIds: commonCoronavirus,
    }),
  ),
  defineHistory({
    virusId: 'sars-cov',
    discovery: {
      dateLabel: '2002–2003',
      place: '중국 광둥성과 홍콩',
      context: '비정형 폐렴 집단발생에서 원인 코로나바이러스가 확인됐다.',
    },
    primaryHosts: ['사람'],
    reservoir:
      '박쥐 계통 바이러스가 장기 자연 저장소로 여겨지며 사향고양이가 초기 증폭 숙주로 관여했다.',
    impactSummary:
      '2002–2004년 국제 유행으로 중증급성호흡기증후군과 사망, 병원 내 전파, 여행·경제 혼란을 일으켰다.',
    currentStatus:
      '2004년 이후 지역사회 전파는 확인되지 않았지만 실험실 안전과 재출현 감시가 중요하다.',
    sourceIds: ['cdc-human-coronavirus-history', 'ictv-report'],
  }),
  defineHistory({
    virusId: 'mers-cov',
    discovery: {
      year: 2012,
      place: '사우디아라비아와 요르단',
      context: '중증 호흡기 질환 사례에서 처음 확인됐다.',
    },
    reservoir: '단봉낙타가 사람 감염의 주요 동물 저장소다.',
    primaryHosts: ['단봉낙타', '사람'],
    impactSummary:
      '중동을 중심으로 산발적 인수공통감염과 의료기관 집단발생을 일으켰고, 2015년 한국 유행처럼 국제적 확산도 발생했다.',
    currentStatus:
      '지속적인 낙타-사람 전파와 제한적 사람 간 전파 때문에 국제 감시가 계속된다.',
    sourceIds: ['who-mers', 'ictv-report'],
  }),
  defineHistory({
    virusId: 'sars-cov-2',
    discovery: {
      year: 2019,
      place: '중국 우한',
      context: '원인 불명 폐렴 집단발생의 원인 바이러스로 확인됐다.',
    },
    primaryHosts: ['사람'],
    hostNote:
      '박쥐 계통 코로나바이러스와 가깝지만 사람 유입의 구체적 경로는 확정되지 않았다.',
    impactSummary:
      'COVID-19 세계적 대유행을 일으켜 대규모 질병·사망과 장기 후유증, 보건의료·교육·경제 전반의 혼란을 초래했다.',
    currentStatus:
      '백신과 면역, 치료제가 중증 부담을 낮췄지만 변이와 재감염을 동반해 계속 순환한다.',
    uncertainty: ['최초 사람 감염의 정확한 장소·중간 숙주·경로는 확정되지 않았다.'],
    sourceIds: ['who-covid', 'ictv-report'],
  }),
] as const;

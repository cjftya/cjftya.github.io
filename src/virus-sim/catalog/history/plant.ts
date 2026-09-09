import { defineHistory } from './shared';

const plantSources = ['tmv-history', 'plant-virus-review', 'ictv-report'] as const;

export const PLANT_HISTORY = [
  defineHistory({
    virusId: 'tmv',
    discovery: {
      dateLabel: '1886–1898',
      place: '유럽의 담배 연구',
      context:
        '담배 모자이크병의 여과성 감염 인자 연구에서 세균과 다른 바이러스 개념이 확립됐다.',
    },
    primaryHosts: ['담배', '토마토를 포함한 가지과 식물'],
    impactSummary:
      '담배와 여러 작물에 모자이크·생육저하를 일으킨다. 최초로 규명된 바이러스이자 최초로 결정화된 바이러스로 바이러스학과 구조생물학의 토대를 만들었다.',
    currentStatus:
      '저항성 품종·위생 관리가 중요하며, 실험실에서는 식물 바이러스의 대표 모델로 쓰인다.',
    sourceIds: plantSources,
    events: [
      {
        period: '1890년대',
        title: '바이러스 개념의 출발점',
        summary:
          '세균 여과기를 통과하는 감염 인자라는 관찰이 새로운 병원체 범주를 여는 계기가 됐다.',
        impactType: 'research',
      },
    ],
  }),
  defineHistory({
    virusId: 'ccmv',
    discovery: {
      dateLabel: '20세기 중반',
      place: '북미의 동부콩 병해 연구',
      context: '동부콩의 퇴록 얼룩 증상과 연관된 바이러스로 분리·분류됐다.',
    },
    primaryHosts: ['동부콩과 일부 콩과 식물'],
    impactSummary:
      '감수성 식물에 모자이크와 생육 저하를 일으키지만, 현대에는 자가조립 캡시드와 나노소재 연구 모델로 더 널리 알려져 있다.',
    currentStatus: '식물 병리와 바이러스 나노입자 연구에서 사용된다.',
    sourceIds: plantSources,
  }),
  defineHistory({
    virusId: 'bmv',
    discovery: {
      dateLabel: '20세기 중반',
      place: '북미의 벼과 식물 병해 조사',
      context: 'brome grass의 모자이크병 원인으로 연구됐다.',
    },
    primaryHosts: ['벼과 식물'],
    impactSummary:
      '일부 곡류와 풀에서 모자이크 증상을 일으킨다. 분절 RNA의 복제·재조합·포장을 연구하는 대표 식물 바이러스다.',
    currentStatus: '농업 피해보다 양성가닥 RNA 바이러스 기초연구에서 중요성이 크다.',
    sourceIds: plantSources,
  }),
  defineHistory({
    virusId: 'cpmv',
    discovery: {
      dateLabel: '20세기 중반',
      place: '아프리카의 동부콩 재배지',
      context: '동부콩 모자이크병의 원인 바이러스로 분리됐다.',
    },
    primaryHosts: ['동부콩과 콩과 작물'],
    impactSummary:
      '감수성 동부콩에서 모자이크와 수량 감소를 일으킨다. 안정적인 캡시드 때문에 식물 기반 발현과 나노의학 전달체 연구에도 이용된다.',
    currentStatus: '매개 딱정벌레 관리와 저항성 품종이 농업 대응의 중심이다.',
    sourceIds: plantSources,
  }),
  defineHistory({
    virusId: 'tbsv',
    discovery: {
      dateLabel: '1930년대',
      place: '영국의 토마토 재배지',
      context: '토마토의 덤불위축 증상을 일으키는 바이러스로 기술됐다.',
    },
    primaryHosts: ['토마토와 여러 초본식물'],
    impactSummary:
      '토마토에서 생육 위축과 과실 손실을 일으킬 수 있다. 작은 구형 RNA 바이러스의 복제와 숙주 상호작용 연구 모델이기도 하다.',
    currentStatus: '종자·토양·기계적 전염 관리와 실험 모델 양쪽에서 다뤄진다.',
    sourceIds: plantSources,
  }),
  defineHistory({
    virusId: 'stmv',
    discovery: {
      year: 1986,
      place: '미국의 담배 모자이크병 연구',
      context:
        '담배모자이크바이러스의 도움을 받아 증식하는 작은 위성 바이러스로 확인됐다.',
    },
    primaryHosts: ['TMV가 감염하는 가지과 식물'],
    hostNote: '독립적으로 증식하지 못하고 helper tobamovirus가 필요하다.',
    impactSummary:
      '단독 피해보다 helper virus와의 상호작용을 바꾸며 증상과 바이러스 축적에 영향을 준다. RNA 구조·자가조립 연구에 중요하다.',
    currentStatus: '위성 바이러스 생물학의 대표 실험계다.',
    sourceIds: plantSources,
  }),
  defineHistory({
    virusId: 'cmv-fny',
    discovery: {
      dateLabel: '1910년대',
      place: '미국의 오이 재배지',
      context:
        '오이 모자이크병의 전염성 원인으로 기술됐고, Fny는 이후 널리 쓰인 연구 균주다.',
    },
    primaryHosts: ['오이·고추·토마토·관상식물 등 매우 넓은 식물 범위'],
    impactSummary:
      '가장 넓은 숙주 범위를 가진 식물 바이러스 가운데 하나로 모자이크·왜화·기형과 수량·상품성 저하를 일으킨다.',
    currentStatus: '진딧물 매개 전파, 잡초 저장소, 감염묘 관리가 중요하다.',
    sourceIds: plantSources,
  }),
  defineHistory({
    virusId: 'tymv',
    discovery: {
      dateLabel: '20세기 중반',
      place: '유럽의 순무 병해 연구',
      context: '순무의 황화 모자이크 증상에서 분리됐다.',
    },
    primaryHosts: ['순무와 배추과 식물'],
    impactSummary:
      '배추과 작물에 황화·모자이크와 생육 저하를 일으키며, T=3 캡시드와 RNA 구조 연구에 활용됐다.',
    currentStatus: '농업 현장에서는 감염 식물과 매개 곤충 관리가 중심이다.',
    sourceIds: plantSources,
  }),
  defineHistory({
    virusId: 'pvx',
    discovery: {
      dateLabel: '1930년대',
      place: '유럽의 감자 바이러스 분류 연구',
      context: '감자 모자이크를 일으키는 여러 바이러스 가운데 X 바이러스로 구분됐다.',
    },
    primaryHosts: ['감자와 가지과 식물'],
    impactSummary:
      '단독 감염은 비교적 약한 경우가 많지만 수량을 낮출 수 있고, PVY 등과 복합감염하면 피해가 크게 심해질 수 있다.',
    currentStatus: '무병 씨감자, 저항성 품종, 위생 관리로 통제한다.',
    sourceIds: plantSources,
  }),
  defineHistory({
    virusId: 'papmv',
    discovery: {
      dateLabel: '20세기',
      place: '아메리카의 파파야 재배지',
      context: '파파야 모자이크 증상과 관련된 potexvirus로 분리·분류됐다.',
    },
    primaryHosts: ['파파야'],
    impactSummary:
      '잎 모자이크와 생육·과실 품질 저하를 일으킬 수 있다. 캡시드 단백질의 면역자극성과 나노입자 응용도 연구된다.',
    currentStatus: '감염주 제거와 무병 번식재 관리가 주요 대응이다.',
    sourceIds: plantSources,
  }),
  defineHistory({
    virusId: 'pvy',
    discovery: {
      dateLabel: '1930년대',
      place: '유럽의 감자 바이러스 분류 연구',
      context: '감자 바이러스군에서 Y 바이러스로 구분됐다.',
    },
    primaryHosts: ['감자', '담배', '고추와 다른 가지과 식물'],
    impactSummary:
      '감자의 수량과 종서 품질을 낮추고 일부 계통은 괴경 괴사 고리무늬를 일으켜 세계 감자 산업에 큰 손실을 준다.',
    currentStatus: '무병 씨감자 인증, 진딧물 관리, 저항성 품종과 계통 감시가 사용된다.',
    sourceIds: plantSources,
  }),
  defineHistory({
    virusId: 'camv',
    discovery: {
      dateLabel: '20세기 중반',
      place: '유럽의 콜리플라워 병해 연구',
      context: '배추과 식물의 모자이크병 원인 DNA 바이러스로 분리됐다.',
    },
    primaryHosts: ['콜리플라워와 배추과 식물'],
    impactSummary:
      '모자이크·왜화와 수량 저하를 일으킨다. 강한 35S promoter는 식물 분자생물학과 형질전환 기술의 핵심 도구가 됐다.',
    currentStatus: '농업 병원체이면서 식물 생명공학의 중요한 연구 자원이다.',
    sourceIds: plantSources,
  }),
  defineHistory({
    virusId: 'maize-streak',
    discovery: {
      dateLabel: '19세기 말–20세기 초',
      place: '남부 아프리카',
      context:
        '옥수수 잎의 줄무늬와 심한 왜화 질병으로 기록되고 바이러스성 병해로 규명됐다.',
    },
    primaryHosts: ['옥수수와 일부 벼과 식물'],
    impactSummary:
      '사하라 이남 아프리카에서 감수성 옥수수의 생육을 크게 억제하고 심한 경우 수확을 거의 잃게 할 수 있는 중요한 식량안보 병해다.',
    currentStatus: '저항성 품종과 매개 매미충 관리가 핵심이다.',
    sourceIds: plantSources,
  }),
  defineHistory({
    virusId: 'tylcv',
    discovery: {
      dateLabel: '1930년대',
      place: '동지중해 지역',
      context:
        '토마토의 잎말림·황화·왜화 질병으로 인식됐고 이후 원인 begomovirus가 규명됐다.',
    },
    primaryHosts: ['토마토와 일부 가지과 식물'],
    impactSummary:
      '담배가루이가 전파하며 어린 토마토 감염 시 착과와 수량을 심각하게 낮춘다. 국제적 묘목·매개충 이동으로 여러 대륙에 확산했다.',
    currentStatus: '저항성 품종, 매개충 통합관리, 감염묘 차단이 중요하다.',
    sourceIds: plantSources,
  }),
] as const;

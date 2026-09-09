import { defineHistory } from './shared';

const sources = ['archaeal-virus-review', 'ictv-report'] as const;

export const ARCHAEA_HISTORY = [
  defineHistory({
    virusId: 'ssv1',
    discovery: {
      dateLabel: '1980년대',
      place: '일본 벳푸의 산성 온천',
      context: '고온성 Sulfolobus 배양주에서 유도되는 방추형 바이러스로 발견됐다.',
    },
    primaryHosts: ['Sulfolobus 계열 고세균'],
    impactSummary:
      '사람·동물·작물 질병과 관련되지 않는다. 극한환경 바이러스, 고세균 유전자 조절과 통합성 바이러스 연구의 대표 모델이다.',
    currentStatus: '고세균 바이러스학과 열안정성 생체분자 연구에서 사용된다.',
    uncertainty: [
      '온천에서의 최초 분리는 이 바이러스 계통의 진화적 기원을 뜻하지 않는다.',
    ],
    sourceIds: sources,
  }),
  defineHistory({
    virusId: 'sirv2',
    discovery: {
      dateLabel: '1990년대',
      place: '아이슬란드의 산성 온천',
      context: 'Sulfolobus islandicus에 감염하는 막대형 고세균 바이러스로 분리됐다.',
    },
    primaryHosts: ['Sulfolobus islandicus'],
    impactSummary:
      '알려진 사람 질병 피해는 없다. 극한환경에서 안정적인 막대형 캡시드와 독특한 세포 탈출 구조를 이해하는 데 중요하다.',
    currentStatus: '고세균-바이러스 상호작용과 극한환경 생물학 연구 모델이다.',
    sourceIds: sources,
  }),
  defineHistory({
    virusId: 'stiv',
    discovery: {
      dateLabel: '2000년대 초',
      place: '미국 옐로스톤의 산성 온천',
      context: '고온·산성 환경의 Sulfolobus에서 turreted icosahedral virus로 분리됐다.',
    },
    primaryHosts: ['Sulfolobus 계열 고세균'],
    impactSummary:
      '사람에게 알려진 직접 피해는 없으며, 고세균 바이러스의 다면체 캡시드·내부막·피라미드형 세포 탈출 구조 연구에 기여했다.',
    currentStatus: '서로 먼 바이러스 집단의 구조 진화를 비교하는 연구 자원이다.',
    sourceIds: sources,
  }),
  defineHistory({
    virusId: 'atv',
    discovery: {
      dateLabel: '2000년대',
      place: '이탈리아의 고온 산성 환경',
      context:
        'Acidianus 고세균에서 방추형 입자로 분리됐고 숙주 밖에서 양끝 꼬리가 발달하는 현상이 관찰됐다.',
    },
    primaryHosts: ['Acidianus 계열 고세균'],
    impactSummary:
      '사람·동물·작물 질병과 관련되지 않는다. 숙주 밖에서 형태가 성숙하는 매우 드문 바이러스 조립 방식 때문에 과학적으로 중요하다.',
    currentStatus: '극한환경 바이러스의 형태 형성과 진화를 연구하는 특수 모델이다.',
    sourceIds: sources,
  }),
] as const;

import { defineHistory } from './shared';

const phageSources = ['phage-history', 'virus-model-research', 'ictv-report'] as const;

function researchPhage(input: {
  virusId: string;
  dateLabel: string;
  place?: string;
  context: string;
  hosts: readonly string[];
  significance: string;
  currentStatus?: string;
}) {
  return defineHistory({
    virusId: input.virusId,
    discovery: {
      dateLabel: input.dateLabel,
      place: input.place,
      context: input.context,
    },
    primaryHosts: input.hosts,
    impactSummary: `사람에게 직접 질병을 일으키는 바이러스는 아니다. ${input.significance}`,
    currentStatus:
      input.currentStatus ??
      '세균-파지 상호작용과 분자생물학 연구에서 보존·활용되는 기준 파지다.',
    uncertainty: ['최초 분리 장소는 진화적 기원이나 자연 분포 전체를 뜻하지 않는다.'],
    sourceIds: phageSources,
  });
}

export const PHAGE_HISTORY = [
  researchPhage({
    virusId: 't4',
    dateLabel: '1940년대',
    place: '미국의 대장균 파지 연구',
    context: 'T 계열 대장균 파지의 하나로 표준화돼 유전학·형태 연구에 쓰였다.',
    hosts: ['Escherichia coli'],
    significance:
      '수축성 꼬리의 감염 장치, DNA 복제, 유전자 개념을 밝히는 데 큰 역할을 했다.',
  }),
  researchPhage({
    virusId: 'lambda',
    dateLabel: '1950년대',
    place: '미국',
    context: '자외선 처리한 E. coli K-12에서 용원성 파지로 발견됐다.',
    hosts: ['Escherichia coli'],
    significance:
      '용원성, 유전자 조절, 재조합, 분자 클로닝을 이해하는 대표 모델이 됐다.',
  }),
  researchPhage({
    virusId: 't7',
    dateLabel: '1940년대',
    place: '미국의 대장균 파지 수집',
    context: 'T 계열 파지 가운데 짧은 꼬리를 가진 독립 연구 모델로 정리됐다.',
    hosts: ['Escherichia coli'],
    significance: 'T7 RNA 중합효소와 발현 시스템은 현대 생명공학의 표준 도구가 됐다.',
  }),
  researchPhage({
    virusId: 'ms2',
    dateLabel: '1961년',
    context: '수컷 특이 대장균에 감염하는 작은 RNA 파지로 분리됐다.',
    hosts: ['F pili를 가진 Escherichia coli'],
    significance:
      'RNA 유전정보, 번역 조절, 캡시드 조립과 수질 지표 연구에 널리 쓰인다.',
  }),
  researchPhage({
    virusId: 'm13',
    dateLabel: '1960년대',
    context: 'F pili를 가진 대장균에서 증식하는 필라멘트형 파지로 연구됐다.',
    hosts: ['F pili를 가진 Escherichia coli'],
    significance:
      '숙주를 즉시 용해하지 않고 방출되며, DNA 시퀀싱·파지 디스플레이·나노재료의 핵심 도구가 됐다.',
  }),
  researchPhage({
    virusId: 'phix174',
    dateLabel: '1930년대',
    context: '작은 단일가닥 DNA 대장균 파지로 분리됐다.',
    hosts: ['Escherichia coli와 가까운 장내세균'],
    significance:
      '최초로 완전한 DNA 유전체 서열이 결정된 생물체로 유전체학의 이정표가 됐다.',
  }),
  researchPhage({
    virusId: 'qbeta',
    dateLabel: '1960년대',
    context: '수컷 특이 RNA 대장균 파지 연구에서 분리·분류됐다.',
    hosts: ['F pili를 가진 Escherichia coli'],
    significance: 'RNA 복제효소, 준종 진화, 캡시드 기반 백신 입자 연구에 기여했다.',
  }),
  researchPhage({
    virusId: 'phi29',
    dateLabel: '1960년대',
    context: 'Bacillus subtilis 계열 세균에 감염하는 작은 꼬리 파지로 분리됐다.',
    hosts: ['Bacillus subtilis'],
    significance:
      '강력한 DNA 중합효소와 포털 모터 연구로 전장 유전체 증폭과 나노모터 연구에 쓰인다.',
  }),
  researchPhage({
    virusId: 'p22',
    dateLabel: '1950년대',
    context: 'Salmonella의 용원성·형질도입을 연구하는 파지로 확립됐다.',
    hosts: ['Salmonella enterica'],
    significance: '일반 형질도입, 캡시드 조립, DNA 포장 연구의 대표 모델이다.',
  }),
  researchPhage({
    virusId: 'hk97',
    dateLabel: '1970년대',
    place: '홍콩',
    context: '대장균에 감염하는 온건성 파지로 분리됐다.',
    hosts: ['Escherichia coli'],
    significance:
      '성숙 과정에서 공유결합으로 연결되는 캡시드와 HK97 fold 연구의 기준이 됐다.',
  }),
  researchPhage({
    virusId: 't5',
    dateLabel: '1940년대',
    context: 'T 계열 대장균 파지의 하나로 표준 연구군에 포함됐다.',
    hosts: ['Escherichia coli'],
    significance: '긴 비수축성 꼬리, 단계적 DNA 주입, 큰 파지 유전체 연구에 사용된다.',
  }),
  researchPhage({
    virusId: 't1',
    dateLabel: '1940년대',
    context: 'T 계열 대장균 파지의 하나로 표준화됐다.',
    hosts: ['Escherichia coli'],
    significance:
      '고전 파지 유전학과 긴 꼬리 파지 구조 비교에 사용됐고 실험실 오염 파지로도 잘 알려져 있다.',
  }),
  researchPhage({
    virusId: 'prd1',
    dateLabel: '1970년대',
    context:
      '광범위 숙주 플라스미드 의존성 세균에 감염하는 내부막 보유 파지로 분리됐다.',
    hosts: ['여러 그람음성 세균'],
    significance:
      '바이러스 내부막과 서로 다른 숙주 영역 사이의 구조 진화 관계를 연구하는 모델이다.',
  }),
  researchPhage({
    virusId: 'phi6',
    dateLabel: '1970년대',
    place: '미국의 식물 병원성 세균 연구',
    context:
      'Pseudomonas 감염 파지 가운데 외피와 분절 dsRNA를 가진 독특한 바이러스로 분리됐다.',
    hosts: ['Pseudomonas syringae 계열'],
    significance:
      '분절 RNA 재배열, 외피 바이러스, 환경 안정성 연구에서 인플루엔자 대체 모델로 쓰인다.',
  }),
  researchPhage({
    virusId: 'pm2',
    dateLabel: '1960년대',
    place: '칠레 연안',
    context: '해양 Pseudoalteromonas 계열 세균에 감염하는 내부막 보유 파지로 분리됐다.',
    hosts: ['해양 Pseudoalteromonas 계열 세균'],
    significance:
      '해양 파지 생태와 내부막을 가진 DNA 바이러스의 진화를 이해하는 모델이다.',
  }),
  researchPhage({
    virusId: 'ap205',
    dateLabel: '20세기 후반',
    context: 'Acinetobacter에 감염하는 작은 RNA 파지로 분리·연구됐다.',
    hosts: ['Acinetobacter 계열 세균'],
    significance:
      '안정적인 캡시드가 바이러스유사입자 백신 플랫폼과 RNA 포장 연구에 활용된다.',
  }),
] as const;

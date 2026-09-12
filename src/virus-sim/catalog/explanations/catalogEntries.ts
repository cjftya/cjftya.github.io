import { getCatalogEntry } from '../registry';
import type {
  ObservationDefinition,
  ObservationLayerId,
  ObservationPartId,
  VirusId,
} from '../types';
import {
  layerTarget,
  partTarget,
  type EntryExplanationRegistration,
  type StructureExplanationContent,
  type StructureExplanationEvidence,
  type StructureExplanationTarget,
} from './types';

interface StructureNameProfile {
  readonly name: string;
  readonly summary?: string;
  readonly role?: string;
  readonly location?: string;
  readonly relationship?: string;
  readonly model?: string;
  readonly simplification?: string;
  readonly evidence?: StructureExplanationEvidence;
}

type ProfileValue = string | StructureNameProfile;
type EntryProfile = Readonly<Record<string, ProfileValue>>;

const profile = (
  name: string,
  overrides: Omit<StructureNameProfile, 'name'> = {},
): StructureNameProfile => ({ name, ...overrides });

const DETAILS: Readonly<
  Record<
    ObservationPartId,
    Pick<
      StructureExplanationContent,
      'genericSummary' | 'role' | 'location' | 'modelRepresentation'
    > & { readonly relationship: string }
  >
> = {
  capsid: {
    genericSummary: '유전체를 둘러싸는 바이러스의 주된 단백질 shell이에요.',
    role: '유전체를 보호하고 입자의 전체 형태와 조립 틀을 만들어요.',
    location: '유전체 바깥의 단백질 껍질',
    relationship: '반복 capsomer가 shell을 만들고 내부 유전체를 둘러싸요.',
    modelRepresentation: '현재 모델의 주된 다면체 또는 연속 shell로 표시해요.',
  },
  capsomer: {
    genericSummary: 'capsid 표면을 조립하는 반복 단백질 단위예요.',
    role: '인접 단위와 결합해 안정한 capsid 격자를 만들어요.',
    location: 'capsid shell 표면',
    relationship: '같은 단위가 반복되어 capsid 면과 꼭짓점의 배열을 만들어요.',
    modelRepresentation: 'shell 표면에 반복되는 작은 기둥이나 patch로 표시해요.',
  },
  genome: {
    genericSummary: '입자 안에 포장되어 다음 감염 주기로 전달되는 바이러스 핵산이에요.',
    role: '바이러스 단백질 발현과 새 유전체 복제에 필요한 정보를 담아요.',
    location: 'capsid 또는 가장 안쪽 core 내부',
    relationship: '주변 capsid·coat protein 또는 nucleoprotein과 함께 포장돼요.',
    modelRepresentation: '내부의 보라색 코일·곡선 또는 분절 묶음으로 표시해요.',
  },
  neck: {
    genericSummary: '파지 머리와 꼬리를 연결하는 head–tail connector 영역이에요.',
    role: '머리와 꼬리를 결합하고 DNA 전달 축을 정렬해요.',
    location: 'capsid 아래와 꼬리 위 사이',
    relationship: '위쪽 portal과 아래쪽 tail tube를 이어줘요.',
    modelRepresentation: '머리 아래의 짧은 고리와 원통으로 표시해요.',
  },
  sheath: {
    genericSummary: '파지 tail tube 바깥에서 수축하는 단백질성 꼬리집이에요.',
    role: '수축하며 내부 관을 숙주 표면 쪽으로 밀어 넣어요.',
    location: 'neck과 baseplate 사이, inner tube 바깥',
    relationship: '안쪽 inner tube와 아래쪽 baseplate에 기계적으로 연결돼요.',
    modelRepresentation: 'tail tube 둘레의 반복 고리 또는 두꺼운 관으로 표시해요.',
  },
  'inner-tube': {
    genericSummary: '파지 유전체가 이동하는 중심 tail tube예요.',
    role: 'capsid와 숙주 세포 사이의 DNA 전달 통로를 만들어요.',
    location: 'head–tail 축의 중심',
    relationship: '위쪽 portal과 아래쪽 말단 장치를 연결해요.',
    modelRepresentation: '꼬리 중심의 가는 원통으로 표시해요.',
  },
  baseplate: {
    genericSummary: '파지 꼬리 끝의 부착·수축 신호 플랫폼이에요.',
    role: '숙주 접촉을 감지하고 꼬리 장치를 안정화해요.',
    location: 'tail distal end',
    relationship: 'tail tube와 여러 tail fiber가 이 구조에 모여요.',
    modelRepresentation: '꼬리 끝의 다각형 판과 짧은 다리로 표시해요.',
  },
  'tail-fiber': {
    genericSummary: '파지가 숙주 표면을 탐색하고 부착하는 가는 섬유 구조예요.',
    role: '숙주 수용체를 인식하고 꼬리 끝을 세포 표면에 고정해요.',
    location: 'tail distal end 또는 connector 둘레',
    relationship: '꼬리 관·말단 허브와 연결되어 감염의 첫 접촉을 만들어요.',
    modelRepresentation: '꼬리에서 여러 방향으로 뻗는 분절 선으로 표시해요.',
  },
  tailspike: {
    genericSummary: '짧고 굵은 파지 꼬리의 수용체 결합 spike예요.',
    role: '숙주 표면 다당류를 인식하고 안정한 부착을 도와요.',
    location: '짧은 tail hub 둘레',
    relationship: '중앙 tail machine에 방사형으로 결합해요.',
    modelRepresentation: '꼬리 허브 둘레의 굵은 분절 돌기로 표시해요.',
  },
  'flexible-tail': {
    genericSummary: '수축하지 않는 길고 유연한 파지 tail tube예요.',
    role: '머리의 DNA가 숙주 세포 쪽으로 이동할 통로를 만들어요.',
    location: 'head connector 아래에서 말단 복합체까지',
    relationship: '위쪽 neck과 아래쪽 receptor-binding apparatus를 이어줘요.',
    modelRepresentation: '완만하게 굽은 긴 관과 반복 고리로 표시해요.',
  },
  portal: {
    genericSummary: '파지 capsid의 고유 꼭짓점에 놓이는 DNA 출입구예요.',
    role: '조립 중 DNA 포장과 감염 시 DNA 방출의 축을 만들어요.',
    location: 'capsid와 tail machine 사이의 unique vertex',
    relationship: 'capsid 내부 DNA와 아래쪽 꼬리 관을 연결해요.',
    modelRepresentation: '머리 아래의 짧은 고리 또는 funnel로 표시해요.',
  },
  'maturation-protein': {
    genericSummary: '대칭 capsid의 한 자리를 깨는 비대칭 숙주 결합 단백질이에요.',
    role: '숙주 표면을 인식하고 genome·capsid 사이의 특수 접점을 만들어요.',
    location: 'capsid 표면의 단 하나 또는 소수의 비대칭 자리',
    relationship: '주변 coat-protein shell과 내부 genome 양쪽에 접촉해요.',
    modelRepresentation: 'capsid 한쪽의 색과 크기가 다른 patch로 표시해요.',
  },
  channel: {
    genericSummary: 'capsid 또는 나선 피복을 관통하는 축 방향 통로예요.',
    role: '조립 구조의 중심축이나 핵산 이동 가능 경로를 정의해요.',
    location: '입자의 symmetry axis',
    relationship: '주변 capsid protein이 통로 벽을 만들어요.',
    modelRepresentation: 'shell을 관통하는 빈 원통 또는 꼭짓점 구멍으로 표시해요.',
  },
  'coat-protein': {
    genericSummary: '나선형·필라멘트형 입자의 몸체를 이루는 반복 피복 단백질이에요.',
    role: '핵산을 따라 반복 조립되어 길고 안정한 nucleoprotein shell을 만들어요.',
    location: '필라멘트 몸체 전체',
    relationship: '인접 단백질과 내부 genome 양쪽에 접촉해요.',
    modelRepresentation: '긴 몸체 표면의 짧은 반복 단위로 표시해요.',
  },
  'terminal-protein': {
    genericSummary: '필라멘트의 극성 또는 말단 복합체를 나타내는 선택 대상이에요.',
    role: '감염·조립 방향을 구분하는 말단 기능을 설명해요.',
    location: '필라멘트의 한쪽 또는 양쪽 끝',
    relationship: '반복 coat-protein 몸체와 축 방향으로 이어져요.',
    modelRepresentation: '몸체 끝의 색과 크기가 다른 cap으로 표시해요.',
  },
  penton: {
    genericSummary: 'adenovirus capsid 꼭짓점에서 fiber를 받치는 오량체 기반이에요.',
    role: 'fiber를 capsid에 연결하고 세포 진입 과정에 참여해요.',
    location: '정이십면체 capsid의 12개 꼭짓점',
    relationship: '면의 hexon과 바깥쪽 fiber 사이를 연결해요.',
    modelRepresentation: 'capsid 꼭짓점의 오각 기둥으로 표시해요.',
  },
  fiber: {
    genericSummary: 'adenovirus penton에서 뻗는 긴 숙주 부착 단백질이에요.',
    role: '말단 knob로 숙주 수용체를 인식해요.',
    location: '12개 penton base 바깥쪽',
    relationship: 'penton base에 고정되어 capsid보다 길게 돌출해요.',
    modelRepresentation: '긴 shaft와 둥근 knob로 표시해요.',
  },
  'outer-capsid': {
    genericSummary: '다층 입자의 가장 바깥 단백질 shell이에요.',
    role: '내부 core를 보호하고 숙주 인식·진입에 필요한 표면을 제공해요.',
    location: '다층 입자의 최외곽 단백질층',
    relationship: '안쪽 middle/core layer를 둘러싸고 표면 단백질과 접해요.',
    modelRepresentation: '가장 큰 반지름의 다면체 shell로 표시해요.',
  },
  'middle-capsid': {
    genericSummary: 'outer capsid와 전사 core 사이의 중간 단백질 shell이에요.',
    role: '입자를 안정화하고 바깥층과 core 사이의 구조적 연결을 제공해요.',
    location: 'outer-capsid 안쪽과 core-capsid 바깥쪽 사이',
    relationship: '바깥층과 안쪽 core 양쪽에 방사형으로 맞물려요.',
    modelRepresentation: '중간 반지름의 다면체 shell로 표시해요.',
  },
  'core-capsid': {
    genericSummary: '유전체와 전사 장치를 직접 감싸는 가장 안쪽 단백질 core예요.',
    role: '핵산을 보호하고 core 내부 반응을 위한 공간을 만들어요.',
    location: '다층 입자의 중심',
    relationship: '바깥 capsid 층에 둘러싸이고 내부 genome과 접해요.',
    modelRepresentation: '가장 작은 반지름의 다면체 shell로 표시해요.',
  },
  'inner-membrane': {
    genericSummary: '단백질 capsid 안쪽에 포함된 바이러스 지질막이에요.',
    role: '유전체 core를 감싸고 감염 시 막 재배열 또는 전달에 관여해요.',
    location: '바깥 capsid shell 바로 안쪽',
    relationship: '단백질 capsid와 내부 genome 사이에 놓여요.',
    modelRepresentation: 'capsid 안쪽의 매끈한 반투명 shell로 표시해요.',
  },
  envelope: {
    genericSummary: '입자의 바깥을 둘러싸는 막 또는 단백질·지질성 외곽층이에요.',
    role: '표면 단백질을 지지하고 내부 구조를 외부 환경과 분리해요.',
    location: '입자의 가장 바깥쪽',
    relationship: '바깥 부속 구조와 안쪽 capsid·core 사이에 놓여요.',
    modelRepresentation: '현재 입자 윤곽을 따르는 반투명 외곽 shell로 표시해요.',
  },
  spike: {
    genericSummary: '입자 표면에서 숙주 인식이나 진입에 관여하는 돌출 구조예요.',
    role: '숙주 수용체 접촉과 세포 진입의 초기 단계를 담당해요.',
    location: 'capsid 또는 envelope 표면',
    relationship: '입자 shell에 고정되어 바깥쪽으로 돌출해요.',
    modelRepresentation: '표면의 반복 돌기·knob 또는 vertex complex로 표시해요.',
  },
  turret: {
    genericSummary: '다면체 꼭짓점에서 바깥으로 돌출한 대형 단백질 복합체예요.',
    role: '핵산 전사물의 방출 또는 숙주 상호작용을 위한 특수 꼭짓점을 만들어요.',
    location: 'capsid의 symmetry vertex',
    relationship: 'capsid shell과 내부 core를 축 방향으로 이어줘요.',
    modelRepresentation: '꼭짓점의 속이 빈 굵은 원통형 돌기로 표시해요.',
  },
  'surface-domain': {
    genericSummary:
      'capsid protein에서 표면 바깥으로 올라온 loop 또는 protruding domain이에요.',
    role: '입자 안정성, 숙주 인식 또는 항원성 표면을 형성해요.',
    location: 'capsid shell의 바깥 표면',
    relationship: '별도 shell이 아니라 capsid protein의 바깥쪽 영역이에요.',
    modelRepresentation: 'capsid 표면의 높이가 다른 node나 patch로 표시해요.',
  },
  'geminate-bridge': {
    genericSummary: '두 geminate capsid 절반이 맞닿는 접촉 영역이에요.',
    role: '두 불완전한 shell을 하나의 twin particle로 연결해요.',
    location: '두 capsid lobe 사이',
    relationship: '별도 단백질 다리가 아니라 coat-protein interface예요.',
    modelRepresentation: '두 다면체 사이의 좁은 띠로 표시해요.',
  },
  tegument: {
    genericSummary: 'herpesvirus envelope와 capsid 사이의 비균일 단백질 영역이에요.',
    role: '감염 초기에 필요한 단백질을 운반하고 조립 관계를 연결해요.',
    location: '지질 외피와 capsid 사이',
    relationship: '바깥 envelope와 안쪽 icosahedral capsid를 연결해요.',
    modelRepresentation: '서로 다른 반지름에 흩어진 작은 입자층으로 표시해요.',
  },
  matrix: {
    genericSummary: '외피 바로 안쪽에서 입자 조립과 형태를 지지하는 단백질층이에요.',
    role: '바깥 막과 안쪽 nucleocapsid를 조직해요.',
    location: '지질 외피 바로 안쪽',
    relationship: 'envelope와 내부 core 사이에 놓여요.',
    modelRepresentation: '외피 안쪽의 얇은 연속 shell로 표시해요.',
  },
  rnp: {
    genericSummary:
      '바이러스 RNA가 nucleoprotein·polymerase와 이루는 ribonucleoprotein이에요.',
    role: 'RNA를 보호하고 전사·복제 가능한 template 형태로 유지해요.',
    location: 'matrix 또는 envelope 안쪽',
    relationship: 'genome과 nucleoprotein을 하나의 기능 단위로 묶어요.',
    modelRepresentation: '내부의 굽은 막대 또는 나선 묶음으로 표시해요.',
  },
  nucleocapsid: {
    genericSummary: '바이러스 핵산과 결합 단백질이 이루는 내부 복합체예요.',
    role: 'genome을 보호하고 입자 안에 정렬해요.',
    location: 'envelope·matrix 안쪽',
    relationship: 'genome을 직접 감싸고 바깥 shell과 조립 관계를 맺어요.',
    modelRepresentation: '내부의 shell·나선 또는 RNP 곡선으로 표시해요.',
  },
  'core-wall': {
    genericSummary: 'poxvirus genome과 전사 장치를 둘러싼 core의 단백질성 벽이에요.',
    role: '유전체와 효소를 보호하고 감염 뒤 단계적으로 해체돼요.',
    location: '벽돌형 입자의 중앙',
    relationship: '양옆 lateral body 사이에 놓여요.',
    modelRepresentation: '가운데가 좁은 아령형 shell로 표시해요.',
  },
  'lateral-body': {
    genericSummary: 'poxvirus core 양옆의 단백질 저장 구조예요.',
    role: '감염 초기에 숙주 세포로 전달될 단백질을 담아요.',
    location: 'core wall 양옆과 membrane 사이',
    relationship: '중앙 core를 좌우에서 감싸요.',
    modelRepresentation: 'core 양옆의 두 타원체로 표시해요.',
  },
  'terminal-tail': {
    genericSummary: '특수 형태 바이러스의 극성 말단 부속 구조예요.',
    role: '숙주 부착 또는 성숙 입자의 방향성 있는 형태를 만들어요.',
    location: 'rod 또는 spindle body의 한쪽·양쪽 끝',
    relationship: '중앙 virion body와 축 방향으로 연결돼요.',
    modelRepresentation: '말단에서 뻗는 꼬리 또는 갈라진 섬유로 표시해요.',
  },
};

const ENTRY_PROFILES: Readonly<Record<string, EntryProfile>> = {
  phix174: {
    capsid: 'PhiX174 F protein T=1 capsid shell',
    capsomer: 'PhiX174 F protein pentamers',
    spike: profile('PhiX174 G protein vertex spikes', {
      role: '12개 꼭짓점에서 세균 표면 접촉과 DNA 전달 축 형성에 관여해요.',
      model: '각 꼭짓점의 짧고 굵은 방사형 돌기로 표시해요.',
    }),
    genome: 'Circular ssDNA genome',
  },
  qbeta: {
    capsid: 'Qβ coat-protein T=3 capsid',
    capsomer: 'Qβ coat-protein dimers',
    'maturation-protein': 'Qβ A2 maturation protein',
    genome: 'Positive-sense ssRNA genome',
  },
  ap205: {
    capsid: 'AP205 coat-protein T=3 capsid',
    capsomer: 'AP205 coat-protein dimers',
    'surface-domain': profile('AP205 capsid-protein surface loops', {
      relationship: '별도 surface protein이 아니라 coat protein의 노출된 영역이에요.',
    }),
    genome: 'Positive-sense ssRNA genome',
  },
  ccmv: {
    capsid: 'CCMV coat-protein T=3 capsid',
    capsomer: 'CCMV coat-protein capsomers',
    'surface-domain': 'CCMV coat-protein surface loops',
    genome: 'Tripartite positive-sense ssRNA genome',
  },
  bmv: {
    capsid: 'BMV coat-protein T=3 capsid',
    capsomer: 'BMV coat-protein capsomers',
    'surface-domain': 'BMV coat-protein surface loops',
    genome: 'Tripartite positive-sense ssRNA genome',
  },
  cpmv: {
    capsid: 'CPMV pseudo-T=3 capsid',
    capsomer: 'CPMV large (L) and small (S) coat-protein subunits',
    'surface-domain': 'CPMV L/S coat-protein surface loops',
    genome: 'Bipartite positive-sense ssRNA genome',
  },
  tbsv: {
    capsid: 'TBSV coat-protein T=3 capsid',
    capsomer: 'TBSV coat-protein capsomers',
    'surface-domain': profile('TBSV protruding P domains', {
      role: 'capsid 표면의 돌출부를 만들고 shell의 바깥 상호작용 면을 제공해요.',
      model: 'capsid 표면의 뚜렷한 외곽 node로 표시해요.',
    }),
    genome: 'Positive-sense ssRNA genome',
  },
  stmv: {
    capsid: 'STMV coat-protein T=1 capsid',
    capsomer: 'STMV coat-protein pentamers',
    genome: 'Positive-sense ssRNA genome',
  },
  'cmv-fny': {
    capsid: 'CMV Fny coat-protein T=3 capsid',
    capsomer: 'CMV coat-protein capsomers',
    'surface-domain': 'CMV coat-protein surface loops',
    genome: 'Tripartite positive-sense ssRNA genome',
  },
  tymv: {
    capsid: 'TYMV coat-protein T=3 capsid',
    capsomer: 'TYMV coat-protein capsomers',
    'surface-domain': 'TYMV coat-protein surface loops',
    genome: 'Positive-sense ssRNA genome',
  },
  camv: {
    capsid: 'CaMV capsid-protein shell',
    capsomer: 'CaMV capsid-protein assembly units',
    'surface-domain': 'CaMV capsid surface features',
    genome: 'Circular double-stranded DNA-RT genome',
  },
  aav2: {
    capsid: 'AAV2 VP1/VP2/VP3 T=1 capsid',
    capsomer: 'AAV2 capsid-protein pentamers',
    'surface-domain': 'AAV2 threefold capsid protrusions',
    channel: profile('AAV2 fivefold capsid channel', {
      role: 'capsid 조립과 유전체 포장·방출에 관련된 축 통로를 형성해요.',
      model: '다섯 겹 대칭 꼭짓점의 작은 구멍으로 표시해요.',
    }),
    genome: 'Single-stranded DNA genome',
  },
  'canine-parvovirus': {
    capsid: 'Canine parvovirus VP1/VP2 T=1 capsid',
    capsomer: 'VP1/VP2 capsid-protein pentamers',
    'surface-domain': 'Canine parvovirus capsid surface loops and spikes',
    channel: 'Fivefold capsid channel',
    genome: 'Single-stranded DNA genome',
  },
  pcv2: {
    capsid: 'PCV2 Cap-protein T=1 capsid',
    capsomer: 'PCV2 Cap-protein pentamers',
    'surface-domain': 'PCV2 Cap-protein surface loops',
    genome: 'Circular ssDNA genome',
  },
  hpv16: {
    capsid: 'HPV16 L1/L2 capsid',
    capsomer: 'HPV16 L1 pentameric capsomers',
    'surface-domain': 'HPV16 L1 surface loops',
    genome: 'Circular dsDNA genome',
  },
  sv40: {
    capsid: 'SV40 VP1 T=7d capsid',
    capsomer: 'SV40 VP1 pentamers',
    'surface-domain': 'SV40 VP1 receptor-binding surface loops',
    genome: 'Circular dsDNA minichromosome',
  },
  'murine-polyomavirus': {
    capsid: 'Murine polyomavirus VP1 T=7d capsid',
    capsomer: 'Murine polyomavirus VP1 pentamers',
    'surface-domain': 'VP1 receptor-binding surface loops',
    genome: 'Circular dsDNA minichromosome',
  },
  norwalk: {
    capsid: 'Norwalk virus VP1 T=3 capsid',
    capsomer: 'Norwalk VP1 dimers',
    'surface-domain': profile('Norwalk VP1 protruding P domains', {
      role: '숙주 histo-blood group antigen과 상호작용하는 바깥 표면을 형성해요.',
      model: 'capsid 표면에서 높게 올라온 paired node로 표시해요.',
    }),
    genome: 'Positive-sense ssRNA genome',
  },
  rhdv: {
    capsid: 'RHDV VP60 T=3 capsid',
    capsomer: 'RHDV VP60 dimers',
    'surface-domain': 'RHDV VP60 protruding P domains',
    genome: 'Positive-sense ssRNA genome',
  },
  'astrovirus-1': {
    capsid: 'Human astrovirus 1 mature capsid shell',
    capsomer: 'Astrovirus capsid-protein assembly units',
    spike: profile('Astrovirus capsid spike domains', {
      relationship:
        '별도 막단백질이 아니라 성숙 capsid protein에서 절단·형성된 돌출 domain이에요.',
      model: 'capsid 표면의 별 모양 배치를 강조한 짧은 spike로 표시해요.',
    }),
    genome: 'Positive-sense ssRNA genome',
  },
  'flock-house': {
    capsid: 'Flock House virus alpha-protein T=3 capsid',
    capsomer: 'FHV capsid-protein dimers',
    'surface-domain': 'FHV capsid-protein surface protrusions',
    genome: 'Bipartite positive-sense ssRNA genome',
  },

  phi29: {
    capsid: 'Phi29 gp8 prolate capsid',
    capsomer: 'Phi29 gp8 capsomers',
    portal: 'Phi29 gp10 portal complex',
    'inner-tube': 'Phi29 short non-contractile tail tube',
    'tail-fiber': 'Phi29 collar appendages and tail fibers',
    'layer:tail': 'Phi29 short tail and collar-appendage apparatus',
    genome: 'Linear dsDNA genome',
  },
  p22: {
    capsid: 'P22 gp5 mature capsid',
    capsomer: 'P22 gp5 capsomers',
    portal: 'P22 gp1 portal complex',
    tailspike: profile('P22 gp9 tailspikes', {
      role: 'Salmonella 표면 다당류를 인식하고 절단하며 안정한 부착을 도와요.',
    }),
    'layer:tail': 'P22 short tail machine and six gp9 tailspikes',
    genome: 'Linear dsDNA genome',
  },
  hk97: {
    capsid: 'HK97 gp5 crosslinked Head II capsid',
    capsomer: profile('HK97 gp5 chainmail capsomers', {
      role: '서로 공유결합된 고리형 network로 얇고 강한 mature head를 만들어요.',
    }),
    neck: 'HK97 head–tail connector',
    'flexible-tail': profile('HK97 non-contractile tail concept', {
      evidence: 'conceptual',
      simplification:
        'PDB 2FT1은 Head II 근거이며 꼬리는 계열 형태만 개념적으로 표시해요.',
    }),
    'layer:tail': profile('HK97 non-contractile tail concept', {
      evidence: 'conceptual',
      simplification:
        'PDB 2FT1은 Head II 근거이며 꼬리는 계열 형태만 개념적으로 표시해요.',
    }),
    genome: profile('Linear dsDNA genome concept', {
      evidence: 'conceptual',
      simplification: 'Head II 구조 자료에서 보이지 않는 DNA는 위치 관계만 표시해요.',
    }),
  },
  t5: {
    capsid: 'T5 major capsid-protein head',
    capsomer: 'T5 major capsid-protein capsomers',
    neck: 'T5 head–tail connector',
    'flexible-tail': 'T5 long non-contractile tail tube',
    'tail-fiber': 'T5 lateral fibers and terminal receptor-binding apparatus',
    'layer:tail': 'T5 long tail tube and terminal apparatus',
    genome: 'Linear dsDNA genome',
  },
  t1: {
    capsid: 'T1 major capsid-protein head',
    capsomer: 'T1 major capsid-protein capsomers',
    neck: 'T1 portal–adaptor head–tail connector',
    'flexible-tail': 'T1 long non-contractile tail tube',
    'tail-fiber': 'T1 receptor-binding tail fibers',
    'layer:tail': 'T1 long tail and distal fiber apparatus',
    genome: 'Linear dsDNA genome',
  },

  prd1: {
    capsid: 'PRD1 P3 major capsid-protein shell',
    capsomer: 'PRD1 P3 trimers',
    'inner-membrane': 'PRD1 internal lipid membrane',
    spike: profile('PRD1 vertex spike and receptor-recognition complex', {
      evidence: 'family-supported',
      simplification:
        'PDB 1W8X의 꼭짓점 맥락을 바탕으로 수용체 인식 장치를 절차적 돌기로 단순화했어요.',
    }),
    genome: profile('Linear dsDNA genome', {
      evidence: 'family-supported',
      simplification:
        '유전체의 위치와 종류를 내부 코일로 표시하며 원자 좌표나 실제 응축 상태로 해석하지 않아요.',
    }),
  },
  pm2: {
    capsid: 'PM2 major capsid-protein shell',
    capsomer: 'PM2 major capsid-protein trimers',
    'inner-membrane': 'PM2 internal lipid membrane',
    spike: 'PM2 vertex spike complexes',
    genome: 'Supercoiled circular dsDNA genome',
  },
  ibdv: {
    'outer-capsid': 'IBDV VP2 outer capsid',
    'core-capsid': profile('IBDV VP3 inner ribonucleoprotein layer', {
      summary:
        'VP3가 dsRNA와 polymerase 복합체를 조직하는 내부 ribonucleoprotein 영역이에요.',
      role: '분절 dsRNA를 결합하고 복제·전사 복합체를 VP2 capsid 안쪽에 조직해요.',
      relationship: 'VP2 outer capsid 안쪽에서 두 dsRNA 분절과 polymerase를 묶어요.',
      model: '작은 연속 다면체 shell로 내부 VP3–RNP 영역을 표시해요.',
      simplification: '닫힌 VP3 capsid가 관찰됐다는 뜻이 아닌 공간적 추상화예요.',
      evidence: 'family-supported',
    }),
    capsomer: 'IBDV VP2 trimeric capsomers',
    genome: 'Two-segment dsRNA genome',
  },
  bluetongue: {
    'outer-capsid': 'Bluetongue VP2/VP5 outer capsid',
    'middle-capsid': 'Bluetongue VP7 intermediate shell',
    'core-capsid': 'Bluetongue VP3 transcription core',
    spike: 'Bluetongue VP2 receptor-binding surface projections',
    genome: 'Ten-segment dsRNA genome',
  },
  'reovirus-t3d': {
    'outer-capsid': 'Reovirus μ1/σ3 outer capsid',
    'middle-capsid': 'Reovirus intermediate capsid layer',
    'core-capsid': 'Reovirus λ1 transcription core shell',
    turret: 'Reovirus λ2 pentameric turrets',
    genome: 'Ten-segment dsRNA genome',
  },
  stiv: {
    capsid: 'STIV B345 major capsid-protein shell',
    capsomer: 'STIV B345 trimeric capsomers',
    turret: 'STIV C381 vertex turret complexes',
    'inner-membrane': 'STIV internal lipid membrane',
    genome: 'Circular dsDNA genome',
  },

  pvx: {
    capsid: 'PVX flexible helical capsid',
    'coat-protein': 'PVX coat-protein subunits',
    'terminal-protein': profile('PVX model terminal orientation marker', {
      summary: 'PVX filament의 방향을 구분하기 위해 모델에 둔 말단 표식이에요.',
      role: '독립된 표면 terminal protein의 직접 구조 근거가 아니라 관찰 방향을 알려줘요.',
      relationship:
        'coat-protein filament 끝에 붙지만 실제 별도 virion cap으로 해석하지 않아요.',
      evidence: 'conceptual',
    }),
    genome: 'Positive-sense ssRNA genome',
  },
  papmv: {
    capsid: 'PapMV flexible helical capsid',
    'coat-protein': 'PapMV coat-protein subunits',
    'terminal-protein': profile('PapMV model terminal orientation marker', {
      summary: 'PapMV filament의 방향을 구분하는 모델상의 말단 표식이에요.',
      role: 'PDB 4DOX의 coat-protein 기반 filament 끝을 시각적으로 식별하게 해요.',
      relationship: '별도 표면 terminal protein이 확인된 것으로 해석하지 않아요.',
      evidence: 'conceptual',
    }),
    genome: 'Positive-sense ssRNA genome',
  },
  pvy: {
    capsid: 'PVY flexible helical capsid',
    'coat-protein': 'PVY coat-protein subunits',
    'terminal-protein': profile('PVY VPg-linked genome-end concept marker', {
      summary: 'PVY filament의 극성과 genome 5′ 말단 방향을 보여주는 개념 표식이에요.',
      role: 'VPg는 RNA 5′ 말단에 결합하지만 현재 cap 기하는 실제 표면 VPg 위치가 아니에요.',
      relationship: 'coat-protein 몸체 끝과 genome 방향을 연결하는 관찰용 표식이에요.',
      evidence: 'conceptual',
    }),
    genome: 'Positive-sense ssRNA genome with 5′-linked VPg',
  },

  ssv1: {
    envelope: profile('SSV1 protein–lipid outer envelope', {
      relationship:
        'spindle body의 major virion protein layer와 분리하기 어려운 복합 외곽이에요.',
    }),
    capsid: profile('SSV1 spindle-shaped virion body', {
      summary: 'SSV1의 방추형 단백질성 몸체를 가리키는 모델 선택 영역이에요.',
      role: '원형 dsDNA를 감싸고 극성 말단 섬유가 붙는 central body를 만들어요.',
      relationship:
        '전형적인 icosahedral capsid와 달리 envelope와 body protein이 이루는 복합 구조예요.',
      model: '가운데가 부풀고 양끝이 좁아지는 spindle shell로 표시해요.',
    }),
    'terminal-tail': 'SSV1 single polar tail-fiber bundle',
    'layer:tail': 'SSV1 polar tail-fiber apparatus',
    genome: 'Circular dsDNA genome',
  },
  atv: {
    envelope: 'ATV spindle-body envelope',
    capsid: profile('ATV spindle-shaped central virion body', {
      summary: 'ATV가 세포 밖에서 두 꼬리를 발달시키는 중앙 방추형 몸체예요.',
      role: '선형 dsDNA를 감싸고 양쪽 tail extension의 기반을 만들어요.',
      model: '가운데가 부푼 긴 spindle shell로 표시해요.',
    }),
    'terminal-tail': profile('ATV extracellular bipolar tails', {
      role: '숙주 밖에서 발달해 성숙 입자의 양극성 형태와 부착 가능 영역을 만들어요.',
      model: 'spindle 양끝에서 길게 뻗는 두 개의 tapered tail로 표시해요.',
    }),
    'layer:tail': 'ATV two extracellular tail extensions',
    genome: 'Linear dsDNA genome',
  },
} as const;

const LAYER_TO_PART: Readonly<
  Partial<Record<ObservationLayerId, readonly ObservationPartId[]>>
> = {
  envelope: ['envelope'],
  'surface-protein': ['spike', 'surface-domain', 'turret'],
  tegument: ['tegument'],
  capsid: ['capsid'],
  tail: ['flexible-tail', 'inner-tube', 'tailspike', 'terminal-tail', 'tail-fiber'],
  'outer-capsid': ['outer-capsid'],
  'middle-capsid': ['middle-capsid'],
  'core-capsid': ['core-capsid'],
  'inner-membrane': ['inner-membrane'],
  matrix: ['matrix'],
  nucleocapsid: ['nucleocapsid', 'rnp'],
  membrane: ['envelope'],
  'core-wall': ['core-wall'],
  'lateral-body': ['lateral-body'],
  genome: ['genome'],
};

export const FULL_CATALOG_STRUCTURE_EXPLANATIONS: readonly EntryExplanationRegistration[] =
  Object.entries(ENTRY_PROFILES).flatMap(([virusId, names]) => {
    const definition = getCatalogEntry(virusId);
    if (definition.id !== virusId) {
      throw new Error(`Unknown structure explanation profile: ${virusId}`);
    }
    const targets: StructureExplanationTarget[] = [
      ...definition.parts.map(partTarget),
      ...definition.layers.map(({ id }) => layerTarget(id)),
    ];
    return targets.map((target) => {
      const { value, detailPart } = resolveProfile(definition, names, target);
      const content = toContent(definition, value, DETAILS[detailPart]);
      return { virusId, targets: [target], explanation: content };
    });
  });

export const FULL_CATALOG_PROFILE_IDS = Object.keys(
  ENTRY_PROFILES,
) as readonly VirusId[];

export const TARGETED_ENTRY_OVERRIDE_IDS = ['hiv-2', 'hcov-oc43', 'hcov-hku1'] as const;

export const TARGETED_ENTRY_STRUCTURE_EXPLANATIONS: readonly EntryExplanationRegistration[] =
  [
    {
      virusId: 'hiv-2',
      targets: [partTarget('capsid'), layerTarget('capsid')],
      explanation: {
        genericSummary:
          '성숙 HIV-2의 RNA와 효소를 둘러싸는 lentivirus capsid core예요.',
        actualName: 'HIV-2 capsid protein p26 mature core',
        role: '유전체와 효소를 보호하고 세포 진입 뒤 uncoating·역전사 환경을 조절해요.',
        location: 'matrix layer 안쪽',
        relationships: [
          '두 RNA 유전체와 nucleocapsid protein·viral enzyme이 이 core 안에 포장돼요.',
        ],
        modelRepresentation: 'HIV-1과 공유하는 비대칭 원뿔형 family model로 표시해요.',
        simplification:
          'HIV-2 p26 격자의 종별 직접 구조로 해석하지 않고 lentivirus 공통 core 형태만 사용해요.',
        evidence: 'family-supported',
        sourceIds: ['ictv-retroviridae', 'emd-hiv2-capsid'],
      },
    },
    ...(
      [
        ['hcov-oc43', 'pdb-5n11'],
        ['hcov-hku1', 'hku1-he-cryoem'],
      ] as const
    ).map(([virusId, heSourceId]): EntryExplanationRegistration => ({
      virusId,
      targets: [partTarget('spike'), layerTarget('surface-protein')],
      explanation: {
        genericSummary:
          'Embecovirus 표면에는 주된 S glycoprotein과 더 짧은 hemagglutinin-esterase가 함께 있어요.',
        actualName:
          'Spike (S), hemagglutinin-esterase (HE), membrane (M), and envelope (E) proteins',
        role: 'S는 수용체 결합·융합, HE는 부착·esterase, M과 E는 조립과 입자 형성에 관여해요.',
        location: '지질 외피 표면',
        relationships: ['네 성분은 같은 외피에 박히며 크기·양·기능이 달라요.'],
        modelRepresentation:
          'S는 왕관형, HE는 더 짧은 club형, M은 짧은 돌기, E는 channel 표식으로 구분해요.',
        simplification:
          'S와 HE의 실제 비율·배열·당쇄를 하나의 surface-protein 선택 그룹으로 줄였어요.',
        evidence: 'family-supported',
        sourceIds: ['ictv-coronaviridae', heSourceId],
      },
    })),
  ];

function resolveProfile(
  definition: ObservationDefinition,
  names: EntryProfile,
  target: StructureExplanationTarget,
): { readonly value: StructureNameProfile; readonly detailPart: ObservationPartId } {
  if (target.kind === 'part') {
    return {
      value: normalizeProfileValue(requiredValue(names, target.id, definition.id)),
      detailPart: target.id,
    };
  }

  const exact = names[`layer:${target.id}`];
  if (exact) {
    const detailPart = firstAvailablePart(definition, target.id);
    return { value: normalizeProfileValue(exact), detailPart };
  }

  const detailPart = firstAvailablePart(definition, target.id);
  return {
    value: normalizeProfileValue(requiredValue(names, detailPart, definition.id)),
    detailPart,
  };
}

function firstAvailablePart(
  definition: ObservationDefinition,
  layerId: ObservationLayerId,
): ObservationPartId {
  const candidates = LAYER_TO_PART[layerId] ?? [];
  const part = candidates.find((candidate) => definition.parts.includes(candidate));
  if (!part) {
    throw new Error(
      `No structure profile mapping for ${definition.id}: layer:${layerId}`,
    );
  }
  return part;
}

function requiredValue(
  names: EntryProfile,
  key: string,
  virusId: string,
): ProfileValue {
  const value = names[key];
  if (!value) throw new Error(`Missing actualName for ${virusId}: ${key}`);
  return value;
}

function normalizeProfileValue(value: ProfileValue): StructureNameProfile {
  return typeof value === 'string' ? { name: value } : value;
}

function toContent(
  definition: ObservationDefinition,
  value: StructureNameProfile,
  detail: (typeof DETAILS)[ObservationPartId],
): StructureExplanationContent {
  return {
    genericSummary: value.summary ?? detail.genericSummary,
    actualName: value.name,
    role: value.role ?? detail.role,
    location: value.location ?? detail.location,
    relationships: [value.relationship ?? detail.relationship],
    modelRepresentation: value.model ?? detail.modelRepresentation,
    simplification: value.simplification ?? definition.simplifications.join(' '),
    evidence: value.evidence ?? evidenceFor(definition),
    sourceIds: definition.sourceIds,
  };
}

function evidenceFor(definition: ObservationDefinition): StructureExplanationEvidence {
  if (
    definition.evidenceStatus === 'observed' &&
    definition.sourceIds.some(
      (sourceId) =>
        sourceId.startsWith('pdb-') ||
        sourceId.startsWith('emd-') ||
        sourceId.startsWith('pnas-'),
    )
  ) {
    return 'observed';
  }
  if (definition.evidenceStatus === 'observed') return 'family-supported';
  if (definition.evidenceStatus === 'conceptual') return 'family-supported';
  return 'conceptual';
}

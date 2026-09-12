import type { VirusId } from '../types';
import {
  layerTarget,
  partTarget,
  type EntryExplanationRegistration,
  type StructureExplanationContent,
  type StructureExplanationTarget,
} from './types';

const entry = (
  virusId: VirusId,
  targets: readonly StructureExplanationTarget[],
  explanation: StructureExplanationContent,
): EntryExplanationRegistration => ({ virusId, targets, explanation });

export const REPRESENTATIVE_VIRUS_IDS = [
  'sars-cov-2',
  'influenza-a',
  'hiv-1',
  'hsv1',
  'ebola-virus',
  'adenovirus-5',
  'rotavirus-rrv',
  't4',
] as const;

export const REPRESENTATIVE_STRUCTURE_EXPLANATIONS: readonly EntryExplanationRegistration[] =
  [
    entry('sars-cov-2', [partTarget('envelope'), layerTarget('envelope')], {
      genericSummary: '숙주 세포에서 유래한 지질막이 SARS-CoV-2 입자를 둘러싸요.',
      actualName: 'SARS-CoV-2 lipid envelope',
      role: 'S·M·E 단백질이 자리 잡는 막 바탕이며 내부 RNP를 감싸요.',
      location: '입자의 가장 바깥쪽 막층',
      relationships: ['S는 외피 밖으로 돌출하고 M과 E는 막에 박혀 있어요.'],
      modelRepresentation:
        '반투명한 구형 막으로 표시하고 M 단백질층과 분리해 볼 수 있어요.',
      simplification:
        '개별 지질과 E 단백질은 현재 모델에서 별도 형상으로 분리하지 않아요.',
      evidence: 'family-supported',
      sourceIds: ['ictv-coronaviridae'],
    }),
    entry('sars-cov-2', [partTarget('spike'), layerTarget('surface-protein')], {
      genericSummary: '외피 표면에서 수용체 결합과 막 융합을 담당하는 당단백질이에요.',
      actualName: 'S glycoprotein',
      role: 'S1 영역은 ACE2 결합에, S2 영역은 바이러스막과 세포막의 융합에 주로 관여해요.',
      location: '지질 외피 표면',
      relationships: ['외피에 박힌 삼량체이며 M 단백질층보다 바깥으로 돌출해요.'],
      modelRepresentation: '외피 바깥의 왕관형 club-shaped 돌기로 반복해 표시해요.',
      simplification:
        'S 삼량체의 원자 구조, 유연성, 당쇄와 RBD 상태는 재현하지 않아요.',
      evidence: 'observed',
      sourceIds: ['pdb-7tov', 'ictv-coronaviridae'],
    }),
    entry('sars-cov-2', [partTarget('matrix'), layerTarget('matrix')], {
      genericSummary: '코로나바이러스 입자 조립의 중심이 되는 막 단백질이에요.',
      actualName: 'Membrane protein (M)',
      role: '외피의 형태를 잡고 다른 구조 단백질과 상호작용해 조립과 출아를 조직해요.',
      location: '지질 외피에 박힌 막 단백질층',
      relationships: ['바깥의 S·E와 내부 N-RNA 복합체 사이의 조립 관계를 이어줘요.'],
      modelRepresentation: '외피 안쪽의 연속된 얇은 shell로 표시해요.',
      simplification: '개별 M 단백질의 막 관통 구조와 배열은 연속층으로 단순화했어요.',
      evidence: 'family-supported',
      sourceIds: ['ictv-coronaviridae'],
    }),
    entry('sars-cov-2', [partTarget('nucleocapsid'), layerTarget('nucleocapsid')], {
      genericSummary:
        'SARS-CoV-2 RNA와 N 단백질이 이루는 ribonucleoprotein 복합체예요.',
      actualName: 'N protein–RNA ribonucleoprotein',
      role: '긴 RNA 유전체를 포장하고 복제·전사 과정에 필요한 핵산-단백질 환경을 만들어요.',
      location: 'M 단백질층 안쪽의 입자 내부',
      relationships: [
        'N 단백질이 RNA와 결합하며 외피의 M 단백질과도 조립 관계를 맺어요.',
      ],
      modelRepresentation: '입자 내부의 굽은 보라색 RNP 가닥으로 표시해요.',
      simplification:
        'N 단백질과 RNA의 실제 응축 상태를 규칙적인 원자 구조로 해석하지 않아요.',
      evidence: 'family-supported',
      sourceIds: ['ictv-coronaviridae'],
    }),
    entry('sars-cov-2', [partTarget('genome'), layerTarget('genome')], {
      genericSummary: 'SARS-CoV-2의 단일 양성가닥 RNA 유전체예요.',
      actualName: 'Positive-sense single-stranded RNA genome',
      role: '감염 뒤 번역과 복제에 사용되는 바이러스 유전정보를 담아요.',
      location: 'N 단백질과 결합한 상태로 입자 내부에 포장돼요.',
      relationships: ['독립된 맨 RNA가 아니라 N 단백질과 함께 RNP를 이뤄요.'],
      modelRepresentation: 'nucleocapsid와 같은 내부 RNP 곡선으로 함께 표시해요.',
      simplification: '약 30 kb RNA의 서열·접힘·N 결합 위치는 별도로 그리지 않아요.',
      evidence: 'family-supported',
      sourceIds: ['ictv-coronaviridae'],
    }),

    entry('influenza-a', [partTarget('envelope'), layerTarget('envelope')], {
      genericSummary: '숙주 세포막에서 유래한 지질 외피가 입자를 둘러싸요.',
      actualName: 'Influenza A lipid envelope',
      role: 'HA·NA·M2가 자리 잡는 막이며 안쪽 M1 matrix와 내부 vRNP를 감싸요.',
      location: '구형 예시 입자의 최외곽 막층',
      relationships: ['표면 단백질과 M1 matrix 사이에 놓여요.'],
      modelRepresentation: '약간 찌그러진 반투명 구형 막으로 표시해요.',
      simplification: '다형성 입자 가운데 구형 형태만 선택했어요.',
      evidence: 'observed',
      sourceIds: ['ictv-influenza', 'influenza-quant'],
    }),
    entry('influenza-a', [partTarget('spike'), layerTarget('surface-protein')], {
      genericSummary: '인플루엔자 A 외피에는 기능이 다른 HA·NA·M2가 함께 있어요.',
      actualName: 'HA, NA and M2 surface proteins',
      role: 'HA는 sialic acid 결합과 막 융합, NA는 새 입자의 방출, M2는 proton channel 기능을 담당해요.',
      location: '지질 외피 표면과 막 내부',
      relationships: ['세 단백질은 같은 외피에 있지만 모양과 양, 기능이 서로 달라요.'],
      modelRepresentation:
        'HA는 원뿔, NA는 knob, M2는 작은 channel 형태로 구분해 표시해요.',
      simplification:
        '실제 HA:NA 비율, 배열, 당쇄와 M2 사량체 구조는 정량 재현하지 않아요.',
      evidence: 'observed',
      sourceIds: ['ictv-influenza', 'influenza-quant'],
    }),
    entry('influenza-a', [partTarget('matrix'), layerTarget('matrix')], {
      genericSummary:
        '외피 안쪽을 받치며 입자 조립과 형태 유지에 관여하는 단백질층이에요.',
      actualName: 'M1 matrix protein layer',
      role: '외피와 vRNP 사이를 조직하고 조립·출아·uncoating 과정에 관여해요.',
      location: '지질 외피 바로 안쪽',
      relationships: ['바깥 외피와 안쪽의 여덟 vRNP 사이에 놓여요.'],
      modelRepresentation: '외피 안쪽의 얇은 연속 shell로 표시해요.',
      simplification: 'M1 단백질의 국소 배열을 균일한 표면으로 줄였어요.',
      evidence: 'observed',
      sourceIds: ['influenza-quant'],
    }),
    entry(
      'influenza-a',
      [partTarget('rnp'), layerTarget('nucleocapsid'), partTarget('genome')],
      {
        genericSummary:
          '각 RNA 분절이 nucleoprotein과 polymerase에 결합한 viral RNP예요.',
        actualName: 'Eight segmented viral ribonucleoproteins (vRNPs)',
        role: '여덟 음성가닥 RNA 분절을 포장하고 전사·복제 장치를 함께 운반해요.',
        location: 'M1 matrix 안쪽의 입자 내부',
        relationships: [
          '각 유전체 분절은 독립된 vRNP를 이루며 함께 한 입자에 포장돼요.',
        ],
        modelRepresentation: '서로 다른 길이와 방향의 여덟 굽은 막대로 표시해요.',
        simplification:
          'RNA와 NP·polymerase를 분리하지 않고 vRNP 한 단위로 단순화했어요.',
        evidence: 'observed',
        sourceIds: ['ictv-influenza', 'influenza-quant'],
      },
    ),

    entry('hiv-1', [partTarget('envelope'), layerTarget('envelope')], {
      genericSummary: '숙주 세포막에서 유래한 지질 외피가 성숙 HIV-1 입자를 둘러싸요.',
      actualName: 'HIV-1 lipid envelope',
      role: 'Env를 지지하고 MA matrix와 성숙 capsid를 감싸요.',
      location: '성숙 입자의 가장 바깥쪽',
      relationships: ['표면 Env와 안쪽 MA 사이에 놓여요.'],
      modelRepresentation: '반투명한 구형 지질막으로 표시해요.',
      simplification: '실제 막의 지질 조성과 숙주 단백질은 표시하지 않아요.',
      evidence: 'observed',
      sourceIds: ['ictv-retroviridae', 'hiv-particle-review'],
    }),
    entry('hiv-1', [partTarget('spike'), layerTarget('surface-protein')], {
      genericSummary:
        'HIV-1이 숙주 CD4와 공동수용체를 인식하고 막 융합에 사용하는 외피 당단백질이에요.',
      actualName: 'Env trimer (gp120–gp41)',
      role: 'gp120은 수용체 결합을, gp41은 바이러스막과 세포막의 융합을 담당해요.',
      location: '지질 외피 표면',
      relationships: ['gp41이 외피에 고정되고 gp120이 바깥쪽 수용체 결합부를 이뤄요.'],
      modelRepresentation: '외피 표면에 드문 club-shaped 돌기로 표시해요.',
      simplification: 'Env 삼량체의 당쇄, 가변 부위와 형태 전환은 생략해요.',
      evidence: 'observed',
      sourceIds: ['ictv-retroviridae', 'hiv-env-diversity'],
    }),
    entry('hiv-1', [partTarget('matrix'), layerTarget('matrix')], {
      genericSummary:
        '외피 바로 안쪽에서 조립과 막 결합을 담당하는 HIV-1 단백질층이에요.',
      actualName: 'Matrix protein p17 (MA)',
      role: 'Gag 유래 matrix로서 바이러스 조립과 출아, Env의 입자 편입에 관여해요.',
      location: '지질 외피 바로 안쪽',
      relationships: ['바깥 외피와 안쪽의 성숙 capsid 사이에 놓여요.'],
      modelRepresentation: '외피 안쪽의 얇은 연속 shell로 표시해요.',
      simplification: '개별 MA 단백질 배열과 Gag 절단 과정은 재현하지 않아요.',
      evidence: 'observed',
      sourceIds: ['ictv-retroviridae', 'hiv-particle-review'],
    }),
    entry('hiv-1', [partTarget('capsid'), layerTarget('capsid')], {
      genericSummary: '성숙 HIV-1에서 RNA와 효소를 둘러싸는 비대칭 단백질 코어예요.',
      actualName: 'Capsid protein p24 (CA) mature core',
      role: '유전체와 효소를 보호하고 세포 진입 뒤 uncoating과 역전사 환경을 조절해요.',
      location: 'MA matrix 안쪽',
      relationships: [
        '두 RNA 유전체와 nucleocapsid 단백질, 효소들이 이 코어 안에 포장돼요.',
      ],
      modelRepresentation: '입자 중심에서 약간 벗어난 속이 빈 원뿔형 shell로 표시해요.',
      simplification: 'PDB 3J3Q의 CA 격자를 전체 입자의 원자 모델로 재현하지 않아요.',
      evidence: 'observed',
      sourceIds: ['pdb-3j3q', 'hiv-particle-review'],
    }),
    entry('hiv-1', [partTarget('genome'), layerTarget('genome')], {
      genericSummary: 'HIV-1은 같은 계열의 양성가닥 RNA 두 분자를 한 입자에 포장해요.',
      actualName: 'Paired positive-sense ssRNA genome',
      role: '감염 뒤 reverse transcriptase가 DNA로 복사할 유전정보를 담아요.',
      location: '성숙 p24 capsid 내부',
      relationships: [
        'RNA는 nucleocapsid protein p7과 결합하지만 p7은 현재 모델에서 별도 구조로 보이지 않아요.',
      ],
      modelRepresentation: '원뿔형 capsid 안쪽의 두 개 보라색 코일로 표시해요.',
      simplification:
        'RNA 접힘, p7 결합, reverse transcriptase와 integrase는 별도 형상으로 표시하지 않아요.',
      evidence: 'observed',
      sourceIds: ['ictv-retroviridae', 'hiv-particle-review'],
    }),

    entry('hsv1', [partTarget('envelope'), layerTarget('envelope')], {
      genericSummary: '숙주 유래 지질 외피가 tegument와 capsid를 둘러싸요.',
      actualName: 'HSV-1 lipid envelope',
      role: '여러 envelope glycoprotein을 지지하고 tegument를 감싸요.',
      location: '성숙 HSV-1 입자의 최외곽',
      relationships: ['바깥 glycoprotein과 안쪽 tegument 사이에 놓여요.'],
      modelRepresentation: '반투명한 구형 막으로 표시해요.',
      simplification:
        '실제 외피의 불규칙성과 지질·단백질 조성은 균일한 막으로 줄였어요.',
      evidence: 'family-supported',
      sourceIds: ['ictv-herpes'],
    }),
    entry('hsv1', [partTarget('spike'), layerTarget('surface-protein')], {
      genericSummary:
        'HSV-1 외피에는 세포 부착과 융합에 협력하는 여러 glycoprotein이 있어요.',
      actualName: 'HSV-1 envelope glycoproteins',
      role: 'gB·gD·gH/gL 등을 포함한 복합 단백질군이 수용체 인식과 막 융합을 나눠 담당해요.',
      location: '지질 외피 표면',
      relationships: ['외피에 박혀 있고 tegument와 capsid보다 바깥으로 돌출해요.'],
      modelRepresentation: '길고 짧은 두 종류의 반복 돌기로 구분해 표시해요.',
      simplification:
        '각 glycoprotein의 정확한 종류·비율·복합체를 개별 식별하지 않아요.',
      evidence: 'family-supported',
      sourceIds: ['ictv-herpes'],
    }),
    entry('hsv1', [partTarget('tegument'), layerTarget('tegument')], {
      genericSummary: '외피와 capsid 사이를 채우는 비균일한 바이러스 단백질층이에요.',
      actualName: 'HSV-1 tegument',
      role: '감염 초기에 전달되는 바이러스 단백질을 운반하고 조립 과정에서 외피와 capsid를 연결해요.',
      location: '지질 외피와 정이십면체 capsid 사이',
      relationships: [
        '규칙적인 shell이 아니라 여러 tegument 단백질이 이루는 비균일 영역이에요.',
      ],
      modelRepresentation: '서로 다른 반지름에 흩어진 작은 입자 구름으로 표시해요.',
      simplification: '개별 tegument 단백질의 종류와 비대칭 배치는 구분하지 않아요.',
      evidence: 'family-supported',
      sourceIds: ['ictv-herpes'],
    }),
    entry('hsv1', [partTarget('capsid'), layerTarget('capsid')], {
      genericSummary:
        '조밀하게 포장된 dsDNA를 감싸는 T=16 유사 정이십면체 단백질 껍질이에요.',
      actualName: 'HSV-1 procapsid-derived T=16 capsid',
      role: '고압으로 포장된 dsDNA 유전체를 보호하고 한 꼭짓점의 portal을 통해 포장·방출해요.',
      location: 'tegument 안쪽의 입자 중심',
      relationships: [
        'capsomer 단위가 capsid shell을 만들고 그 내부에 dsDNA가 들어 있어요.',
      ],
      modelRepresentation: '다면체 shell과 표면의 반복 원기둥 단위로 나눠 표시해요.',
      simplification:
        '실제 capsomer 수와 portal·CATC 비대칭 구조는 정량 재현하지 않아요.',
      evidence: 'observed',
      sourceIds: ['pdb-6odm', 'ictv-herpes'],
    }),
    entry('hsv1', [partTarget('capsomer')], {
      genericSummary: 'HSV-1 capsid 표면을 이루는 반복 단백질 복합체예요.',
      actualName: 'HSV-1 capsomers and triplexes',
      role: 'major capsid protein의 hexon·penton과 triplex가 T=16 capsid shell을 조직해요.',
      location: 'tegument 안쪽의 capsid 표면',
      relationships: [
        '반복 capsomer가 capsid 면과 꼭짓점을 만들고 내부 dsDNA를 둘러싸요.',
      ],
      modelRepresentation: 'capsid 표면에 반복되는 작은 육각 기둥 형태로 표시해요.',
      simplification:
        'hexon·penton·triplex의 종류와 실제 수를 하나의 반복 단위로 줄였어요.',
      evidence: 'observed',
      sourceIds: ['pdb-6odm'],
    }),
    entry('hsv1', [partTarget('genome'), layerTarget('genome')], {
      genericSummary: 'HSV-1 capsid 안에 매우 조밀하게 포장되는 선형 이중가닥 DNA예요.',
      actualName: 'Linear dsDNA genome',
      role: '바이러스 복제와 단백질 발현에 필요한 유전정보를 담아요.',
      location: 'T=16 capsid 내부',
      relationships: [
        '고압으로 capsid 안에 감겨 있으며 portal vertex가 포장과 방출에 관여해요.',
      ],
      modelRepresentation: 'capsid 내부의 굵은 보라색 코일로 표시해요.',
      simplification: '실제 동심성 DNA 층과 무질서한 중심부를 하나의 코일로 줄였어요.',
      evidence: 'observed',
      sourceIds: ['pdb-6odm'],
    }),

    entry('ebola-virus', [partTarget('envelope'), layerTarget('envelope')], {
      genericSummary:
        '숙주 세포막에서 유래한 지질 외피가 긴 에볼라바이러스 입자를 둘러싸요.',
      actualName: 'Ebola virus lipid envelope',
      role: 'GP를 지지하고 VP40 matrix와 nucleocapsid를 감싸요.',
      location: '필라멘트 몸체의 가장 바깥쪽',
      relationships: ['바깥 GP와 안쪽 VP40 matrix 사이에 놓여요.'],
      modelRepresentation: '굽은 관 형태의 반투명 외곽 막으로 표시해요.',
      simplification:
        '다양한 실제 입자 길이와 굽힘 가운데 하나의 대표 형태만 보여줘요.',
      evidence: 'observed',
      sourceIds: ['ictv-orthoebolavirus'],
    }),
    entry('ebola-virus', [partTarget('spike'), layerTarget('surface-protein')], {
      genericSummary:
        '에볼라바이러스가 숙주 세포에 들어갈 때 사용하는 외피 당단백질이에요.',
      actualName: 'Ebola virus glycoprotein (GP)',
      role: '세포 부착과 endosomal entry 뒤 막 융합을 매개해요.',
      location: '지질 외피 표면',
      relationships: ['외피에 박혀 바깥으로 돌출하고 안쪽에는 VP40 matrix가 놓여요.'],
      modelRepresentation:
        '필라멘트 표면에 반복되는 짧은 capsule-shaped 돌기로 표시해요.',
      simplification: 'GP 삼량체, mucin-like domain과 당쇄는 구분하지 않아요.',
      evidence: 'family-supported',
      sourceIds: ['ictv-orthoebolavirus', 'ebola-makona-a82v'],
    }),
    entry('ebola-virus', [partTarget('matrix'), layerTarget('matrix')], {
      genericSummary:
        '에볼라바이러스 외피 안쪽을 따라 형성되는 주요 matrix 단백질층이에요.',
      actualName: 'VP40 matrix layer',
      role: '입자 조립과 출아를 주도하고 필라멘트 형태를 지지해요.',
      location: '지질 외피 바로 안쪽',
      relationships: ['외피와 안쪽 nucleocapsid 사이에 놓여요.'],
      modelRepresentation: '외피보다 가는 안쪽 관형 shell로 표시해요.',
      simplification: 'VP40의 개별 oligomer와 막 결합 배열은 연속층으로 줄였어요.',
      evidence: 'family-supported',
      sourceIds: ['ictv-orthoebolavirus'],
    }),
    entry(
      'ebola-virus',
      [
        partTarget('nucleocapsid'),
        layerTarget('nucleocapsid'),
        partTarget('genome'),
        layerTarget('genome'),
      ],
      {
        genericSummary:
          '음성가닥 RNA와 NP를 중심으로 여러 단백질이 이루는 나선형 RNP 복합체예요.',
        actualName: 'Ebola virus helical nucleocapsid',
        role: 'RNA 유전체를 포장하고 L·VP35 등과 함께 복제·전사 틀을 만들어요.',
        location: 'VP40 matrix 안쪽의 필라멘트 중심부',
        relationships: [
          'RNA는 NP에 결합하며 VP35·VP24·L 등이 nucleocapsid 기능에 관여해요.',
        ],
        modelRepresentation: '몸체 중심선을 따라 감기는 단일 보라색 나선으로 표시해요.',
        simplification: 'RNA와 NP·VP35·VP24·L을 별도 형상으로 분리하지 않아요.',
        evidence: 'family-supported',
        sourceIds: ['ictv-orthoebolavirus'],
      },
    ),

    entry('adenovirus-5', [partTarget('capsid'), layerTarget('capsid')], {
      genericSummary: '외피 없이 dsDNA를 감싸는 정이십면체 단백질 껍질이에요.',
      actualName: 'Human adenovirus 5 icosahedral capsid',
      role: '유전체를 보호하고 hexon·penton 및 여러 minor protein을 하나의 안정한 입자로 조직해요.',
      location: '바이러스 입자의 바깥 단백질 shell',
      relationships: [
        '면의 hexon과 12개 꼭짓점의 penton base가 함께 capsid를 만들어요.',
      ],
      modelRepresentation: '강하게 각진 정이십면체 shell로 표시해요.',
      simplification:
        '실제 준원자 표면과 minor capsid protein은 단일 shell로 줄였어요.',
      evidence: 'observed',
      sourceIds: ['pdb-4v4u'],
    }),
    entry('adenovirus-5', [partTarget('capsomer')], {
      genericSummary: '아데노바이러스 capsid 면을 채우는 반복 단백질 단위예요.',
      actualName: 'Hexon trimers',
      role: 'capsid 면의 대부분을 구성하고 인접 단위와 함께 shell을 안정화해요.',
      location: '정이십면체 capsid의 20개 면',
      relationships: ['꼭짓점의 penton base·fiber와 구별되는 주된 면 단위예요.'],
      modelRepresentation: 'capsid 표면에 반복되는 작은 육각 기둥 형태로 표시해요.',
      simplification: '실제 240개 hexon trimer의 정확한 수와 배열은 줄였어요.',
      evidence: 'observed',
      sourceIds: ['pdb-4v4u'],
    }),
    entry('adenovirus-5', [partTarget('penton')], {
      genericSummary: '정이십면체 꼭짓점에서 fiber를 받치는 오량체 기반이에요.',
      actualName: 'Penton base pentamer',
      role: 'fiber를 capsid에 연결하고 세포 진입 과정에 관여해요.',
      location: 'capsid의 12개 꼭짓점',
      relationships: ['각 penton base에서 한 개의 trimeric fiber가 바깥으로 뻗어요.'],
      modelRepresentation: '각 꼭짓점의 금색 오각 기둥으로 표시해요.',
      simplification: '표면 loop와 단백질 간 접촉은 단순한 오각형 기반으로 줄였어요.',
      evidence: 'observed',
      sourceIds: ['pdb-4v4u'],
    }),
    entry('adenovirus-5', [partTarget('fiber')], {
      genericSummary: 'penton 꼭짓점에서 바깥으로 뻗는 trimeric 부착 단백질이에요.',
      actualName: 'Fiber protein: shaft and knob',
      role: '말단 knob가 세포 수용체를 인식하고 긴 shaft가 capsid와 수용체 사이 거리를 만들어요.',
      location: '12개 penton base의 바깥쪽',
      relationships: ['penton base에 고정되어 capsid 표면보다 길게 돌출해요.'],
      modelRepresentation: '가느다란 shaft와 둥근 말단 knob의 조합으로 표시해요.',
      simplification: 'shaft 반복과 굽힘, knob의 원자 구조는 생략해요.',
      evidence: 'observed',
      sourceIds: ['pdb-4v4u'],
    }),
    entry('adenovirus-5', [partTarget('genome'), layerTarget('genome')], {
      genericSummary: '단백질과 함께 capsid 내부에 포장되는 선형 이중가닥 DNA예요.',
      actualName: 'Linear dsDNA genome',
      role: '아데노바이러스 복제와 단백질 발현에 필요한 유전정보를 담아요.',
      location: '정이십면체 capsid 내부',
      relationships: [
        '실제 입자에서는 core protein과 결합하지만 모델은 DNA 위치만 보여줘요.',
      ],
      modelRepresentation: 'capsid 안쪽의 보라색 코일로 표시해요.',
      simplification: 'DNA 말단 단백질과 core protein, 실제 포장 밀도는 생략해요.',
      evidence: 'conceptual',
      sourceIds: ['pdb-4v4u'],
    }),

    entry('rotavirus-rrv', [partTarget('outer-capsid'), layerTarget('outer-capsid')], {
      genericSummary: '감염성 rotavirus 입자의 가장 바깥 단백질층이에요.',
      actualName: 'VP7 outer capsid layer',
      role: '중간 VP6 layer를 덮고 VP4 spike와 함께 세포 진입에 관여해요.',
      location: '삼중층 입자의 최외곽 shell',
      relationships: [
        'VP4 spike가 이 층을 통과해 돌출하고 안쪽에는 VP6 layer가 있어요.',
      ],
      modelRepresentation: '가장 큰 반지름의 매끄러운 청록색 shell로 표시해요.',
      simplification:
        'VP7 trimer의 실제 격자와 calcium-dependent 상태는 연속 표면으로 줄였어요.',
      evidence: 'observed',
      sourceIds: ['pdb-4v7q'],
    }),
    entry(
      'rotavirus-rrv',
      [partTarget('middle-capsid'), layerTarget('middle-capsid')],
      {
        genericSummary: '바깥 VP7과 내부 VP2 core 사이를 이루는 중간 단백질층이에요.',
        actualName: 'VP6 middle capsid layer',
        role: '입자의 주된 구조 shell을 만들고 내부 transcription core를 둘러싸요.',
        location: 'VP7 outer layer와 VP2 core 사이',
        relationships: [
          '바깥층을 벗긴 double-layered particle의 표면이 되는 층이에요.',
        ],
        modelRepresentation: '중간 반지름의 각진 반복 단위 shell로 표시해요.',
        simplification: 'VP6 trimer의 정확한 수와 T=13 배열은 대표 단위로 줄였어요.',
        evidence: 'observed',
        sourceIds: ['pdb-4v7q'],
      },
    ),
    entry('rotavirus-rrv', [partTarget('core-capsid'), layerTarget('core-capsid')], {
      genericSummary:
        '11개 dsRNA 분절과 전사 효소를 감싸는 가장 안쪽 단백질 shell이에요.',
      actualName: 'VP2 core capsid',
      role: '유전체와 polymerase complex를 보관하고 입자 내부 전사의 반응 공간을 만들어요.',
      location: 'VP6 middle layer 안쪽',
      relationships: ['내부 dsRNA 분절과 효소를 둘러싸고 바깥의 VP6와 맞닿아요.'],
      modelRepresentation: '가장 작은 반지름의 강하게 각진 dense shell로 표시해요.',
      simplification: 'VP1·VP3 효소와 실제 channel 구조는 별도로 표시하지 않아요.',
      evidence: 'observed',
      sourceIds: ['pdb-4v7q'],
    }),
    entry('rotavirus-rrv', [partTarget('spike')], {
      genericSummary:
        'rotavirus 입자 표면에서 세포 부착과 막 침투에 관여하는 돌기예요.',
      actualName: 'VP4 spike',
      role: 'proteolytic cleavage 뒤 생성되는 영역들이 수용체 결합과 세포막 침투에 관여해요.',
      location: 'VP7 outer capsid 바깥 표면',
      relationships: ['VP7 layer를 통과해 바깥으로 돌출해요.'],
      modelRepresentation: 'outer capsid 표면의 원뿔형 돌기로 표시해요.',
      simplification: 'VP4의 절단 상태와 굽은 다중 domain 구조는 단순 원뿔로 줄였어요.',
      evidence: 'observed',
      sourceIds: ['pdb-4v7q'],
    }),
    entry('rotavirus-rrv', [partTarget('genome'), layerTarget('genome')], {
      genericSummary: 'Rotavirus A가 가진 11개 이중가닥 RNA 분절이에요.',
      actualName: 'Eleven-segment dsRNA genome',
      role: '각 분절이 바이러스 단백질을 암호화하고 core 내부 전사의 template가 돼요.',
      location: 'VP2 core capsid 내부',
      relationships: ['polymerase complex와 함께 core 안에 포장돼요.'],
      modelRepresentation: '코어 내부에 서로 분리된 11개 짧은 곡선으로 표시해요.',
      simplification:
        '각 분절 길이와 동심성 RNA 배열, 효소 결합은 정량 재현하지 않아요.',
      evidence: 'observed',
      sourceIds: ['pdb-4v7q'],
    }),

    entry('t4', [partTarget('capsid'), layerTarget('capsid')], {
      genericSummary: 'T4의 긴 dsDNA를 감싸는 prolate icosahedral head예요.',
      actualName: 'Expanded T4 head capsid',
      role: '고밀도 dsDNA를 보호하고 portal을 통해 꼬리 장치와 연결해요.',
      location: 'T4 입자의 위쪽 머리',
      relationships: [
        '주요 capsid 단백질 gp23* 격자와 꼭짓점 단백질이 prolate shell을 만들어요.',
      ],
      modelRepresentation:
        '세로로 늘어난 다면체 shell과 줄인 수의 반복 단위로 표시해요.',
      simplification: '실제 capsid 단백질 수와 장식 단백질 배열은 크게 줄였어요.',
      evidence: 'observed',
      sourceIds: ['pdb-7vs5'],
    }),
    entry('t4', [partTarget('capsomer')], {
      genericSummary: 'T4의 길쭉한 head 표면을 이루는 반복 capsid 단위예요.',
      actualName: 'gp23* major capsid protein lattice',
      role: '반복 격자를 이루어 dsDNA를 견디는 prolate capsid shell의 주된 면을 만들어요.',
      location: 'T4 head의 다면체 표면',
      relationships: [
        '꼭짓점의 gp24* 및 장식 단백질과 함께 expanded head를 안정화해요.',
      ],
      modelRepresentation: 'prolate shell 표면의 줄인 수의 반복 기하로 표시해요.',
      simplification:
        'gp23* hexamer의 실제 수, gp24* pentamer와 장식 단백질은 개별 구분하지 않아요.',
      evidence: 'observed',
      sourceIds: ['pdb-7vs5'],
    }),
    entry('t4', [partTarget('genome'), layerTarget('genome')], {
      genericSummary: 'T4 head 안에 높은 밀도로 포장되는 선형 이중가닥 DNA예요.',
      actualName: 'Linear dsDNA genome',
      role: '감염 때 꼬리의 내부 관을 통해 세균 세포 안으로 전달될 유전정보를 담아요.',
      location: 'prolate capsid 내부',
      relationships: ['head의 portal과 neck을 지나 tail tube 방향으로 방출돼요.'],
      modelRepresentation: 'head 안쪽의 보라색 코일로 표시해요.',
      simplification: '실제 DNA의 동심성 포장과 압력은 단순 코일로 줄였어요.',
      evidence: 'observed',
      sourceIds: ['pdb-7vs5'],
    }),
    entry('t4', [partTarget('neck')], {
      genericSummary:
        'T4 head의 portal과 contractile tail을 이어 주는 연결 복합체예요.',
      actualName: 'Head–tail connector and neck',
      role: '조립된 head와 tail을 연결하고 DNA 전달 경로를 정렬해요.',
      location: 'capsid 아래와 tail sheath 위 사이',
      relationships: ['위쪽 capsid portal과 아래쪽 inner tube·sheath를 이어줘요.'],
      modelRepresentation: 'capsid 아래의 여러 겹 고리로 표시해요.',
      simplification: 'connector를 이루는 개별 단백질과 symmetry mismatch는 생략해요.',
      evidence: 'family-supported',
      sourceIds: ['pdb-7vs5', 'pdb-5iv5'],
    }),
    entry('t4', [partTarget('sheath'), layerTarget('tail')], {
      genericSummary: 'T4 tail tube를 둘러싸고 수축하는 단백질성 꼬리집이에요.',
      actualName: 'Contractile tail sheath',
      role: 'baseplate의 신호를 받아 수축하며 rigid inner tube를 세포 표면 쪽으로 밀어 넣어요.',
      location: 'neck 아래에서 baseplate 위까지',
      relationships: [
        'inner tube 바깥을 감싸고 아래쪽 baseplate와 기계적으로 연결돼요.',
      ],
      modelRepresentation: 'inner tube 둘레의 반복 torus ring으로 표시해요.',
      simplification:
        '나선형 gp18 lattice와 수축 전후의 구조 전환은 고정된 반복 고리로 줄였어요.',
      evidence: 'observed',
      sourceIds: ['pdb-5iv5'],
    }),
    entry('t4', [partTarget('inner-tube')], {
      genericSummary: '수축형 sheath 안쪽을 지나는 단단한 DNA 전달 관이에요.',
      actualName: 'Tail tube protein gp19 assembly',
      role: 'sheath 수축 뒤 세포 쪽으로 이동해 DNA가 지나는 통로를 만들어요.',
      location: 'neck과 baseplate 사이, sheath 중심축',
      relationships: ['바깥 sheath에 둘러싸이고 아래쪽 baseplate 중심과 이어져요.'],
      modelRepresentation: 'sheath 중심을 관통하는 가는 흰색 원통으로 표시해요.',
      simplification: 'gp19 반복과 말단 spike 복합체를 단순한 연속 관으로 줄였어요.',
      evidence: 'observed',
      sourceIds: ['pdb-5iv5'],
    }),
    entry('t4', [partTarget('baseplate')], {
      genericSummary:
        'T4 꼬리 끝에서 여러 섬유와 전달 관을 모으는 다단백질 플랫폼이에요.',
      actualName: 'T4 baseplate complex',
      role: '숙주 표면 부착 신호를 감지해 sheath 수축을 촉발하고 tail tube를 정렬해요.',
      location: 'contractile tail의 말단',
      relationships: [
        '위쪽 sheath·inner tube와 바깥쪽 tail fiber가 모두 이곳에 연결돼요.',
      ],
      modelRepresentation: '꼬리 끝의 육각형 중심판과 다리 형태로 표시해요.',
      simplification:
        '다수의 gp6·gp7·gp8·gp10 등 단백질을 하나의 기하 그룹으로 줄였어요.',
      evidence: 'observed',
      sourceIds: ['pdb-5iv5'],
    }),
    entry('t4', [partTarget('tail-fiber')], {
      genericSummary:
        'T4가 세균 표면을 탐색하고 부착할 때 사용하는 길고 가는 수용체 인식 구조예요.',
      actualName: 'Long and short tail fiber system',
      role: '긴 섬유가 숙주 표면을 탐색하고 안정한 부착 뒤 baseplate 활성화에 기여해요.',
      location: 'baseplate 둘레에서 바깥쪽으로 뻗어요.',
      relationships: ['baseplate에 연결되어 sheath 수축 신호의 앞단에서 작동해요.'],
      modelRepresentation:
        'baseplate에서 여러 방향으로 꺾여 뻗는 가는 선형 부품으로 표시해요.',
      simplification: '긴·짧은 fiber의 단백질 조성, 마디 수와 정확한 각도는 줄였어요.',
      evidence: 'family-supported',
      sourceIds: ['pdb-5iv5', 'pdb-2bsg'],
    }),
  ] as const;

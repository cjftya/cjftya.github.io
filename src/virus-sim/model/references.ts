export type EvidenceGrade = '관찰 근거' | '단순화 모델' | '가상 조건';

export interface ModelNote {
  readonly grade: EvidenceGrade;
  readonly title: string;
  readonly description: string;
  readonly href?: string;
}

export const MODEL_NOTES: readonly ModelNote[] = [
  {
    grade: '관찰 근거',
    title: '바이러스의 기본 구분',
    description: '바이러스는 서로 다른 종류의 유전체와 구조를 가질 수 있어요.',
    href: 'https://ictv.global/report/information/virus-properties',
  },
  {
    grade: '관찰 근거',
    title: '파지의 구조와 유전체 전달',
    description: '머리 캡시드와 꼬리·부착·전달 장치는 서로 다른 역할을 담당해요.',
    href: 'https://www.nature.com/articles/s41467-024-52752-1',
  },
  {
    grade: '단순화 모델',
    title: '생산과 조립',
    description:
      '실제 분자 반응망 대신 자원·유전체·부품 묶음·완성 입자 수로 줄여 계산해요.',
  },
  {
    grade: '가상 조건',
    title: '시간·계수·입자 수',
    description:
      '화면의 시간과 확률 계수는 교육용 비교 조건이며 실제 감염률이나 농도가 아니에요.',
  },
];

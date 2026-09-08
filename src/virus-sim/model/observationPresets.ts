import { getCatalogEntry } from '../catalog/registry';
import type {
  ObservationDefinition,
  ObservationPartDefinition,
  ObservationPartId,
  ObservationPresetId,
} from '../observation/types';

const part = (
  id: ObservationPartId,
  name: string,
  summary: string,
  detail: string,
): ObservationPartDefinition => ({ id, name, summary, detail });

export const OBSERVATION_PARTS: Readonly<
  Record<ObservationPartId, ObservationPartDefinition>
> = {
  capsid: part(
    'capsid',
    '캡시드',
    '유전체를 감싸는 단백질 껍질',
    '반복 단백질이 만드는 보호 껍질이에요. 화면의 반복 수는 실제 화학량론이 아니에요.',
  ),
  capsomer: part(
    'capsomer',
    '표면 단위 배열',
    '껍질 표면의 반복 조형',
    '표면 단백질 배열의 방향과 밀도를 읽기 위한 경량 기하예요.',
  ),
  genome: part(
    'genome',
    '유전체',
    '입자 안의 유전정보',
    '종별 유전체 종류와 내부 위치를 보여주는 개념 표현이에요. 실제 서열이나 원자 패킹 좌표는 아니에요.',
  ),
  neck: part(
    'neck',
    '목 연결부',
    '머리와 꼬리의 접속 구조',
    '캡시드 포털과 꼬리 장치가 이어지는 부위예요.',
  ),
  sheath: part(
    'sheath',
    '수축형 꼬리집',
    '내부 관을 감싸는 반복 구조',
    'T4 같은 일부 파지에만 있는 수축형 꼬리집이에요.',
  ),
  'inner-tube': part(
    'inner-tube',
    '내부 관',
    '꼬리 안쪽의 전달 통로',
    '머리 아래에서 꼬리 끝으로 이어지는 가는 중심 관이에요.',
  ),
  baseplate: part(
    'baseplate',
    '기저판',
    '꼬리 끝의 부착 플랫폼',
    '여러 꼬리섬유와 중심 관이 만나는 말단 장치예요.',
  ),
  'tail-fiber': part(
    'tail-fiber',
    '꼬리섬유',
    '표면을 인식하는 가는 부품',
    '파지마다 길이와 배열이 다른 접촉 부품을 단순화했어요.',
  ),
  tailspike: part(
    'tailspike',
    'Tailspike',
    '굵은 수용체 결합 돌기',
    'P22 같은 파지의 꼬리 허브 둘레에 놓이는 굵은 결합 구조예요.',
  ),
  'flexible-tail': part(
    'flexible-tail',
    '비수축형 꼬리',
    '길고 가는 유연한 관',
    '수축형 꼬리집과 다른 길고 가는 꼬리 윤곽이에요.',
  ),
  portal: part(
    'portal',
    '포털·연결부',
    '캡시드의 비대칭 출구',
    '유전체와 꼬리 장치가 만나는 캡시드 꼭짓점이에요.',
  ),
  'maturation-protein': part(
    'maturation-protein',
    '비대칭 성숙 단백질',
    '대칭 껍질의 한쪽 특수 부위',
    '작은 RNA 파지의 대칭을 깨는 단일 성숙 단백질 위치를 강조해요.',
  ),
  channel: part(
    'channel',
    '중심 채널',
    '껍질이나 막대를 관통하는 통로',
    'TMV 중심이나 다면체 대칭축에서 확인되는 빈 통로를 표시해요.',
  ),
  'coat-protein': part(
    'coat-protein',
    '피복 단백질 배열',
    '나선으로 반복되는 표면 단위',
    '필라멘트와 막대 표면의 나선 방향을 보여줘요.',
  ),
  'terminal-protein': part(
    'terminal-protein',
    '말단 단백질',
    '필라멘트 양끝의 다른 부품',
    '긴 주 피복과 구별되는 말단 단백질 그룹이에요.',
  ),
  penton: part(
    'penton',
    'Penton',
    '다면체 꼭짓점의 단백질 복합체',
    '아데노바이러스 fiber가 나오는 오각형 기반이에요.',
  ),
  fiber: part(
    'fiber',
    '꼭짓점 fiber',
    '캡시드 밖으로 뻗는 섬유',
    'penton에서 길게 돌출하는 구조를 화면용으로 단순화했어요.',
  ),
  'outer-capsid': part(
    'outer-capsid',
    '바깥 캡시드',
    '다층 입자의 가장 바깥 단백질층',
    '안쪽 shell과 분리되는 최외곽 단백질층이에요.',
  ),
  'middle-capsid': part(
    'middle-capsid',
    '중간 캡시드',
    '바깥층과 코어 사이의 껍질',
    '다층 dsRNA 바이러스의 중간 단백질 shell이에요.',
  ),
  'core-capsid': part(
    'core-capsid',
    '코어 캡시드',
    '유전체를 둘러싼 안쪽 껍질',
    '분절 유전체와 전사 복합체를 감싸는 내부 코어예요.',
  ),
  'inner-membrane': part(
    'inner-membrane',
    '내부 막',
    '단백질 캡시드 안쪽의 막',
    'PRD1·PM2·STIV처럼 캡시드 내부에 막이 있는 입자에서만 표시해요.',
  ),
  envelope: part(
    'envelope',
    '지질 외피·막',
    '입자 바깥의 막층',
    '단백질 캡시드와 구별되는 외곽 막이에요.',
  ),
  spike: part(
    'spike',
    '표면 돌기',
    '외피나 캡시드 밖의 단백질',
    '표면 단백질의 배열과 길이를 읽기 위한 반복 기하예요.',
  ),
  turret: part(
    'turret',
    '꼭짓점 turret',
    '대칭축 위의 굵은 돌출 구조',
    'STIV·reovirus 등 일부 입자의 꼭짓점 복합체예요.',
  ),
  'surface-domain': part(
    'surface-domain',
    '표면 돌출 영역',
    'shell 위로 솟은 단백질 영역',
    'P-domain, loop, ridge처럼 표면에서 구별되는 영역을 묶어 표시해요.',
  ),
  'geminate-bridge': part(
    'geminate-bridge',
    '쌍둥이 연결부',
    '두 캡시드 엽의 접합 지점',
    'geminivirus 특유의 두 엽이 맞닿는 좁은 연결부예요.',
  ),
  tegument: part(
    'tegument',
    'Tegument',
    '외피와 캡시드 사이의 층',
    '규칙적 shell이 아닌 불균일한 단백질성 중간층이에요.',
  ),
  matrix: part(
    'matrix',
    'Matrix',
    '외피 안쪽을 받치는 단백질층',
    '외피와 뉴클레오캡시드 사이의 구조적 층이에요.',
  ),
  rnp: part(
    'rnp',
    '분절 RNP',
    'RNA와 단백질이 결합한 내부 단위',
    '인플루엔자 A의 여러 유전체 분절을 굽은 막대로 단순화했어요.',
  ),
  nucleocapsid: part(
    'nucleocapsid',
    '뉴클레오캡시드',
    '유전체와 단백질의 결합 구조',
    'RNA와 단백질이 결합한 내부 코어 또는 나선 구조예요.',
  ),
  'core-wall': part(
    'core-wall',
    '코어 벽',
    '복합 바이러스의 중심 구조',
    '백시니아 성숙 입자의 아령 모양 코어 벽을 단순화했어요.',
  ),
  'lateral-body': part(
    'lateral-body',
    '측면체',
    '코어 양옆의 내부 구조',
    '폭스바이러스 코어 양쪽에 놓이는 두 내부 구조예요.',
  ),
  'terminal-tail': part(
    'terminal-tail',
    '말단 꼬리·섬유',
    '방추·막대 입자의 끝 구조',
    '고세균 바이러스 몸체의 한쪽 또는 양쪽 끝 부속 구조예요.',
  ),
};

export function getObservationPreset(id: ObservationPresetId): ObservationDefinition {
  return getCatalogEntry(id);
}

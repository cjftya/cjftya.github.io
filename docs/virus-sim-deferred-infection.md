# Virus Sim 보류 기능: 감염 실험

보류 기준: 2026-09-08 · Git commit
[`890b85287d92cf5bfbd6423ab9043b60c862358f`](https://github.com/cjftya/cjftya.github.io/tree/890b85287d92cf5bfbd6423ab9043b60c862358f)

v2.5는 구조 관찰실에 집중하기 위해 v2의 감염 실행 흐름과 T4 전달 시연을 제품·번들에서
제거했다. 코드를 별도 복사 폴더로 남기지 않으며 필요할 때 Git 이력에서 검토한다.

## 기준 커밋의 복원 경로

- `src/virus-sim/simulation/`: 고정 tick 감염 계산, 접촉 geometry, PRNG
- `src/virus-sim/experiments/runHistory.ts`: 사건·실행 요약과 JSON 기록
- `src/virus-sim/model/presets.ts`: 감염 설정과 가상 계수
- `src/virus-sim/model/types.ts`: 세균·파지 상태와 snapshot 계약
- `src/virus-sim/app.ts`: 감염 RAF, 컨트롤과 패널 동기화
- `src/virus-sim/rendering/VirusScene.ts`: 세균·다수 파지 렌더 경로
- `tests/virus-sim/simulation.test.ts`: 결정성·상태 전이·경계 계약

예를 들어 기준 구현은 `git show 890b852:src/virus-sim/simulation/createSimulation.ts`로
읽을 수 있다.

## 재도입 전에 유지해야 할 계약

1. 구조 관찰 상태와 감염 계산 상태를 다시 결합하지 않는다.
2. 감염 계산은 DOM·Three.js와 독립된 고정 tick 순수 코어여야 한다.
3. 같은 모델 버전·설정·시드·tick은 같은 상태와 사건 순서를 만든다.
4. 파지 이동은 반사 경계와 구간 접촉 검사를 사용하고 세균 내부 관통을 허용하지 않는다.
5. rate는 프레임당 상수가 아니라 `1 - exp(-k dt)`로 적용한다.
6. 유전체 전달·생산·조립·용균은 서로 다른 상태이며 음수 자원이나 중복 방출이 없어야
   한다.
7. T4 전달 설명은 감염 성공 계산과 분리하고, 모든 바이러스의 일반 감염 방식처럼
   표현하지 않는다.
8. 가상 시간·입자 수·계수는 문헌 보정 전에는 실제 감염률이나 치료 효과로 표시하지
   않는다.

관찰이 공유하던 `normalizeSeed`는 v2.5에서 `src/virus-sim/common/random.ts`로 옮겼다.
향후 감염실은 이 중립 유틸리티를 재사용할 수 있지만, 현재 관찰 번들은 보류 코드를
import하지 않는다.

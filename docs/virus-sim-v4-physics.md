# Virus Sim v4 물리 근사

## 범위와 단위

Physics Arena는 바이러스의 실제 감염성, 유체역학 계수, 질량이나 생물학적 우열을 예측하지
않는다. `lab-unit`과 `sim-s`를 쓰는 결정적 개념 실험으로, 형태·방향·흐름·통로 접촉의
차이를 화면과 같은 surrogate에서 비교한다.

- 고정 step: `dt = 1/120 sim-s`
- 렌더 cadence와 물리 step 분리: accumulator 방식, frame당 최대 18 substep
- PRNG: run seed의 xorshift32, Box–Muller 정규분포, 장식 난수와 분리
- 처리 순서: `initialInstances` 순서를 run 전체에서 유지
- scale mode: 대표 길이 맞춤 또는 도감 대표 nm의 상대 비율

실제 크기 모드는 선택된 표본 중 최대 대표 nm를 화면 목표 길이에 맞추고 나머지 표본을 같은
비율로 환산한다. 자료가 없는 항목만 해당 profile 대표 길이로 fallback하며 이 경우 UI에서
개념 크기임을 표시한다.

## 흐름과 점성

기본 속도는 다음 개념식이다.

`speed = clamp(drive, 0, 2) × 1.15 / clamp(viscosityRatio, 0.25, 4)`

따라서 상대 점성이 커지면 계산 유속과 브라운 확산이 함께 감소한다. 점성 slider는 단순
재생 속도가 아니며 sim-time step은 바꾸지 않는다.

- 직선: `v = (direction × speed, 0, 0)`
- 전단: y 정규화 위치에 따라 x 속도를 바꾸고 0.08 아래로 내려가지 않게 제한한다.
- 와류: core 0.85의 `r / (core² + r²)` 항을 사용해 원점에서 발산하지 않는다.

화면 marker와 물리 body는 둘 다 `sampleVelocityField()`를 호출한다. marker가 장애물 내부나
경계 밖으로 가면 시작 분포로 되돌리며, obstacle descriptor는 화면과 충돌 계산이 공유한다.

## 형태별 surrogate

| shape    | 계산                                        | 표시와의 대응                         | 한계                                    |
| -------- | ------------------------------------------- | ------------------------------------- | --------------------------------------- |
| sphere   | 방향 독립 반지름, 등방 drag                 | 구형/외피형 경량 mesh                 | 돌기는 충돌 반지름에 별도 추가하지 않음 |
| capsule  | local x축 capsule AABB, 방향성 drag·회전    | 막대·탄환·벽돌형의 같은 장축          | 정밀 곡면 접촉이 아닌 보수적 AABB       |
| filament | 10점 capsule chain, 5회 길이·굽힘·접촉 보정 | 같은 centerline에 9개 capsule segment | 실측 탄성·점탄성 계수가 아님            |
| compound | 공통 반지름과 회전된 offset 집합            | phage·쌍둥이·방추형 경량 구성         | 개별 부품의 정밀 접촉 대신 전체 AABB    |

TMV는 관찰 geometry가 filament 계열이어도 물리에서는 강직 capsule이다. Ebola와 M13은
제한 굽힘 filament이며, 계열의 다른 항목은 실제 구조 자료 수준에 따라 capsule 또는
filament 근사로 명시한다. 모든 71개 기본 항목은 `physics:<virusId>:v1` ID로 하나씩 매핑한다.
`observed`/`conceptual` 근거 단계와 근사 설명은 기존 도감 항목에서 이어받는다.

긴 body의 이동성은 흐름 방향과 local axis 정렬도의 제곱으로 평행/수직 drag 계수를 섞는다.
전단과 와류의 local rotation을 quaternion에 적분한다. 구는 두 drag가 같아 방향의 영향을
받지 않는다.

## 브라운 이동과 안정성

브라운 변위의 표준편차는 `sqrt(2 × diffusion × dt)`이며,
`diffusion = 0.0028 / (viscosityRatio × max(0.35, bodyScale))`다. frame마다 임의 offset을
더하지 않아 같은 fixed tick·seed·명령열에서 같은 순서를 재현한다. 모든 step 뒤 position과
orientation의 유한값을 확인하고 오류면 `LabSession`을 안전 정지한다.

## 챔버와 결과

공통 bounds는 x `[-6, 6]`, y `[-3.2, 3.2]`, z `[-2.5, 2.5]`다. Obstacle Chamber의 위·아래
벽은 z 전 깊이를 채우므로 카메라 밖 깊이 방향 우회가 없다. 통로 폭은 0.7~4.2 lab-unit이고,
실행 중 한 번의 변경량은 최대 0.2로 제한한다. 벽 변경이 현재 body AABB와 겹치면 마지막
유효 폭을 유지한다.

통과는 중심점이 아니라 filament points 또는 회전된 body의 전체 AABB가 방향별 exit plane
밖으로 나간 tick에 기록한다. 제한 시간 종료 시 남은 상태는 `not-passed`이며 영구적 통과
불가능을 뜻하지 않는다. 궤적은 실제 body center를 일정 sim-time 간격으로 표본당 최대
384점 저장한다.

## 재현과 fixture

정확 재생 record에는 초기 config, seed, 시작 pose/centerline을 재구성할 profile version,
stable instance 순서, tick별 최종 환경 명령과 종료 tick을 포함한다. 재생 중 사용자가 값을
바꾸면 현재 환경을 초기값으로 한 새 run을 0초부터 시작하며 원래 last run을 즉시 덮지 않는다.
브라우저와 JS 엔진이 다른 환경에서 비트 단위 동일성을 약속하지 않고 테스트 허용 오차를 쓴다.

자동 fixture는 30/60/120Hz cadence 일치, paused 불변, 유한 core, 점성 단조 감소, capsule
방향 폭, filament segment 길이·깊이 경계, 전체 body 통과, 8개 instance, nm 비율, tick command
재생과 손상 설정 거부를 검사한다.

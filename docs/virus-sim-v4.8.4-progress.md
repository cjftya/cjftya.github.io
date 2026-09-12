# Virus Sim v4.8.4 진행 기록

## 목표

v4.8.3의 71종을 그대로 보존하고, 사람 보건·바이러스학 학습 가치가 높은 24종을 구조·치수·설명·연혁·출처가 완결된 항목으로 추가한다. 기존 3D 우선 UI와 native select를 유지하며 전체 95종의 저·고품질 모델 계약을 다시 검사한다.

## 반영 내용

- 사람 바이러스 24종 추가, 총 95종으로 확장
- `human-rnp` 데이터 기반 renderer와 7개 계열 profile 추가
- 기존 filovirus, VSV, vaccinia, HSV, influenza, alphavirus, icosahedral renderer를 11종에 재사용
- 24종의 geometry profile, physical dimensions, structural signature 추가
- 신규 part/layer 215개 target에 entry-specific 설명 추가
- 신규 24종의 discovery, host/reservoir, impact, current status 추가
- 구조 출처 17개와 공중보건·연혁 출처 24개 추가
- 앱과 관찰 상태 schema를 `v4.8.4`로 갱신
- 이전 버전 테스트의 71종 rollout 범위를 고정하고 현재 릴리스용 95종 전수 테스트 추가

## 결과

| 검사                        |     결과 |
| --------------------------- | -------: |
| Catalog entries             |       95 |
| 신규 entries                |       24 |
| Structural signatures       |       95 |
| Physical dimensions         |       95 |
| History entries             |       95 |
| Declared part/layer targets |      784 |
| Entry-specific targets      |      560 |
| Family targets              |      224 |
| Generic targets             |        0 |
| Explanation errors/warnings |    0 / 0 |
| Test files / tests          | 42 / 232 |

## 설계 제한

모델은 구조 관계를 이해하기 위한 절차 기하다. 원자 배열, 실제 단백질 수와 조성비, 다형성 입자의 모든 형태를 재현하지 않는다. 종별 직접 구조가 부족한 항목은 계열 근거를 사용하며 UI에서 `family-supported` 수준으로 제한한다.

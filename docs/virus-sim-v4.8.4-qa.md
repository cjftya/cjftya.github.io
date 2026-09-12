# Virus Sim v4.8.4 QA

## 자동 검사

| 항목                        |              기대값 | 결과 |
| --------------------------- | ------------------: | ---- |
| Catalog ID / identityKey    |      95 / 95 unique | PASS |
| 이전 catalog 보존           |        첫 71종 동일 | PASS |
| 신규 release set            | 지정 24종·순서 일치 | PASS |
| Structural signatures       |                  95 | PASS |
| Physical dimensions         |                  95 | PASS |
| History entries             |                  95 | PASS |
| Explanation targets         |                 784 | PASS |
| Generic fallback            |                   0 | PASS |
| Explanation error / warning |               0 / 0 | PASS |
| Low/high model build        |          190 builds | PASS |
| Part/layer 양방향 contract  |          mismatch 0 | PASS |
| Geometry position values    |      NaN/Infinity 0 | PASS |
| Native virus select         |    1개, option 95개 | PASS |
| Test suite                  | 42 files, 232 tests | PASS |

## 회귀 범위

- v3.5–v4.8.3 테스트는 각 버전 rollout의 기존 71종 범위를 유지한다.
- v4.8.4 테스트가 현재 95종의 registry 정확성, source 해석, 모델 생성, 설명 감사와 UI option을 전수 검사한다.
- 기존 generic builder는 다시 도입하지 않았다.
- 선택 가능한 모든 catalog part/layer는 low와 high 모델 map에 존재하고, 모델 map에도 선언 밖 key가 없다.

## 수동 확인 체크리스트

- 데스크톱과 좁은 viewport에서 native select가 한 개만 보이는지 확인
- 신규 24종이 지정 순서로 표시되고 선택되는지 확인
- 외피/RNP, poxvirus, herpesvirus, influenza, 비외피 capsid 대표 항목을 회전·확대·단면 관찰
- History & Impact와 구조 설명의 외부 링크가 새 탭에서 안전하게 열리는지 확인
- 배포된 `/projects/virus-sim/`에서 정적 asset 404와 콘솔 오류가 없는지 확인

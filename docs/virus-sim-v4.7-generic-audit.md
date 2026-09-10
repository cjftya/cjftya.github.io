# Virus Sim v4.7 Generic Builder 감사

## 결과

v4.3~v4.7 형태군 rollout 뒤 catalog에서 generic builder를 사용하는 항목은 없다. v4.7에서는
0-use fallback을 계속 보관하지 않고 함수, `ModelBuilderId`, factory mapping과 전용 파일을 함께
삭제했다.

| Generic builder       | 해당 rollout 직전 활성 수 | v4.7 후 활성 수 | 최종 상태 |
| --------------------- | ------------------------: | --------------: | --------- |
| `generic-icosahedral` |                 21 (v4.5) |               0 | 삭제      |
| `generic-enveloped`   |                  4 (v4.4) |               0 | 삭제      |
| `generic-layered`     |                  6 (v4.5) |               0 | 삭제      |
| `generic-filament`    |                  3 (v4.6) |               0 | 삭제      |
| `generic-phage`       |                  5 (v4.7) |               0 | 삭제      |
| `generic-geminate`    |                  2 (v4.6) |               0 | 삭제      |
| `generic-spindle`     |                  2 (v4.6) |               0 | 삭제      |
| `generic-rod`         |                  1 (v4.6) |               0 | 삭제      |

남아 있는 generic/fallback 항목과 유지 사유는 모두 없음이다. 새 자료 부족 항목이 추가될 경우
기존 범용 경로를 되살리는 대신 근거 범위를 명시한 family profile을 추가해야 한다.

## 제거한 dead path

- `rendering/models/generic.ts`의 8개 generic builder
- `ModelBuilderId`의 8개 generic ID
- `createObservationModel`의 generic switch case와 import
- legacy geometry field: `tailLength`, `tailStyle`, `filamentLength`, `filamentRadius`, `bend`,
  `lobeSpacing`, `terminalTails`
- 위 field를 보관하던 profile 값

`layers`, `protrusion`, `unitCount`, `unitScale`, `spikeCount`, `turretCount` 등은 현재 specialized
builder에서 사용하므로 유지했다. catalog가 참조하지 않는 geometry profile은 없으며, 71개
entry의 profile ID 집합과 `GEOMETRY_PROFILES` key 집합이 일치하는 테스트로 보호한다.

## Factory와 계약 감사

긴 switch는 `Record<ModelBuilderId, ModelBuilder>`를 만족하는 typed registry로 바꿨다. 새 builder
ID가 추가되면 registry mapping 누락이 TypeScript build에서 실패한다. 71개 모델을 high/low로
생성해 선언된 part/layer의 누락과 catalog에 없는 render-only orphan 등록을 모두 검사한다.

source ID와 History mapping은 cleanup 대상에서 제외했으며 전 항목 resolve 여부를 전역 sweep에서
검사한다. 이전 v4.4~v4.6 테스트의 generic 사용 수 검사는 삭제된 union과 호환되도록 문자열 기반
회귀 assertion으로 유지했다.

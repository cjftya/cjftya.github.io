# Virus Sim v4.8 Generic·Legacy 최종 감사

## 결과

71개 catalog entry가 사용하는 `generic-*` builder는 0개다. v4.7에서 제거한 여덟 generic
builder와 geometry legacy field가 다시 들어오지 않았으며, v4.8의 builder 사용 집합은 typed
registry의 25개 ID와 정확히 일치한다.

| 감사 대상                          | 최종 상태 |
| ---------------------------------- | --------- |
| generic builder entry              | 0         |
| 미참조 geometry profile            | 0         |
| signature 없는 catalog entry       | 0         |
| source 없는 evidence component     | 0         |
| catalog에만 선언된 part/layer      | 0         |
| model에만 등록된 orphan part/layer | 0         |

자료 부족 항목도 무관한 범용 구형 모델로 되돌리지 않는다. 직접 whole-particle 자료가 부족하면
명시적 family profile, `conceptual` evidence와 항목별 simplification을 함께 유지한다. 따라서
generic 0개는 근거가 모두 직접 관찰됐다는 뜻이 아니다.

## v4.8에서 제거한 잔여 경로

- UI에서 이미 제거된 A/B 변형 비교 전용 `catalog/variants/registry.ts`
- `SpecimenVariant`, `StructureChange`, `VariantKind` 비교 전용 type
- 현재 scanner가 사용하지 않던 옛 `scanner/math.ts`
- 호출되지 않던 physical/normalized scale helper와 observed count export
- 등록·소비 경로가 없던 `FlexibleSegment` 계약
- `SceneRenderer`와 중복되며 호출되지 않던 `SpecimenView.getRenderMetrics`

바이러스 catalog 71개와 각 entry의 구조·History·source 데이터는 삭제하지 않았다. Ebola, HIV와
Coronavirus의 종·계통별 catalog entry도 그대로 유지한다.

## 계속 유지한 값

`layers`, `protrusion`, `unitCount`, `unitScale`, `spikeCount`, `turretCount`와 special geometry의
`lobeSpacing`은 현재 builder가 실제로 사용한다. 이름이 과거 field와 비슷하다는 이유만으로
삭제하지 않았고 import·사용 검색과 TypeScript build를 함께 확인했다.

## 재발 방지

`v4.8-final-audit.test.ts`가 다음을 고정한다.

- catalog의 builder 사용 집합과 25개 expected builder의 exact equality
- catalog/signature/dimensions/History ID 집합의 exact equality
- geometry profile key 집합과 catalog 참조 집합의 exact equality
- generic 접두 builder 0개
- high/low model의 declared/orphan part·layer 양방향 검증

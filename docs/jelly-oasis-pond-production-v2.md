# Jelly Oasis 연못 v2 운영 전환
사용자의 “변경된걸로 교체해줘” 요청에 따라 일반 URL의 기본 연못을 PondEdge_Blockout_Detail_v2.glb로 교체했습니다. 후보 단계에서 검증한 비대칭 수면·둑 경계와 기존 지형 재질 연결을 그대로 사용합니다.

- [운영 화면](https://cjftya.github.io/projects/jelly-oasis/)
- debug 비교: ?debug&pond=blockout / ?debug&pond=detail / ?debug&pond=detail-v2
- debug가 없는 URL에서는 pond 쿼리를 무시하고 항상 v2를 선택합니다.

main.ts의 기본 선택과 QA 기대값을 갱신했습니다. 모델·수면 높이·전역 지형·다른 랜드마크는 이 전환에서 수정하지 않았습니다. 자동 배포는 master push에 연결되어 있습니다.

검증 통과: lint, 52개 파일·289개 테스트, build, landmark 브라우저 QA 및 pond QA. production preview의 일반 URL/후보 쿼리 URL에서 v2 GLB 선택·콘솔 오류 없음·동선 통과를 확인했습니다. 결과는 [운영 QA 기록](../artifacts/jelly-oasis/pond-edge-production-v2/browser-qa.json), [랜드마크 기록](../artifacts/jelly-oasis/pond-edge-production-v2/landmark-regression/browser-qa.json), [일반 URL 화면](../artifacts/jelly-oasis/pond-edge-production-v2/production-default.png)에 저장합니다.

형상과 성능 수치는 [v2 후보 보고서](jelly-oasis-pond-edge-detail-v2.md)에 있습니다. 모바일 QA는 headless 검사이며 실기기 FPS·연속 충돌 검증을 대신하지 않습니다.

# 프로젝트 데이터 스키마

프로젝트 데이터 원본은 `public/data/projects.json`입니다. 런타임에는
`JsonProjectRepository`가 읽고 Zod schema로 검증합니다.

## 최상위 구조

```json
{
  "version": 4,
  "galaxies": [],
  "projects": []
}
```

| 필드       | 필수 | 의미                                |
| ---------- | ---- | ----------------------------------- |
| `version`  | 예   | schema 버전. 현재는 정수 `4`만 허용 |
| `galaxies` | 예   | 은하계 선택 UI와 시각 테마 정보     |
| `projects` | 예   | 프로젝트 객체 배열                  |

배열 위치는 표시 순서를 의미하지 않습니다. UI 순서는 `order`, 같은 값이면 `id`로
결정합니다.

## 은하계 필드

| 필드          | 타입    | 의미                                       |
| ------------- | ------- | ------------------------------------------ |
| `id`          | string  | 프로젝트의 `galaxyId`가 참조할 영구 ID     |
| `name`        | string  | 은하계 선택기에 표시할 이름                |
| `description` | string  | 현재 은하계 소개 문구                      |
| `color`       | string  | `#RRGGBB` 형식의 중심별·전환 효과 기준색   |
| `order`       | integer | 은하계 선택기 표시 순서                    |
| `atmosphere`  | object  | 배경색·별빛·우주 먼지·움직임의 분위기 설정 |
| `starProfile` | object  | 중심 항성의 표면·흐름·맥동·광륜 설정       |

은하계 ID는 중복될 수 없고, 프로젝트는 반드시 등록된 은하계 하나를 참조해야 합니다.
은하계를 바꾸면 해당 그룹의 행성·궤도·별자리만 표시됩니다.

### 은하계 분위기

| 필드                         | 타입·범위 | 의미                            |
| ---------------------------- | --------- | ------------------------------- |
| `atmosphere.backgroundColor` | `#RRGGBB` | 장면의 어두운 배경 기준색       |
| `atmosphere.starColor`       | `#RRGGBB` | 먼 별빛 색                      |
| `atmosphere.dustColor`       | `#RRGGBB` | 가까운 우주 먼지 색             |
| `atmosphere.starOpacity`     | `0..1`    | 먼 별빛 밀도감                  |
| `atmosphere.dustOpacity`     | `0..1`    | 가까운 우주 먼지 밀도감         |
| `atmosphere.motionScale`     | `0..2`    | 별과 먼지의 느린 회전 속도 배율 |

전환 시 기존 point field를 다시 만들지 않고 색·투명도·회전 배율만 부드럽게 보간합니다.

### 중심 항성 프로필

| 필드                  | 타입·범위 | 의미                           |
| --------------------- | --------- | ------------------------------ |
| `starProfile.seed`    | integer   | 표면과 광륜 형태를 재현할 seed |
| `colors.base`         | `#RRGGBB` | 대류 무늬의 어두운 색          |
| `colors.middle`       | `#RRGGBB` | 대류 무늬의 주 색              |
| `colors.hot`          | `#RRGGBB` | 밝은 기포·가장자리 색          |
| `patternScale`        | `1..12`   | 무늬 크기. 클수록 조밀함       |
| `flowSpeed`           | `0..0.2`  | 표면 무늬 흐름 속도            |
| `pulseAmount`         | `0..0.05` | 젤리처럼 호흡하는 크기 변화량  |
| `corona.color`        | `#RRGGBB` | 두 겹 광륜의 기준색            |
| `corona.innerScale`   | `1.1..2`  | 안쪽 광륜 크기                 |
| `corona.outerScale`   | `1.5..3`  | 바깥 광륜 크기                 |
| `corona.irregularity` | `0..0.18` | seed 기반 광륜 실루엣 변형량   |
| `corona.opacity`      | `0..0.3`  | 안쪽 광륜의 기준 투명도        |

`corona.outerScale`은 `innerScale`보다 커야 합니다. 항성 표면은 단일 경량 셰이더로
계산하며 이미지 텍스처를 사용하지 않습니다. 광륜 geometry는 은하계 전환 때만 다시
만들고 animation frame에서는 새 객체나 GPU buffer를 만들지 않습니다.

## 프로젝트 필드

| 필드       | 타입     | 필수 | 의미                                     |
| ---------- | -------- | ---- | ---------------------------------------- |
| `id`       | string   | 예   | 영구 식별자. 소문자, 숫자, 하이픈만 허용 |
| `galaxyId` | string   | 예   | 프로젝트가 속한 은하계 ID                |
| `name`     | string   | 예   | 사용자에게 표시할 이름                   |
| `summary`  | string   | 예   | 짧은 설명. 모르면 빈 문자열 허용         |
| `status`   | enum     | 예   | `active`, `legacy`, `archived` 중 하나   |
| `featured` | boolean  | 예   | 향후 강조 표시에 사용할 값               |
| `order`    | integer  | 예   | 같은 은하계 안에서의 표시 순서           |
| `tags`     | string[] | 예   | 검색·분류용 태그. 없으면 빈 배열         |
| `links`    | object   | 예   | 상세 패널의 선택적 GitHub 액션           |
| `details`  | object   | 예   | 상세 패널에 표시할 설명과 기술 정보      |
| `planet`   | object   | 예   | 행성 표현 설정                           |

프로젝트 `id`는 전체 배열에서 고유해야 합니다. 이름이 바뀌더라도 기존 `id`는 유지합니다.

## 링크

| 필드           | 타입             | 의미                       |
| -------------- | ---------------- | -------------------------- |
| `links.github` | string 또는 null | 선택적 프로젝트 GitHub URL |

문자열이면 `https://github.com/`으로 시작하는 완전한 URL이어야 합니다. `null`이면
상세 패널의 액션 영역 전체를 숨기며 WebGL 대체 화면에서도 링크를 만들지 않습니다.
Viola와 Wedding Card가 이 규칙을 사용합니다.

## 상세 정보

| 필드                  | 타입     | 의미                            |
| --------------------- | -------- | ------------------------------- |
| `details.category`    | string   | 프로젝트 유형                   |
| `details.description` | string   | 상세 패널의 본문 설명           |
| `details.techStack`   | string[] | 실제 사용 기술. 최소 한 개 필요 |

## 행성 옵션

### seed와 궤도

| 필드                | 타입·범위      | 의미                         |
| ------------------- | -------------- | ---------------------------- |
| `planet.seed`       | integer        | 같은 행성 형태를 재현할 seed |
| `orbit.radius`      | number, `> 0`  | 태양 중심에서 거리           |
| `orbit.speed`       | number, `>= 0` | 초당 공전 각속도             |
| `orbit.startAngle`  | finite number  | 초기 공전 각도(도)           |
| `orbit.inclination` | `-90..90`      | 궤도 경사(도)                |

### 자전

| 필드                 | 타입·범위      | 의미                                |
| -------------------- | -------------- | ----------------------------------- |
| `rotation.speed`     | number, `>= 0` | 초당 자전 각속도                    |
| `rotation.direction` | enum           | `clockwise` 또는 `counterclockwise` |
| `rotation.axisTilt`  | `-180..180`    | 자전축 기울기(도)                   |

### 형태와 표면

| 필드                | 타입·범위        | 의미                       |
| ------------------- | ---------------- | -------------------------- |
| `shape.radius`      | number, `> 0`    | 행성 기본 반지름           |
| `shape.roughness`   | `0..0.5`         | 반지름 대비 표면 변위 비율 |
| `shape.frequency`   | `> 0`, 최대 `16` | 노이즈 공간 빈도           |
| `surface.baseColor` | `#RRGGBB`        | 절차적 표면의 기준 색      |

같은 `seed`, `shape`, `baseColor` 값을 사용하면 같은 geometry와 색 변화가
재현됩니다. `seed`는 가로 띠, 젤리 얼룩, 극지방, 흐르는 색상층, 마블형 노이즈 중
한 가지 표면 패턴도 결정합니다. 이미지 텍스처는 사용하지 않습니다.

### 고리

| 필드           | 타입·범위      | 의미                        |
| -------------- | -------------- | --------------------------- |
| `ring.enabled` | boolean        | 고리 표시 여부              |
| `ring.color`   | `#RRGGBB`      | 고리 색                     |
| `ring.width`   | number, `>= 0` | 고리 폭                     |
| `ring.tilt`    | `-180..180`    | 행성축 기준 고리 기울기(도) |

`enabled`가 `false`이면 나머지 값은 보관되지만 geometry는 생성하지 않습니다.

## 프로젝트 추가 예시

```json
{
  "id": "sample-project",
  "galaxyId": "jelly-garden",
  "name": "Sample Project",
  "summary": "",
  "status": "active",
  "featured": false,
  "order": 30,
  "tags": [],
  "links": {
    "github": "https://github.com/cjftya/sample-project"
  },
  "details": {
    "category": "Sample",
    "description": "프로젝트 상세 설명",
    "techStack": ["TypeScript"]
  },
  "planet": {
    "seed": 3003,
    "orbit": {
      "radius": 9,
      "speed": 0.035,
      "startAngle": 240,
      "inclination": 3
    },
    "rotation": {
      "speed": 0.12,
      "direction": "counterclockwise",
      "axisTilt": 12
    },
    "shape": {
      "radius": 0.8,
      "roughness": 0.05,
      "frequency": 2.5
    },
    "surface": {
      "baseColor": "#8ab4f8"
    },
    "ring": {
      "enabled": false,
      "color": "#ffffff",
      "width": 0.2,
      "tilt": 0
    }
  }
}
```

실제 정보가 불명확한 필드는 저장소 코드와 문서를 먼저 확인합니다. 상세 설명과 기술
스택은 확인된 정보만 입력합니다.

## 검증

```bash
npm run test
```

테스트는 정상 파싱, 필수 필드 누락, 중복 은하계·프로젝트 ID, 알 수 없는 은하계 참조,
선택적 액션, 잘못된 자전 방향, 음수 반지름, Repository 조회와 실제
`projects.json`을 검사합니다. 검증 실패 메시지는
`projects.0.planet.shape.radius`처럼 잘못된 필드 경로를 포함합니다.

브라우저 런타임에서도 같은 schema를 사용합니다. 실패하면 자세한 오류는 console에
남고, 사용자는 데이터 로딩 오류 패널을 보게 됩니다.

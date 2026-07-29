# 프로젝트 데이터 스키마

프로젝트 데이터 원본은 `public/data/projects.json`입니다. 런타임에는
`JsonProjectRepository`가 읽고 Zod schema로 검증합니다.

## 최상위 구조

```json
{
  "version": 1,
  "projects": []
}
```

| 필드       | 필수 | 의미                                |
| ---------- | ---- | ----------------------------------- |
| `version`  | 예   | schema 버전. 현재는 정수 `1`만 허용 |
| `projects` | 예   | 프로젝트 객체 배열                  |

배열 위치는 표시 순서를 의미하지 않습니다. UI 순서는 `order`, 같은 값이면 `id`로
결정합니다.

## 프로젝트 필드

| 필드       | 타입     | 필수 | 의미                                     |
| ---------- | -------- | ---- | ---------------------------------------- |
| `id`       | string   | 예   | 영구 식별자. 소문자, 숫자, 하이픈만 허용 |
| `name`     | string   | 예   | 사용자에게 표시할 이름                   |
| `summary`  | string   | 예   | 짧은 설명. 모르면 빈 문자열 허용         |
| `status`   | enum     | 예   | `active`, `legacy`, `archived` 중 하나   |
| `featured` | boolean  | 예   | 향후 강조 표시에 사용할 값               |
| `order`    | integer  | 예   | 표시 순서                                |
| `tags`     | string[] | 예   | 검색·분류용 태그. 없으면 빈 배열         |
| `links`    | object   | 예   | 프로젝트 링크                            |
| `planet`   | object   | 예   | 행성 표현 설정                           |

프로젝트 `id`는 전체 배열에서 고유해야 합니다. 이름이 바뀌더라도 기존 `id`는 유지합니다.

## 링크

| 필드           | 타입             | 의미                 |
| -------------- | ---------------- | -------------------- |
| `links.page`   | string 또는 null | 공개 프로젝트 페이지 |
| `links.github` | string 또는 null | 별도 GitHub 저장소   |

링크는 `/projects/example/` 같은 루트 상대 경로나 완전한 URL이어야 합니다. 링크가
없으면 빈 문자열 대신 `null`을 사용합니다.

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

| 필드                | 타입·범위        | 의미                        |
| ------------------- | ---------------- | --------------------------- |
| `shape.radius`      | number, `> 0`    | 행성 기본 반지름            |
| `shape.roughness`   | `0..0.5`         | 반지름 대비 표면 변위 비율  |
| `shape.frequency`   | `> 0`, 최대 `16` | 노이즈 공간 빈도            |
| `surface.baseColor` | `#RRGGBB`        | texture가 없을 때 사용할 색 |
| `surface.texture`   | string 또는 null | 선택적 public texture 경로  |

같은 `seed`, `shape` 값을 사용하면 같은 좌표에서 같은 노이즈가 계산됩니다. texture가
없거나 로딩에 실패하면 `baseColor`로 렌더링합니다.

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
  "name": "Sample Project",
  "summary": "",
  "status": "active",
  "featured": false,
  "order": 30,
  "tags": [],
  "links": {
    "page": "/projects/sample-project/",
    "github": null
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
      "baseColor": "#8ab4f8",
      "texture": null
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

실제 정보가 불명확한 필드는 추측해서 채우지 않고, `summary`는 빈 문자열,
nullable 링크는 `null`, 태그는 빈 배열로 둡니다.

## 검증

```bash
npm run test
```

테스트는 정상 파싱, 필수 필드 누락, 중복 ID, 잘못된 자전 방향, 음수 반지름,
Repository 조회와 실제 `projects.json`을 검사합니다. 검증 실패 메시지는
`projects.0.planet.shape.radius`처럼 잘못된 필드 경로를 포함합니다.

브라우저 런타임에서도 같은 schema를 사용합니다. 실패하면 자세한 오류는 console에
남고, 사용자는 데이터 로딩 오류 패널을 보게 됩니다.

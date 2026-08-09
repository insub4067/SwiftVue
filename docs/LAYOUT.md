# 레이아웃 계약 (Layout Contract)

SwiftVue 컨테이너의 크기 결정 규칙. 새 컨테이너를 추가하거나 기존 컨테이너를
수정할 때 이 계약을 따라야 하며, `e2e/layout.spec.ts`가 이를 CI에서 강제한다.

## 왜 계약이 필요한가

SwiftUI와 CSS는 크기를 반대 방향으로 계산한다.

- **SwiftUI**: 부모가 크기를 *제안*하고 자식이 응답한다 (top-down 협상).
- **CSS**: 콘텐츠가 컨테이너를 밀어낸다 (bottom-up, min-content 하한).

이 간극을 방치하면 "컨테이너가 콘텐츠 크기로 부풀어 조상까지 밀어내는"
blowout이 발생한다. 실제로 같은 뿌리의 결함이 세 번 발견되었다:

| 사례 | 증상 |
|---|---|
| 가로 ScrollView | 콘텐츠 폭(1516px)으로 부풀어 스크롤 자체가 성립하지 않음 |
| leading 정렬 VStack 섹션 | 자식 행의 min-content(387px)에 고정되어 좁은 화면에서 잘림 |
| grid `1fr` 트랙 | min-content 하한 때문에 넓은 자식이 그리드를 밀어냄 |

## 규칙

### 1. 스크롤 축의 크기는 부모에게서 받는다

어떤 축으로 스크롤하는 컨테이너는 그 축의 크기를 **콘텐츠가 아니라 부모**에서
가져와야 한다. 컨테이너 크기 == 콘텐츠 크기면 넘칠 것이 없어 스크롤이 성립하지
않는다.

```
ScrollView(horizontal) → width: 100% (frame.width가 명시되면 그것이 우선)
```

### 2. 스크롤 컨테이너는 자동 최소 크기를 버린다

flex/grid 자식의 기본 `min-width: auto`는 min-content 아래로 줄어들지 못하게
막는다. 스크롤 컨테이너에는 `min-width: 0`을 걸어 콘텐츠가 넘칠 수 있게 한다.

### 3. 유연한 그리드 트랙은 `minmax(0, 1fr)`

맨 `1fr`은 하한이 min-content라서 넓은 자식이 트랙과 그리드 전체를 컨테이너
밖으로 밀어낸다. `resolveTracks()`가 이를 강제하므로 트랙 문자열을 직접 만들지
말고 반드시 이 유틸을 거친다.

### 4. 세로 흐름 그리드는 부모 폭을 채우고, 가로 흐름 그리드는 콘텐츠 크기

- `LazyVGrid`: `width: 100%` — adaptive 트랙이 측정할 기준 폭이 필요하다.
- `LazyHGrid`: 폭을 강제하지 않는다 — 가로 ScrollView 안에서 콘텐츠만큼
  자라야 스크롤이 성립한다.

### 5. 폰 뷰포트를 넘을 수 있는 행은 wrap 또는 스크롤

`alignment="leading"`인 VStack은 교차축이 fit-content이므로, 자식 중 가장 넓은
행이 곧 섹션 폭이 된다. 320px에서 넘칠 수 있는 행은 둘 중 하나를 선택한다:

- `<HStack wrap>` — 줄바꿈 (SwiftUI에 없는 웹 전용 prop)
- 가로 `ScrollView`로 감싸기

섹션 래퍼에는 `frame.width: 100%`를 명시해 자식이 아니라 컨테이너가 폭을
결정하게 한다.

## 검증

- 단위: `tests/components/layout.test.ts` — 각 규칙의 스타일 출력 검증
- E2E: `e2e/layout.spec.ts` — 320–430px에서 데모 전 탭의 가로 오버플로 부재,
  탭바 가시성, 가로 스크롤 성립을 실브라우저로 검증

레이아웃 결함은 happy-dom 단위 테스트로 잡히지 않는다 (위 세 사례 모두 단위
테스트 전부 통과 상태에서 발생). 컨테이너 크기 로직을 바꾸면 반드시 E2E를
로컬에서 돌려볼 것: `npm run e2e`

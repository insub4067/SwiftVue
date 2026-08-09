# 개발 프로세스

## 파이프라인

| 단계 | 트리거 | 내용 |
|---|---|---|
| CI `check` | push/PR → main | typecheck · lint · 단위 테스트 · **패키지 타입 검증** (Node 22/24/26) |
| CI `e2e` | push/PR → main | Playwright 레이아웃 게이트 (`docs/LAYOUT.md` 강제) |
| CI `preview` | PR | 데모 빌드를 아티팩트로 업로드 — PR 화면에서 다운로드해 확인 |
| `deploy.yml` | main push | 데모를 GitHub Pages로 배포 |
| `release.yml` | `v*` 태그 push | check → build → npm publish (provenance) → GitHub Release |

## 로컬 명령

```bash
npm run check           # typecheck + lint + 단위 테스트
npm run verify:package  # 빌드 후, 패킹된 tarball을 소비자 관점에서 컴파일
npm run e2e             # 레이아웃 E2E (데모 빌드 + 실브라우저)
npm run dev             # 데모 개발 서버
```

`verify:package`가 필요한 이유: `vite-plugin-dts`는 선언 파일 생성 오류를 출력만 하고
종료 코드 0으로 끝나며, `vue-tsc --noEmit`은 **소스**를 검사할 뿐 생성된 `.d.ts`를 검사하지
않습니다. 실제로 `NavigationLink`의 `#destination` 슬롯이 선언에서 누락된 채 빌드가
성공했습니다. 이 스크립트는 `npm pack` 산출물에 대해 소비자 픽스처를 컴파일해 그 간극을 막습니다.

컨테이너/레이아웃 코드를 건드렸다면 `npm run e2e`는 필수다 — 지금까지의
레이아웃 결함 전부가 단위 테스트 green 상태에서 발생했다.

## 브랜치 보호 (저장소 관리자가 1회 설정)

CI가 머지 *전* 게이트로 작동하려면 GitHub에서:

1. **Settings → Branches → Add branch protection rule**
2. Branch name pattern: `main`
3. **Require status checks to pass before merging** 체크 후
   `check (22)` `check (24)` `check (26)` `e2e` 선택
4. (권장) **Require a pull request before merging**

## npm 배포

1회 준비: npmjs.com에서 automation token 발급 →
저장소 **Settings → Secrets → Actions**에 `NPM_TOKEN`으로 등록.

배포:

```bash
npm version patch        # 또는 minor / major — package.json + 태그 생성
git push origin main --follow-tags
```

태그 push가 release.yml을 실행한다. 태그와 package.json 버전이 다르면
배포는 실패한다(교차 검증 단계).

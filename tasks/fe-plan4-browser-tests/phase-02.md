# Phase 02. CI 에 브라우저 테스트 job 추가

**Execution profile**: fast
**Domain**: app-router

## 목표

PR 마다 브라우저 테스트를 돌려, 화면 배치가 깨진 변경을 머지 전에 잡는다.

**범위 외**: 테스트 기반과 spec 은 phase 01 이 만들었다. 기존 `test` job 의 단계는 바꾸지 않는다.

## 컨텍스트

모든 경로는 저장소 root 기준이다.

- `.github/workflows/frontend-ci.yml` 에 `test` job 이 있다. pnpm 10.22.0, Node 22, `working-directory: frontend` 를 쓴다. 새 job 도 같은 설정을 쓴다.
- phase 01 이 `frontend/package.json` 에 `test:browser` 를 더했다. 이 명령이 빌드한 Next 서버와 가짜 백엔드를 함께 띄운다.

**근거 문서**: `frontend/docs/adr/ADR-F34-browser-tests-fake-backend.md`, `frontend/docs/testing-strategy.md` 의 「6. 브라우저 테스트」 절.

## 의도 메모

- 기존 `test` job 에 단계를 덧붙이지 않고 별도 job 으로 둔다. 둘이 나란히 돌아 전체 시간이 덜 늘고, 어느 쪽이 실패했는지 바로 보인다.
- 브라우저는 chromium 하나만 설치한다.
- 실패하면 Playwright 결과 디렉터리를 artifact 로 올려 trace 를 받아 볼 수 있게 한다.

## 작업 항목

### 1. `.github/workflows/frontend-ci.yml` 에 `browser` job 추가

- `runs-on: ubuntu-latest`, `defaults.run.working-directory: frontend`.
- 단계: checkout, pnpm 설정(10.22.0), Node 22 설정(pnpm 캐시, `cache-dependency-path: frontend/pnpm-lock.yaml`), `pnpm install --frozen-lockfile`,
  `pnpm exec playwright install --with-deps chromium`, `pnpm test:browser`.
- `if: failure()` 일 때 `actions/upload-artifact` 로 `frontend/test-results`를 올린다.
  phase 01의 설정 파일 위치에서 `../test-results`를 해석한 `outputDir`과 같은 디렉터리다.
- action 버전은 같은 파일의 기존 job 이 쓰는 major 버전을 따른다.

### 2. 이 phase 를 검증하는 기존 브라우저 테스트

새 테스트 파일은 만들지 않는다. phase 01 의 `frontend/browser/categories.spec.ts` 와 `frontend/browser/notifications.spec.ts` 를 CI 와 같은 명령으로 로컬에서 돌려, job 이 부를 명령이 통과하는지 확인한다.

## 검증

저장소 root 에서 실행한다.

```bash
python3 -c "import yaml,sys; d=yaml.safe_load(open('.github/workflows/frontend-ci.yml')); assert 'browser' in d['jobs'], 'browser job 없음'; print(list(d['jobs']))"
cd frontend && pnpm install --frozen-lockfile && pnpm exec playwright install chromium && pnpm test:browser browser/categories.spec.ts browser/notifications.spec.ts
```

기대값:

- 첫 명령이 `['test', 'browser']` 처럼 두 job 을 출력한다.
- `pnpm test:browser` 가 8건 모두 통과한다.

### CI 설정의 의미 검증

job 존재 검사에 더해 일회성 Python 검증으로 아래 값을 모두 단언한다.
임시 스크립트가 필요하면 `mktemp -d`로 `/tmp` 아래에 만들고 종료 시 제거한다.
어느 단언이든 실패하면 종료 코드 1로 끝낸다.

- `browser.runs-on`은 `ubuntu-latest`이고 기본 실행 디렉터리는 `frontend`다.
- checkout, pnpm 설정, Node 설정의 action major는 기존 `test` job과 같다.
- pnpm 버전은 `10.22.0`, Node 버전은 `22`, 캐시는 `pnpm`이다.
  캐시 의존 파일은 `frontend/pnpm-lock.yaml`이다.
- 설치와 실행 명령은 각각 `pnpm install --frozen-lockfile`,
  `pnpm exec playwright install --with-deps chromium`, `pnpm test:browser`다.
- artifact 단계는 `if: failure()`를 쓰고 `actions/upload-artifact`를 호출한다.
  artifact 경로는 `frontend/test-results`다.
  `frontend/browser/playwright.config.ts`의 `outputDir`을 해석한 디렉터리가
  저장소 root 기준 artifact 경로와 같은지 단언한다.

설정의 실행 명령이나 artifact 경로를 임시로 틀리게 바꿨을 때 검증이 실패하는지 확인하고,
원래 값으로 되돌린 뒤 검증이 통과하는지 확인한다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `.github/workflows/frontend-ci.yml` | 수정 |

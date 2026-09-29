# Phase 03. CI 와 이미지 워크플로를 경로별로 나눈다

**Execution profile**: standard

## 목표

프론트엔드와 백엔드의 CI, 이미지 워크플로, dependabot 설정을 루트 `.github/` 하나로 모으고, 바뀐 하위 프로젝트의 워크플로만 돌게 한다.
이미지 이름은 기존 두 GHCR 이름을 그대로 쓴다.

**범위 외**: 리뷰 워크플로(phase 04), Jenkins 호출과 배포 자동화(별도 plan), Vercel 연결 해제(사용자가 머지 전에 한다).

## 컨텍스트

- phase 01 이후 루트 `.github/workflows/` 에는 프론트엔드의 `frontend-ci.yml`, `docker-publish.yml`, `claude-code-review.yml` 이 있다.
- phase 02 이후 `backend/.github/` 에 백엔드의 `backend-ci.yml`, `docker-publish.yml`, `claude-code-review.yml`, `dependabot.yml` 이 있다. GitHub 는 하위 디렉터리의 `.github/` 를 읽지 않는다.
- 두 `docker-publish.yml` 은 `IMAGE_NAME: ${{ github.repository }}` 를 쓴다. 저장소가 하나가 되면 둘 다 같은 이름으로 push 하므로 고정해야 한다.
- 홈 서버 compose 는 `ghcr.io/jon890/fos-accountbook-frontend:latest`, `ghcr.io/jon890/fos-accountbook-backend:latest` 를 참조한다.
- 프론트엔드 CI 는 `pnpm tsc --noEmit`, `pnpm lint`, `pnpm lint:md`, `pnpm test:ci` 를, 백엔드 CI 는 `./gradlew checkstyleMain`, `checkstyleTest`, `test`, `build` 를 돈다.

**근거 문서**: `docs/adr.md` 의 ADR-M01 「적용 범위」 표의 CI, 이미지 행

## 의도 메모

- 경로 필터는 워크플로 파일 자신도 포함한다. 워크플로만 고친 PR 에서도 그 워크플로가 검증된다.
- 루트 문서와 하네스만 바뀐 PR 에서는 두 CI 모두 돌지 않는다. 필수 check 가 없어 머지를 막지 않는다.
- `workflow_dispatch` 의 `tag` 입력은 유지한다. 머지 전에 이 브랜치에서 시험 태그로 push 해 GHCR 권한과 빌드 경로를 확인하는 데 쓴다.
- 백엔드 CI 의 `gradle wrapper` 단계는 그대로 옮긴다. 이번 이관에서 빌드 절차를 바꾸지 않는다.

## 작업 항목

### 1. `.github/workflows/frontend-ci.yml`

- `on.push` 와 `on.pull_request` 에 `paths: ["frontend/**", ".github/workflows/frontend-ci.yml"]` 를 단다.
- job 에 `defaults.run.working-directory: frontend` 를 둔다.
- `setup-node` 의 `cache-dependency-path` 를 `frontend/pnpm-lock.yaml` 로, codecov 의 `files` 를 `./frontend/coverage/coverage-final.json` 으로 바꾼다.

### 2. `.github/workflows/backend-ci.yml`

`backend/.github/workflows/backend-ci.yml` 을 `git mv` 로 옮기고 고친다.

- 기존 paths 항목마다 `backend/` 를 앞에 붙이고, 워크플로 자신의 경로는 `.github/workflows/backend-ci.yml` 로 둔다.
- job 에 `defaults.run.working-directory: backend` 를 둔다.
- artifact `path` 들을 `backend/build/...` 로 바꾼다. `actions/checkout` 은 루트와 같은 `@v7` 로 맞춘다.

### 3. 이미지 워크플로 두 개

- `.github/workflows/docker-publish.yml` 을 `frontend-image.yml` 로 `git mv` 한다.
    - paths 에 `frontend/` 를 붙이고 워크플로 경로를 새 이름으로 바꾼다.
    - `IMAGE_NAME: jon890/fos-accountbook-frontend`, build `context: ./frontend` 로 둔다.
- `backend/.github/workflows/docker-publish.yml` 을 `.github/workflows/backend-image.yml` 로 `git mv` 한다.
    - paths 에 `backend/` 를 붙이고 `IMAGE_NAME: jon890/fos-accountbook-backend`, build `context: ./backend` 로 둔다.

### 4. `.github/dependabot.yml`

두 설정을 하나로 합친다.

- npm 항목은 `directory: "/frontend"`, gradle 과 docker 항목은 `directory: "/backend"`, github-actions 는 `directory: "/"` 하나로 둔다.
- 프론트엔드의 `next >=16` 과 `eslint-config-next >=16` 무시 규칙은 지운다. 이미 Next 16 을 쓰고 있어 다음 메이저 업데이트까지 막는다.
- `backend/.github/dependabot.yml` 은 지운다.

### 5. 남은 백엔드 `.github` 를 지운다

`backend/.github/workflows/claude-code-review.yml` 을 지운다. 리뷰 워크플로는 phase 04 가 루트 것 하나로 합친다.
`backend/.github/workflows/code-review-prompt.txt` 는 phase 04 가 옮기므로 남긴다.

## 검증

```bash
# cwd: <worktree root>
actionlint .github/workflows/frontend-ci.yml .github/workflows/backend-ci.yml .github/workflows/frontend-image.yml .github/workflows/backend-image.yml
ls backend/.github/workflows/                 # code-review-prompt.txt 하나
test ! -e backend/.github/dependabot.yml && test ! -e .github/workflows/docker-publish.yml
grep -n "IMAGE_NAME: jon890/fos-accountbook-frontend" .github/workflows/frontend-image.yml
grep -n "IMAGE_NAME: jon890/fos-accountbook-backend" .github/workflows/backend-image.yml
python3 -c "import yaml; d=yaml.safe_load(open('.github/dependabot.yml')); print(sorted((u['package-ecosystem'], u['directory']) for u in d['updates']))"
cd frontend && pnpm lint && pnpm test
```

- `actionlint` 는 info 수준(SC2016, SC2086, SC2028) 외의 오류가 없어야 한다.
- dependabot 출력은 `[('docker', '/backend'), ('github-actions', '/'), ('gradle', '/backend'), ('npm', '/frontend')]` 이어야 한다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `.github/workflows/frontend-ci.yml` | 수정 |
| `.github/workflows/backend-ci.yml` | 신규 (backend/ 에서 이동) |
| `.github/workflows/frontend-image.yml` | 신규 (docker-publish.yml 에서 이동) |
| `.github/workflows/backend-image.yml` | 신규 (backend/ 에서 이동) |
| `.github/workflows/docker-publish.yml` | 삭제 |
| `.github/dependabot.yml` | 수정 |
| `backend/.github/workflows/backend-ci.yml` | 삭제 |
| `backend/.github/workflows/docker-publish.yml` | 삭제 |
| `backend/.github/workflows/claude-code-review.yml` | 삭제 |
| `backend/.github/dependabot.yml` | 삭제 |

# Phase 01. 프론트엔드 파일을 frontend/ 로 옮긴다

**Execution profile**: standard

## 목표

프론트엔드 저장소의 파일을 `frontend/` 아래로 옮기고, 저장소 전체 ADR 을 루트 `docs/adr.md` 에 둔다.
백엔드를 합치기 전에 루트를 비워 두 하위 프로젝트가 경로로 부딪히지 않게 한다.

**범위 외**: 백엔드 이력 합치기(phase 02), 워크플로 경로 수정(phase 03, 04), 하네스 내용 수정(phase 05).
이 phase 는 파일 위치만 바꾸고 내용을 고치지 않는다.

## 컨텍스트

- 이 저장소는 `jon890/fos-accountbook-frontend` 이고 Next.js 16 과 pnpm 10 을 쓴다.
- 저장소 전체 결정은 `docs/monorepo-adr.md` 에 이미 적혀 있다. 이 phase 에서 루트 `docs/adr.md` 로 이름을 바꾼다.
- `frontend/docs/adr.md` 의 ADR-F11 은 루트 ADR 을 `../../docs/adr.md#adr-m01` 로, 루트 ADR 은 F11 을 `../frontend/docs/adr.md#adr-f11` 로 가리킨다. 옮긴 뒤 두 링크가 맞아야 한다.

**근거 문서**: `docs/monorepo-adr.md` 의 ADR-M01 「적용 범위」 표

## 의도 메모

- `git mv` 로 옮겨 `git log --follow` 가 이어지게 한다. 복사 후 삭제하지 않는다.
- `.github/`, `tasks/`, `scripts/pr-risk-labels.sh` 는 저장소 전체 것이라 루트에 남긴다. 워크플로와 위험 라벨 내용은 phase 03, 04 가 고친다.
    - 리뷰 워크플로가 main 의 `scripts/pr-risk-labels.sh` 를 읽으므로 경로를 바꾸지 않는다.
- `.gitignore` 는 두 개가 된다. 프론트엔드 규칙은 `frontend/.gitignore` 로 옮기고, 루트에는 저장소 전체 규칙만 새로 둔다.
- `.tool-versions` 는 루트에 남긴다. phase 05 가 백엔드 파일로 바꾼다.
- 루트 `docs/adr.md` 자리에 프론트 ADR 이 있다가 저장소 ADR 로 바뀐다. 알려진 부작용이 둘 있고 받아들인다.
    - `git log --follow docs/adr.md` 에 프론트 ADR 이력이 붙어 나온다. 프론트 ADR 이력은 `git log --follow frontend/docs/adr.md` 로 본다.
    - PR diff 에서 루트 `docs/adr.md` 가 대량 수정으로 보인다.

## 작업 항목

### 1. 프론트엔드 파일을 `frontend/` 로 옮긴다

아래를 `git mv` 로 `frontend/` 아래 같은 이름으로 옮긴다.

`src`, `public`, `scripts/check-tailwind-md.mjs`, `.agents`, `.claude`, `.dockerignore`, `.env.example`, `CLAUDE.md`, `README.md`, `components.json`, `Dockerfile`, `eslint.config.mjs`, `jest.config.js`, `jest.setup.js`, `next.config.ts`, `package.json`, `pnpm-lock.yaml`, `postcss.config.js`, `skills-lock.json`, `tsconfig.json`, `.gitignore`

`docs/` 는 `docs/monorepo-adr.md` 를 뺀 나머지를 `frontend/docs/` 로 옮긴다.

### 2. 루트 `docs/adr.md` 를 만든다

`git mv docs/monorepo-adr.md docs/adr.md` 한다. 내용은 고치지 않는다.

### 3. 루트 `.gitignore` 를 새로 둔다

루트 `.gitignore` 에는 저장소 전체 규칙만 둔다.

```
.DS_Store
.omc
.claude/settings.local.json
.claude/worktrees/
worktrees/
.scratch/
```

`frontend/.gitignore` 의 `/node_modules`, `/.next/` 같은 루트 고정 패턴은 그 파일이 있는 디렉터리 기준으로 동작하므로 고치지 않는다.

### 4. 옮긴 뒤 프론트엔드 검증

`frontend/` 에서 설치와 검사를 돌린다. `.claude/skills/next-best-practices` 같은 심링크가 `../../.agents/...` 를 가리키므로 함께 옮겨졌는지 확인한다.

## 검증

```bash
# cwd: <worktree root>
test ! -e src && test ! -e package.json && test -f frontend/package.json && test -f docs/adr.md
test -f scripts/pr-risk-labels.sh && test -f frontend/scripts/check-tailwind-md.mjs
test "$(ls docs/)" = adr.md                # 루트 docs 에는 adr.md 하나
test "$(git log --follow --oneline -- frontend/src/proxy.ts | wc -l)" -gt 1   # 이관 전 커밋까지 이어진다
test "$(git log --follow --oneline -- frontend/docs/adr.md | wc -l)" -gt 1
readlink frontend/.claude/skills/next-best-practices && test -f frontend/.claude/skills/next-best-practices/SKILL.md
cd frontend && pnpm install --frozen-lockfile && pnpm lint && pnpm lint:md && pnpm test && pnpm exec tsc --noEmit
```

모두 종료 코드 0 이어야 한다. `pnpm test` 는 257개 이상 통과해야 한다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `frontend/**` | 신규 (이동) |
| `src/**` | 삭제 (이동) |
| `public/**` | 삭제 (이동) |
| `scripts/check-tailwind-md.mjs` | 삭제 (이동) |
| `.agents/**` | 삭제 (이동) |
| `.claude/**` | 삭제 (이동) |
| `docs/prd.md` | 삭제 (이동) |
| `docs/flow.md` | 삭제 (이동) |
| `docs/data-schema.md` | 삭제 (이동) |
| `docs/code-architecture.md` | 삭제 (이동) |
| `docs/testing-strategy.md` | 삭제 (이동) |
| `docs/calendar-api.md` | 삭제 (이동) |
| `docs/monorepo-adr.md` | 삭제 (이동) |
| `docs/adr.md` | 수정 (monorepo-adr.md 에서 이동) |
| `.gitignore` | 수정 |
| `.dockerignore` | 삭제 (이동) |
| `.env.example` | 삭제 (이동) |
| `CLAUDE.md` | 삭제 (이동) |
| `README.md` | 삭제 (이동) |
| `components.json` | 삭제 (이동) |
| `Dockerfile` | 삭제 (이동) |
| `eslint.config.mjs` | 삭제 (이동) |
| `jest.config.js` | 삭제 (이동) |
| `jest.setup.js` | 삭제 (이동) |
| `next.config.ts` | 삭제 (이동) |
| `package.json` | 삭제 (이동) |
| `pnpm-lock.yaml` | 삭제 (이동) |
| `postcss.config.js` | 삭제 (이동) |
| `skills-lock.json` | 삭제 (이동) |
| `tsconfig.json` | 삭제 (이동) |

---
name: commit-convention
description: |
  이 프로젝트의 Git 커밋 컨벤션 가이드. 커밋을 만들거나 staged 변경사항을 커밋하거나,
  "커밋해줘", "commit", "변경사항 저장" 등의 요청이 있을 때 반드시 이 스킬을 따른다.
---

# fos-accountbook 커밋 컨벤션

## 커밋 전 검증

```bash
# cwd: <repo root>
cd frontend && pnpm lint && pnpm test
cd backend && ./gradlew checkstyleMain checkstyleTest test
```

- 바뀐 하위 프로젝트의 명령만 돌린다. 둘 다 바뀌었으면 둘 다 돌린다.
- 실패하면 고친 뒤 커밋한다.
- `--no-verify` 는 쓰지 않는다.
- `&` 로 병렬 실행한 뒤 `wait` 로 기다리지 않는다. `wait` 는 인자가 없으면 앞 명령이 실패해도 0 으로 끝난다.

## 메시지

형식은 `type(scope): 설명` 이다. type 과 scope 는 `git log --oneline` 의 기존 커밋을 따른다.

- 제목과 본문은 한국어로 쓴다.
- 본문에는 무엇을 왜 바꿨는지 쓴다.

## 따로 커밋할 파일

기능 변경과 섞지 않고 별도 커밋으로 나눈다.

- `.claude/`, `CLAUDE.md`, `AGENTS.md` — 하네스 지침
- `skills-lock.json` — `.agents/skills/` 외부 스킬 락파일
- `.github/workflows/` — CI

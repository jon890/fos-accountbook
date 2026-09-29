# fos-accountbook build-with-teams 오버레이 (저장소 공통)

공용 코어(`~/.claude/skills/build-with-teams`)에 저장소 공통 규칙을 주입한다.
검증 명령과 index.json 스키마는 하위 프로젝트 오버레이가 소유한다.

## 저장소 배치

| 값 | 값 |
| --- | --- |
| docs 경로 | `docs/` |
| tasks 경로 | `tasks/` |
| plan 접두사 | `mono-` |

## 작업 공간 준비

기준 브랜치는 `main` 이다.

```bash
# cwd: <repo root>
git fetch origin
git worktree add .claude/worktrees/{접두사}{N} plan/{접두사}{N}-{slug}
```

- 예: `plan/fe-001-login` 은 `.claude/worktrees/fe-001` 에 만든다.
- 의존성 설치는 대상 하위 프로젝트 오버레이의 설치 절을 따른다.
- `.claude/worktrees/` 는 `.gitignore` 에 있다.
- 끝나면 `git worktree remove .claude/worktrees/{접두사}{N}` 로 정리한다.

## 에이전트 이름

이 저장소에는 전용 에이전트가 없다. 아래를 스폰한다.

| 역할 | 에이전트 |
| --- | --- |
| critic | `oh-my-claudecode:critic` |
| executor | `oh-my-claudecode:executor` |
| code-reviewer | `oh-my-claudecode:code-reviewer` |
| docs-verifier | `oh-my-claudecode:architect` |

## 브랜치와 PR

`CLAUDE.md` 의 「Git & PR Conventions」 를 따른다.
`/planning` 이 이미 push 한 `plan/{접두사}{N}-{slug}` 브랜치를 그대로 이어 쓰고, 완료 마킹도 그 브랜치에서 커밋한다.

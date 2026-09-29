# fos-accountbook build-with-teams 오버레이

공용 코어(`~/.claude/skills/build-with-teams`)에 fos-accountbook 특화를 주입한다.

## 통합 검증 명령

```bash
# cwd: <worktree root>
pnpm lint && pnpm lint:md && pnpm test:ci && pnpm build
```

- `pnpm build`(`next build`)가 타입 검사를 겸한다.
    - 별도 `tsc --noEmit` 스크립트는 없다.
- `lint:md` 는 markdown 안의 Tailwind arbitrary class 위험 패턴을 검출한다(CODE-3).

## 작업 공간 준비

기준 브랜치는 `main` 이다.

```bash
# cwd: <repo root>
git fetch origin
git worktree add .claude/worktrees/plan{N} plan/{N}-{slug}
cd .claude/worktrees/plan{N} && pnpm install
```

- `.claude/worktrees/` 는 `.gitignore` 에 있다.
- 끝나면 `git worktree remove .claude/worktrees/plan{N}` 로 정리한다.

## 에이전트 이름

이 저장소에는 전용 에이전트가 없다. 아래를 스폰한다.

| 역할 | 에이전트 |
| --- | --- |
| critic | `oh-my-claudecode:critic` |
| executor | `oh-my-claudecode:executor` |
| code-reviewer | `oh-my-claudecode:code-reviewer` |
| docs-verifier | `oh-my-claudecode:architect` |

## index.json 스키마

이 저장소가 써 온 `tasks/plan{N}-*/index.json` 형식이다. 코어 예시와 필드 이름이 다르다.

```jsonc
{
  "name": "plan{N}-{slug}",              // 디렉터리명과 일치
  "description": "무엇을 구현하는 plan인지 한 줄 + (있으면) v2 갱신 요약",
  "status": "pending",                   // pending | completed
  "created_at": "2026-07-16",            // YYYY-MM-DD
  "total_phases": 4,                     // phases 배열 길이와 일치
  "related_docs": ["docs/adr.md", "CLAUDE.md"],
  "phases": [
    {
      "number": 1,                       // 1부터 순차 증가
      "file": "phase-01.md",
      "title": "phase 제목",
      "model": "sonnet",                 // haiku | sonnet | opus
      "status": "pending"                // pending | completed
    }
  ]
}
```

## 반복 함정 목록

`.claude/skills/_shared/common-pitfalls.md` 를 쓴다.
critic 과 code-reviewer 는 phase 의 `domain` 태그에 해당하는 `CODE-N` 만 골라 점검한다.

## 브랜치와 PR

`CLAUDE.md` 의 「Git & PR Conventions」 를 따른다.
`/planning` 이 이미 push 한 `plan/{N}-{slug}` 브랜치를 그대로 이어 쓰고, 완료 마킹도 그 브랜치에서 커밋한다.

# fos-accountbook build-with-teams 오버레이

공용 코어(`~/.claude/skills/build-with-teams`)에 fos-accountbook 특화를 주입한다.

## 저장소 배치

| 값 | 값 |
| --- | --- |
| docs 경로 | `frontend/docs/` |
| tasks 경로 | `tasks/` |
| plan 접두사 | `fe-` |

## 통합 검증 명령

```bash
# cwd: frontend
pnpm lint && pnpm lint:md && pnpm test:ci && pnpm build
```

- `pnpm build`(`next build`)가 타입 검사를 겸한다.
    - 별도 `tsc --noEmit` 스크립트는 없다.
- `lint:md` 는 markdown 안의 Tailwind arbitrary class 위험 패턴을 검출한다(CODE-3).

## 설치

```bash
# cwd: <worktree root>
cd frontend && pnpm install
```

## index.json 스키마

이 저장소가 써 온 `tasks/fe-plan{N}-*/index.json` 형식이다. 코어 예시와 필드 이름이 다르다.

```jsonc
{
  "name": "fe-plan{N}-{slug}",           // 디렉터리명과 일치
  "description": "무엇을 구현하는 plan인지 한 줄 + (있으면) v2 갱신 요약",
  "status": "pending",                   // pending | completed
  "created_at": "2026-07-16",            // YYYY-MM-DD
  "total_phases": 4,                     // phases 배열 길이와 일치
  "related_docs": ["frontend/docs/adr.md", "frontend/CLAUDE.md"],
  "phases": [
    {
      "number": 1,                       // 1부터 순차 증가
      "file": "phase-01.md",
      "title": "phase 제목",
      "execution_profile": "standard",   // fast | standard | deep
      "status": "pending"                // pending | completed
    }
  ]
}
```

## 반복 함정 목록

`frontend/.claude/skills/_shared/common-pitfalls.md` 를 쓴다.
critic 과 code-reviewer 는 phase 의 `domain` 태그에 해당하는 `CODE-N` 만 골라 점검한다.

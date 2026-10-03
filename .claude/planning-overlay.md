# fos-accountbook planning 오버레이 (저장소 공통)

공용 코어(`~/.claude/skills/planning`)에 저장소 공통 규칙을 주입한다.
하위 프로젝트 전용 규칙은 `frontend/.claude/planning-overlay.md`, `backend/.claude/planning-overlay.md` 가 소유한다.

## 저장소 배치

| 값 | 값 |
| --- | --- |
| docs 경로 | `docs/` |
| tasks 경로 | `tasks/` |
| plan 접두사 | `mono-` |

접두사는 계획이 걸치는 범위로 고른다: 저장소 전체 `mono-`, 프론트엔드 `fe-`, 백엔드 `be-`.
번호는 접두사마다 001 부터 따로 센다.

## plan 번호 조회

```bash
# cwd: <repo root>
# 완료된 계획서는 지우므로 사용한 번호는 git 이력에서 찾는다
bash "$SKILL_DIR/scripts/plan_number.sh" --prefix <접두사> | tail -1
gh pr list --state open --json number,headRefName,title --jq '.[] | "\(.headRefName) \(.title)"'
```

`$SKILL_DIR` 는 planning 스킬 번들 경로다. 스킬을 열 때 「Base directory for this skill」 로 나온다. `~/.claude/skills/planning` 은 없다.

## 커밋과 핸드오프

브랜치 이름, main push 차단, 단일 PR 원칙은 `CLAUDE.md` 의 「Git & PR Conventions」 를 따른다.

- **브랜치**: origin/main 기준으로 새로 만든다. 이전 plan 브랜치 위에 쌓지 않는다.
- **커밋**: docs 변경과 task 파일을 **한 커밋**으로 묶는다. 메시지: `docs({접두사}plan{N}): {plan 한 줄 요약}`.
- **push**: `git push -u origin plan/{접두사}{N}-{slug}` 까지만 하고 PR 은 만들지 않는다. 이후 `git switch main` 으로 복귀한다.
- **핸드오프**: `/build-with-teams {접두사}plan{N}` 로 구현 시작을 안내한다.

# fos-accountbook docs-check 오버레이 (저장소 공통)

공용 코어(`~/.claude/skills/docs-check`)에 저장소 공통 규칙을 주입한다.
하위 프로젝트 문서의 감사 범위는 각 하위 프로젝트 오버레이가 소유한다.

## 저장소 배치

| 값 | 값 |
| --- | --- |
| docs 경로 | `docs/` |
| tasks 경로 | `tasks/` |
| plan 접두사 | `mono-` |

## 감사 대상

루트 `docs/adr/` 의 결정별 파일과 `INDEX.md` 다.

- 하네스 지침(`CLAUDE.md`, `.claude/`)은 `harness-cleanup` 이 맡는다. 이 감사에서 제외한다.
- 프론트엔드와 백엔드 ADR 은 각 하위 프로젝트 오버레이가 맡는다.

## ADR Index 동기화 검증

```bash
# cwd: <repo root>
python3 scripts/check-adr-links.py
```

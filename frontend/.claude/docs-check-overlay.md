# fos-accountbook docs-check 오버레이

공용 코어(`~/.claude/skills/docs-check`)에 fos-accountbook 특화를 주입한다.

## 저장소 배치

| 값 | 값 |
| --- | --- |
| docs 경로 | `frontend/docs/` |
| tasks 경로 | `tasks/` |
| plan 접두사 | `fe-` |

## 감사 대상

`frontend/CLAUDE.md` 「컨텍스트 문서」 표의 문서와 백엔드 요청 문서다.

```bash
# cwd: frontend
ls docs/*.md
```

- 백엔드 ADR(`backend/docs/adr.md`)과 루트 ADR(`docs/adr.md`)은 이 오버레이의 감사 범위가 아니다.
- 문서 간 책임 분리 표와 ADR 자명성 점검은 `planning-overlay.md` 의 「docs 컨벤션」 이 소유한다.

## ADR 구조

- 단일 파일 `docs/adr.md` 다. 디렉터리가 아니다.
- 상단 `## ADR Index` 가 링크 목록이고, 본문은 `## ADR-FNN: ...` 헤딩이다.
- 제목 바로 위에 `<a id="adr-fnn"></a>` 앵커를 둔다.
    - 규칙은 `planning-overlay.md` 의 「ADR 표기 중 이 레포에서만 다른 것」 이 소유한다.

## ADR Index 동기화 검증

```bash
# cwd: frontend
BODY=$(grep -oE '^## ADR-F[0-9]+' docs/adr.md | grep -oE 'ADR-F[0-9]+' | sort -u)
INDEX=$(grep -oE '\[ADR-F[0-9]+\]' docs/adr.md | grep -oE 'ADR-F[0-9]+' | sort -u)
diff <(echo "$BODY") <(echo "$INDEX") && echo "OK: ADR Index synced"
```

## 코드 대조 grep

```bash
# cwd: frontend
# data-schema.md 가 언급하는 Action 이 실제 코드에 존재하는지
grep -oE '`[a-zA-Z][a-zA-Z0-9]*Action`' docs/data-schema.md | sort -u | while read -r fn; do
  name=$(echo "$fn" | tr -d '`')
  grep -rq "export.*function $name\|export const $name" src/actions/ 2>/dev/null || echo "DECAY: $name — docs/data-schema.md 언급, src/actions/ 에 없음"
done
```

ADR 이 결정한 컴포넌트와 경로가 실제로 있는지는 ADR 마다 grep 한다.

## docs-verifier

전용 에이전트가 없다. 코어 기본 동작을 따른다.

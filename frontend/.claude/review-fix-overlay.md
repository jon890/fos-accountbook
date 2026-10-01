# fos-accountbook review-fix 오버레이

## 저장소 배치

| 값 | 값 |
| --- | --- |
| docs 경로 | `frontend/docs/` |
| tasks 경로 | `tasks/` |
| plan 접두사 | `fe-` |

## 검증 명령

`build-with-teams-overlay.md` 의 「통합 검증 명령」 을 쓴다.
봇 심각도 표기는 루트 `.claude/review-fix-overlay.md` 를 따른다.

## 학습 누적 위치

review-fix 의 학습 누적 단계에서 **재현 가능한 코드 패턴**을 찾으면 아래 위치에 기록한다.
재현 가능이란, 같은 실수가 다른 코드에서도 날 수 있고 grep·lint 로 검출 가능한 경우다.

- 파일: `frontend/.claude/skills/_shared/common-pitfalls.md` → `## 코드 패턴 함정` 섹션
- 형식:

  ```
  ### CODE-N · trigger: <상황 키워드> · auto-gate: —

  <한 줄 요약> (PR #<번호>)

  - **증상**: ...
  - **Good**: ...
  - **검출**: <grep/lint 명령>
  - **Why**: ...
  ```

- 1회성 오타, 특정 PR 한정 지적, 칭찬은 기록하지 않는다.
    - 기준은 common-pitfalls.md 끝의 「코드 패턴 누적 규칙」 이다.

ADR 급 결정(라이브러리와 스택 의사결정)은 `frontend/docs/adr/ADR-FNN-{slug}.md` 파일 하나로 기록하고 `frontend/docs/adr/INDEX.md` 표에 한 줄을 더한다.

# fos-accountbook review-fix 오버레이 (저장소 공통)

## 저장소 배치

| 값 | 값 |
| --- | --- |
| docs 경로 | `docs/` |
| tasks 경로 | `tasks/` |
| plan 접두사 | `mono-` |

## 봇 심각도 표기

코드 리뷰 봇의 리뷰는 2026-10-02 부터 `github-actions[bot]` 이름으로 게시된다(ADR-F11). 그 전 리뷰는 `claude[bot]` 이다. 두 이름 모두 이 저장소의 리뷰 봇이며, 본문이 `## 코드 리뷰` 나 등급 표시로 시작하는 것만 리뷰 봇 글로 본다.
리뷰 봇 등급은 `.github/claude-review-prompt-common.txt` 의 「등급」 절이 정한다.
그 표의 등급을 코어의 심각도 분류에 대응시킨다.

검증 명령과 학습 누적 위치는 바뀐 하위 프로젝트의 오버레이를 따른다.

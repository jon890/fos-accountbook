# ADR-F11: CI 코드 리뷰 워크플로 설계 (개정)

**결정**: Claude Code Action 기반 자동 코드 리뷰 워크플로를 아래 방침으로 운영. fos-blog 정착 패턴과 동일화 (2026-05-09 개정, 2026-06-02 단일 opus 리뷰어로 모델 전환, 2026-09-01 요약을 리뷰 body 로 통합, 2026-09-29 fos-assistant 판에 맞춰 호출 경계와 등급과 위험 라벨 추가).

**적용 범위**: 모노레포의 리뷰 워크플로 하나가 프론트엔드와 백엔드를 함께 리뷰한다([ADR-M01](../../docs/adr.md#adr-m01)). 백엔드의 ADR-B14 는 이 ADR 로 대체된다.

**핵심 결정 사항**:

| 항목 | 결정 | 이유 |
|------|------|------|
| 트리거 | `opened` + `/review` 수동 | `synchronize` 제거 — 매 push마다 토큰 소비 방지 |
| 호출 경계 | PR 은 이 저장소 브랜치에서 연 것만. `/review` 는 댓글이 그 명령으로 시작하고 OWNER / MEMBER / COLLABORATOR 가 단 것만. 포크 PR 은 댓글 트리거에서도 첫 단계에서 제외 | 공개 저장소라 누구나 PR 과 댓글을 남길 수 있다. 본문에 `/review` 가 들어 있기만 해도 우리 토큰으로 리뷰가 돌던 것을 막는다 |
| 체크아웃 | `refs/pull/N/head` | 리뷰어가 PR 에서 바뀐 파일과 지침을 Read / Grep 으로 읽는다. `issue_comment` 의 기본 체크아웃은 main 이다 |
| 도구 허용 | Read / Grep / Glob / Agent / Task 와 게시용 Bash(`gh`, `jq`, `mktemp`, `cat`, `rm`)만. Write / Edit 금지 | Agent 가 없으면 거르기 위임이 드러나지 않게 자가검토로 바뀐다. Bash 를 열어 두면 체크아웃한 PR 코드를 실행할 길이 생긴다 |
| 등급 | 🔴 P1 치명 ~ ⚪ P5 참고 다섯 단계. P4 와 P5 는 리뷰당 세 개까지 | 두 단계로는 꼭 고칠 것과 참고할 것 사이가 비었다. 등급은 반영하지 않았을 때 깨지는 것으로 정한다 |
| 거르기 | 수집한 지적의 통과 여부를 서브 에이전트가 판정. 맡기지 못하면 리뷰 본문 끝에 그 사실을 남긴다 | 지적을 만든 쪽이 판정하면 통과시키는 쪽으로 기운다 |
| 위험 라벨 | main 의 `scripts/pr-risk-labels.sh` 하나가 프론트와 백엔드 경로 규칙을 함께 보고 라벨을 달아 프롬프트에 넘긴다. 머지 규칙은 바꾸지 않는다 | LLM 위험 점수는 실행마다 달라 기준이 못 된다. PR head 의 스크립트를 쓰면 PR 이 자기 규칙을 바꿔 피할 수 있다 |
| Review Event | 항상 `COMMENT` (🔴 있어도 차단 안 함) | 리뷰는 권고. 머지 차단은 인간 reviewer 책임. `REQUEST_CHANGES` 사고 회피 |
| 요약 게시 | 인라인과 같은 리뷰의 `body` 로 통합 — `reviews` POST 1회 | 요약과 인라인이 리뷰 단위로 접힘. 일반 댓글로 분리하면 Conversation 탭에서 흩어짐 |
| 리뷰 요청 본문 전달 | `mktemp` 임시 파일 + `--input` | 인자로 직접 쓰면 shell 이 `\n` 을 literal 두 글자로 전달. 체크아웃 밖에 만들어 wrapper 의 `git add -A` 회피 |
| 댓글 정리 | 일반 댓글과 인라인은 DELETE (REST) | minimize 누적 시 PR 스레드 시각 답답. 이력은 GitHub event log 로 충분 |
| 리뷰 정리 | 리뷰 본문만 GraphQL `minimizeComment` (OUTDATED) | 제출된 COMMENT 리뷰는 REST 삭제가 없고 dismiss 도 APPROVED / CHANGES_REQUESTED 에만 가능. 실행당 1개라 누적량이 인라인과 다름 |
| Dummy 댓글 자동 정리 | post-step 에서 `jq` 로 길이, placeholder, 등급 표시(색 원과 P1~P5) 부재를 검사해 삭제 | Claude action 이 자연어 sanity check 무시하고 placeholder 게시하는 사고 (fos-blog PR #114) 강제 차단. 판정을 `jq` 안에서 해야 여러 줄 본문이 `while read` 를 깨뜨리지 않는다 |
| literal `\n` 자동 보정 | post-step bash 로 세 경로 검출 후 perl 교체 — 일반 댓글과 인라인은 comments PATCH, 리뷰 요약은 `reviews/{id}` PUT | Claude action 이 가이드 무시하고 `--field body="...\n..."` 호출 시 literal 두 글자 박힘 (PR #208 사고). 보정 후 정상 줄바꿈 |
| 모델 | opus 리뷰어 (`--model opus` 별칭). 실제 모델 ID 는 실행 기록에서 읽어 Job Summary 에 남긴다 | haiku specialist 는 추론 능력이 떨어져 오탐(false positive) 많고 실제 버그 놓침. 리뷰 신뢰도 > 토큰 절약. `opus` 별칭은 버전업 무수정 추종 |
| action 버전 | `anthropics/claude-code-action@v1` major 태그 | 릴리스마다 다시 고정하지 않는다. #1290 회귀로 걸었던 고정은 같은 설정의 다른 저장소가 `@v1` 로 정상 동작해 풀었다 |
| 실패 원인 기록 | 실행이 `is_error` 로 끝나면 실행 파일의 결과 문구나 마지막 assistant 문구를 500자까지 `::error` 와 Job Summary 에 남긴다 | action 은 `is_error` 만 남겨 사용량 한도와 토큰 오류를 가를 수 없었다. 공개 저장소라 리뷰 본문 전체는 남기지 않는다 |
| allowed_bots | `"*"` | 광범위 허용 — Dependabot/Claude 모두 차단되지 않음. 보안 검증은 리뷰어가 담당 |
| diff 필터 | `frontend/pnpm-lock.yaml`, `*.lock`, `*.snap`, `backend/gradle/wrapper/gradle-wrapper.jar`, `backend/build/`, `*.class` 제외. Flyway SQL 은 제외하지 않는다 | 노이즈 감소. `*` 가 없는 pathspec 은 저장소 루트 기준이라 하위 프로젝트 경로를 붙인다 |
| Job timeout | 15분 | agent hang 시 불필요한 비용 방지 |
| Check Run 수동 등록 | `issue_comment` 트리거 시 수동 생성 | issue_comment workflow run 이 PR Checks 탭에 자동 노출 안 됨 — 수동 Check Run 으로 진행 상태 가시화 |
| 프롬프트 관리 | 공통 본문 `.github/claude-review-prompt-common.txt` 와 점검 목록 `-frontend.txt`, `-backend.txt` 로 외부 분리. 바뀐 경로로 점검 목록을 고르고 둘 다 바뀌면 이어 붙인다. `frontend/`, `backend/` 어느 쪽도 바뀌지 않으면 두 목록을 모두 붙인다. 선택 스크립트 `scripts/review-checklist.sh` 는 보안 경계가 아니라 PR head 의 것을 쓴다. `envsubst` 로 `$PR_NUMBER`·`$REPO`·`$RISK_LABELS`·`$CHECKLIST` 치환 | ~180줄 인라인 heredoc 가독성·diff 정밀도 확보. `.md` 아닌 `.txt` 로 IDE 포맷터의 glob·식별자 깨짐 회피 |
| 소규모 PR 스킵 | 안 함 | 모든 PR 동일 리뷰 |

**대안 기각**:
- `REQUEST_CHANGES` event 유지: PR 머지 버튼 비활성으로 사용자가 매번 dismiss 해야 함 + Reviews 탭 빨간 X 가 시각적으로 부정적. 안전망 가치보다 마찰 비용 큼.
- minimize 유지: PR 스레드에 minimized 블록 누적 → "Show outdated" 토글이 보이고 답답. 이력은 GitHub Activity 탭에서 보존.
- 요약을 `gh pr comment` 일반 댓글로 분리 (2026-09-01 기각): 요약과 인라인이 Conversation 탭에서 흩어지고 등록 호출이 2회로 늘어남. 리뷰 `body` 도 Conversation 탭에 그대로 노출되므로 분리 이유가 없었음.
- 리뷰까지 포함해 전부 minimize: DELETE 결정을 뒤집게 되고 minimized 블록이 누적됨. REST 로 지울 수 없는 리뷰 본문 한 종류에만 예외를 둠.

**요청 본문 전달 강제 (실측 사고)**:
- 리뷰 요청 JSON 은 `mktemp` 로 만든 임시 파일에 담아 `--input` 으로 넘긴다.
- `--field body="...\n..."` 패턴은 shell 이 `\n` 을 literal 두 글자로 전달해 본문 줄바꿈이 깨진다.
- JSON 문자열 안의 `\n` 은 JSON parser 가 해석하므로 정상.
- 임시 파일은 체크아웃 밖에 만든다. action wrapper 의 `git add -A` 가 체크아웃 안 파일을 PR 브랜치 commit 으로 흘려보낸다 (fos-blog PR #83 사고).

---



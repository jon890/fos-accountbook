# Phase 04. 리뷰 워크플로와 위험 라벨을 하나로 합친다

**Execution profile**: standard

## 목표

Claude 코드 리뷰 워크플로를 루트 하나로 두고, 바뀐 경로로 프론트엔드와 백엔드 점검 목록을 골라 리뷰 하나를 게시하게 한다.
위험 라벨 스크립트도 두 경로 규칙을 합친 하나로 둔다.

**범위 외**: 리뷰 정책 자체(트리거, 모델, 등급, 거르기)는 바꾸지 않는다. CI 와 이미지 워크플로는 phase 03 이 맡는다.

## 컨텍스트

- 루트 `.github/workflows/claude-code-review.yml` 은 프론트엔드 것이다. `.github/claude-review-prompt.txt` 를 `envsubst '$PR_NUMBER $REPO $RISK_LABELS'` 로 치환해 쓴다.
    - 위험 라벨은 `git show origin/main:scripts/pr-risk-labels.sh` 를 실행해 얻는다.
- phase 02 이후 백엔드 것은 `backend/.github/workflows/code-review-prompt.txt`, `backend/scripts/pr-risk-labels.sh` 에 있다. 백엔드 워크플로 파일은 phase 03 이 지웠다.
- 프론트엔드 라벨은 `위험:인증`, `위험:권한`, `위험:배포설정`, 백엔드 라벨은 `위험:마이그레이션`, `위험:보안`, `위험:이벤트캐시`, `위험:배포설정` 이다.
- 두 프롬프트는 뼈대(1단계 수집, 2단계 검토와 등급과 거르기, 3단계 게시, 핵심 규칙)가 같지만 내용이 다른 곳이 있다. 프론트엔드 파일은 `.github/claude-review-prompt.txt`, 백엔드 파일은 `backend/.github/workflows/code-review-prompt.txt` 다.
    - 소개 문단(1~4행)과 지침 안내(7~8행, 백엔드는 7~9행)는 하위 프로젝트마다 다르다.
    - diff 필터: 프론트엔드는 `':!pnpm-lock.yaml' ':!*.lock' ':!*.snap'`, 백엔드는 `':!gradle/wrapper/gradle-wrapper.jar' ':!*.lock' ':!build/' ':!*.class'` 이고 백엔드에는 「Flyway SQL 은 리뷰 대상이다」 줄이 더 있다.
    - 등급 표의 P1 정의: 백엔드에는 「금액이 틀린다」, 「마이그레이션이 실패한다」 가 더 있다.
    - 점검 절 이름: 프론트엔드는 「이 저장소에서 특히 볼 것」(목록), 백엔드는 「지침에서 특히 볼 곳」(표)이다.
    - 「위험 라벨」 절: `$RISK_LABELS` 가 든 줄(프론트엔드 117행), 설명 줄(119행), 표(121~125행), 요약 지시(127행)로 되어 있다.
    - 「지적하지 않는 것」: 백엔드에는 Checkstyle 이 잡는 형식과 `docs/` 측정 기록의 모델 이름이 더 있다.
- 프롬프트 렌더 단계(`claude-code-review.yml` 의 「리뷰 프롬프트 렌더」)의 env 에는 `GH_TOKEN` 이 없다. 위험 라벨 단계에는 있다.
- `*` 가 없는 git pathspec 은 저장소 루트 기준으로만 맞는다. `':!pnpm-lock.yaml'` 는 `frontend/pnpm-lock.yaml` 을 빼지 못한다.
- 리뷰 워크플로를 바꾸는 PR 에서는 `claude-code-action` 이 기본 브랜치와 워크플로가 다르다는 이유로 리뷰를 건너뛴다. 이 phase 의 동작은 머지 뒤 첫 PR 에서 확인된다.

**근거 문서**: `docs/adr.md` 의 ADR-M01 「적용 범위」 표의 코드 리뷰 행

phase 01 이후 프론트엔드 ADR 은 `frontend/docs/adr.md` 에 있다. 그 파일의 ADR-F11 「프롬프트 관리」, 「위험 라벨」 행이 이 phase 의 결과를 이미 적고 있다.

## 의도 메모

- 공통 절을 두 파일에 두지 않는다. 공통 본문 하나와 하위 프로젝트별 점검 목록 둘로 나눈다.
- 스크립트 하나로 합칠 때 경로 규칙마다 `frontend/`, `backend/` 를 앞에 붙인다. 라벨 이름은 그대로 두고, 겹치는 `위험:배포설정` 은 한 번만 낸다.
- 워크플로가 main 의 스크립트를 쓰는 규칙은 유지한다. PR 이 자기 규칙을 바꿔 라벨을 피하지 못하게 하려는 것이다.
- 점검 목록 선택은 보안 경계가 아니라 PR head 의 스크립트와 프롬프트 파일을 그대로 쓴다. 선택 로직을 스크립트로 빼는 것은 표본 검사로 검증하려는 것이다.
- `.github/workflows/*` 는 루트에 있으므로 위험 라벨 규칙에서 접두사를 붙이지 않는다.

## 작업 항목

### 1. 프롬프트를 세 파일로 나눈다

`.github/claude-review-prompt.txt` 를 `.github/claude-review-prompt-common.txt` 로 `git mv` 하고 아래대로 고친다. 적지 않은 절은 프론트엔드 판을 그대로 둔다.

| 자리 | 공통 본문에 둘 것 |
| --- | --- |
| 소개 문단(1~4행) | 가족 가계부 저장소이고 루트 아래 `frontend/`(Next.js 16 App Router, TypeScript, NextAuth v5, Tailwind CSS v4, Shadcn, Jest)와 `backend/`(Spring Boot 4, Java 21, JPA, QueryDSL, JWT, Flyway, Checkstyle)가 있다. 프론트엔드는 Server Action 을 거쳐 백엔드 API 를 부른다 |
| 지침 안내(7~8행) | 점검 기준은 루트 `CLAUDE.md` 와 루트 `docs/adr.md`(ADR-M), 그리고 바뀐 하위 프로젝트의 `CLAUDE.md` 와 `docs/` 가 소유한다. 하위 프로젝트별 문서는 아래 점검 목록이 가리킨다 |
| diff 필터 | `gh pr diff $PR_NUMBER --repo $REPO -- ':!frontend/pnpm-lock.yaml' ':!*.lock' ':!*.snap' ':!backend/gradle/wrapper/gradle-wrapper.jar' ':!backend/build/' ':!*.class'` 와 그 아래 「Flyway SQL 은 리뷰 대상이다. 걸러내지 않는다.」 한 줄 |
| 2단계 첫 문단 | 「아래 「이 저장소에서 특히 볼 것」」 을 「아래 하위 프로젝트 점검 목록」 으로 바꾼다 |
| FINDING 예시와 jq 예시의 path | `frontend/src/components/foo.tsx` |
| 등급 표 P1 | 동작이 틀린다, 금액이 틀린다, 다른 가족의 자료나 비밀이 샌다, 빌드나 기동이나 마이그레이션이 실패한다, 데이터를 잃는다 |
| 「이 저장소에서 특히 볼 것」 절 | 절 전체를 지우고 그 자리에 `${CHECKLIST}` 한 줄만 둔다 |
| 「위험 라벨」 절 | `$RISK_LABELS` 가 든 줄, 설명 줄, 요약 지시 줄은 남긴다. 표만 빼고 그 자리에 「라벨마다 더 볼 것은 위 점검 목록의 「위험 라벨별로 더 볼 것」 표가 정한다.」 한 줄을 둔다 |
| 「지적하지 않는 것」 | 프론트엔드 세 항목에 백엔드 두 항목을 합친다: 「동작에 영향이 없는 표기 정렬. 백엔드는 Checkstyle 이 잡는 형식도」, 「`backend/docs/` 의 측정 기록에 적힌 실제 모델 이름. 측정 사실이다」 |

점검 목록 두 파일을 새로 만든다. 각 파일은 공통 본문의 `${CHECKLIST}` 자리에 들어가므로 `###` 절 하나로 시작한다.

- `.github/claude-review-prompt-frontend.txt`
    - `### 프론트엔드에서 특히 볼 것 (frontend/)` 제목 아래에 프론트엔드 지침 안내 두 줄을 둔다. 경로는 `frontend/CLAUDE.md`, `frontend/docs/adr.md`, `frontend/docs/code-architecture.md`, `frontend/docs/data-schema.md` 로 쓴다.
    - 이어서 프론트엔드 「이 저장소에서 특히 볼 것」 본문을 옮긴다. 본문의 `docs/data-schema.md` 같은 경로는 `frontend/` 를 붙인다.
    - 끝에 `#### 위험 라벨별로 더 볼 것` 제목과 프론트엔드 위험 라벨 표(`위험:인증`, `위험:권한`, `위험:배포설정`)를 둔다.
- `.github/claude-review-prompt-backend.txt`
    - `### 백엔드 지침에서 특히 볼 곳 (backend/)` 제목 아래에 백엔드 지침 안내 세 줄(원본 7~9행)을 둔다. 경로는 `backend/CLAUDE.md`, `backend/docs/`, `backend/docs/adr.md` 로 쓴다.
    - 이어서 백엔드 「지침에서 특히 볼 곳」 표를 옮긴다. 표 안의 `docs/code-architecture.md`, `docs/testing-strategy.md` 는 `backend/` 를 붙인다.
    - 끝에 `#### 위험 라벨별로 더 볼 것` 제목과 백엔드 위험 라벨 표(`위험:마이그레이션`, `위험:보안`, `위험:이벤트캐시`, `위험:배포설정`)를 둔다.
- `backend/.github/workflows/code-review-prompt.txt` 를 지운다.
- 두 점검 목록에는 `$` 로 시작하는 envsubst 변수를 두지 않는다. envsubst 는 한 번만 치환하므로 점검 목록 안의 변수는 글자 그대로 남는다.

### 2. 점검 목록 선택 스크립트와 워크플로

- `scripts/review-checklist.sh` 를 만든다. 바뀐 경로를 한 줄에 하나씩 받아 고를 점검 목록 이름을 한 줄에 하나씩 낸다.
    - `frontend/` 로 시작하는 경로가 있으면 `frontend`, `backend/` 로 시작하는 경로가 있으면 `backend` 를 이 순서로 낸다.
    - 둘 다 없으면 `frontend` 와 `backend` 를 모두 낸다.
- `.github/workflows/claude-code-review.yml` 의 「리뷰 프롬프트 렌더」 단계를 고친다.
    - env 에 `GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}` 을 더한다.
    - `gh pr diff "$PR_NUMBER" --repo "$REPO" --name-only | bash scripts/review-checklist.sh` 로 이름을 얻고, 이름마다 `.github/claude-review-prompt-<이름>.txt` 를 빈 줄로 이어 붙여 `CHECKLIST` 로 export 한다.
    - `envsubst '$PR_NUMBER $REPO $RISK_LABELS $CHECKLIST' < .github/claude-review-prompt-common.txt` 로 렌더한다. 이 단계 위의 주석도 네 변수로 고친다.

### 3. 위험 라벨 스크립트를 합친다

- 루트 `scripts/pr-risk-labels.sh` 에 백엔드 규칙을 합친다. 프론트엔드 경로에는 `frontend/`, 백엔드 경로에는 `backend/` 를 앞에 붙인다.
    - `.github/workflows/*` 는 예외다. 루트 경로 그대로 `위험:배포설정` 으로 둔다.
    - 백엔드의 `src=src/main/java/com/bifos/accountbook` 변수는 `backend/` 를 붙인 값으로 둔다.
    - 라벨 출력 순서는 `위험:인증`, `위험:권한`, `위험:마이그레이션`, `위험:보안`, `위험:이벤트캐시`, `위험:배포설정` 이다. `위험:배포설정` 은 한 번만 낸다.
- `backend/scripts/pr-risk-labels.sh` 를 지운다. `backend/scripts/` 가 비면 디렉터리도 없어진다.

### 4. 두 스크립트의 표본 검사

`scripts/test-pr-risk-labels.sh` 와 `scripts/test-review-checklist.sh` 를 만든다. 표본마다 스크립트 출력과 기대 출력을 비교하고, 하나라도 다르면 어느 표본이 무엇을 냈는지 출력하고 종료 코드 1 로 끝난다.

위험 라벨 표본이다.

| 입력 경로 | 기대 라벨 |
| --- | --- |
| `frontend/src/components/ui/button.tsx` | 없음 |
| `frontend/src/actions/expense/create-expense-action.ts` | `위험:권한` |
| `frontend/src/proxy.ts` | `위험:인증` |
| `backend/src/main/resources/db/migration/V1__init.sql` | `위험:마이그레이션` |
| `backend/src/main/java/com/bifos/accountbook/config/SecurityConfig.java` | `위험:보안` |
| `frontend/Dockerfile` 와 `backend/Dockerfile` 을 함께 | `위험:배포설정` 한 줄 |
| `.github/workflows/frontend-ci.yml` | `위험:배포설정` |
| `src/proxy.ts` (접두사 없는 옛 경로) | 없음 |
| `docs/adr.md` | 없음 |

점검 목록 표본이다.

| 입력 경로 | 기대 출력 |
| --- | --- |
| `frontend/src/proxy.ts` | `frontend` |
| `backend/build.gradle.kts` | `backend` |
| `frontend/package.json` 와 `backend/build.gradle.kts` 를 함께 | `frontend`, `backend` 두 줄 |
| `docs/adr.md` | `frontend`, `backend` 두 줄 |
| 빈 입력 | `frontend`, `backend` 두 줄 |

## 검증

```bash
# cwd: <worktree root>
bash scripts/test-pr-risk-labels.sh
bash scripts/test-review-checklist.sh
actionlint .github/workflows/claude-code-review.yml
test ! -e backend/.github && test ! -e backend/scripts/pr-risk-labels.sh
grep -q 'GH_TOKEN' <(sed -n '/리뷰 프롬프트 렌더/,/Claude 코드 리뷰 실행/p' .github/workflows/claude-code-review.yml)
grep -q "':!frontend/pnpm-lock.yaml'" .github/claude-review-prompt-common.txt
test "$(grep -c 'CHECKLIST' .github/claude-review-prompt-common.txt)" -ge 1
! grep -qE '\$[A-Za-z_{]' .github/claude-review-prompt-frontend.txt .github/claude-review-prompt-backend.txt   # 점검 목록에 envsubst 변수가 없다
render() { PR_NUMBER=1 REPO=a/b RISK_LABELS=없음 CHECKLIST="$1" envsubst '$PR_NUMBER $REPO $RISK_LABELS $CHECKLIST' < .github/claude-review-prompt-common.txt; }
BOTH="$(cat .github/claude-review-prompt-frontend.txt; echo; cat .github/claude-review-prompt-backend.txt)"
render "$(cat .github/claude-review-prompt-frontend.txt)" | grep -q 'ADR-F25'
render "$(cat .github/claude-review-prompt-backend.txt)" | grep -q 'ADR-B09'
! render "$BOTH" | grep -qF '$RISK_LABELS'      # 변수가 글자 그대로 남지 않는다
! render "$BOTH" | grep -qF '${CHECKLIST}'
test "$(render "$BOTH" | grep -c '위험 라벨: 없음')" -ge 1
```

모두 종료 코드 0 이어야 한다. `actionlint` 는 info 수준(SC2016, SC2086, SC2028) 외의 오류가 없어야 한다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `.github/claude-review-prompt.txt` | 삭제 (common 으로 이동) |
| `.github/claude-review-prompt-common.txt` | 신규 |
| `.github/claude-review-prompt-frontend.txt` | 신규 |
| `.github/claude-review-prompt-backend.txt` | 신규 |
| `.github/workflows/claude-code-review.yml` | 수정 |
| `backend/.github/workflows/code-review-prompt.txt` | 삭제 |
| `scripts/pr-risk-labels.sh` | 수정 |
| `scripts/review-checklist.sh` | 신규 |
| `scripts/test-pr-risk-labels.sh` | 신규 |
| `scripts/test-review-checklist.sh` | 신규 |
| `backend/scripts/pr-risk-labels.sh` | 삭제 |

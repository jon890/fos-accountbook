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
- 두 프롬프트 모두 「이 저장소에서 특히 볼 것」 절과 「위험 라벨」 표를 가진다. 나머지 절(등급, 거르기, 게시 형식, 핵심 규칙)은 같은 내용이다.
- 리뷰 워크플로를 바꾸는 PR 에서는 `claude-code-action` 이 기본 브랜치와 워크플로가 다르다는 이유로 리뷰를 건너뛴다. 이 phase 의 동작은 머지 뒤 첫 PR 에서 확인된다.

**근거 문서**: `docs/adr.md` 의 ADR-M01 「적용 범위」 표의 코드 리뷰 행

phase 01 이후 프론트엔드 ADR 은 `frontend/docs/adr.md` 에 있다. 그 파일의 ADR-F11 「프롬프트 관리」, 「위험 라벨」 행이 이 phase 의 결과를 이미 적고 있다.

## 의도 메모

- 공통 절을 두 파일에 두지 않는다. 공통 본문 하나와 하위 프로젝트별 점검 목록 둘로 나눈다.
- 스크립트 하나로 합칠 때 경로 규칙마다 `frontend/`, `backend/` 를 앞에 붙인다. 라벨 이름은 그대로 두고, 겹치는 `위험:배포설정` 은 한 번만 낸다.
- 워크플로가 main 의 스크립트를 쓰는 규칙은 유지한다. PR 이 자기 규칙을 바꿔 라벨을 피하지 못하게 하려는 것이다.

## 작업 항목

### 1. 프롬프트를 세 파일로 나눈다

- `.github/claude-review-prompt.txt` 를 `.github/claude-review-prompt-common.txt` 로 `git mv` 하고 「이 저장소에서 특히 볼 것」 절과 「위험 라벨」 표를 뺀다. 그 자리에 `${CHECKLIST}` 한 줄을 둔다.
- 뺀 프론트엔드 절과 표를 `.github/claude-review-prompt-frontend.txt` 로 둔다. 경로 예시는 `frontend/src/...` 로 고친다.
- `backend/.github/workflows/code-review-prompt.txt` 에서 같은 두 부분만 떼어 `.github/claude-review-prompt-backend.txt` 로 두고, 원본 파일은 지운다.
- 공통 본문의 저장소 소개 문단을 모노레포에 맞게 고친다: 루트 아래 `frontend/`(Next.js)와 `backend/`(Spring Boot)가 있다.

### 2. 워크플로가 경로로 점검 목록을 고른다

`.github/workflows/claude-code-review.yml` 의 프롬프트 준비 단계를 고친다.

- `gh pr diff --name-only` 결과에 `frontend/` 로 시작하는 경로가 있으면 frontend 목록을, `backend/` 로 시작하는 경로가 있으면 backend 목록을 `CHECKLIST` 에 이어 붙인다. 둘 다 없으면 두 목록을 모두 붙인다.
- `envsubst '$PR_NUMBER $REPO $RISK_LABELS $CHECKLIST'` 로 공통 본문을 치환한다.
- diff 필터 제외 목록에 `*.lock`, `pnpm-lock.yaml` 외에 `gradle.lockfile` 이 있으면 유지한다.

### 3. 위험 라벨 스크립트를 합친다

- 루트 `scripts/pr-risk-labels.sh` 에 백엔드 규칙을 합친다. 프론트엔드 경로에는 `frontend/`, 백엔드 경로에는 `backend/` 를 앞에 붙인다.
- `backend/scripts/pr-risk-labels.sh` 를 지운다. `backend/scripts/` 가 비면 디렉터리도 없어진다.

### 4. 위험 라벨 스크립트 표본 검사

아래 표본을 스크립트에 넣어 기대 출력과 같은지 확인하는 `scripts/test-pr-risk-labels.sh` 를 만든다. 하나라도 다르면 종료 코드 1 로 끝나야 한다.

| 입력 경로 | 기대 라벨 |
| --- | --- |
| `frontend/src/components/ui/button.tsx` | 없음 |
| `frontend/src/actions/expense/create-expense-action.ts` | `위험:권한` |
| `frontend/src/proxy.ts` | `위험:인증` |
| `backend/src/main/resources/db/migration/V1__init.sql` | `위험:마이그레이션` |
| `backend/src/main/java/com/bifos/accountbook/config/SecurityConfig.java` | `위험:보안` |
| `frontend/Dockerfile` 와 `backend/Dockerfile` 을 함께 | `위험:배포설정` 한 줄 |
| `docs/adr.md` | 없음 |

## 검증

```bash
# cwd: <worktree root>
bash scripts/test-pr-risk-labels.sh
actionlint .github/workflows/claude-code-review.yml
test ! -e backend/.github && test ! -e backend/scripts/pr-risk-labels.sh
grep -c 'CHECKLIST' .github/claude-review-prompt-common.txt        # 1 이상
PR_NUMBER=1 REPO=a/b RISK_LABELS=없음 CHECKLIST="$(cat .github/claude-review-prompt-frontend.txt)" \
  envsubst '$PR_NUMBER $REPO $RISK_LABELS $CHECKLIST' < .github/claude-review-prompt-common.txt | grep -c 'ADR-F25'   # 1 이상
```

- `test-pr-risk-labels.sh` 는 종료 코드 0 이어야 한다.
- `actionlint` 는 info 수준(SC2016, SC2086, SC2028) 외의 오류가 없어야 한다.

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
| `scripts/test-pr-risk-labels.sh` | 신규 |
| `backend/scripts/pr-risk-labels.sh` | 삭제 |

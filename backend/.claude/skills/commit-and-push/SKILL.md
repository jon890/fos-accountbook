# Commit, Push & PR Agent (workflow)

This document defines the **standard workflow** for an agent that performs `git commit`, `git push`, and optionally `gh pr create`.
Primary goals: **safety** (no leaks, no destructive ops) and **user control** (explicit approvals).

## Commands (signals to inspect first)

```bash
git status --porcelain
git diff
git diff --staged
git log -5 --oneline
git branch --show-current
```

If the repo has a standard test/lint command, run it before proposing a commit:

```bash
./gradlew checkstyleMain checkstyleTest  # Checkstyle first (fast)
./gradlew test                            # Then tests
```

## Expected user input (if available)

- **Scope**: what should be included/excluded
- **Test command**: e.g. `./gradlew test`
- **Push target**: remote + branch (e.g. `origin feature/foo`)
- **PR**: whether to create a PR after push (default: ask after push)
- **Commit style**: any existing convention (optional)

If missing, infer from repo defaults, but keep actions conservative.

## Standard workflow

### 0) Safety precheck

- Inspect changes (`git status`, `git diff`, `git diff --staged`)
- Check recent history (`git log -5 --oneline`) to match message style
- Flag risky files (examples): `.env`, `*.pem`, `id_rsa`, `credentials.*`, `secrets.*`, large binaries
  - If suspicious: **stop** and ask the user what to do (do not commit/push).

### 1) Verify (lint + test gate)

- Run checkstyle first (default: `./gradlew checkstyleMain checkstyleTest`) - it's fast and catches style issues early.
- Run the test command (default: `./gradlew test`) unless the user explicitly asks to skip.
- If the change is **documentation only** (e.g. only `.md` files changed), skip checkstyle and tests.
- If checkstyle or tests fail: summarize failure + propose a fix; do not proceed to commit.

### 2) Propose a staging plan

- Prefer **small, single-purpose** commits (split by concern: feature/test/docs/config).
- List exactly what will be staged.

### 3) Draft a commit message

- 1–2 sentences, focus on _why_.
- Provide 1 best candidate (optionally 1 alternative).

### 4) Ask for explicit commit approval (required)

Share the following in a single approval request — do NOT ask for commit and push approval separately unless the user asks:

- staged file list (planned)
- final commit message
- exact commands you will run (`git add ...`, `git commit ...`, `git push ...`)
- whether PR will be created after push (if applicable)

Do not run `git commit` until the user approves.

### 5) Commit

- Stage only the approved files
- Commit with the approved message
- Show `git status --porcelain` after commit

### 6) Push

- Push to the approved remote/branch
- Use `-u origin <branch>` if tracking is not yet set

### 7) PR creation (if applicable)

After push, determine if a PR should be created:

- **Skip PR if**: pushing to `main`/`master` directly, or user explicitly said no PR
- **Auto-create PR if**: user asked for it, or branch is a feature/fix/chore branch with an associated issue
- **Ask if unclear**: "브랜치가 PR 대상인가요? PR을 생성할까요?"

When creating a PR:

1. Inspect the full diff vs base branch: `git diff <base>...HEAD`
2. Check recent commits on the branch: `git log <base>...HEAD --oneline`
3. Look for related issue numbers in branch name or commit messages (e.g. `feat/issue-42` → closes #42)
4. Draft PR title and body

**PR body format:**

```markdown
## Summary

- <bullet points of what changed and why>

## Related Issues

closes #<issue number>  ← include only if confirmed

## Test plan

- [ ] <how to verify the change>

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

5. Show the draft title + body to the user for approval before running `gh pr create`
6. Run `gh pr create` with the approved content
7. Return the PR URL

## Boundaries (hard rules)

- Never commit or push without **explicit user approval**.
- Never force push (`--force`, `--force-with-lease`) unless explicitly requested.
- Never disable hooks (`--no-verify`) unless explicitly requested.
- Avoid interactive git commands (`git add -i`, `git rebase -i`) in non-interactive environments.
- Do not commit secrets or generated/build outputs.
- **One approval request per workflow** — combine commit + push + PR proposal into a single ask, not three separate asks, unless the user requests step-by-step control.

## Approval request template

Present this as a single block before running anything:

---

**커밋 & 푸시 & PR 생성 계획**

- **Stage할 파일:**
  - `file1.java`
  - `file2.java`
- **커밋 메시지:** `feat: ...`
- **푸시 대상:** `origin feature/foo`
- **PR 생성:** 예 / 아니오 (기본 브랜치: `main`)
  - 제목: `...`
  - 연관 이슈: closes #XX

OK to run?
```bash
git add file1.java file2.java
git commit -m "feat: ..."
git push -u origin feature/foo
gh pr create --title "..." --body "..."
```

---

## Post-completion

After everything is done, share:
- Commit SHA
- PR URL (if created)
- Any warnings or notes for follow-up

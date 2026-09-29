# Common Pitfalls — fos-accountbook

## 이 문서 쓰는 법

함정은 두 가지로 나뉜다.

- **자동 검출형** — `auto-gate:` 값이 있는 항목. 빌드·lint·타입 게이트가 자동으로 막는다. 별도 self-check 불필요.
- **판단형** — `auto-gate: —` 인 항목. 설계·UX·권한 판단이 필요하다. **아래 인덱스 표에서 작업 종류에 해당하는 항목만 골라 읽는다.**

전체를 매번 통독하지 않는다. 인덱스로 필요한 항목만 참조한다.

## 통제 어휘 (domain 키 목록)

phase 프런트매터의 `**Domain**:` 태그와 아래 인덱스 표의 작업종류 키, 각 함정의 `trigger:` 태그가 **같은 어휘를 써야** 매핑이 성립한다.

| domain 키 | 대상 작업 |
|---|---|
| `markdown-write` | markdown / task 문서 작성 |
| `color-token` | 색 토큰 / Tailwind 스타일 작성 |
| `app-router` | App Router 경계 / 컴포넌트 / revalidatePath |
| `server-action` | Server Action 작성 (현재 연결 함정: CLAUDE.md ADR 참조) |

## 작업종류→함정 인덱스

| 작업 종류 | 봐야 할 함정 | 자동 점검 |
|---|---|---|
| markdown/task 문서 작성 | CODE-3 | `pnpm lint:md` |
| 색 토큰 / Tailwind 스타일 | CODE-1, CODE-2 | — |
| Server Action 작성 | CLAUDE.md ADR-F25, ADR-F06 참조 | — |
| App Router 경계 / 컴포넌트 | CODE-4, CODE-5, CODE-6 | — |

plan 작성과 팀 운영의 반복 함정은 공용 코어(`planning`, `build-with-teams`)의 검증기와 reference 가 소유한다.

## 축적 규칙

- 새로운 사고 타입 발견 시 해당 섹션에 **패턴 한 줄 + 실측 명령 + self-check** 추가
- 함정 추가 시 인덱스 표에도 해당 행을 갱신한다 (단일 소스: trigger 태그가 진실, 인덱스는 그 뷰)
- 같은 사고 재발 시 패턴 강화 (예시 / 체크 엄격화)
- "왜 이 가드가 필요한지" 1줄 단서는 반드시 — 미래 AI 가 의도 모르고 우회하지 않도록
- 사고 사례 (plan###) 는 1개로 충분, 복수 나열 금지

---

## 코드 패턴 함정

`review-fix` 가 PR 리뷰 댓글 처리 후 재발 가능 패턴을 누적하는 자리.
같은 지적이 다음 PR 에서 반복되지 않도록 도메인 코드 작성 시에도 참조한다.

### CODE-1 · trigger: color-token · auto-gate: —

CSS custom property 키는 as CSSProperties 단언 필요 (PR #81)

- **증상**: `style={{ "--my-var": value }}` 가 `Properties<>` 인덱스에 없는 키라 type-check 실패 (TS2353).
- **Good**: `as CSSProperties` 단언은 그대로 유지. 단 값 부분에 number 직접 넣지 말고 `String(num)` 명시 변환으로 의도 명확화.
- **Why**: claude bot 이 "단언 제거" 권장하기 쉽지만 custom property 키 자체가 단언 원인이라 제거 불가. 값 변환만이 의미 있다.

### CODE-2 · trigger: color-token · auto-gate: —

inline style vs Tailwind arbitrary class (PR #81)

- **증상**: 토큰 var() 적용에 `style={{ color: "var(--token)" }}` 사용.
- **Good**: 단일 색상 / 크기 / 길이 토큰은 `className="text-[var(--token)]"` arbitrary class (프로젝트 관례). 다중 CSS property 또는 동적 계산 필요할 때만 inline style.
- **예외**: SVG presentation attribute var() 미해결 우회 같은 경우 inline style 정당.

### CODE-3 · trigger: markdown-write · auto-gate: md-lint

JSDoc/TSDoc 코멘트에 Tailwind 클래스 패턴 금지 (PR #94 관측)

- **증상**: Tailwind v4 의 content scanner 가 `.ts`/`.tsx` 코멘트뿐 아니라 `frontend/` 아래 `docs/`·`.claude/skills/` 의 `.md` 파일까지 클래스 후보로 추출. arbitrary value 안에 와일드카드나 중괄호가 포함된 패턴이 layer utilities 에 invalid CSS 를 생성 → `Unexpected token` parse error → 모든 페이지 500.
- **Good**: 클래스 패턴을 prose 로 표현 (예: "color-cat 토큰 (canonical key 별)"). 코드 예시가 필요하면 `text-[var(--color-cat-KEY)] 형태` 처럼 placeholder(KEY) 로 쓴다.
- **검출**: 닫힌 `[...]` arbitrary 값 안에 와일드카드나 중괄호가 든 경우 위험 — `pnpm lint:md`(`scripts/check-tailwind-md.mjs`)가 CI 에서 자동 차단 (ADR-F29).
- **Why**: 한 번 발생하면 dev 서버가 통째로 다운된다. `@source not` 안전망은 Turbopack(Next 16 dev)에서 미작동이라(2026-06 실측) 쓰지 않고, 패턴을 안전 표기로 바꾸는 lint 게이트가 유일한 확실한 차단이다.

### CODE-4 · trigger: app-router · auto-gate: —

App Router 경계 위반

- **증상**: `actions/` 가 `lib/server/api` 거치지 않고 `fetch` 직접 호출. `services/` 가 `revalidatePath` / `requireAuth` 호출.
- **Good**: 레이어 규칙 준수 — `actions/` → `services/` → `lib/server/api`.
- **검출**: `grep -nE 'fetch\(' src/actions/` — lib/server/api 경유 없이 직접 fetch 있으면 의심.
- **Why**: 레이어 경계 위반이 누적되면 인증 / 검증 우회 가능성이 생긴다.

### CODE-5 · trigger: app-router · auto-gate: —

Shadcn 우회

- **증상**: native `<button>` / `<select>` / `<dialog>` 직접 사용. 인라인 overlay 모달이 `Dialog` / `AlertDialog` 대신 `<div>`.
- **Good**: `src/components/ui/` 의 Shadcn 컴포넌트 우선 사용.
- **검출**: `grep -nE '<button|<select|<dialog' src/components/` — Shadcn 대체 없이 native 태그 직접 쓰면 의심.
- **Why**: Shadcn 접근성 / 키보드 내비게이션 / 테마 통합이 native 직접 사용 시 무력화된다.

### CODE-6 · trigger: app-router · auto-gate: —

revalidatePath 누락

- **증상**: write Server Action 데이터 변경 후 `revalidatePath` 누락 → stale UI.
- **Good**: 데이터를 변경하는 모든 Server Action 끝에 `revalidatePath` 호출.
- **검출**: `grep -rn 'revalidatePath' src/actions/` — write action 수 대비 revalidatePath 호출 수 점검.
- **Why**: Next.js App Router 캐시가 갱신되지 않아 사용자에게 이전 데이터가 노출된다.

## 코드 패턴 누적 규칙

- `review-fix` 의 학습 누적 단계에서 추출해 코드 패턴 섹션에 추가한다
- ✅ 재현 가능 패턴 — 같은 실수가 다른 코드에서도 발생 가능. 명령으로 검출 가능
- ❌ 1회성 / 특정 plan 컨텍스트에서만 의미 / 칭찬 / 단순 확인 요청

---

fos-accountbook 전용. 다른 레포는 각자 common-pitfalls 유지.

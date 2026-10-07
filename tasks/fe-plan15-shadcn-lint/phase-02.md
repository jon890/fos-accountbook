# Phase 02. 동적 className 을 정적으로 바꾸고 require-static-classes 켜기

**Execution profile**: standard
**Domain**: color-token

## 목표

컴포넌트에 넘기는 className 을 변수로 조립하던 6곳을 lint 가 읽을 수 있는 정적 형태로 바꾸고 `shadcn/require-static-classes` 를 `error` 로 켠다.
변수로 조립한 className 은 다른 `shadcn/*` 규칙도 검사하지 못하므로, 뒤 단계 규칙이 이 자리를 보게 하려는 것이다.

**범위 외**: 이 6곳의 클래스 값 자체(`bg-[var(--color-cat-food-bg)]` 같은 임의 값)는 바꾸지 않는다. ADR-F43 정리 순서 4번이 맡는다.

## 컨텍스트

**근거 문서**: `frontend/docs/adr/ADR-F43-design-lint-ratchet.md`.
- phase 01 이 `frontend/eslint.config.mjs` 에 `files: ["src/**/*.{ts,tsx}"]` 인 `shadcn` 플러그인 블록을 만들었다. 이 phase 는 그 블록의 `rules` 에 규칙 하나를 더한다.
- 2026-10-07 에 미리 확인한 결과, 플러그인은 아래 형태를 읽는다.
  - 문자열 리터럴, `cn(...)` 안의 문자열, `cn(...)` 안의 조건 객체 `{ "클래스": 조건 }`
  - 컴포넌트 자신의 파일에 있는 `cva` 변형
- 아래 형태는 읽지 못해 `require-static-classes` 에 걸린다.
  - `cn(buttonVariants({ variant: "destructive" }))` 처럼 다른 파일의 `cva` 를 부른 결과
  - `let` 변수에 담아 바꾼 문자열
  - `TONE_CLASS[toneKey].bg` 같은 객체 조회
  - 호출하는 파일에 둔 `cva`
- 위반 6곳:
  - `frontend/src/app/(authenticated)/categories/_components/DeleteCategoryDialog.tsx` 의 `<AlertDialogAction className={cn(buttonVariants({ variant: "destructive" }))}>`
  - `frontend/src/components/transactions/dialogs/EditTransactionDialog.tsx` 의 `<AlertDialogAction className={buttonVariants({ variant: "destructive" })}>`
  - `frontend/src/components/transactions/dialogs/AddTransactionDialog.tsx` 와 `EditTransactionDialog.tsx` 의 `<SubmitButton className={cn("flex-1 hover:opacity-90", ctaGradient)}>`. `ctaGradient` 는 `activeType` 에 따라 `let` 으로 바뀐다
  - `frontend/src/components/expenses/forms/CategoryGrid.tsx` 의 `<Button className={cn(..., isSelected ? cn(tone.bg, tone.border) : ...)}>` 2건

## 의도 메모

- `AlertDialogAction` 에 `variant` prop 을 더한다. shadcn 최신 alert-dialog 와 같은 방식이고 호출하는 쪽이 `buttonVariants` 를 직접 부르지 않게 된다.
- 호출하는 파일에 `cva` 를 두는 방식은 기각했다. 플러그인이 컴포넌트 자신의 파일에 있는 `cva` 만 읽는다(2026-10-07 시험).

## 작업 항목

### 1. `frontend/src/components/ui/alert-dialog.tsx` 의 `AlertDialogAction` 에 `variant` 추가

props 타입을 `React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action> & Pick<VariantProps<typeof buttonVariants>, "variant">` 로 바꾸고 `className={cn(buttonVariants({ variant }), className)}` 로 넘긴다.
`VariantProps` 는 `class-variance-authority` 에서 가져온다. `variant` 를 넘기지 않으면 지금과 같은 기본 버튼이다.
이 동작을 `frontend/src/__tests__/components/ui/alert-dialog.test.tsx` 에서 확인한다.
열린 `AlertDialog` 안에서 `variant="destructive"` 인 `AlertDialogAction` 의 className 에 `buttonVariants({ variant: "destructive" })` 의 클래스가 들어 있는지 본다.
`variant` 가 없을 때는 `buttonVariants()` 기본 클래스인지 본다.

### 2. 삭제 확인 버튼 2곳을 `variant="destructive"` 로 교체

`DeleteCategoryDialog.tsx` 와 `EditTransactionDialog.tsx` 의 `AlertDialogAction` 에서 `className={...buttonVariants...}` 를 지우고 `variant="destructive"` 를 준다.
쓰지 않게 된 `buttonVariants`, `cn` import 는 지운다.

### 3. 거래 다이얼로그의 CTA 색을 조건 객체로 교체

`AddTransactionDialog.tsx` 와 `EditTransactionDialog.tsx` 에서 `let ctaGradient` 와 그것을 바꾸는 대입을 지운다.
`SubmitButton` 의 className 을 아래처럼 바꾼다. `ctaLabel` 과 다른 분기는 그대로 둔다.

```tsx
className={cn("flex-1 hover:opacity-90", {
  "gradient-expense text-expense-fg": activeType === "expense",
  "gradient-income text-income-fg": activeType === "income",
  "gradient-primary text-brand-fg": activeType !== "expense" && activeType !== "income",
})}
```

기존 `frontend/src/__tests__/components/transactions/dialogs/AddTransactionDialog.test.tsx` 와 `EditTransactionDialog.test.tsx` 가 통과해야 한다.
두 테스트는 지금 CTA 클래스를 단언하지 않는다. `AddTransactionDialog.test.tsx` 에 지출 탭의 제출 버튼이 `gradient-expense` 를, 수입 탭의 제출 버튼이 `gradient-income` 을 갖는지 보는 단언을 더한다.

### 4. `CategoryGrid.tsx` 의 선택 색을 조건 객체로 교체

`TONE_CLASS` 에서 `bg`, `border` 를 빼고 `text` 만 남긴다. 아이콘 아래 이름 `span` 은 컴포넌트가 아니라 이 규칙 대상이 아니다.
`Button` 의 className 에서 `isSelected ? cn(tone.bg, tone.border) : "bg-bg border-border hover:bg-bg-muted"` 를 아래 형태로 바꾼다. 10개 tone 키(`food`, `cafe`, `transit`, `telecom`, `home`, `shopping`, `health`, `leisure`, `education`, `etc`)를 모두 적는다. 클래스 값은 지금 `TONE_CLASS` 의 `bg` 와 `border` 를 그대로 옮긴다.

```tsx
isSelected
  ? {
      "bg-[var(--color-cat-food-bg)] border-[var(--color-cat-food-fg)]": toneKey === "food",
      // 나머지 9개 tone
    }
  : "bg-bg border-border hover:bg-bg-muted",
```

기존 `frontend/src/__tests__/components/expenses/CategoryGrid.test.tsx` 의 `food`, `etc` 선택 색 단언이 그대로 통과해야 한다.

### 5. 규칙 켜기와 lint 테스트 추가

`frontend/eslint.config.mjs` 의 `shadcn` 블록 `rules` 에 `"shadcn/require-static-classes": "error"` 를 더한다.
`frontend/src/__tests__/lint/design-lint.test.ts` 의 lint 소스에 아래 줄을 더하고 기대를 단언한다.
버튼은 `import { Button } from "@/components/ui/button";` 을 소스 첫 줄에 더해 쓴다. 줄 번호가 밀리면 기존 단언도 함께 고친다.

| 소스 | 기대 |
| --- | --- |
| `const tones = { a: "bg-bg" }; export const E = ({ k }: { k: "a" }) => <Button className={tones[k]} />;` | `shadcn/require-static-classes` |
| `export const F = ({ on }: { on: boolean }) => <Button className={cn("flex-1", { "bg-bg": on })} />;` | `shadcn/*` 없음. `cn` 은 `@/lib/client/utils` 에서 가져온다 |

## 검증

```bash
cd frontend && pnpm test -- src/__tests__/lint src/__tests__/components/ui/alert-dialog.test.tsx src/__tests__/components/expenses/CategoryGrid.test.tsx src/__tests__/components/transactions/dialogs
cd frontend && pnpm tsc --noEmit && pnpm lint && pnpm lint:md && pnpm test
cd frontend && pnpm test:browser
! git grep -n "ctaGradient" -- frontend/src/components
```

- `pnpm lint` 는 종료 코드 0 이어야 한다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `frontend/src/components/ui/alert-dialog.tsx` | 수정 |
| `frontend/src/__tests__/components/ui/alert-dialog.test.tsx` | 신규 |
| `frontend/src/app/(authenticated)/categories/_components/DeleteCategoryDialog.tsx` | 수정 |
| `frontend/src/components/transactions/dialogs/AddTransactionDialog.tsx` | 수정 |
| `frontend/src/components/transactions/dialogs/EditTransactionDialog.tsx` | 수정 |
| `frontend/src/__tests__/components/transactions/dialogs/AddTransactionDialog.test.tsx` | 수정 |
| `frontend/src/components/expenses/forms/CategoryGrid.tsx` | 수정 |
| `frontend/eslint.config.mjs` | 수정 |
| `frontend/src/__tests__/lint/design-lint.test.ts` | 수정 |

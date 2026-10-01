# Phase 01. 공용 라우터 훅과 상단 진행 막대

**Execution profile**: standard
**Domain**: app-router

## 목표

`useAppRouter` 로 이동하거나 새로고침하면 전환이 끝날 때까지 전역 대기 상태가 켜지고, 150ms 넘게 걸리면 화면 맨 위에 진행 막대가 뜬다.

**범위 외**: 기존 화면의 `useRouter` 교체와 lint 규칙은 phase 02, 화면별 영역 표시와 액션 버튼은 phase 03 이다.

## 컨텍스트

모든 경로는 저장소 root 기준이다. 명령은 `frontend/` 에서 돌린다.

**근거 문서**: `frontend/docs/adr/ADR-F39-navigation-pending-feedback.md`, `frontend/docs/code-architecture.md` 의 「화면 전환」, `frontend/docs/flow.md` 의 「14-2. 빈 상태 / 에러 / 로딩」.

코드에서 확인한 사실:

- Next.js 16.3.6 App Router 다. `router.push`, `router.replace`, `router.refresh` 를 `startTransition` 안에서 부르면 새 화면이 커밋될 때까지 그 transition 이 대기 상태다.
- `frontend/src/app/providers.tsx` 가 `ThemeProvider` 와 `SessionProvider` 안에 `children` 과 `Toaster` 를 둔다. 로그인 전 화면(랜딩, 가족 선택)도 이 Provider 를 거친다.
- 클라이언트 컴포넌트 20개가 `next/navigation` 의 `useRouter` 를 쓴다. 단위 테스트 13개 파일이 `next/navigation` 을 모킹한다.

## 의도 메모

- `frontend/src/lib/client/navigation.tsx` 에 둘을 둔다.
  - `NavigationProgressProvider`: 진행 중인 전환 수를 센다. `start()` 가 끝내는 함수를 돌려준다.
  - `useAppRouter()`: `useRouter()` 의 `push`, `replace`, `refresh`, `back`, `prefetch` 와 같은 모양을 돌려준다. `push`, `replace`, `refresh` 는 `useTransition` 으로 감싸고 대기 동안 Provider 의 수를 올린다. 반환값에 이 훅 인스턴스의 `isPending` 을 더한다.
- Provider 밖에서 불러도 동작해야 한다. 단위 테스트가 Provider 없이 컴포넌트를 그리고 `next/navigation` 만 모킹하기 때문이다. Provider 가 없으면 전역 수를 세지 않고 `isPending` 만 낸다.
- `NavigationProgressBar` 는 전역 수가 0 보다 큰 상태가 150ms 이어지면 보인다. 화면 맨 위 `fixed`, 높이 3px, `bg-brand-500`, `role="progressbar"`, `aria-label="화면을 불러오는 중"`. 끝나면 바로 사라진다. 진행률은 알 수 없으므로 막대가 좌우로 흐르는 애니메이션을 쓰고 `prefers-reduced-motion` 에서는 멈춘 막대를 보인다.
- `back()` 은 history 이동이라 transition 종료를 알 수 없다. 감싸지 않는다.

## 작업 항목

### 1. `frontend/src/lib/client/navigation.tsx`(신규)

### 2. `frontend/src/components/layout/NavigationProgressBar.tsx`(신규)

애니메이션 keyframes 가 필요하면 `frontend/src/app/globals.css` 에 더한다.

### 3. `frontend/src/app/providers.tsx` 에 Provider 와 막대 배치

### 4. 단위 테스트 `frontend/src/__tests__/lib/client/navigation.test.tsx`(신규)

- `next/navigation` 의 라우터 호출이 state 를 바꾸고 deferred Promise 를 던지는 Suspense 자식으로 전환을 보류한다. 라우터는 void 를 반환한다. 150ms 전에는 막대가 없고, 지난 뒤에는 `role="progressbar"` 가 보인다. Promise 해제 후 전환이 끝나면 사라진다.
- 겹친 전환 중 하나만 끝나면 막대를 유지한다. pending 중 호출 컴포넌트를 unmount 하면 전역 대기 수를 정리한다. 즉시 완료와 라우터 예외도 전역 수를 남기지 않는다.
- Provider 없이 `useAppRouter().push` 를 불러도 오류가 나지 않는다.

## 검증

`frontend/` 에서 실행한다.

```bash
pnpm install --frozen-lockfile
pnpm tsc --noEmit && pnpm lint && pnpm lint:md && pnpm test
pnpm test src/__tests__/lib/client/navigation.test.tsx
```

기대값: 모든 명령이 성공한다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `frontend/src/lib/client/navigation.tsx` | 신규 |
| `frontend/src/components/layout/NavigationProgressBar.tsx` | 신규 |
| `frontend/src/app/providers.tsx` | 수정 |
| `frontend/src/app/globals.css` | 수정 |
| `frontend/src/__tests__/lib/client/navigation.test.tsx` | 신규 |

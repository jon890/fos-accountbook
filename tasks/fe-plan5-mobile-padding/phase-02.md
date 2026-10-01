# Phase 02. 화면이 다시 쌓은 바깥 여백을 뺀다

**Execution profile**: standard
**Domain**: color-token

## 목표

로그인 뒤 화면의 바깥 여백을 인증 레이아웃 하나로 맞춘다. 390px 에서 콘텐츠 왼쪽 끝이 화면 끝에서 12px 에 놓인다. `loading.tsx` 도 같은 위치에 그려 로딩이 끝날 때 레이아웃이 밀리지 않게 한다.

**범위 외**: 공용 컴포넌트는 phase 01 이 끝냈다. 섹션 간격과 화면 안쪽 여백은 phase 03 이다.

## 컨텍스트

모든 경로는 저장소 root 기준이다. 명령은 `frontend/` 에서 돌린다.

**근거 문서**: `frontend/docs/adr/ADR-F35-mobile-spacing.md`.

인증 레이아웃 `frontend/src/app/(authenticated)/layout.tsx` 의 `main` 이 `max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-3 md:pt-6 ...` 이다. 아래 파일은 그 위에 바깥 여백을 다시 준다(2026-10-01 조사).

| 파일 | 지금 클래스 | 바꿀 값 |
|---|---|---|
| `frontend/src/app/(authenticated)/categories/page.tsx` 31행 | `container mx-auto py-6 px-4 max-w-4xl space-y-6` | `mx-auto max-w-4xl space-y-4 md:space-y-6 md:px-4 md:py-6` (모바일 바깥 여백만 제거) |
| `frontend/src/app/(authenticated)/notifications/_components/NotificationsClient.tsx` 62행 | `p-4 md:p-6 max-w-2xl mx-auto` | `md:p-6 max-w-2xl mx-auto` |
| `frontend/src/app/(authenticated)/budget/_components/BudgetClient.tsx` 61행 | `p-4 md:p-6 space-y-4 md:space-y-6` | `md:p-6 space-y-4 md:space-y-6` |
| `frontend/src/components/families/FamilySelector.tsx` 122-123행 | `min-h-screen py-8` 와 `px-4` | `md:py-8`, `px-0 md:px-4` |
| `frontend/src/app/(authenticated)/invite/[token]/_components/InvitePageClient.tsx` 74행 | `min-h-screen p-5` | `md:p-5` 로 모바일 바깥 여백 제거 |
| `frontend/src/app/(authenticated)/families/create/page.tsx` 71-72행 | 바깥 `min-h-screen p-4`, 안쪽 `pt-20` | 바깥 `md:p-4`, `md:pt-20` |
| `frontend/src/app/(authenticated)/loading.tsx`, `analytics/loading.tsx`, `budget/loading.tsx`, `transactions/loading.tsx` 5행 | `max-w-2xl mx-auto px-4 py-6` | `max-w-2xl mx-auto md:px-4 md:py-6` (모바일 바깥 여백만 제거) |
| `frontend/src/app/(authenticated)/notifications/loading.tsx` 5, 13행 | `p-4 md:p-6`, 항목 `p-4` | 본 화면과 같게 `md:p-6`, 항목 `p-3 md:p-4` |
| `frontend/src/app/(authenticated)/calendar/loading.tsx` 5행 | `space-y-5` | `space-y-4` (실제 화면과 같게) |

줄 번호는 조사 시점 값이다. 고치기 전에 그 파일을 열어 클래스 문자열로 찾는다.

## 작업 항목

### 1. 위 표의 화면 컴포넌트 여섯 곳을 고친다

### 2. 위 표의 `loading.tsx` 여섯 파일을 고친다

### 3. 이 phase 를 검증하는 브라우저 테스트

- `frontend/browser/mobile-spacing.spec.ts` 에 더한다.
  - `/categories`: `mobile` 에서 첫 `[data-slot="card"]` 의 `boundingBox().x` 가 12 다. `desktop` 에서는 `main` 의 `padding-left` 로 정해진 위치보다 왼쪽에 있지 않다.
  - `/notifications`: `mobile` 에서 알림 목록 바깥 상자의 `boundingBox().x` 가 12 다.
- 가짜 백엔드가 응답하는 두 화면만 단언한다. 다른 화면은 이 phase 에서 application API 경로를 더하지 않는다.

### 4. 계획 검토 반영

- 바깥 여백 규칙은 `md` 미만에 적용한다. `md` 이상의 표에 명시한 화면 여백은 유지한다.
- 카테고리 desktop 카드 위치는 중앙 정렬된 896px 영역의 왼쪽 좌표 208px로 정확히 단언한다. 모바일 알림 loading과 완료 화면 x 좌표는 모두 12px이다.
- 가짜 백엔드에 테스트 전용 알림 응답 지연 설정을 추가한다. `POST /__test/notifications-delay`에 `{hold: true}`를 보내 응답을 보류하고 `{hold: false}`로 해제한다. 응답은 테스트가 명시적으로 해제할 때까지 보류하고 reset에서 해제해 실행 순서 의존을 막는다. 클라이언트 탐색 중 알림 loading과 완료 화면의 바깥 x 좌표를 모바일에서 비교한다. 고정 시간 대기는 쓰지 않는다.

## 검증

`frontend/` 에서 실행한다.

```bash
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
pnpm tsc --noEmit && pnpm lint && pnpm lint:md && pnpm test
pnpm test:browser browser/mobile-spacing.spec.ts
```

기대값: 모든 명령이 성공한다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `frontend/src/app/(authenticated)/categories/page.tsx` | 수정 |
| `frontend/src/app/(authenticated)/notifications/_components/NotificationsClient.tsx` | 수정 |
| `frontend/src/app/(authenticated)/budget/_components/BudgetClient.tsx` | 수정 |
| `frontend/src/components/families/FamilySelector.tsx` | 수정 |
| `frontend/src/app/(authenticated)/invite/[token]/_components/InvitePageClient.tsx` | 수정 |
| `frontend/src/app/(authenticated)/families/create/page.tsx` | 수정 |
| `frontend/src/app/(authenticated)/loading.tsx` | 수정 |
| `frontend/src/app/(authenticated)/analytics/loading.tsx` | 수정 |
| `frontend/src/app/(authenticated)/budget/loading.tsx` | 수정 |
| `frontend/src/app/(authenticated)/transactions/loading.tsx` | 수정 |
| `frontend/src/app/(authenticated)/notifications/loading.tsx` | 수정 |
| `frontend/src/app/(authenticated)/calendar/loading.tsx` | 수정 |
| `frontend/browser/mobile-spacing.spec.ts` | 수정 |
| `frontend/browser/fake-backend.mjs` | 수정 |

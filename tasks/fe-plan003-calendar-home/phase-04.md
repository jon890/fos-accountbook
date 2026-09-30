# Phase 04. 하단 탭, 전체 메뉴, 뒤로 가기, 안전 영역

**Execution profile**: standard
**Domain**: app-router

## 목표

모든 화면에 하단 탭에서 두 번 안에 닿게 한다. 하위 화면에서 빠져나올 수 있게 한다. 아이폰 하단 인디케이터와 겹치지 않게 한다.

**범위 외**: 대시보드 제거와 분석 화면 이전은 phase 05 다. 입력창 글자 크기, 작은 터치 영역, 다크 모드 색, PWA 는 후속 계획이다.

## 컨텍스트

- `frontend/src/components/layout/BottomNavigation.tsx`: 홈, 내역, FAB, 분석, 설정. 버튼이 `onClick` 의 `router.push` 라 prefetch 가 되지 않는다. 라벨 10px, 버튼에 `flex-1` 이 없다. `safe-area-pb` 클래스를 쓰지만 CSS 어디에도 정의가 없다.
- `frontend/src/app/layout.tsx:25-29` 의 viewport 에 `viewportFit` 이 없어 `env(safe-area-inset-*)` 가 0 이다.
- `frontend/src/components/layout/Header.tsx`: 왼쪽 로고, 오른쪽 가족 선택(md+), 알림, 아바타 메뉴(설정, 로그아웃).
- 하단 탭은 `(authenticated)/layout.tsx` 가 모든 인증 화면에 붙인다.
- 설정의 가족 「관리」 버튼(`app/(authenticated)/settings/_components/SettingsPageClient.tsx:221` 부근)이 없는 경로 `/families/{uuid}` 로 간다.
- 초대 다이얼로그 `components/dashboard/InviteFamilyDialog.tsx`, 모바일 가족 전환 Sheet `Header.tsx` 의 `FamilySelectorList`.

**근거 문서**: `frontend/docs/flow.md` 의 「16. 하단 탭과 전체 메뉴」, 「14-1. Header / TopBar 구조」, `frontend/docs/adr.md` 의 ADR-F33

## 의도 메모

- 햄버거 메뉴를 쓰지 않는 이유는 ADR-F33 에 있다.
- FAB 날짜: `/calendar` 에서는 URL `date` 를 `defaultDate` 로 넘기고, 다른 화면에서는 넘기지 않는다(오늘). `useSearchParams` 는 `history.replaceState` 로 바뀐 값도 읽는다(Next 14.1 이후).
- 뒤로 가기: `window.history.length > 1` 이면 `router.back()`, 아니면 `/menu`. 홈 화면에서 앱처럼 열면 기록이 없기 때문이다.
- 하단 탭 숨김 경로: `/families/create`, `/families/select`, `/invite/*`.

## 작업 항목

### 1. 안전 영역: `frontend/src/app/layout.tsx`, `frontend/src/app/globals.css`, `(authenticated)/layout.tsx`

- viewport 에 `viewportFit: "cover"`.
- `globals.css` 에 `@utility safe-area-pb { padding-bottom: env(safe-area-inset-bottom); }` 를 정의한다(Tailwind v4 `@utility`).
- `main` 의 `pb-20` 을 하단 탭 높이와 안전 영역을 더한 값(`calc(4rem + env(safe-area-inset-bottom))` 등)으로 바꾼다.
- phase 02 가 다이얼로그에 쓴 `pb-[env(safe-area-inset-bottom)]` 을 `safe-area-pb` 로 바꾼다.

### 2. `BottomNavigation.tsx`

- 탭: 달력 `/calendar`, 내역 `/transactions`, FAB, 분석 `/analytics`, 전체 `/menu`. 아이콘은 lucide 에서 고른다(달력 `CalendarDays`, 전체 `LayoutGrid` 등).
- `next/link` 의 `Link` 로 바꾸고 현재 탭에 `aria-current="page"`. 활성 판정은 경로 접두어로 한다(`/transactions?tab=…`, `/expenses` 포함).
- 각 탭 `flex-1 h-full`, 라벨 12px, 아이콘 22px.
- FAB 는 의도 메모의 날짜 규칙으로 `AddTransactionDialog` 를 연다.
- 하단 탭 숨김 경로에서는 `null` 을 반환한다.

### 3. 전체 메뉴: `frontend/src/app/(authenticated)/menu/page.tsx` (신규)

- `flow.md` 「16」 의 네 묶음을 목록형으로 둔다. 각 행은 아이콘, 이름, 오른쪽 화살표이고 높이 52px 이상의 `Link`. 가족 전환과 구성원 초대는 기존 Sheet 와 `InviteFamilyDialog` 를 연다.
- 맨 위에 현재 가족 이름과 사용자 이름.

### 4. Header 뒤로 가기와 설정의 가족 「관리」 버튼

- `Header.tsx`: 경로가 `/categories`, `/budget`, `/notifications`, `/settings`, `/menu` 하위가 아닌 하위 화면(`/invite/*`)이면 로고 자리에 뒤로 가기 버튼(`aria-label` 「뒤로 가기」, 44px). 목록은 상수 하나로 둔다. `/menu` 자신은 탭이므로 뒤로 가기가 없다.
- `SettingsPageClient.tsx`: 가족 「관리」 버튼을 지운다.

### 5. 테스트

- `frontend/src/__tests__/components/layout/BottomNavigation.test.tsx`: 다섯 탭이 링크이고 현재 경로 탭에 `aria-current`, `/families/create` 에서 렌더링하지 않는다, `/calendar?date=2026-09-14` 에서 FAB 를 누르면 `AddTransactionDialog` 에 `defaultDate` 가 전달된다.
- `frontend/src/__tests__/components/layout/Header.test.tsx`(기존 파일에 추가): `/categories` 에서 뒤로 가기 버튼, 기록이 없으면 `/menu` 로 이동, `/calendar` 에서는 로고.
- `frontend/src/__tests__/app/menu/page.test.tsx`: 카테고리, 예산, 고정지출, 알림, 설정 링크가 있다.

## 검증

```bash
# cwd: <repo root>
cd frontend && pnpm test -- src/__tests__/components/layout/BottomNavigation.test.tsx src/__tests__/components/layout/Header.test.tsx src/__tests__/app/menu/page.test.tsx
pnpm lint && pnpm test
grep -rn "safe-area-pb" src/app/globals.css   # 정의 1건 이상
grep -n "router.push" src/components/layout/BottomNavigation.tsx   # 결과 없음
```

## 변경 파일

| 파일 | 변경 |
|---|---|
| `frontend/src/app/layout.tsx` | 수정 |
| `frontend/src/app/globals.css` | 수정 |
| `frontend/src/app/(authenticated)/layout.tsx` | 수정 |
| `frontend/src/components/layout/BottomNavigation.tsx` | 수정 |
| `frontend/src/components/layout/Header.tsx` | 수정 |
| `frontend/src/app/(authenticated)/menu/page.tsx` | 신규 |
| `frontend/src/app/(authenticated)/settings/_components/SettingsPageClient.tsx` | 수정 |
| `frontend/src/components/transactions/dialogs/AddTransactionDialog.tsx` | 수정 |
| `frontend/src/components/transactions/dialogs/EditTransactionDialog.tsx` | 수정 |
| `frontend/src/__tests__/components/layout/BottomNavigation.test.tsx` | 신규 |
| `frontend/src/__tests__/components/layout/Header.test.tsx` | 수정 |
| `frontend/src/__tests__/app/menu/page.test.tsx` | 신규 |

# Phase 01. 날짜 선택 시 날짜 목록 드러내기와 포커스

**Execution profile**: fast

**Domain**: `app-router`

## 목표

달력 홈에서 날짜를 누르면, 날짜 목록 제목이 화면에 다 보이지 않을 때 그 제목까지 스크롤하고 제목에 포커스를 준다.
휴대폰에서는 달력이 화면을 거의 채워 아래 거래 목록이 가려져 있어 매번 직접 스크롤해야 했다.

**범위 외**: 달력 격자, 월 이동, 거래 목록 내용은 바꾸지 않는다.

## 컨텍스트

모든 경로는 저장소 root 기준이다. 명령은 `frontend/` 에서 돌린다.

**근거 문서**: `frontend/docs/flow.md` 의 「5. 달력 홈 (`/calendar`)」 절. 날짜를 눌러 고를 때의 규칙이 거기 있다.

코드에서 확인한 사실:

- `frontend/src/components/calendar/CalendarHome.tsx`
  - `"use client"` 컴포넌트다. 날짜 선택은 `selectDate(date)` 가 `setDateDraft(date)` 만 한다.
  - `CalendarGrid` 의 `onSelect={selectDate}` 로 불린다. 날짜 버튼은 `CalendarGrid.tsx` 에서 `onClick={() => onSelect(date)}` 다.
  - 초기 날짜 변경이나 URL 의 `date` 제거로 `setDateDraft(null)` 하는 경로는 렌더 중 비교로 처리하고, `selectDate` 를 거치지 않는다.
- `frontend/src/components/calendar/DayTransactionList.tsx`: 제목은 `<h2 className="text-base font-bold text-fg">{month}월 {day}일 ({weekday})</h2>` 다.
- 상단 헤더 `frontend/src/components/layout/Header.tsx` 는 `sticky top-0` 이고 높이가 `h-14 md:h-16` 이다.
- 하단 탭 `frontend/src/components/layout/BottomNavigation.tsx` 는 `fixed bottom-0` 이다. 본문 `frontend/src/app/(authenticated)/layout.tsx` 의 `main` 이 하단을 `pb-[calc(6.5rem+env(safe-area-inset-bottom))]` 로 비운다.
- jsdom 에는 `Element.prototype.scrollIntoView` 가 없다. 테스트에서 직접 정의한다. `window.matchMedia` 는 `frontend/jest.setup.js` 에서 정의돼 있지 않으면 테스트에서 흉내 낸다.
- 테스트 선례: `frontend/src/__tests__/components/calendar/CalendarHome.test.tsx` 의 「최초 조회 뒤 날짜 변경은 서버를 다시 부르지 않고 URL과 목록만 바꾼다」 가 `CalendarPage` 를 렌더해 날짜 버튼을 누른다.

## 의도 메모

- **판정과 스크롤 위치를 같은 값으로 맞춘다.** 제목에 `scroll-mt-[4.5rem] md:scroll-mt-[5rem] scroll-mb-[7rem]` 을 둔다. 헤더 높이에 1rem, 하단 여백 6.5rem 에 0.5rem 을 더한 값이다.
  보이는지 판정은 `getComputedStyle(element).scrollMarginTop`, `scrollMarginBottom` 을 읽어 `rect.top >= marginTop && rect.bottom <= window.innerHeight - marginBottom` 으로 한다. 헤더와 하단 탭 DOM 을 직접 찾지 않는다.
- 다 보이지 않을 때만 `element.scrollIntoView({ block: "start", behavior })` 를 부른다. `behavior` 는 `window.matchMedia("(prefers-reduced-motion: reduce)").matches` 면 `"auto"`, 아니면 `"smooth"` 다.
- 포커스는 스크롤 여부와 관계없이 `element.focus({ preventScroll: true })` 로 준다. 제목에 `tabIndex={-1}` 을 두고, 포커스 링이 거슬리지 않게 `focus:outline-none` 을 준다.
- 호출은 `selectDate` 안에서만 한다. effect 로 `selectedDate` 변화를 보고 스크롤하면 초기화 경로에서도 스크롤이 일어난다.
  `selectDate` 가 상태를 바꾼 직후 같은 제목 요소에 바로 호출해도 된다. 제목 요소는 날짜가 바뀌어도 같은 DOM 이고, 위치는 위쪽 달력이 정한다.
- 제목 요소는 `DayTransactionList` 에 `headingRef` prop 으로 넘긴다(React 19 의 `ref` prop 대신 이름 있는 prop 으로 둔다. 컴포넌트가 함수 컴포넌트이고 다른 ref 용도가 없어 이름이 분명한 쪽을 택했다).

## 작업 항목

### 1. 도우미 `frontend/src/lib/client/reveal.ts`

`revealAndFocus(element: HTMLElement | null): void` 를 export 한다. null 이면 아무것도 하지 않는다. 의도 메모의 판정, 스크롤, 포커스를 한다.

### 2. `DayTransactionList` 의 제목

`headingRef?: React.Ref<HTMLHeadingElement>` prop 을 더하고 `h2` 에 `ref`, `tabIndex={-1}`, 의도 메모의 scroll margin 과 `focus:outline-none` 클래스를 더한다.

### 3. `CalendarHome` 에서 호출

`useRef<HTMLHeadingElement>(null)` 을 만들어 `DayTransactionList` 에 넘기고, `selectDate` 에서 `setDateDraft(date)` 뒤 `revealAndFocus(headingRef.current)` 를 부른다.

### 4. 이 phase 를 검증하는 테스트

- `frontend/src/__tests__/lib/reveal.test.ts`(신규):
  - 제목이 화면 아래에 있으면(`getBoundingClientRect` 가 `top` 900, `bottom` 920, `innerHeight` 800) `scrollIntoView` 가 `{ block: "start", behavior: "smooth" }` 로 한 번 불리고, `focus` 가 `{ preventScroll: true }` 로 불린다.
  - 제목이 다 보이면(`top` 200, `bottom` 220) `scrollIntoView` 를 부르지 않고 `focus` 는 부른다.
  - 제목이 헤더에 가려 있으면(`top` 10, scroll margin top 72px) 스크롤한다.
  - 「움직임 줄이기」 면 `behavior` 가 `"auto"` 다.
  - null 을 넘기면 아무 일도 없다.
- `frontend/src/__tests__/components/calendar/CalendarHome.test.tsx` 에 케이스를 더한다.
  - 날짜 버튼을 누르면 날짜 목록 제목이 `document.activeElement` 다.
  - 처음 렌더와 월 이동만으로는 `scrollIntoView` 가 불리지 않는다(`Element.prototype.scrollIntoView` 를 `jest.fn()` 으로 두고 확인).

## 검증

```bash
cd frontend && pnpm test -- src/__tests__/lib/reveal.test.ts src/__tests__/components/calendar/CalendarHome.test.tsx
cd frontend && pnpm tsc --noEmit && pnpm lint && pnpm lint:md && pnpm test
cd frontend && pnpm test:browser -- browser/calendar.spec.ts
```

모두 종료 코드 0 이어야 한다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `frontend/src/lib/client/reveal.ts` | 신규 |
| `frontend/src/components/calendar/DayTransactionList.tsx` | 수정 |
| `frontend/src/components/calendar/CalendarHome.tsx` | 수정 |
| `frontend/src/__tests__/lib/reveal.test.ts` | 신규 |
| `frontend/src/__tests__/components/calendar/CalendarHome.test.tsx` | 수정 |

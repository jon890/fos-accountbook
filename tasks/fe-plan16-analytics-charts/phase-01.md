# Phase 01. 월별 추이 막대가 높이를 갖게 한다

**Execution profile**: standard
**Domain**: color-token

## 목표

`/analytics` 의 「월별 지출 추이」 카드에서 막대가 보이지 않고 월 라벨만 남는 문제를 고친다.

**범위 외**: 추이 조회 실패를 실패 카드로 보이는 일은 phase 02, 도넛 색은 phase 03 이 맡는다.

## 컨텍스트

`frontend/src/app/(authenticated)/analytics/_components/MonthlyTrendBar.tsx` 의 구조는 아래와 같다.

- 바깥 줄: `flex items-end justify-between gap-1.5 h-[140px] md:h-[180px]`. 높이가 고정돼 있다.
- 각 열: `flex-1 flex flex-col items-center gap-1 min-w-0`. 금액 라벨, 막대, 월 라벨을 세로로 쌓는다.
- 막대: `style={{ height: \`${heightPct}%\` }}` 와 `aria-label={\`${year}년 ${month}월 지출 ...\`}` 를 가진 div.

바깥 줄이 `items-end` 라서 열이 줄 높이로 늘어나지 않고 내용 높이만 갖는다.
열의 높이가 정해지지 않았으니 막대의 퍼센트 높이도 기준이 없어 0 으로 계산된다.

`frontend/browser/fake-backend.mjs` 에는 `dashboard/stats/monthly-trend` 처리가 없다.
지금은 서비스가 그 실패를 0원으로 바꿔 화면이 뜬다. phase 02 가 그 동작을 없애므로 이 phase 에서 가짜 응답을 먼저 더한다.
응답 형식은 `frontend/src/lib/schemas/responses/dashboard.ts` 의 `monthlyTrendResponseSchema` 이다. `points[{ year, month, totalExpense }]`, `average` 이다.

**근거 문서**: `frontend/docs/flow.md` 의 「5-3. /analytics 페이지 구조」

## 의도 메모

- recharts 로 바꾸지 않는다. 순수 CSS 막대는 recharts 를 지연 로드하지 않아도 되는 가벼운 카드로 유지한다(`frontend/docs/code-architecture.md` 의 차트 지연 로드 절).
- jsdom 은 레이아웃을 계산하지 않아 Jest 로는 막대 높이를 확인할 수 없다. 브라우저 테스트로 확인한다.

## 작업 항목

### 1. `MonthlyTrendBar.tsx` 의 열과 막대 영역

- 각 열에 `h-full` 을 더해 바깥 줄 높이를 받게 한다.
- 금액 라벨과 월 라벨 사이에 막대 영역 div 를 둔다. 클래스는 `flex-1 min-h-0 w-full flex items-end` 이다.
- 막대 div 를 그 영역 안으로 옮긴다. 막대의 클래스, `style` 높이 계산, `aria-label` 은 바꾸지 않는다.
- 금액 라벨이 빈 문자열인 달도 열 높이가 같아야 한다. 라벨 span 은 지금처럼 항상 렌더링한다.

### 2. `frontend/browser/fake-backend.mjs` 에 월별 추이 응답

- `GET /api/v1/families/${FAMILY_UUID}/dashboard/stats/monthly-trend` 를 처리한다. 다른 `dashboard/stats/*` 처리 옆에 둔다.
- `from`, `to` 쿼리(`YYYY-MM`)를 읽어 그 사이의 모든 달에 점을 하나씩 만든다. i 번째 달(0부터)의 `totalExpense` 는 `100000 * (i + 1)` 이다.
- `average` 는 점들의 평균을 반올림한 값이다. 응답은 다른 처리와 같이 `sendJson(response, 200, { success: true, data })` 로 보낸다.

### 3. 이 phase 를 검증하는 `frontend/browser/analytics-charts.spec.ts`

`frontend/browser/category-summary.spec.ts` 처럼 `./fixtures` 의 `test`, `expect` 를 쓴다.

- 정상: 390x844 와 1280x800 에서 `/analytics?period=m3` 를 연다. `[aria-label*="월 지출"]` 막대 3개가 모두 높이 8px 이상이고, 마지막 막대가 가장 높으며 40px 이상이다.
- 실패 입력: 막대 높이가 0 이 되던 지금 구조에서는 위 단언이 실패한다. 구현 전에 한 번 돌려 실패하는 것을 확인한다.

## 검증

```bash
cd frontend && pnpm tsc --noEmit && pnpm lint && pnpm test
cd frontend && pnpm test:browser analytics-charts.spec.ts
cd frontend && pnpm test:browser
```

- 두 번째 줄은 새 spec 만 돌린다. 세 번째 줄은 가짜 백엔드를 고쳐 다른 spec 이 깨지지 않았는지 본다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `frontend/src/app/(authenticated)/analytics/_components/MonthlyTrendBar.tsx` | 수정 |
| `frontend/browser/fake-backend.mjs` | 수정 |
| `frontend/browser/analytics-charts.spec.ts` | 신규 |

# Code Architecture — fos-accountbook

> 상세 코딩 컨벤션·금지사항은 `CLAUDE.md` 참고. 이 문서는 계층 구조와 패턴만 다룬다.

---

## 계층 구조

```
app/ (Page, Layout)
  └─ actions/          "use server" — 인증, Zod 검증, revalidatePath
       └─ services/    API 호출, 쿼리 빌딩, 데이터 변환
            └─ lib/server/api/   HTTP 클라이언트 (ky)
```

## 계층 계약

| 계층          | 책임                                              | 금지                                        |
| ------------- | ------------------------------------------------- | ------------------------------------------- |
| `app/`        | 라우팅, 레이아웃, 데이터 fetch (Server Component) | API 직접 호출                               |
| `actions/`    | `"use server"`, 인증, Zod 검증, revalidatePath    | API 호출, 비즈니스 로직                     |
| `services/`   | API 호출, 쿼리 빌딩, 변환, 오케스트레이션         | `"use server"`, revalidatePath, requireAuth |
| `components/` | 렌더링, 사용자 인터랙션                           | 직접 fetch, 비즈니스 로직                   |

---

## 핵심 패턴

### Server Action 표준 구조

```typescript
"use server";

export async function createExpenseAction(
  data: unknown,
): Promise<ActionResult> {
  const session = await requireAuthOrRedirect();
  const familyUuid = await getSelectedFamilyUuid(session);

  const parsed = createExpenseSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.flatten() };

  const result = await expenseService.create(
    familyUuid,
    session.userUuid,
    parsed.data,
  );

  revalidatePath("/calendar");
  revalidatePath("/transactions");
  return { success: true, data: result };
}
```

### Server / Client 컴포넌트 분리

```
page.tsx          (Server) — 데이터 fetch, SEO
  └─ *Client.tsx  (Client) — useState, 이벤트 핸들러, 폼
       └─ components/ui/   — Shadcn 기반 (Server or Client)
```

규칙: `"use client"` 경계를 말단 컴포넌트로 밀어내 번들 최소화.
모든 `page.tsx`는 Server Component. 인터랙션이 필요한 부분만 `*Client.tsx`로 분리.

대시보드 분포, 분석 분포와 예산 누적 차트는 기존 Client wrapper 를 유지하고 recharts 를 사용하는 차트 본체만 분리한다.
wrapper 가 `next/dynamic` 의 `ssr: false` 로 본체를 지연 로드해 recharts 를 초기 동기 번들에서 제외한다.
다운로드 중에는 차트와 같은 반응형 높이의 자리표시자를 표시해 화면이 밀리지 않게 한다.

`/dashboard` 는 `/analytics` 로 보내는 이전 주소다.
분석 Page가 예산, 수입과 지출, 고정비 카드를 서버에서 렌더링하고 그 아래에 기존 분석 Client를 둔다.
초대 다이얼로그는 가족 컴포넌트에 두고 전체 메뉴에서 연다.
대시보드 분포 컴포넌트는 후속 정리를 위해 유지하지만 현재 화면에서는 사용하지 않는다.
첫 화면의 구성원 아바타는 비로그인 Landing에서 계속 사용한다.

통계 Action은 세션 시간대를 Service에 전달하고 기존 월별 캐시가 해당 시간대의 현재 연월을 조회한다.
분석과 예산 Page, 분석 Action의 기본 연월은 공용 시간대 날짜 함수를 사용한다.
시간대가 없거나 잘못되면 서울을 사용하며 명시한 조회 연월과 백엔드 집계 방식은 유지한다.

### 에러 처리

- **Server Action**: `{ success: false, error }` 반환 → 클라이언트에서 `toast.error`
- **HTTP 오류**: ky가 `HTTPError` 발생 → 서비스 레이어에서 catch 후 재throw 또는 null 반환
- **응답 계약 오류**: `serverApiGet` 같은 래퍼에 `schema` 를 넘기면 `data` 를 Zod 로 검증한다. 어긋나면 엔드포인트와 필드 경로를 로그에 남기고 `ResponseValidationError` 를 던진다. Action 은 이를 내부 오류로 돌려준다 (ADR-F42)
- **필드 검증 실패(400)**: 백엔드 응답의 `errors[0].message` 가 있으면 그 문구를 `INVALID_INPUT` 실패 결과의 메시지로 그대로 돌려준다. 백엔드가 사용자용 문장으로 만든 문구라서다. 없으면 기본 문구로 바꾼다
- **인증 오류**: `requireAuthOrRedirect()` → `/auth/signin` 리다이렉트

### 인증 흐름

두 가지 패턴이 존재:

```
페이지 진입 시 호출되는 Action (지출 등록 등)
  └─ requireAuthOrRedirect()          세션 없으면 /auth/signin 리다이렉트
       └─ getSelectedFamilyUuid()     JWT에 캐싱된 defaultFamilyUuid 반환

이미 페이지 안에서 호출되는 Action (반복 지출 CRUD 등 Sheet/모달 내)
  └─ requireAuth()                    세션 없으면 에러 반환 (리다이렉트 안 함)
       └─ getSelectedFamilyUuid()
```

**규칙**: 페이지 최초 로드 시 호출 → `requireAuthOrRedirect`, Sheet/모달 내부 → `requireAuth`

---

## 디렉터리 구조 요약

```
src/
├── actions/{domain}/       Server Action — 인증·검증·revalidatePath
├── services/{domain}/      API 호출·변환 함수
├── lib/schemas/responses/ 백엔드 응답 Zod 스키마 (ADR-F42)
├── components/
│   ├── ui/                 Shadcn 기반 기본 컴포넌트
│   ├── layout/             Header, BottomNavigation, SettingsCard (페이지 카드 helper)
│   └── {domain}/           도메인별 UI 컴포넌트
├── components/calendar/    달력 홈 (CalendarHome, CalendarGrid, DayTransactionList, MemberTotals)
├── app/(authenticated)/    인증 필요 라우트 (Server Component 기본). 첫 화면은 calendar/, 전체 메뉴는 menu/
├── app/api/auth/           NextAuth API Route
└── __tests__/              서비스 단위 테스트
```

`src/` 밖의 `browser/` 는 Playwright 브라우저 테스트다. 테스트 설정, 가짜 백엔드, 세션 쿠키를 만드는 fixture, 화면별 `*.spec.ts` 를 둔다([ADR-F34](adr/ADR-F34-browser-tests-fake-backend.md)).

---

## 새 도메인 추가 체크리스트

1. `src/actions/{domain}/` — Server Action (`"use server"` + Zod 스키마 + revalidatePath)
2. `src/services/{domain}/` — API 호출 함수 (순수 함수, 테스트 가능)
3. `src/components/{domain}/` — UI 컴포넌트 (Server/Client 구분)
4. `src/__tests__/` — 서비스 단위 테스트
5. `src/app/(authenticated)/` — 페이지 라우트 (Server Component)
6. `docs/data-schema.md` — TypeScript 타입 + API 엔드포인트 업데이트

---

## 화면 전환

- 클라이언트 이동은 `src/lib/client/navigation.tsx` 의 `useAppRouter` 로 한다. `next/navigation` 의 `useRouter` 직접 사용은 ESLint 가 막는다 (ADR-F39).
- `NavigationProgressProvider` 가 전역 대기 상태를 갖고 `NavigationProgressBar` 가 그 상태로 상단 진행 막대를 그린다. 둘 다 `src/app/providers.tsx` 에 놓인다.

## 디자인 토큰 / 테마

- **단일 소스**: `src/app/globals.css` 의 `@theme` 블록. OKLCH 평면 값 (ADR-F13).
- **토큰 카테고리**:
  - `--color-brand-{50..900}` — Toss Blue h=257 스케일 (primary/hover/pressed 파생)
  - `--color-{income|expense|warning}` — semantic 의미색
  - `--color-neutral-{0..950}` — cool gray h=230
  - `--color-{bg|bg-elev|bg-muted|fg|fg-muted|fg-subtle|border|border-strong}` — surface 토큰 (light/dark 분리)
- **Dark mode**: `[data-theme="dark"]` 셀렉터 (ADR-F15). `next-themes` `attribute="data-theme"`.
- **다크 값**: 라이트 전용 값을 가진 토큰(`brand-tint`, `brand-{50|100|200}`, `brand-{700|800|900}`, `cat-*`, 바탕 그라디언트)은 다크 블록에서 다시 정의한다. `brand-ink` 와 `neutral-0` 은 테마와 무관한 고정값이다 (ADR-F38).
- **테마 선택**: 설정 화면에서 시스템, 라이트, 다크를 고른다. `next-themes` 가 그 기기의 브라우저에 저장한다 (ADR-F38).
- **시맨틱 그라디언트 클래스**: `gradient-{primary|expense|income|budget|family|category}` 6종 — 클래스명 유지, 값만 OKLCH.
- **수치 표기**: `.num` 또는 `data-num` — Inter + `tabular-nums` (ADR-F14).
- **금지**: Tailwind 기본 팔레트 클래스(`gray-*`, `blue-*`, `white` 등). 단위 테스트가 소스를 검사한다 (ADR-F38).
- **금지**: hex / rgb / hsl 직접 작성 (`oklch()` 또는 토큰 변수만). `style={{ color: ... }}` inline 토큰 직접 표기 — `text-[var(--token)]` arbitrary class 사용.

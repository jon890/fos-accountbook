# Testing Strategy — fos-accountbook (Frontend)

> 최종 업데이트: 2026-10-01

## 1. 테스트 피라미드

```
┌─────────────────────────────────────┐
│   Browser (Playwright, 가짜 백엔드)  │  ← 해상도별 화면 검증
├─────────────────────────────────────┤
│   Contract (OpenAPI snapshot diff)  │  ← 백엔드 스냅샷 기반 타입 drift 감지
├─────────────────────────────────────┤
│   Component Integration (future)    │  ← Testing Library + Server Component
├─────────────────────────────────────┤
│   Unit (jest.mock Server Actions)   │  ← 핵심 계층. Action → Service mock
└─────────────────────────────────────┘
```

### 계층별 역할

| 계층      | 도구                               | 목적                                            | 실행 시점   |
| --------- | ---------------------------------- | ----------------------------------------------- | ----------- |
| Unit      | Jest + jest.mock                   | Server Action의 Zod 검증, 인증, revalidate 동작 | `pnpm test` |
| Component | Testing Library (예정)             | UI 컴포넌트 렌더링 + 사용자 인터랙션            | `pnpm test` |
| Contract  | openapi-typescript + tsc           | 백엔드 API 스키마와 프론트 타입 동기화 검증     | CI pipeline |
| Browser   | Playwright + 가짜 백엔드           | 모바일과 데스크톱 폭에서 화면 배치와 여백 검증  | `pnpm test:browser`, CI browser job |

---

## 2. Unit 테스트 규칙 (Server Actions)

### 2.1 기본 원칙

- **jest.mock 방식** (MSW 아님 — ADR-F09)
- Service 함수를 mock하고 Action의 **Zod 검증 + 인증 + revalidate** 동작을 테스트
- 테스트 위치: `src/__tests__/actions/`

### 2.2 필수 테스트 시나리오 (모든 Server Action)

| 시나리오          | 검증 내용                                               |
| ----------------- | ------------------------------------------------------- |
| 정상 동작         | Zod 통과 → Service 호출 → revalidatePath 호출           |
| Zod 검증 실패     | 잘못된 입력 → `{ success: false }` + Service 미호출     |
| 미인증            | `requireAuth` → 에러 반환, Service 미호출               |
| familyUuid 미선택 | `getSelectedFamilyUuid` → null → familyNotSelected 에러 |
| Service 에러      | API 호출 실패 → `handleActionError`로 안전하게 처리     |

### 2.3 mock 패턴

```typescript
// 표준 mock 셋업
jest.mock("@/lib/env/server.env", () => ({
  serverEnv: { BACKEND_API_URL: "http://localhost:8080" },
}));
jest.mock("@/lib/server/auth/auth", () => ({
  handlers: {},
  auth: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));
jest.mock("@/lib/server/auth/auth-helpers");
jest.mock("@/services/<domain>/<service-name>");
jest.mock("next/cache");
```

---

## 3. OpenAPI 계약 검증

### 3.1 목적

백엔드 API 응답 구조가 변경되었을 때 **프론트 빌드 시점에 감지**. 로컬 서버 실행 없이 검증.

### 3.2 흐름

```
Backend CI (artifact)
    │
    └── openapi-snapshot.json (GitHub Actions artifact)
            │
            ▼
Frontend CI
    │
    ├── artifact 다운로드
    ├── npx openapi-typescript openapi-snapshot.json \
    │       -o src/types/generated-api.d.ts
    ├── tsc --noEmit (수동 타입과 호환성 검사)
    └── drift 감지 → CI 실패
```

### 3.3 타입 생성 전략

- **생성된 타입은 검증 전용** (코드에서 직접 import하지 않음)
- 수동 타입(`src/types/`)이 원본, 생성 타입과 호환성만 검사
- 이유: 프론트 타입에 UI 전용 필드, 변환 로직이 포함될 수 있으므로

### 3.4 향후 자동화 (CI 워크플로)

```yaml
# .github/workflows/contract-check.yml (예시)
name: API Contract Check
on:
  workflow_run:
    workflows: ["Backend CI"]
    types: [completed]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/download-artifact@v4
        with:
          name: openapi-snapshot
          github-token: ${{ secrets.GITHUB_TOKEN }}
          run-id: ${{ github.event.workflow_run.id }}
      - run: npx openapi-typescript openapi-snapshot.json -o src/types/generated-api.d.ts
      - run: npx tsc --noEmit
```

---

## 4. 테스트 커버리지 현황

### Server Actions — RecurringExpense (v2)

| Action                            | 테스트 상태     | 파일                                   |
| --------------------------------- | --------------- | -------------------------------------- |
| `createRecurringExpenseAction`    | ✅ 4개 시나리오 | `createRecurringExpenseAction.test.ts` |
| `updateRecurringExpenseAction`    | ❌ 추가 필요    | —                                      |
| `deleteRecurringExpenseAction`    | ❌ 추가 필요    | —                                      |
| `getRecurringExpensesAction`      | ❌ 추가 필요    | —                                      |
| `getRecurringExpensesTotalAction` | ❌ 추가 필요    | —                                      |

### 공통 누락 시나리오

| 시나리오                       | 해당 Action |
| ------------------------------ | ----------- |
| familyUuid 미선택 시 에러      | 모든 Action |
| Service 호출 실패 시 에러 처리 | 모든 Action |

---

## 5. 컴포넌트 통합 테스트 (향후)

### 대상

- `RecurringExpenseList`: 목록 렌더링 + 빈 상태 처리
- `AddTransactionDialog` / `EditTransactionDialog`: 3 type 토글 + 폼 입력 → submit → Action 호출 (plan014 에서 23 테스트 적용 완료 — 추가 시나리오는 향후)

### 도구

- `@testing-library/react` + `@testing-library/user-event`
- Server Component 테스트: `next/test` (Next.js 15+ 지원 시)

---

## 6. 브라우저 테스트

결정과 근거는 [ADR-F34](adr/ADR-F34-browser-tests-fake-backend.md) 가 소유한다.

### 구조

| 구성 | 하는 일 |
| --- | --- |
| 웹 서버 | 빌드한 Next 서버를 띄운다. `BROWSER_WEB_SERVER=dev` 면 개발 서버를 띄운다 |
| 가짜 백엔드 | `BACKEND_API_URL` 이 가리키는 HTTP 서버. 화면이 부르는 경로에 고정 응답을 준다. 모르는 경로를 받으면 기록하고 테스트를 실패시킨다 |
| 세션 fixture | `AUTH_SECRET` 으로 NextAuth 세션 쿠키를 만들고 `backend_access_token` 쿠키와 함께 넣는다 |
| project | `mobile`(390×844), `desktop`(1280×900). 같은 spec 을 두 폭으로 돌린다 |

### 단언 방식

- 여백과 위치는 `boundingBox()` 와 `getComputedStyle()` 로 숫자를 단언한다. 스크린샷 비교는 쓰지 않는다.
- 폭에 따라 기대값이 다르면 `testInfo.project.name` 으로 나눈다.

### 새 화면을 검사할 때

1. 그 화면이 부르는 백엔드 경로를 가짜 백엔드에 더한다.
2. `browser/{화면}.spec.ts` 를 만든다.

---

## 7. 실행 방법

```bash
# 전체 테스트
pnpm test

# 특정 테스트
pnpm test -- --testPathPattern="recurring-expense"

# CI 모드
pnpm test:ci

# 타입 검사
pnpm exec tsc --noEmit

# 브라우저 테스트 (처음 한 번 pnpm exec playwright install chromium)
pnpm test:browser
```

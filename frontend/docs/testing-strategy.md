# Testing Strategy — fos-accountbook (Frontend)

> 최종 업데이트: 2026-04-04

## 1. 테스트 피라미드

```
┌─────────────────────────────────────┐
│   E2E (Playwright, Docker Compose)  │  ← 향후 구축. CI-only
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
| E2E       | Playwright + Docker Compose (예정) | 실제 브라우저에서 전체 플로우 검증              | CI pipeline |

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
          repository: jon890/fos-accountbook-backend
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

## 6. E2E 테스트 (향후)

### 구조

```yaml
# docker-compose.test.yml
services:
  backend:
    image: fos-accountbook-backend:test
    environment:
      SPRING_PROFILES_ACTIVE: test
  frontend:
    build: .
    depends_on: [backend]
  playwright:
    image: mcr.microsoft.com/playwright:latest
    depends_on: [frontend]
    command: npx playwright test
```

### 우선 E2E 시나리오

1. 로그인 → 거래 내역 → 반복 지출 탭 → 목록 조회
2. 반복 지출 추가 → 목록에 표시 확인
3. 대시보드 → 반복 지출 카드 금액 표시 확인

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
```

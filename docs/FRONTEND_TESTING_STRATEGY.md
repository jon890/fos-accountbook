# 프론트엔드 테스트 전략

## 📋 개요

이 문서는 프론트엔드 프로젝트에서 의존성 업그레이드(특히 Next.js 15 → 16) 시 수행해야 할 테스트 전략을 설명합니다.

---

## 🧪 테스트 계층 구조

### 1. 단위 테스트 (Unit Tests)

**목적:** 개별 함수, 컴포넌트, 유틸리티의 동작 검증

**범위:**
- 유틸리티 함수 (`src/lib/utils/`)
- 순수 함수 (부수 효과 없음)
- 컴포넌트 렌더링 (Props 기반)

**실행:**
```bash
pnpm test:unit
```

**예시:**
```typescript
// src/__tests__/lib/utils/format.test.ts
import { formatCurrency } from '@/lib/utils/format';

describe('formatCurrency', () => {
  it('숫자를 한국 원화 형식으로 변환한다', () => {
    expect(formatCurrency(50000)).toBe('₩50,000');
  });
});
```

---

### 2. 컴포넌트 테스트 (Component Tests)

**목적:** React 컴포넌트의 렌더링 및 상호작용 검증

**범위:**
- UI 컴포넌트 (`src/components/ui/`)
- 도메인 컴포넌트 (`src/components/expenses/`, `src/components/incomes/`)
- 폼 컴포넌트

**실행:**
```bash
pnpm test
```

**예시:**
```typescript
// src/__tests__/components/ui/SubmitButton.test.tsx
import { render, screen } from '@testing-library/react';
import { SubmitButton } from '@/components/ui/submit-button';

jest.mock('react-dom', () => ({
  useFormStatus: jest.fn(),
}));

describe('SubmitButton', () => {
  it('pending 상태일 때 버튼이 비활성화된다', () => {
    useFormStatus.mockReturnValue({ pending: true });
    render(<SubmitButton>제출</SubmitButton>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

---

### 3. 통합 테스트 (Integration Tests)

**목적:** 여러 컴포넌트나 모듈이 함께 작동하는 방식 검증

**범위:**
- Server Actions (`src/app/actions/`)
- API 통신 (`src/lib/server/api/client.ts`)
- 인증 플로우 (`src/lib/server/auth-helpers.ts`)

**실행:**
```bash
pnpm test:integration
```

**예시:**
```typescript
// src/__tests__/actions/expense/create-expense-action.test.ts
import { createExpenseAction } from '@/app/actions/expense/create-expense-action';

jest.mock('@/lib/server/auth-helpers');
jest.mock('@/lib/server/api/client');

describe('createExpenseAction', () => {
  it('유효한 데이터로 지출 생성에 성공한다', async () => {
    mockRequireAuth.mockResolvedValue(undefined);
    mockServerApiClient.mockResolvedValue({ data: { uuid: 'test' } });
    
    const formData = new FormData();
    formData.append('amount', '50000');
    
    const result = await createExpenseAction(initialState, formData);
    
    expect(result.success).toBe(true);
  });
});
```

---

### 4. E2E 테스트 (End-to-End Tests)

**목적:** 사용자 관점에서 전체 애플리케이션 플로우 검증

**권장 도구:**
- Playwright (권장)
- Cypress

**주요 테스트 시나리오:**

1. **인증 플로우:**
   - 로그인 → 대시보드 이동
   - 로그아웃 → 로그인 페이지 이동

2. **지출 관리:**
   - 지출 추가 → 목록에 표시
   - 지출 수정 → 변경사항 반영
   - 지출 삭제 → 목록에서 제거

3. **수입 관리:**
   - 수입 추가 → 목록에 표시
   - 수입 수정 → 변경사항 반영

4. **가족 관리:**
   - 가족 선택 → 대시보드 업데이트
   - 가족 초대 → 초대 수락

5. **설정:**
   - 프로필 수정 → 변경사항 저장
   - 기본 가족 설정 → 쿠키 저장

**설정 예시 (Playwright):**
```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test('로그인 후 대시보드로 이동', async ({ page }) => {
  await page.goto('/auth/signin');
  // 로그인 로직
  await expect(page).toHaveURL('/dashboard');
});
```

---

## 🔄 업그레이드 시 테스트 절차

### 1단계: 사전 테스트 (업그레이드 전)

```bash
# 현재 상태에서 모든 테스트 통과 확인
pnpm test:ci

# 프로덕션 빌드 성공 확인
pnpm build

# 타입 체크
pnpm tsc --noEmit

# 린트 체크
pnpm lint
```

**목적:** 업그레이드 전 기준선(baseline) 확보

---

### 2단계: 의존성 업그레이드

```bash
# 브랜치 생성
git checkout -b upgrade/nextjs-16

# 의존성 업그레이드
pnpm add next@16 eslint-config-next@16

# 파일명 변경 (middleware.ts → proxy.ts)
mv src/middleware.ts src/proxy.ts

# 의존성 설치
pnpm install
```

---

### 3단계: 타입 및 빌드 확인

```bash
# TypeScript 타입 체크
pnpm tsc --noEmit

# ESLint 체크
pnpm lint

# 프로덕션 빌드
pnpm build
```

**확인 사항:**
- 타입 에러 없음
- 린트 에러 없음
- 빌드 성공
- 빌드 시간 변화 확인

---

### 4단계: 자동화된 테스트 실행

```bash
# 전체 테스트 실행
pnpm test:ci

# 커버리지 확인
pnpm test:coverage
```

**확인 사항:**
- 모든 테스트 통과
- 테스트 커버리지 유지 (또는 향상)
- 테스트 실행 시간 변화 확인

---

### 5단계: 개발 서버 테스트

```bash
# 개발 서버 실행
pnpm dev
```

**수동 테스트 체크리스트:**

- [ ] **페이지 렌더링:**
  - [ ] 홈 페이지 (`/`)
  - [ ] 대시보드 (`/dashboard`)
  - [ ] 지출 페이지 (`/expenses`)
  - [ ] 수입 페이지 (`/incomes`)
  - [ ] 설정 페이지 (`/settings`)

- [ ] **인증 플로우:**
  - [ ] 로그인 성공
  - [ ] 로그아웃 성공
  - [ ] 인증되지 않은 사용자 리다이렉트

- [ ] **주요 기능:**
  - [ ] 지출 추가/수정/삭제
  - [ ] 수입 추가/수정/삭제
  - [ ] 가족 선택
  - [ ] 프로필 수정

- [ ] **에러 확인:**
  - [ ] 브라우저 콘솔 에러 없음
  - [ ] 네트워크 탭에서 API 호출 정상
  - [ ] 서버 로그 에러 없음

---

### 6단계: 프로덕션 빌드 테스트

```bash
# 프로덕션 빌드
pnpm build

# 프로덕션 서버 실행
pnpm start
```

**확인 사항:**
- 빌드 성공
- 빌드 시간 확인
- 프로덕션 서버 정상 실행
- 프로덕션 환경에서 기능 정상 작동

---

### 7단계: 성능 테스트

**측정 항목:**
- 빌드 시간 (Before/After 비교)
- 페이지 로드 시간
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Time to Interactive (TTI)

**도구:**
- Lighthouse (Chrome DevTools)
- WebPageTest
- Vercel Analytics

---

### 8단계: 모바일 테스트

**테스트 환경:**
- 실제 모바일 기기 (iOS/Android)
- 모바일 브라우저 (Safari/Chrome)
- 반응형 디자인 확인

**확인 사항:**
- 터치 이벤트 정상 작동
- 모바일 브라우저에서 쿠키 정상 작동
- 반응형 레이아웃 정상
- 성능 (모바일 네트워크 환경)

---

### 9단계: 스테이징 배포

**Vercel 스테이징 환경:**
```bash
# Vercel에 배포
vercel --prod=false
```

**확인 사항:**
- 스테이징 환경에서 모든 기능 정상 작동
- 에러 로그 확인
- 성능 모니터링

---

## 📊 테스트 커버리지 목표

**현재 목표:**
- 단위 테스트: 80% 이상
- 컴포넌트 테스트: 70% 이상
- 통합 테스트: 60% 이상
- E2E 테스트: 주요 플로우 커버

**업그레이드 후:**
- 기존 커버리지 유지 또는 향상
- 새로운 기능에 대한 테스트 추가

---

## 🛠 테스트 도구

### 현재 사용 중

- **Jest**: 테스트 러너
- **React Testing Library**: 컴포넌트 테스트
- **MSW**: API 모킹

### 권장 추가 도구

- **Playwright**: E2E 테스트
- **Lighthouse CI**: 성능 테스트
- **Storybook**: 컴포넌트 문서화 및 테스트

---

## 📝 테스트 작성 가이드

### AAA 패턴 (Arrange-Act-Assert)

```typescript
describe('formatCurrency', () => {
  it('숫자를 한국 원화 형식으로 변환한다', () => {
    // Arrange: 테스트 데이터 준비
    const amount = 50000;
    
    // Act: 테스트 실행
    const result = formatCurrency(amount);
    
    // Assert: 결과 검증
    expect(result).toBe('₩50,000');
  });
});
```

### Given-When-Then 패턴

```typescript
describe('createExpenseAction', () => {
  it('유효한 데이터로 지출 생성에 성공한다', async () => {
    // Given: 테스트 조건 설정
    mockRequireAuth.mockResolvedValue(undefined);
    mockServerApiClient.mockResolvedValue({ data: { uuid: 'test' } });
    
    const formData = new FormData();
    formData.append('amount', '50000');
    
    // When: 액션 실행
    const result = await createExpenseAction(initialState, formData);
    
    // Then: 결과 검증
    expect(result.success).toBe(true);
    expect(mockServerApiClient).toHaveBeenCalledWith(
      expect.stringContaining('/expenses'),
      expect.objectContaining({ method: 'POST' })
    );
  });
});
```

---

## ⚠️ 주의사항

### 1. 모킹 전략

**✅ 올바른 모킹:**
- 외부 API만 모킹
- Next.js 의존성 모킹 (auth, cookies, cache)

**❌ 피해야 할 모킹:**
- 내부 컴포넌트 모킹 (실제 렌더링 테스트)
- 유틸리티 함수 모킹 (실제 로직 테스트)

### 2. 테스트 격리

- 각 테스트는 독립적으로 실행 가능해야 함
- 테스트 간 상태 공유 금지
- `beforeEach`/`afterEach`로 정리

### 3. 비동기 처리

```typescript
// ✅ 올바른 비동기 테스트
it('비동기 작업을 처리한다', async () => {
  const result = await asyncFunction();
  expect(result).toBe(expected);
});

// ❌ 잘못된 비동기 테스트
it('비동기 작업을 처리한다', () => {
  asyncFunction().then(result => {
    expect(result).toBe(expected); // 테스트가 완료되기 전에 종료될 수 있음
  });
});
```

---

## 📚 참고 자료

- [Jest 공식 문서](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright 공식 문서](https://playwright.dev/)
- [Next.js 테스트 가이드](https://nextjs.org/docs/app/building-your-application/testing)

---

**작성일:** 2025-11-12  
**최종 업데이트:** 테스트 전략 개선 시 업데이트


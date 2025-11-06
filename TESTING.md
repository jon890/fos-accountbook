# 프론트엔드 테스트 전략

## 📊 테스트 피라미드

```
        /\
       /E2E\         적음 (느림, 비용 높음)
      /------\
     /Integration\   중간
    /--------------\
   /   Unit Tests   \ 많음 (빠름, 비용 낮음)
  /------------------\
```

## 1. Unit Tests (70%)

**목적**: 개별 함수, 유틸리티, 훅 테스트

**도구**: Jest

**예시**:

- 날짜 포맷 함수
- 데이터 변환 함수
- 커스텀 훅

## 2. Component Tests (20%)

**목적**: 컴포넌트 렌더링 및 사용자 상호작용

**도구**: Jest + React Testing Library

**테스트 항목**:

- ✅ 렌더링 확인
- ✅ 사용자 이벤트 (클릭, 입력)
- ✅ 조건부 렌더링
- ✅ Props 변경 대응

## 3. Integration Tests (8%)

**목적**: Server Actions, API 통신 테스트

**도구**: Jest + MSW (Mock Service Worker)

**테스트 항목**:

- ✅ Server Actions 호출
- ✅ 에러 처리
- ✅ 로딩 상태
- ✅ 성공/실패 플로우

## 4. E2E Tests (2%)

**목적**: 실제 사용자 플로우 테스트

**도구**: Playwright (추천)

**테스트 항목**:

- ✅ 로그인 → 지출 추가 → 확인
- ✅ 가족 생성 → 초대 → 수락
- ✅ 크리티컬 비즈니스 플로우

---

## 📝 테스트 작성 원칙

### AAA 패턴

```typescript
test('description', () => {
  // Arrange: 준비
  const input = { ... }

  // Act: 실행
  const result = function(input)

  // Assert: 검증
  expect(result).toBe(expected)
})
```

### Given-When-Then

```typescript
test('지출 수정 시 성공 메시지 표시', async () => {
  // Given: 지출 수정 다이얼로그가 열려있고
  render(<EditExpenseDialog ... />)

  // When: 금액을 수정하고 저장하면
  await userEvent.type(screen.getByLabelText('금액'), '50000')
  await userEvent.click(screen.getByRole('button', { name: '수정하기' }))

  // Then: 성공 메시지가 표시된다
  expect(await screen.findByText('지출이 수정되었습니다')).toBeInTheDocument()
})
```

---

## 🚀 실행 방법

```bash
# 전체 테스트
pnpm test

# Watch 모드
pnpm test:watch

# 커버리지
pnpm test:coverage

# 특정 파일만
pnpm test ExpenseItem

# CI 모드
pnpm test:ci
```

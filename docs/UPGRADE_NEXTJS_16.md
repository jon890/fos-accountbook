# Next.js 15 → 16 업그레이드 가이드

## 📋 개요

이 문서는 Next.js 15.5.4에서 Next.js 16으로 업그레이드할 때 고려해야 할 사항과 마이그레이션 절차를 설명합니다.

**현재 상태:**
- Next.js: 15.5.4
- React: 19.2.0
- TypeScript: 5.x
- Node.js: 22.x

---

## ⚠️ 주요 변경사항 (Breaking Changes)

### 1. Middleware 파일명 변경

**변경 전:**
```
src/middleware.ts
```

**변경 후:**
```
src/proxy.ts
```

**영향:**
- `middleware.ts` 파일이 `proxy.ts`로 이름 변경 필요
- 기존 `middleware` 함수는 그대로 유지 가능

**마이그레이션:**
```bash
# 파일명 변경
mv src/middleware.ts src/proxy.ts
```

---

### 2. 최소 요구사항 변경

**Node.js:**
- 최소 버전이 상향 조정될 수 있음 (현재 22.x 사용 중이므로 문제 없음)

**TypeScript:**
- TypeScript 5가 최소 버전 (현재 사용 중이므로 문제 없음)

---

### 3. Turbopack 정식 채택

**변경사항:**
- Turbopack이 기본 빌드 도구로 채택됨
- `--turbopack` 플래그가 더 이상 필요 없을 수 있음

**현재 설정:**
```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build --turbopack"
  }
}
```

**마이그레이션 후:**
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build"
  }
}
```

---

### 4. React Compiler 통합

**변경사항:**
- React Compiler가 자동으로 통합됨
- 성능 최적화가 자동으로 적용됨

**주의사항:**
- 기존 코드는 대부분 호환되지만, 일부 패턴이 변경될 수 있음
- 테스트를 통해 확인 필요

---

### 5. 의존성 호환성 확인

**확인 필요 항목:**
- `next-auth` (Auth.js v5): Next.js 16 호환성 확인 필요
- `@radix-ui/*`: 호환성 확인 필요
- `react-hook-form`: 호환성 확인 필요
- 기타 서드파티 라이브러리

---

## 🧪 테스트 전략

### 1. 개발 환경 테스트

```bash
# 1. 의존성 업그레이드
pnpm install next@16 react@latest react-dom@latest eslint-config-next@16

# 2. 개발 서버 실행
pnpm dev

# 3. 주요 기능 수동 테스트
# - 로그인/로그아웃
# - 페이지 네비게이션
# - 폼 제출
# - API 호출
```

### 2. 빌드 테스트

```bash
# 프로덕션 빌드 테스트
pnpm build

# 빌드 성공 확인
# - 타입 에러 없음
# - 빌드 경고 없음
# - 빌드 시간 확인
```

### 3. 자동화된 테스트

```bash
# 전체 테스트 실행
pnpm test

# 통합 테스트
pnpm test:integration

# 단위 테스트
pnpm test:unit

# 커버리지 확인
pnpm test:coverage
```

### 4. E2E 테스트 (권장)

**추가 도구:**
- Playwright 또는 Cypress 사용 권장
- 주요 사용자 플로우 테스트:
  - 로그인 → 대시보드 → 지출 추가 → 수입 추가
  - 가족 선택 → 설정 변경
  - 초대 수락 → 가족 멤버 추가

---

## 📝 마이그레이션 체크리스트

### 사전 준비

- [ ] 현재 프로젝트의 모든 기능이 정상 작동하는지 확인
- [ ] 테스트 커버리지 확인 (최소 70% 이상 권장)
- [ ] 백업 브랜치 생성 (`git checkout -b backup-before-nextjs-16`)

### 업그레이드 단계

- [ ] `package.json`에서 Next.js 버전 업데이트
- [ ] `middleware.ts` → `proxy.ts` 파일명 변경
- [ ] `package.json`의 `--turbopack` 플래그 제거 (필요시)
- [ ] 의존성 설치 (`pnpm install`)
- [ ] 타입 체크 (`pnpm tsc --noEmit`)
- [ ] 린트 체크 (`pnpm lint`)

### 테스트 단계

- [ ] 개발 서버 실행 및 기본 기능 테스트
- [ ] 프로덕션 빌드 테스트
- [ ] 자동화된 테스트 실행 (모든 테스트 통과 확인)
- [ ] 주요 페이지 수동 테스트:
  - [ ] 홈 페이지
  - [ ] 대시보드
  - [ ] 지출/수입 페이지
  - [ ] 설정 페이지
  - [ ] 가족 선택 페이지
- [ ] 인증 플로우 테스트 (로그인/로그아웃)
- [ ] API 호출 테스트
- [ ] 모바일 환경 테스트

### 배포 전 확인

- [ ] Vercel 스테이징 환경에 배포
- [ ] 스테이징 환경에서 전체 기능 테스트
- [ ] 성능 모니터링 (빌드 시간, 페이지 로드 시간)
- [ ] 에러 로그 확인

---

## 🚀 마이그레이션 절차

### 1단계: 브랜치 생성

```bash
git checkout -b upgrade/nextjs-16
```

### 2단계: 의존성 업데이트

```bash
# Next.js 16 설치
pnpm add next@16 eslint-config-next@16

# React 최신 버전 확인 (필요시)
pnpm add react@latest react-dom@latest

# 의존성 업데이트
pnpm install
```

### 3단계: 파일명 변경

```bash
# middleware.ts → proxy.ts
mv src/middleware.ts src/proxy.ts
```

### 4단계: 설정 파일 업데이트

**package.json:**
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build"
  }
}
```

### 5단계: 타입 및 린트 확인

```bash
# TypeScript 타입 체크
pnpm tsc --noEmit

# ESLint 체크
pnpm lint
```

### 6단계: 테스트 실행

```bash
# 전체 테스트
pnpm test

# 빌드 테스트
pnpm build
```

### 7단계: 수동 테스트

- 개발 서버 실행 (`pnpm dev`)
- 주요 기능 테스트
- 브라우저 콘솔 에러 확인
- 네트워크 탭에서 API 호출 확인

### 8단계: 커밋 및 PR 생성

```bash
git add .
git commit -m "chore: Next.js 15 → 16 업그레이드

- middleware.ts → proxy.ts 파일명 변경
- Turbopack 플래그 제거 (기본값으로 변경)
- 의존성 업데이트"

git push origin upgrade/nextjs-16
```

---

## 🔍 주의사항

### 1. 호환성 문제

**next-auth (Auth.js v5):**
- Next.js 16과의 호환성 확인 필요
- 공식 문서 확인: https://authjs.dev/getting-started/installation

**서드파티 라이브러리:**
- 모든 라이브러리가 Next.js 16을 지원하는지 확인
- 지원하지 않는 경우 대체 라이브러리 검토

### 2. 성능 모니터링

**빌드 시간:**
- 빌드 시간이 크게 증가하지 않는지 확인
- Turbopack 기본 사용으로 빌드 시간 감소 예상

**런타임 성능:**
- 페이지 로드 시간 확인
- React Compiler로 인한 성능 향상 확인

### 3. 에러 처리

**타입 에러:**
- TypeScript 타입 에러가 발생할 수 있음
- `@types/*` 패키지 업데이트 필요할 수 있음

**런타임 에러:**
- 브라우저 콘솔 에러 확인
- 서버 로그 확인

---

## 📚 참고 자료

- [Next.js 16 공식 문서](https://nextjs.org/docs)
- [Next.js 16 릴리스 노트](https://github.com/vercel/next.js/releases)
- [React 19 문서](https://react.dev)
- [Turbopack 문서](https://nextjs.org/docs/app/api-reference/next-cli#turbopack)

---

## ✅ 완료 후 확인사항

마이그레이션 완료 후 다음을 확인하세요:

1. **기능 정상 작동:**
   - 모든 페이지가 정상적으로 렌더링됨
   - API 호출이 정상적으로 작동함
   - 인증 플로우가 정상적으로 작동함

2. **성능 개선:**
   - 빌드 시간이 감소했는지 확인
   - 페이지 로드 시간이 개선되었는지 확인

3. **에러 없음:**
   - 브라우저 콘솔에 에러가 없음
   - 서버 로그에 에러가 없음
   - 타입 에러가 없음

4. **테스트 통과:**
   - 모든 자동화된 테스트가 통과함
   - 테스트 커버리지가 유지됨

---

**작성일:** 2025-11-12  
**최종 업데이트:** Next.js 16 정식 릴리스 후 업데이트 필요


# CI/CD 설정 가이드

## 🎯 개요

이 프로젝트는 GitHub Actions를 사용하여 자동화된 CI/CD 파이프라인을 구성합니다.

---

## 📋 CI 워크플로우

### Frontend CI (`frontend-ci.yml`)

**트리거:**
- `main`, `develop` 브랜치에 push
- `main`, `develop` 브랜치로 Pull Request

**단계:**
1. ✅ TypeScript 타입 체크
2. ✅ ESLint 실행
3. ✅ Jest 테스트 (커버리지 포함)
4. ✅ Next.js 빌드
5. ✅ Codecov 업로드

**필요한 환경변수:**
- GitHub Secrets에 다음 변수 추가:
  ```
  NEXTAUTH_SECRET
  NEXTAUTH_URL
  GOOGLE_CLIENT_ID
  GOOGLE_CLIENT_SECRET
  NEXT_PUBLIC_BACKEND_URL
  ```

### Backend CI (`backend-ci.yml`)

**트리거:**
- `main`, `develop` 브랜치에 push
- `main`, `develop` 브랜치로 Pull Request

**단계:**
1. ✅ MySQL 테스트 DB 구성
2. ✅ JUnit 테스트 실행
3. ✅ Jacoco 커버리지 생성
4. ✅ Gradle 빌드
5. ✅ Codecov 업로드

**필요한 환경변수:**
- 테스트 환경은 `application-test.yml`에서 관리
- CI에서는 MySQL 서비스 컨테이너 사용

---

## 🚀 로컬에서 테스트 실행

### Frontend

```bash
# 전체 테스트
pnpm test

# CI 모드로 테스트 (커버리지 포함)
pnpm test:ci

# Watch 모드
pnpm test:watch

# 커버리지만
pnpm test:coverage
```

### Backend

```bash
# 전체 테스트
./gradlew test

# 커버리지 리포트 생성
./gradlew jacocoTestReport

# 테스트 + 빌드
./gradlew build
```

---

## 📊 코드 커버리지

### Codecov 설정

1. [Codecov](https://codecov.io)에 GitHub 계정으로 로그인
2. 프로젝트 저장소 연동
3. 자동으로 커버리지 리포트 업로드됨

### 커버리지 뱃지 추가 (README.md)

```markdown
[![Frontend Coverage](https://codecov.io/gh/your-username/fos-accountbook/branch/main/graph/badge.svg?flag=frontend)](https://codecov.io/gh/your-username/fos-accountbook)
[![Backend Coverage](https://codecov.io/gh/your-username/fos-accountbook-backend/branch/main/graph/badge.svg?flag=backend)](https://codecov.io/gh/your-username/fos-accountbook-backend)
```

---

## 🔐 GitHub Secrets 설정

### Frontend Repository

Settings → Secrets and variables → Actions → New repository secret

필수 시크릿:
- `NEXTAUTH_SECRET`: NextAuth.js 암호화 키
- `NEXTAUTH_URL`: 프로덕션 URL
- `GOOGLE_CLIENT_ID`: Google OAuth 클라이언트 ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth 클라이언트 시크릿
- `NEXT_PUBLIC_BACKEND_URL`: 백엔드 API URL

### Backend Repository

현재 테스트는 별도 시크릿 불필요 (application-test.yml 사용)

프로덕션 배포 시 Railway 환경변수 사용

---

## 🎨 CI 워크플로우 커스터마이징

### 특정 브랜치만 테스트

```yaml
on:
  push:
    branches: [main, develop, feature/*]
```

### 특정 경로만 트리거

```yaml
on:
  push:
    paths:
      - 'src/**'
      - 'package.json'
      - '.github/workflows/**'
```

### 병렬 테스트 (Matrix Strategy)

```yaml
strategy:
  matrix:
    node-version: [18.x, 20.x]
    os: [ubuntu-latest, windows-latest]
```

---

## 🐛 트러블슈팅

### Frontend

**문제: 테스트 시간 초과**
```bash
# jest.config.js에 추가
testTimeout: 10000
```

**문제: 환경변수 로드 안됨**
```bash
# CI 워크플로우에 env 추가
env:
  NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET }}
```

### Backend

**문제: MySQL 연결 실패**
```yaml
# MySQL 서비스 health check 확인
options: >-
  --health-cmd="mysqladmin ping"
  --health-interval=10s
```

**문제: Jacoco 리포트 생성 안됨**
```bash
# 로컬에서 확인
./gradlew clean test jacocoTestReport
```

---

## 📈 성능 최적화

### 캐싱 활용

**pnpm 캐시:**
```yaml
- uses: actions/setup-node@v4
  with:
    cache: 'pnpm'
```

**Gradle 캐시:**
```yaml
- uses: actions/setup-java@v4
  with:
    cache: 'gradle'
```

### 병렬 실행

```bash
# Frontend: Jest 병렬 실행
pnpm test:ci  # 기본적으로 --maxWorkers=2

# Backend: Gradle 병렬 실행
./gradlew test --parallel
```

---

## 🔄 CD (배포)

### Frontend - Vercel

Vercel은 GitHub 연동으로 자동 배포:
1. `main` 브랜치 push → Production 배포
2. PR 생성 → Preview 배포

### Backend - Railway

Railway는 GitHub 연동으로 자동 배포:
1. `main` 브랜치 push → Production 배포
2. 환경변수는 Railway Dashboard에서 관리

---

## 📝 체크리스트

### PR 전 확인사항

- [ ] `pnpm test:ci` 통과
- [ ] `pnpm lint` 통과
- [ ] `pnpm build` 성공
- [ ] `./gradlew test` 통과 (백엔드)
- [ ] 커버리지 80% 이상 유지
- [ ] 새로운 기능에 테스트 추가

### 배포 전 확인사항

- [ ] 모든 CI 테스트 통과
- [ ] 환경변수 설정 완료
- [ ] DB 마이그레이션 확인 (백엔드)
- [ ] Preview 환경에서 QA 완료


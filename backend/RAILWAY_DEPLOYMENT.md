# Railway 배포 퀵스타트 가이드

이 문서는 Railway를 사용한 빠른 배포를 위한 체크리스트입니다.

## 🚀 빠른 시작 (5분 배포)

### 1단계: Railway 프로젝트 생성
```bash
1. https://railway.app 접속
2. GitHub으로 로그인
3. "New Project" 클릭
```

### 2단계: MySQL 추가
```bash
1. "New" → "Database" → "Add MySQL"
2. MySQL 서비스 자동 생성 완료
```

### 3단계: 앱 배포
```bash
1. "New" → "GitHub Repo" → 레포지터리 선택
2. 자동 빌드 시작 (Dockerfile 감지)
```

### 4단계: 환경변수 설정
```bash
# Variables 탭에서 추가

# ⚠️ Railway MySQL 자동 주입 변수 (자동으로 설정됨)
# MYSQL_HOST=${{MySQL.MYSQL_HOST}}           # mysql.railway.internal
# MYSQL_PORT=${{MySQL.MYSQL_PORT}}           # 3306
# MYSQL_DATABASE=${{MySQL.MYSQL_DATABASE}}   # railway
# MYSQL_USER=${{MySQL.MYSQL_USER}}           # root
# MYSQL_PASSWORD=${{MySQL.MYSQL_PASSWORD}}   # 자동 생성

# 🔧 수동으로 추가해야 하는 변수
JWT_SECRET=your-super-secret-key-at-least-256-bits-long-required-for-hs512
JWT_EXPIRATION=86400000
JWT_REFRESH_EXPIRATION=604800000
SWAGGER_ENABLED=false
SPRING_PROFILES_ACTIVE=prod
```

**✅ Railway MySQL 변수 자동 주입**:
Railway는 MySQL 서비스를 추가하면 다음 환경변수를 **자동으로 주입**합니다:
- `MYSQL_HOST`: mysql.railway.internal
- `MYSQL_PORT`: 3306
- `MYSQL_DATABASE`: railway
- `MYSQL_USER`: root
- `MYSQL_PASSWORD`: 자동 생성된 비밀번호

이 변수들은 `application.yml`에서 자동으로 읽어서 JDBC URL을 구성합니다:
```yaml
jdbc:mysql://${MYSQL_HOST}:${MYSQL_PORT}/${MYSQL_DATABASE}
```

**⚠️ 중요**: `SPRING_PROFILES_ACTIVE=prod` 설정은 **필수**입니다!
- 콘솔 로깅 사용 (Railway가 자동 수집)
- 파일 로깅 비활성화 (컨테이너 환경에 적합)

### 5단계: 도메인 생성
```bash
1. Settings → Networking
2. "Generate Domain" 클릭
3. https://your-app.railway.app 획득
```

### 6단계: 확인
```bash
curl https://your-app.railway.app/api/v1/health
```

**예상 응답:**
```json
{"status":"UP"}
```

## ✅ 배포 체크리스트

### 배포 전
- [ ] GitHub에 코드 푸시
- [ ] `Dockerfile`, `railway.json` 파일 확인
- [ ] `.dockerignore` 파일 확인
- [ ] JWT_SECRET 생성 (256bit 이상)

### Railway 설정
- [ ] MySQL 데이터베이스 추가
- [ ] Spring Boot 앱 배포
- [ ] 환경변수 모두 설정
- [ ] 도메인 생성

### 배포 후
- [ ] Health Check 테스트 (`/api/v1/health`)
- [ ] Swagger 접근 가능 여부 확인 (프로덕션에서는 비활성화 권장)
- [ ] 데이터베이스 마이그레이션 확인
- [ ] 로그 확인

### 프론트엔드 연동
- [ ] Railway 앱 URL을 프론트엔드에 설정
- [ ] CORS 설정 확인
- [ ] Auth.js에 백엔드 URL 추가

## 🔑 환경변수 가이드

### Railway MySQL 자동 주입 변수 (설정 불필요 ✅)

| 변수명 | 설명 | 예시 |
|--------|------|------|
| `MYSQL_HOST` | MySQL 호스트 | `mysql.railway.internal` |
| `MYSQL_PORT` | MySQL 포트 | `3306` |
| `MYSQL_DATABASE` | 데이터베이스명 | `railway` |
| `MYSQL_USER` | DB 사용자명 | `root` |
| `MYSQL_PASSWORD` | DB 비밀번호 | 자동 생성 |

**📝 참고**: Railway가 MySQL 서비스를 자동으로 연결하면 위 변수들이 **자동으로 주입**됩니다.

### 수동 설정 필요 변수 (직접 추가 ⚙️)

| 변수명 | 설명 | 예시 | 필수 여부 |
|--------|------|------|----------|
| `JWT_SECRET` | JWT 서명 키 (256bit+) | `openssl rand -base64 64` 로 생성 | ✅ 필수 |
| `JWT_EXPIRATION` | Access Token 만료 시간 (밀리초) | `86400000` (24시간) | ⚪ 선택 |
| `JWT_REFRESH_EXPIRATION` | Refresh Token 만료 시간 (밀리초) | `604800000` (7일) | ⚪ 선택 |
| `SWAGGER_ENABLED` | Swagger UI 활성화 | `false` (프로덕션 권장) | ⚪ 선택 |
| `SPRING_PROFILES_ACTIVE` | Spring Profile | `prod` | ✅ **필수** |

## 🐛 트러블슈팅

### 로그 파일 오류

**문제**: `FileNotFoundException: logs/application.log (No such file or directory)`

**원인**: Railway는 컨테이너 환경으로 파일 시스템이 ephemeral(임시)입니다.

**해결**: `SPRING_PROFILES_ACTIVE=prod` 환경변수 설정 (**필수**)

```bash
# Railway Variables 탭에서 설정
SPRING_PROFILES_ACTIVE=prod
```

**이렇게 하면**:
- ✅ 콘솔 로깅만 사용 (stdout/stderr)
- ✅ Railway가 자동으로 로그 수집 및 표시
- ✅ 파일 로깅 비활성화 (불필요)
- ✅ 컨테이너 재시작 시에도 로그 유지

**Railway에서 로그 확인**:
```bash
# Railway 대시보드
프로젝트 → 서비스 → Logs 탭

# Railway CLI
railway logs
railway logs --follow
```

### Gradle 빌드 오류

**해결됨**: Dockerfile에서 Gradle 이미지의 `gradle` 명령어를 직접 사용하므로 `gradle-wrapper.jar` 파일은 필요하지 않습니다.

**빌드 방식**:
- ✅ Gradle 이미지 (`gradle:8.14-jdk21-alpine`) 사용
- ✅ `gradle` 명령어로 직접 빌드
- ❌ `./gradlew` 사용 안 함 (wrapper 불필요)

### 빌드 실패
```
1. Railway 로그에서 에러 메시지 확인
2. 로컬에서 빌드 테스트: ./gradlew clean build -x test
3. 메모리 부족 시: Settings → Resources → 메모리 증가 (최소 2GB 권장)
4. Docker 로컬 테스트: docker build -t test .
```

### JDBC URL 오류 (Railway MySQL)

**문제**: `Driver com.mysql.cj.jdbc.Driver claims to not accept jdbcUrl, mysql://...`

**원인**: Railway의 `MYSQL_URL`은 `mysql://` 프로토콜을 사용하지만, JDBC는 `jdbc:mysql://` 형식을 기대합니다.

**해결**: ✅ 이미 해결됨! `application.yml`이 Railway의 자동 주입 변수를 사용합니다:

```yaml
# application.yml에서 자동으로 JDBC URL 구성
spring:
  datasource:
    url: jdbc:mysql://${MYSQL_HOST}:${MYSQL_PORT}/${MYSQL_DATABASE}
    username: ${MYSQL_USER}
    password: ${MYSQL_PASSWORD}
```

**Railway MySQL 자동 주입 변수**:
- `MYSQL_HOST`: mysql.railway.internal
- `MYSQL_PORT`: 3306
- `MYSQL_DATABASE`: railway
- `MYSQL_USER`: root
- `MYSQL_PASSWORD`: 자동 생성

**⚠️ 주의**: 이전처럼 `DATABASE_URL`, `DB_USERNAME`, `DB_PASSWORD`를 수동으로 설정하지 마세요!

### 데이터베이스 연결 실패
```bash
# 1. MySQL 서비스 상태 확인
Railway 대시보드 → MySQL 서비스 → Status: Running 확인

# 2. 자동 주입 변수 확인 (Spring Boot 앱의 Variables 탭)
MYSQL_HOST=mysql.railway.internal    # Railway가 자동 주입
MYSQL_PORT=3306                      # Railway가 자동 주입
MYSQL_DATABASE=railway               # Railway가 자동 주입
MYSQL_USER=root                      # Railway가 자동 주입
MYSQL_PASSWORD=***                   # Railway가 자동 주입

# 3. 서비스 재시작
Railway 대시보드 → Spring Boot 앱 → Deploy → Restart

# 4. 로그 확인
Railway 대시보드 → Spring Boot 앱 → Logs 탭
# "HikariPool-1 - Started" 메시지 확인
```

**주의**: Railway가 MySQL 변수를 자동으로 주입하려면 두 서비스가 **같은 프로젝트**에 있어야 합니다!

### Health Check 실패
```
1. 앱 로그 확인: railway logs
2. PORT 환경변수 자동 주입 확인
3. 컨텍스트 경로 확인: /api/v1/health
```

### 마이그레이션 오류
```
1. Railway MySQL 콘솔에서 테이블 확인
2. Flyway 히스토리: SELECT * FROM flyway_schema_history;
3. 필요시 clean-disabled=false로 초기화 (주의!)
```

## 📱 Railway CLI 사용법

```bash
# CLI 설치
npm i -g @railway/cli

# 로그인
railway login

# 프로젝트 연결
railway link

# 실시간 로그
railway logs

# 환경변수 확인
railway variables

# 로컬에서 Railway 환경으로 실행
railway run ./gradlew bootRun
```

## 💰 비용

- **무료 크레딧**: $5/월
- **MySQL**: ~$1-2/월
- **Spring Boot**: ~$3-5/월
- **총 예상**: ~$4-7/월 (무료 크레딧 내에서 충분)

## 🔗 유용한 링크

- [Railway 대시보드](https://railway.app/dashboard)
- [Railway 문서](https://docs.railway.app)
- [MySQL 연결 가이드](https://docs.railway.app/databases/mysql)
- [환경변수 가이드](https://docs.railway.app/develop/variables)

## 📞 지원

문제 발생 시:
1. Railway 로그 확인
2. 프로젝트 README.md의 상세 가이드 참조
3. Railway Discord 커뮤니티
4. GitHub Issues

---

**배포 성공!** 🎉

이제 `https://your-app.railway.app/api/v1/swagger-ui.html`에서 API를 테스트할 수 있습니다.


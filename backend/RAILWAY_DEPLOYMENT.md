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
DATABASE_URL=${{MySQL.MYSQL_URL}}
DB_USERNAME=${{MySQL.MYSQL_USER}}
DB_PASSWORD=${{MySQL.MYSQL_PASSWORD}}
JWT_SECRET=your-super-secret-key-at-least-256-bits-long-required-for-hs512
JWT_EXPIRATION=86400000
JWT_REFRESH_EXPIRATION=604800000
SWAGGER_ENABLED=false
```

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

## 🔑 필수 환경변수

| 변수명 | 설명 | 예시 |
|--------|------|------|
| `DATABASE_URL` | MySQL 연결 URL | `${{MySQL.MYSQL_URL}}` |
| `DB_USERNAME` | DB 사용자명 | `${{MySQL.MYSQL_USER}}` |
| `DB_PASSWORD` | DB 비밀번호 | `${{MySQL.MYSQL_PASSWORD}}` |
| `JWT_SECRET` | JWT 서명 키 (256bit+) | `your-secret-key...` |
| `JWT_EXPIRATION` | Access Token 만료 시간 | `86400000` (24시간) |
| `JWT_REFRESH_EXPIRATION` | Refresh Token 만료 시간 | `604800000` (7일) |
| `SWAGGER_ENABLED` | Swagger UI 활성화 | `false` (프로덕션) |

## 🐛 트러블슈팅

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

### 데이터베이스 연결 실패
```
1. Variables에서 DATABASE_URL 확인
2. MySQL 서비스가 Running 상태인지 확인
3. ${{MySQL.MYSQL_URL}} 형식으로 설정했는지 확인
```

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


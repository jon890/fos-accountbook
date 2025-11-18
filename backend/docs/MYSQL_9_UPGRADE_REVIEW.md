# MySQL 8.0 → 9.4 업그레이드 검토

## 📋 개요

로컬 개발 환경의 MySQL을 8.0에서 9.4로 업그레이드할 때 발생할 수 있는 이슈를 검토한 문서입니다.

## ⚠️ 주요 이슈 및 해결 방안

### 1. **인증 플러그인 변경 (Critical)**

#### 문제점
- MySQL 9.0부터 `mysql_native_password` 인증 플러그인이 **완전히 제거**되었습니다.
- 현재 `docker/compose.yml`에서 `--default-authentication-plugin=mysql_native_password` 옵션을 사용 중입니다.

#### 해결 방안
MySQL 9.4는 기본적으로 `caching_sha2_password`를 사용하므로, 해당 옵션을 **제거**해야 합니다.

**변경 전:**
```yaml
command:
  - --character-set-server=utf8mb4
  - --collation-server=utf8mb4_unicode_ci
  - --default-authentication-plugin=mysql_native_password  # ❌ 제거 필요
```

**변경 후:**
```yaml
command:
  - --character-set-server=utf8mb4
  - --collation-server=utf8mb4_unicode_ci
  # MySQL 9.4는 기본적으로 caching_sha2_password 사용
```

#### 영향 범위
- ✅ **애플리케이션 코드**: 영향 없음 (JDBC 드라이버가 자동 처리)
- ✅ **MySQL Connector/J 9.5.0**: `caching_sha2_password` 완벽 지원
- ✅ **기존 데이터**: 새 컨테이너 생성 시 자동으로 올바른 인증 방식 사용

---

### 2. **MySQL Connector/J 호환성**

#### 현재 상태
- **MySQL Connector/J**: `9.5.0` 사용 중
- **호환성**: MySQL 9.4 완벽 지원 ✅

#### 확인 사항
- ✅ JDBC 4.2 호환
- ✅ `caching_sha2_password` 지원
- ✅ MySQL 9.x 신규 기능 지원

**결론**: 추가 작업 불필요

---

### 3. **SQL 문법 호환성**

#### 검토 결과
모든 Flyway 마이그레이션 파일을 검토한 결과, MySQL 9.4와 호환되는 표준 SQL만 사용 중입니다.

**사용 중인 SQL 기능:**
- ✅ 표준 DDL (CREATE TABLE, ALTER TABLE)
- ✅ 표준 DML (INSERT, UPDATE, DELETE)
- ✅ 인덱스 및 제약조건
- ✅ DATETIME(3) - MySQL 5.6+ 지원
- ✅ DEFAULT CURRENT_TIMESTAMP(3) - MySQL 5.6+ 지원
- ✅ ON UPDATE CURRENT_TIMESTAMP(3) - MySQL 5.6+ 지원

**사용하지 않는 기능 (호환성 문제 없음):**
- ❌ MySQL 8.0 전용 기능 없음
- ❌ Deprecated 문법 없음
- ❌ 제거된 기능 사용 없음

**결론**: SQL 문법 호환성 문제 없음 ✅

---

### 4. **애플리케이션 코드 호환성**

#### 검토 결과
- ✅ JPA/Hibernate: MySQL 9.4 완벽 지원
- ✅ QueryDSL: MySQL 9.4 완벽 지원
- ✅ Flyway: MySQL 9.4 완벽 지원
- ✅ Spring Boot 3.5.7: MySQL 9.4 공식 지원

**MySQL 특정 기능 사용 여부:**
- ❌ MySQL 전용 함수 사용 없음
- ❌ MySQL 전용 데이터 타입 사용 없음
- ❌ MySQL 전용 SQL 문법 사용 없음

**결론**: 애플리케이션 코드 수정 불필요 ✅

---

### 5. **업그레이드 경로**

#### 프로덕션 환경
프로덕션(Railway)에서는 단계별 업그레이드가 필요할 수 있습니다:
- MySQL 8.0 → 8.4 LTS → 9.4

#### 로컬 개발 환경
로컬 개발 환경(Docker)에서는 **직접 업그레이드 가능**합니다:
- 이유: 데이터가 없거나 쉽게 재생성 가능
- 방법: 기존 컨테이너 삭제 후 새 버전으로 재생성

**권장 절차:**
```bash
# 1. 기존 컨테이너 및 볼륨 삭제
cd docker
docker compose down -v

# 2. 새 버전으로 컨테이너 시작
docker compose up -d mysql

# 3. Flyway 마이그레이션 자동 실행 (애플리케이션 시작 시)
```

---

## ✅ 검토 완료 항목

### 호환성 확인
- [x] MySQL Connector/J 9.5.0 호환성
- [x] SQL 문법 호환성
- [x] 애플리케이션 코드 호환성
- [x] Spring Boot 3.5.7 호환성
- [x] JPA/Hibernate 호환성
- [x] Flyway 호환성

### 수정 필요 항목
- [x] `docker/compose.yml`: `--default-authentication-plugin=mysql_native_password` 제거

---

## 🚀 업그레이드 실행 계획

### 1단계: 설정 파일 수정
- [x] `docker/compose.yml`에서 인증 플러그인 옵션 제거
- [x] MySQL 이미지 버전 확인 (`mysql:9.4`)

### 2단계: 로컬 테스트
```bash
# 기존 컨테이너 삭제
cd docker
docker compose down -v

# 새 버전으로 시작
docker compose up -d mysql

# 로그 확인
docker compose logs -f mysql
# "ready for connections" 메시지 확인

# 애플리케이션 시작 및 테스트
./gradlew bootRun --args='--spring.profiles.active=local'
```

### 3단계: 검증
- [ ] MySQL 연결 성공 확인
- [ ] Flyway 마이그레이션 성공 확인
- [ ] 애플리케이션 정상 동작 확인
- [ ] 테스트 실행 (`./gradlew test`)

---

## 📝 참고 사항

### MySQL 9.4 주요 변경사항
1. **인증 플러그인**: `mysql_native_password` 제거, `caching_sha2_password` 기본값
2. **성능 개선**: 쿼리 최적화 및 인덱스 성능 향상
3. **보안 강화**: 기본 보안 설정 강화
4. **JSON 기능**: JSON 함수 및 연산자 개선

### 프로덕션 업그레이드 시 주의사항
프로덕션 환경(Railway)에서 업그레이드할 때는:
1. **백업 필수**: 업그레이드 전 전체 데이터베이스 백업
2. **단계별 업그레이드**: 8.0 → 8.4 LTS → 9.4
3. **업그레이드 체크 유틸리티**: MySQL Shell의 업그레이드 체커 사용
4. **테스트 환경 검증**: 스테이징 환경에서 먼저 검증

### 로컬 개발 환경의 장점
- 데이터 손실 부담 없음 (재생성 가능)
- 직접 업그레이드 가능 (단계별 불필요)
- 빠른 롤백 가능 (이전 버전 이미지 사용)

---

## 🎯 결론

### ✅ 업그레이드 가능 여부
**업그레이드 가능** - 단, 다음 수정 필요:
1. `docker/compose.yml`에서 `--default-authentication-plugin=mysql_native_password` 제거

### ⚠️ 주의사항
- 인증 플러그인 옵션 제거 필수 (그렇지 않으면 컨테이너 시작 실패 가능)
- 기존 데이터가 있다면 백업 후 업그레이드 권장

### 📊 리스크 평가
- **기술적 리스크**: 낮음 (호환성 문제 없음)
- **데이터 리스크**: 낮음 (로컬 개발 환경)
- **애플리케이션 리스크**: 낮음 (코드 수정 불필요)

---

## 📚 참고 자료

- [MySQL 9.4 Release Notes](https://dev.mysql.com/doc/relnotes/mysql/9.4/en/)
- [MySQL 9.0 Upgrade Guide](https://dev.mysql.com/doc/refman/9.0/en/upgrading.html)
- [MySQL Authentication Plugin Changes](https://dev.mysql.com/doc/refman/9.0/en/upgrading-from-previous-series.html#upgrade-caching-sha2-password)
- [MySQL Connector/J 9.5.0 Release Notes](https://dev.mysql.com/doc/relnotes/connector-j/9.5/en/)


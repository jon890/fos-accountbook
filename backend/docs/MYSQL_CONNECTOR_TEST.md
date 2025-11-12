# MySQL Connector 버전 호환성 테스트 가이드

## 📋 개요

MySQL Connector/J 버전 업그레이드 시 실제 MySQL 데이터베이스로 호환성을 검증하는 가이드입니다.

## 🎯 테스트 목적

- H2 In-Memory DB로는 MySQL Connector 호환성 검증 불가
- 실제 MySQL 환경에서 새 버전의 Connector 동작 확인
- Breaking Changes 및 버그 수정 검증

## 🚀 실행 방법

### 1단계: MySQL 컨테이너 시작

```bash
# MySQL 컨테이너 시작
docker-compose up -d mysql

# MySQL이 준비될 때까지 대기 (약 30초)
docker-compose logs -f mysql
# "ready for connections" 메시지 확인
```

### 2단계: MySQL Connector 버전 업그레이드

`gradle/libs.versions.toml` 파일에서 버전 확인:

```toml
[versions]
mysql-connector-j = "9.5.0"  # 업그레이드할 버전
```

### 3단계: 호환성 테스트 실행

```bash
# MySQL Connector 호환성 테스트 실행
./gradlew test --tests MySQLConnectorVersionTest

# 또는 전체 테스트 실행 (MySQL 프로파일 사용)
./gradlew test -Dspring.profiles.active=test-mysql
```

### 4단계: 결과 확인

테스트가 통과하면 출력 예시:

```
=== MySQL Connection Info ===
Database Product: MySQL
Database Version: 8.0.39
Driver Name: MySQL Connector/J
Driver Version: mysql-connector-j-9.5.0
JDBC Major Version: 4
JDBC Minor Version: 2

=== Available Schemas ===
Schema: accountbook
Schema: information_schema
...
```

### 5단계: 정리

```bash
# MySQL 컨테이너 종료
docker-compose down

# 또는 데이터까지 삭제
docker-compose down -v
```

## 🧪 테스트 항목

### 1. 기본 연결 테스트
- MySQL 연결 성공 여부
- 드라이버 버전 확인

### 2. PreparedStatement 테스트 (9.5.0 버그 수정)
- 따옴표 포함 문자열 처리
- SQL 구문 오류 방지

### 3. DatabaseMetaData 테스트 (9.5.0 개선사항)
- 스키마 조회 기능
- 유효성 검사 동작 확인

### 4. CRUD 동작 테스트
- 기본 쿼리 실행
- 트랜잭션 격리 수준 확인

## 📝 버전별 주요 변경사항

### MySQL Connector/J 9.5.0
- ✅ PreparedStatement 따옴표 이스케이프 버그 수정
- ✅ DatabaseMetaDataInformationSchema 유효성 검사 추가
- ✅ SequentialBalanceStrategy 로드 밸런싱 전략 추가
- 🟢 **Breaking Changes 없음**

### 호환성
- MySQL 8.0+: ✅ 완벽 지원
- MySQL 5.7: ⚠️ 일부 기능 제한
- Spring Boot 3.x: ✅ 완벽 지원
- Java 21: ✅ 완벽 지원

## 🔍 문제 해결

### MySQL 컨테이너 접속 실패

```bash
# MySQL 로그 확인
docker-compose logs mysql

# MySQL 컨테이너 상태 확인
docker ps -a

# MySQL 재시작
docker-compose restart mysql
```

### 포트 충돌 (3306 already in use)

```bash
# 기존 MySQL 프로세스 확인
lsof -i :3306

# 포트 변경 (docker-compose.yml)
ports:
  - "3307:3306"  # 3307로 변경
  
# application-test-mysql.yml도 수정
url: jdbc:mysql://localhost:3307/accountbook?...
```

### Flyway 마이그레이션 실패

```bash
# MySQL 초기화
docker-compose down -v
docker-compose up -d mysql

# 마이그레이션 파일 확인
ls -la src/main/resources/db/migration/
```

## 💡 Best Practices

1. **버전 업그레이드 전 테스트**
   - 먼저 로컬에서 MySQL 테스트 실행
   - 모든 테스트 통과 확인
   - 릴리즈 노트 확인

2. **프로덕션 적용 전**
   - 스테이징 환경에서 검증
   - 모니터링 강화
   - 롤백 계획 수립

3. **정기적인 업데이트**
   - 보안 패치는 즉시 적용
   - 마이너 버전은 분기별 검토
   - 메이저 버전은 신중히 결정

## 🔗 참고 자료

- [MySQL Connector/J 9.5.0 Release Notes](https://dev.mysql.com/doc/relnotes/connector-j/en/news-9-5-0.html)
- [MySQL Connector/J Documentation](https://dev.mysql.com/doc/connector-j/en/)
- [Spring Boot Database Initialization](https://docs.spring.io/spring-boot/docs/current/reference/html/howto.html#howto.data-initialization)


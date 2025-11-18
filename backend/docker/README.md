# Docker 설정 가이드

이 디렉토리에는 개발 환경을 위한 Docker 설정 파일들이 포함되어 있습니다.

## 📁 디렉토리 구조

```
docker/
├── mysql/
│   ├── conf.d/
│   │   └── my.cnf          # MySQL 설정 파일
│   └── init/
│       └── 01-init.sql     # 데이터베이스 초기화 스크립트
└── README.md
```

## 🐳 Docker Compose 구성

### MySQL 컨테이너

- **이미지**: MySQL 9.4 (Railway 프로덕션과 동일)
- **컨테이너명**: fos-accountbook-mysql
- **포트**: 13306 (호스트) → 3306 (컨테이너) - 일반 MySQL 포트(3306)와 충돌 방지
- **네트워크**: fos-accountbook-network
- **볼륨**:
  - `mysql_data`: 데이터 영속성
  - `./mysql/init`: 초기화 스크립트
  - `./mysql/conf.d`: 설정 파일

## 🚀 사용 방법

### 1. 설정 확인

Docker Compose는 별도의 환경변수 파일 없이 작동합니다. 모든 설정이 `compose.yml`에 하드코딩되어 있습니다:

- **데이터베이스**: accountbook
- **사용자**: accountbook_user
- **비밀번호**: accountbook_password
- **Root 비밀번호**: rootpassword
- **포트**: 13306 (호스트) - 일반 MySQL 포트(3306)와 충돌 방지

Spring Boot 애플리케이션의 로컬 설정(`application-local.yml`)도 동일한 값을 사용합니다.

### 2. Docker Compose 명령어

**⚠️ 중요**: `compose.yml` 파일이 `docker/` 폴더에 있으므로, 명령어 실행 시 해당 폴더로 이동하거나 `-f` 옵션을 사용하세요.

```bash
# docker 폴더로 이동
cd docker

# 컨테이너 시작 (백그라운드)
docker compose up -d

# 컨테이너 시작 (로그 표시)
docker compose up

# 로그 확인
docker compose logs -f mysql

# 컨테이너 상태 확인
docker compose ps

# 컨테이너 중지
docker compose stop

# 컨테이너 시작 (이미 생성된 경우)
docker compose start

# 컨테이너 재시작
docker compose restart

# 컨테이너 중지 및 삭제
docker compose down

# 컨테이너 및 볼륨 모두 삭제 (주의: 데이터 손실!)
docker compose down -v
```

**루트 폴더에서 실행하는 경우:**

```bash
# -f 옵션으로 파일 경로 지정
docker compose -f docker/compose.yml up -d
```

### 3. MySQL 접속

#### Docker 컨테이너 내부에서 접속

```bash
# docker 폴더에서 실행
cd docker
docker compose exec mysql mysql -u accountbook_user -p accountbook
# 비밀번호: accountbook_password

# 또는 루트 폴더에서 실행
docker compose -f docker/compose.yml exec mysql mysql -u accountbook_user -p accountbook
```

#### 로컬 MySQL 클라이언트로 접속

```bash
mysql -h localhost -P 13306 -u accountbook_user -p accountbook
```

#### MySQL Workbench 또는 DBeaver로 접속

- **Host**: localhost
- **Port**: 13306 (일반 MySQL 포트 3306과 충돌 방지)
- **Database**: accountbook
- **Username**: accountbook_user
- **Password**: accountbook_password

### 4. 데이터베이스 초기화

컨테이너가 처음 시작될 때 `./docker/mysql/init/` 디렉토리의 SQL 스크립트들이 자동으로 실행됩니다.

추가 초기화 스크립트를 실행하려면:

1. `./docker/mysql/init/` 디렉토리에 `*.sql` 파일 추가
2. 파일명 앞에 숫자를 붙여 실행 순서 지정 (예: `01-init.sql`, `02-seed.sql`)
3. 컨테이너를 재생성하거나 수동으로 실행

## ⚙️ MySQL 설정 (my.cnf)

`./docker/mysql/conf.d/my.cnf` 파일에서 다음 설정을 관리합니다:

- 문자 인코딩: utf8mb4
- 타임존: Asia/Seoul (+09:00)
- 최대 연결 수: 200
- InnoDB 버퍼 풀 크기: 256MB
- Slow query 로그 활성화

설정 변경 후 컨테이너 재시작 필요:

```bash
docker compose restart mysql
```

## 🔧 문제 해결

### 포트 충돌

기본적으로 포트 13306을 사용하므로 일반 MySQL 포트(3306)와 충돌하지 않습니다.

다른 포트를 사용해야 하는 경우:

1. `docker/compose.yml`에서 포트 변경:

   ```yaml
   ports:
     - "13307:3306" # 호스트:컨테이너
   ```

2. `application-local.yml`에서도 포트 변경:
   ```yaml
   spring:
     datasource:
       url: jdbc:mysql://localhost:13307/accountbook...
   ```

### 컨테이너 시작 실패

```bash
# docker 폴더에서 실행
cd docker

# 로그 확인
docker compose logs mysql

# 컨테이너 재생성
docker compose down
docker compose up -d

# 볼륨 삭제 후 재생성 (데이터 손실!)
docker compose down -v
docker compose up -d
```

### 데이터베이스 연결 실패

1. MySQL 컨테이너가 실행 중인지 확인:

   ```bash
   docker compose ps
   ```

2. Health check 상태 확인:

   ```bash
   docker compose ps
   # STATE가 "Up (healthy)"여야 함
   ```

3. 네트워크 연결 확인:
   ```bash
   docker network ls
   docker network inspect fos-accountbook-network
   ```

## 📊 데이터 백업 및 복원

### 백업

```bash
# docker 폴더에서 실행
cd docker

# 전체 데이터베이스 백업
docker compose exec mysql mysqldump -u root -p accountbook > backup.sql

# 특정 테이블만 백업
docker compose exec mysql mysqldump -u root -p accountbook users families > backup-tables.sql
```

### 복원

```bash
# docker 폴더에서 실행
cd docker

# SQL 파일에서 복원
docker compose exec -T mysql mysql -u root -p accountbook < backup.sql

# 또는
cat backup.sql | docker compose exec -T mysql mysql -u root -p accountbook
```

## 🔐 보안 참고사항

- **개발 환경 전용**: 이 설정은 로컬 개발 환경용입니다
- **프로덕션 사용 금지**: 실제 서비스에서는 별도의 보안 설정 필요
- **비밀번호 관리**: `.env` 파일을 Git에 커밋하지 마세요
- **네트워크 노출**: 필요한 경우에만 포트를 호스트에 노출하세요

## 📝 참고 자료

- [MySQL Docker Hub](https://hub.docker.com/_/mysql)
- [Docker Compose 문서](https://docs.docker.com/compose/)
- [MySQL 8.0 Reference Manual](https://dev.mysql.com/doc/refman/8.0/en/)

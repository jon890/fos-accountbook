# Phase 7: 문서 업데이트 + 전체 빌드/테스트 검증

## 컨텍스트

`fos-accountbook-backend`는 Spring Boot 3 + Java 21 기반 가족 가계부 백엔드다.
프로젝트 루트: `/Users/nhn/personal/fos-accountbook-backend`

Phase 1~6 완료 상태: 소스 코드와 테스트 파일이 모두 도메인 기반 패키지로 전환되었다. 마지막으로 문서를 업데이트하고 전체 검증을 수행한다.

반드시 먼저 읽을 문서:
- `CLAUDE.md` — 현재 Architecture 섹션 확인
- `docs/code-architecture.md` — "Target State" 주의문 확인

## 목표

1. 문서를 현재 코드 상태에 맞게 업데이트
2. 빈 old 패키지 디렉터리 정리
3. 전체 빌드 + 테스트 + checkstyle 검증

## 작업 목록

### 1. CLAUDE.md Architecture 섹션 업데이트

`CLAUDE.md`의 `## Architecture` 섹션을 도메인 기반 구조로 업데이트한다:

- old 레이어 기반 구조 설명을 도메인 기반 구조로 교체
- 패키지 트리를 `docs/code-architecture.md`와 일치시킴
- **간결하게** 유지 — 상세 내용은 `docs/code-architecture.md` 참고 안내

### 2. code-architecture.md "Target State" 주의문 제거

`docs/code-architecture.md` 상단의 다음 주의문을 제거한다:
```
> **주의**: 이 구조는 ADR-B16에 따른 목표 상태다. 현재 코드베이스는 레이어 기반...
```

섹션 제목도 변경:
- `## 패키지 구조 (도메인 기반 — Target State, ADR-B16)` → `## 패키지 구조 (도메인 기반, ADR-B16)`

### 3. 빈 old 패키지 디렉터리 정리

Phase 1~5에서 파일을 이동한 후 남은 빈 디렉터리를 삭제한다:

```bash
# src/main 쪽 빈 디렉터리 확인 및 삭제
find src/main/java/com/bifos/accountbook/presentation -type d -empty -delete 2>/dev/null
find src/main/java/com/bifos/accountbook/application -type d -empty -delete 2>/dev/null
find src/main/java/com/bifos/accountbook/domain -type d -empty -delete 2>/dev/null
find src/main/java/com/bifos/accountbook/infra -type d -empty -delete 2>/dev/null
find src/main/java/com/bifos/accountbook/utils -type d -empty -delete 2>/dev/null

# src/test 쪽도 동일
find src/test/java/com/bifos/accountbook/presentation -type d -empty -delete 2>/dev/null
find src/test/java/com/bifos/accountbook/application -type d -empty -delete 2>/dev/null
find src/test/java/com/bifos/accountbook/domain -type d -empty -delete 2>/dev/null
find src/test/java/com/bifos/accountbook/infra -type d -empty -delete 2>/dev/null
```

주의: 파일이 남아있는 디렉터리는 삭제하지 않는다. 남아있는 파일이 있다면 이동이 누락된 것이므로 확인 후 처리.

### 4. 전체 빌드 + 테스트 검증

```bash
./gradlew build --no-daemon
```

이 명령은 다음을 모두 포함:
- 컴파일
- checkstyleMain + checkstyleTest
- 전체 테스트 실행

### 5. 최종 구조 확인

모든 작업 완료 후 다음을 확인:

```bash
# 도메인 패키지 존재 확인
ls src/main/java/com/bifos/accountbook/{shared,user,family,category,expense,income,recurring,invitation,notification,dashboard,config}/

# old 패키지에 파일이 남아있지 않은지 확인
find src/main/java/com/bifos/accountbook/{presentation,application,domain,infra} -name "*.java" 2>/dev/null
# 결과가 비어있어야 함
```

## 성공 기준

- `./gradlew build --no-daemon` 성공 (test + checkstyle 포함)
- `CLAUDE.md` Architecture 섹션이 도메인 기반 구조를 반영
- `docs/code-architecture.md`에서 "Target State" 주의문 제거됨
- old 레이어 패키지에 `.java` 파일 없음
- 10개 도메인 패키지 + config + shared가 모두 존재

## 주의사항

- `config/` 패키지는 삭제하지 않음 — 최상위에 유지되는 패키지
- `AccountBookApplication.java`는 최상위에 유지
- checkstyle 위반이 발생하면 해당 파일의 import 순서나 들여쓰기를 확인
- 테스트 실패 시 실패 원인을 분석하여 수정 (대부분 import 누락이 원인)

## Blocked 조건

`./gradlew build --no-daemon`이 실패하고 원인을 파악할 수 없으면:
`PHASE_BLOCKED: 전체 빌드 실패 — 오류 로그 확인 필요`

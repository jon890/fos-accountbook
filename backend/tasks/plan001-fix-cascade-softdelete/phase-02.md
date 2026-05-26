# Phase 02: 빌드 검증 + 커밋

## 목표

Checkstyle + 빌드 통과 확인 후 커밋.

## 작업 항목

1. **Checkstyle 검증** — `./gradlew checkstyleMain checkstyleTest --no-daemon --console=plain`
2. **빌드 검증** — `./gradlew build -x integrationTest --no-daemon --console=plain`
3. **커밋** — `fix(family): CascadeType.ALL → PERSIST+MERGE (Soft Delete 충돌 해소) (#87)`

## 검증 기준

- Checkstyle + 빌드 + 테스트 모두 통과

# Phase 02: 빌드 검증 + 커밋

## 목표

Checkstyle + 빌드 통과 확인 후 커밋. index.json status를 completed로 마킹.

## 작업 항목

1. **Checkstyle 검증** — `./gradlew checkstyleMain checkstyleTest --no-daemon --console=plain`
2. **빌드 검증** — `./gradlew build -x integrationTest --no-daemon --console=plain`
3. **ADR 업데이트** — `docs/adr.md`에 cascade 변경 근거 및 soft delete 정합성 기록 (ADR-B03 보완 또는 신규 ADR)
4. **커밋** — `fix(family): CascadeType.ALL → PERSIST+MERGE (Soft Delete 충돌 해소) (#87)`
5. **index.json status 갱신** — `"status": "completed"` 마킹 + 커밋

## 검증 기준

- Checkstyle + 빌드 + 테스트 모두 통과
- index.json status가 completed

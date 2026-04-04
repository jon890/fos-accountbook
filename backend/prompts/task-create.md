# Task 생성 가이드 (백엔드)

이 문서는 AI 에이전트가 구현 task를 생성할 때 따르는 규칙이다.

## 디렉터리 구조

```
tasks/
  {task-name}/
    index.json        # task 메타데이터 및 phase 목록
    phase-01.md       # phase 1 프롬프트
    phase-02.md
    ...
```

## index.json 스키마

```json
{
  "name": "task-name",
  "description": "무엇을 구현하는 task인지 한 줄 설명",
  "created_at": "2026-04-04T00:00:00Z",
  "updated_at": "2026-04-04T00:00:00Z",
  "status": "pending",
  "current_phase": 0,
  "total_phases": 7,
  "error_message": null,
  "blocked_reason": null,
  "phases": [
    {
      "number": 1,
      "title": "Flyway 마이그레이션",
      "file": "phase-01.md",
      "status": "pending",
      "allowedTools": ["Read", "Write", "Edit", "Bash", "Glob", "Grep"]
    }
  ]
}
```

### status 값

- `pending` — 아직 실행 전
- `running` — 현재 실행 중
- `completed` — 성공 완료
- `failed` — 오류 발생 (error_message 참고)
- `blocked` — 사용자 개입 필요 (blocked_reason 참고)

---

## phase 파일 작성 규칙

### 핵심 원칙

1. **자기완결적** — 이전 대화 컨텍스트 없이 독립 실행 가능. 필요한 모든 맥락을 포함.
2. **단일 책임** — 한 phase는 하나의 명확한 작업 단위.
3. **검증 가능** — `./gradlew build -x test --no-daemon` 등 실행 가능한 성공 기준 명시.

### phase 파일 구조

```markdown
# Phase N: {제목}

## 컨텍스트

이 프로젝트 소개, 현재 상태, 이 phase의 역할.
참조 문서: CLAUDE.md, docs/code-architecture.md, docs/data-schema.md

## 목표

이 phase에서 구현해야 할 것.

## 작업 목록

- [ ] 구체적인 파일 경로와 클래스명 포함

## 성공 기준

- `./gradlew build -x test --no-daemon` 성공
- 특정 클래스가 존재해야 함

## 주의사항

- CLAUDE.md 규칙 준수 (@Data 금지, 와일드카드 import 금지 등)
- 의존성 방향: presentation → application → domain ← infra

## Blocked 조건

`PHASE_BLOCKED: {이유}`
```

### 특수 마커

```
PHASE_BLOCKED: {이유}    # 사용자 개입 필요 → exit 2
PHASE_FAILED: {오류}     # 복구 불가능 → exit 1
```

---

## Spring Boot 레이어별 phase 순서

새 도메인 추가 시 권장 phase 분리:

| Phase | 레이어 | 내용 |
|-------|--------|------|
| 1 | DB | Flyway 마이그레이션 SQL |
| 2 | Domain | Entity + Repository 인터페이스 + Value Object |
| 3 | Infra | Repository 구현체 (JPA + QueryDSL) |
| 4 | Application | Service + DTO + Event + Scheduler |
| 5 | Presentation | Controller + Request/Response DTO |
| 6 | Test | Controller 통합 테스트 (AbstractControllerTest) |
| 7 | Build | `./gradlew build --no-daemon` 전체 검증 |

각 phase에서 중간 검증: `./gradlew build -x test -x checkstyleMain -x checkstyleTest --no-daemon`

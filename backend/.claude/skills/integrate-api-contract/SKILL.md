---
name: integrate-api-contract
description: 프론트엔드/백엔드 간 REST API 컨트랙트 변경을 통합하는 워크플로우. 한쪽 PR(또는 OpenAPI 변경)을 받아 반대쪽 레포에 반영. backend-fos 전용 (frontend-fos는 integrate-ux 사용).
---

# integrate-api-contract

`integrate-ux`의 backend-fos 변형. UX 디자이너 PR 통합 대신 **API 컨트랙트 변경 통합**을 다룬다. 트리거 시나리오:

1. **frontend → backend**: 프론트엔드 PR이 새 엔드포인트 또는 변경된 응답 스키마를 요구 → backend가 받아서 구현
2. **backend → frontend**: backend 스키마/엔드포인트 변경이 프론트엔드 타입에 영향 → 프론트엔드 PR로 propagate
3. **OpenAPI diff 기반**: SpringDoc OpenAPI가 생성한 스펙의 diff로 변경 식별

## 핵심 원칙

1. **컨트랙트 = source of truth**: 양쪽이 동의한 컨트랙트(OpenAPI 스펙 또는 명시적 합의)가 우선. 어느 한쪽 코드만 바꾸지 않는다
2. **반대 레포 PR 동기 발행**: backend 변경은 frontend 추적 PR(또는 issue)을 동시 생성
3. **하위 호환 우선**: 기존 클라이언트가 깨지지 않는 변경만 단독 머지. 깨는 변경은 양쪽 동시 배포 계획 수립
4. **컨트랙트 검증 자동화**: `spring-cloud-contract` 또는 OpenAPI schema validation 테스트로 회귀 방지

## 실행 절차

### 1. 트리거 분석

#### Case A: frontend PR이 트리거

```bash
# cwd: <backend repo root>
# 프론트엔드 PR을 backend 관점에서 본다
gh -R {frontend-repo} pr view {PR번호} --json title,body,changedFiles
gh -R {frontend-repo} pr diff {PR번호} -- 'src/lib/server/api/**' 'src/services/**' 'src/types/**'
```

확인할 것:
- 새로 호출하는 엔드포인트 path/method
- 변경된 요청/응답 타입
- 인증·권한 요구사항

#### Case B: backend 변경이 트리거

`./gradlew openApi` (또는 SpringDoc UI)로 현재 스펙 추출. 직전 main 스펙과 diff:

```bash
# cwd: <backend repo root>
./gradlew generateOpenApi
diff -u openapi-spec.previous.json openapi-spec.current.json | head -200
```

#### Case C: 양쪽 동시 변경 협의

사용자가 명시적으로 "이런 컨트랙트로 frontend·backend 둘 다 만들자"고 시작.

### 2. 컨트랙트 명세화

변경 사항을 명시적으로 정리 — `docs/api-contract-{plan이름}.md` (임시 파일):

```markdown
## API Contract — {plan이름}

### {METHOD} {path}

- **Request**:
  ```json
  { "field1": "string", "field2": 123 }
  ```
- **Response 200**:
  ```json
  { "id": "uuid", ... }
  ```
- **Errors**: 400 (`INVALID_INPUT`), 403 (`NOT_FAMILY_MEMBER`)
- **인증**: `@LoginUser` 필수
- **하위 호환**: ✅ (새 엔드포인트) / ⚠️ (응답 필드 추가) / ❌ (필드 제거 — frontend 동시 배포 필요)
```

이 파일은 **task 종료 시 삭제** (임시). 영구 보관할 결정은 `docs/adr.md` 또는 `docs/code-architecture.md`로.

### 3. backend 영향 분석

새 엔드포인트인가, 기존 확장인가:

- **새 엔드포인트**: Domain → Infra → Application → Presentation 4 phase
- **응답 스키마 변경**: Response DTO + `static from(Entity)` 변경 — 기존 호출자 영향 grep
- **인증 정책 변경**: `@LoginUser` / `@ValidateFamilyAccess` 적용 위치

```bash
# cwd: <backend repo root>
# 영향받는 Controller / Service / Repository 그리기
grep -rn "{path}" src/main/java/
```

### 4. 사용자와 논의

반드시 논의:
- **하위 호환성**: 변경이 깨는 변경인가? frontend 동시 배포 필요?
- **검증 정책**: Bean Validation? Zod 같은 추가 검증?
- **OpenAPI 문서화**: SpringDoc 어노테이션 추가 범위
- **계약 테스트**: `spring-cloud-contract` 도입 여부 (프로젝트 정책)
- **frontend 추적 PR**: 누가 언제 만들 것인가

### 5. docs 반영 (task 생성 전 필수)

- `docs/data-schema.md` — 스키마 변경 반영
- `docs/code-architecture.md` — 새 엔드포인트 등록
- `docs/adr.md` — 컨트랙트 변경 정책 결정 (예: "v2 prefix vs 비파괴 확장" 등)
- 임시 `docs/api-contract-{plan}.md` 작성 (task 완료 후 삭제)

### 6. task 생성

표준 phase 구조:

| Phase | 내용 | 모델 |
|---|---|---|
| 1 | Domain 변경 (Entity 필드 추가, Value Object) | sonnet |
| 2 | Infra (Flyway 마이그레이션, Repository 구현) | sonnet |
| 3 | Application (Service, `@Transactional`, Event 발행) | sonnet |
| 4 | Presentation (Controller, Request/Response DTO, SpringDoc 어노테이션) | sonnet |
| 5 | 통합 테스트 (`AbstractControllerTest` 상속) | sonnet |
| N-1 | `./gradlew test build` 검증 + Checkstyle | haiku |
| N | 커밋 + push + frontend 추적 PR/issue 생성 | haiku |

### 7. task 실행 + 검증

```bash
# cwd: <backend repo root>
python3 scripts/run-phases.py tasks/{task-name}
```

### 8. frontend 추적 PR/issue 생성

backend 머지 후 frontend 레포에 추적 작업:

```bash
# cwd: <frontend repo root>
gh issue create \
  --repo {frontend-repo} \
  --title "feat(api): adopt {endpoint} from backend plan{N}" \
  --body "..."
```

또는 frontend 레포에서 별도 `/integrate-api-contract` Case A 발동.

### 9. 컨트랙트 회귀 방지

- OpenAPI 스펙 파일을 git에 커밋 (`docs/openapi.json` 등) — 다음 PR diff에서 변경 즉시 검출 가능
- 통합 테스트에서 응답 스키마 검증 (`jsonPath` assertion)
- (선택) `spring-cloud-contract` 도입 시 frontend가 stub 사용 가능

## frontend ↔ backend 추적 페어링

각 backend plan이 frontend issue/PR과 짝을 이룸:

| backend plan | frontend 추적 |
|---|---|
| plan{N} (backend 새 엔드포인트) | issue#{M} 또는 PR#{M} |

이 매핑은 `docs/code-architecture.md` 또는 `tasks/{plan}/index.json`의 새 필드 `frontend_tracking`에 기록.

## 자주 발생하는 함정

### F1. 응답 필드 제거의 silent breakage

backend가 응답에서 필드를 제거 → frontend의 TypeScript 타입은 빌드 시점에 안 잡힘 (서버 응답 스키마는 런타임 확인) → 프로덕션에서 `undefined` 참조 에러.

**해결**: 제거 전에 frontend에서 해당 필드 사용을 모두 제거 + deploy. **두 단계 배포** 강제.

### F2. 인증 정책 추가의 backward break

기존 익명 엔드포인트에 `@LoginUser` 추가 → 기존 frontend 비로그인 호출이 401.

**해결**: 새 엔드포인트로 분리 또는 양쪽 동시 배포.

### F3. 직렬화 형식 변경 (snake_case ↔ camelCase 등)

Jackson 정책 변경이 모든 응답에 영향. 매우 위험.

**해결**: `@JsonNaming` 클래스별 적용으로 점진 마이그레이션. 전역 정책 변경은 별도 plan으로 분리.

## vs integrate-ux

| | integrate-ux | integrate-api-contract |
|---|---|---|
| 적용 레포 | frontend (UI 있음) | backend (또는 양방향) |
| 트리거 | UX 디자이너 PR | 프론트엔드 PR / OpenAPI diff |
| 핵심 작업 | 디자인 → 코드 변환 + Shadcn 통일 | 컨트랙트 정의 → 4-tier 구현 |
| 머지 정책 | rebase + 사용자 PR diff 리뷰 후 | 하위 호환 시 단독, 깨는 변경 시 양쪽 동시 |
| 추적 | UX PR close + 댓글 | 반대 레포 issue/PR 생성 |

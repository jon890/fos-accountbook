# Testing Strategy — fos-accountbook-backend

> 최종 업데이트: 2026-04-04

## 1. 테스트 피라미드

```
┌─────────────────────────────────┐
│   Contract (OpenAPI snapshot)   │  ← CI에서 스냅샷 추출 → 프론트 검증
├─────────────────────────────────┤
│   Integration (H2 in-memory)   │  ← 핵심 계층. Controller → Service → Repository
├─────────────────────────────────┤
│   Unit (순수 로직, 선택적)       │  ← 복잡한 비즈니스 로직만
└─────────────────────────────────┘
```

### 계층별 역할

| 계층 | 도구 | 목적 | 실행 시점 |
|------|------|------|----------|
| Unit | JUnit 5 | 순수 로직 (계산, 변환) | `./gradlew test` |
| Integration | `@SpringBootTest` + H2 | API 엔드포인트 → DB 왕복 전체 검증 | `./gradlew test` |
| Contract | SpringDoc + CI script | OpenAPI 스냅샷 추출 → 프론트엔드와 스키마 동기화 | CI pipeline |

---

## 2. 통합 테스트 규칙

### 2.1 기본 원칙

- **H2 in-memory DB** 사용 (`test` 프로파일)
- **Mock 최소화**: 외부 API 호출만 mock. DB, 트랜잭션은 실제로 동작
- **`AbstractControllerTest` 상속**: MockMvc + ObjectMapper + 트랜잭션 헬퍼 제공
- **`TestFixtures` 활용**: 테스트 데이터 빌더 패턴

### 2.2 필수 테스트 시나리오 (CRUD 엔드포인트)

모든 CRUD 엔드포인트는 최소한 다음을 테스트:

| 시나리오 | 예시 |
|---------|------|
| 정상 생성 | 유효한 입력 → 201 Created |
| 입력 검증 실패 | 범위 초과, 필수값 누락 → 400 Bad Request |
| 정상 조회 | 목록/단건 조회 → 200 OK |
| 정상 수정 | 변경 후 재조회로 반영 확인 |
| 정상 삭제 | 삭제 후 재조회로 사라짐 확인 |
| 존재하지 않는 리소스 | → 404 Not Found |
| 타 가족 접근 차단 | → 403 Forbidden |

### 2.3 스케줄러 테스트 규칙

- **`Clock` 주입 패턴** 사용: `LocalDate.now()` 직접 호출 금지, `Clock` Bean을 통해 날짜 제어
- 필수 시나리오:
  - dayOfMonth 일치 시 정상 생성
  - **멱등성**: 같은 yearMonth에 2회 실행 → 1건만 생성
  - ENDED 상태 반복 지출 → 스케줄러에서 제외
  - 가족이 삭제된 경우 → skip (에러 아닌 경고 로그)

---

## 3. OpenAPI 계약 검증

### 3.1 목적

프론트엔드가 의존하는 API 응답 구조가 변경되었을 때 **빌드 시점에 감지**.

### 3.2 흐름

```
Backend CI
    │
    ├── ./gradlew test
    ├── @SpringBootTest에서 OpenAPI 스냅샷 추출
    │     GET /v3/api-docs → openapi-snapshot.json
    ├── artifact로 저장 (GitHub Actions artifact)
    │
    ▼
Frontend CI
    │
    ├── Backend artifact에서 openapi-snapshot.json 다운로드
    ├── openapi-typescript로 타입 자동 생성
    │     npx openapi-typescript openapi-snapshot.json -o src/types/generated-api.d.ts
    ├── 수동 타입과 구조 비교 (tsc --noEmit)
    └── drift 감지 시 CI 실패
```

### 3.3 prod에서의 api-docs

- **prod에서는 `/v3/api-docs` 비활성화 유지** (보안)
- 스냅샷은 **CI의 `test` 프로파일에서만 추출**
- `@SpringBootTest` 컨텍스트에서 `MockMvc`로 `/v3/api-docs` 호출하여 JSON 파일 생성

### 3.4 스냅샷 추출 테스트

```java
@SpringBootTest
@AutoConfigureMockMvc
class OpenApiSnapshotTest {

    @Autowired MockMvc mockMvc;

    @Test
    void extractOpenApiSnapshot() throws Exception {
        String json = mockMvc.perform(get("/v3/api-docs"))
            .andExpect(status().isOk())
            .andReturn().getResponse().getContentAsString();

        Files.writeString(
            Path.of("build/openapi-snapshot.json"),
            json,
            StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
    }
}
```

---

## 4. 테스트 커버리지 현황

### RecurringExpense (v2)

| 테스트 | 상태 | 파일 |
|--------|------|------|
| CRUD 5개 엔드포인트 | ✅ | `RecurringExpenseControllerTest` |
| 타 가족 접근 차단 | ✅ | `RecurringExpenseControllerTest` |
| dayOfMonth 29 검증 | ✅ | `RecurringExpenseControllerTest` |
| 스케줄러 자동 생성 | ❌ 추가 필요 | — |
| 스케줄러 멱등성 | ❌ 추가 필요 | — |
| ENDED 상태 스케줄러 제외 | ❌ 추가 필요 | — |
| 존재하지 않는 리소스 수정/삭제 | ❌ 추가 필요 | — |
| monthlyTotal 엔드포인트 | ❌ 추가 필요 | — |
| dayOfMonth 0 이하 검증 | ❌ 추가 필요 | — |
| OpenAPI 스냅샷 추출 | ❌ 추가 필요 | — |

---

## 5. 실행 방법

```bash
# 전체 테스트
./gradlew test

# 특정 테스트 클래스
./gradlew test --tests "*.RecurringExpenseControllerTest"

# 스냅샷 추출 (CI용)
./gradlew test --tests "*.OpenApiSnapshotTest"
```

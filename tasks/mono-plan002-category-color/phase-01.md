# Phase 01. 백엔드가 OKLCH 색상을 받고 검증 문구를 응답에 담는다

**Execution profile**: standard

## 목표

카테고리 색상 검증이 `#RRGGBB` 와 `oklch(L C H)` 를 모두 받게 하고, `@Valid` 검증 실패 응답의 필드 항목에 검증 문구를 담는다.
프론트 팔레트가 `oklch(0.560 0.140 35)` 를 보내 카테고리 추가와 색상 수정이 400 으로 실패하고 있다.

**범위 외**: 프론트 오류 표시(phase 02). 기존 hex 데이터 변환은 하지 않는다.

## 컨텍스트

- 색상 검증은 세 곳에 있고 모두 `^#[0-9A-Fa-f]{6}$` 만 받는다.
    - `backend/src/main/java/com/bifos/accountbook/category/application/dto/CreateCategoryRequest.java` 의 `color` `@Pattern`
    - `backend/src/main/java/com/bifos/accountbook/category/application/dto/UpdateCategoryRequest.java` 의 `color` `@Pattern`
    - `backend/src/main/java/com/bifos/accountbook/category/domain/entity/Category.java` 의 `updateColor(String)`
- 같은 엔티티의 `color` 는 `@Column(nullable = false, length = 7)` 이다. 운영 DB 칸은 `varchar(50)` 이다(`V1__init.sql`).
    - 테스트는 `ddl-auto: create-drop` 으로 엔티티에서 테이블을 만들어, 7자를 넘는 OKLCH 값이 테스트에서만 들어가지 않는다.
    - 운영은 `ddl-auto: validate` 라 길이만 50 으로 맞추면 마이그레이션이 필요 없다.
- `backend/src/main/java/com/bifos/accountbook/shared/exception/GlobalExceptionHandler.java` 의 `handleValidationExceptions` 는 `error.getDefaultMessage()` 를 계산하고도 응답에 넣지 않는다.
    - 응답 항목은 `backend/src/main/java/com/bifos/accountbook/shared/dto/ApiErrorResponse.java` 의 `ErrorDetails` 이고 `code`, `field`, `rejectedValue` 만 가진다.
- 컨트롤러 통합 테스트는 `AbstractControllerTest` 를 상속하고 `fixtures.getDefaultUser()` 로 사용자를 만든다. 패턴은 `backend/src/test/java/com/bifos/accountbook/family/presentation/controller/FamilyControllerTest.java` 를 따른다.
    - 가족은 `fixtures.families.family().build()` 로 만든다. 기본 사용자를 멤버로 함께 저장한다.
    - 기존 카테고리는 `fixtures.categories.category(family).build()` 로 만든다.
    - 둘을 함께 쓰는 선례는 `backend/src/test/java/com/bifos/accountbook/notification/presentation/controller/NotificationControllerTest.java` 다.

**근거 문서**: `backend/docs/data-schema.md` 의 `categories` 표 `color` 행, `frontend/docs/data-schema.md` 의 `ApiErrorResponse` 와 `ErrorDetails`

## 의도 메모

- 정규식은 한 곳에 둔다. 세 곳이 따로 가지면 다음에 형식을 바꿀 때 또 한 곳이 남는다.
- OKLCH 는 프론트 팔레트가 내는 형식 하나만 받는다: 소수 세 개를 공백 하나로 나눈 `oklch(0.560 0.140 35)`. `%`, `deg`, 알파는 받지 않는다. 쓰는 곳이 없다.
- `ErrorDetails` 에 칸을 더하는 것은 호환을 깨지 않는다. 기존 칸은 그대로 둔다.

## 작업 항목

### 1. 색상 형식 상수

`backend/src/main/java/com/bifos/accountbook/category/domain/value/CategoryColor.java` 를 새로 만든다.

- `public static final String PATTERN = "^(#[0-9A-Fa-f]{6}|oklch\\(\\d*\\.?\\d+ \\d*\\.?\\d+ \\d*\\.?\\d+\\))$";`
- `public static final String MESSAGE = "색상은 #RRGGBB 또는 oklch(L C H) 형식이어야 합니다";`
- `public static boolean isValid(String color)` : `color.matches(PATTERN)`
- 인스턴스를 만들지 않는 final 클래스로 둔다.

### 2. 검증 세 곳과 컬럼 길이

- 두 DTO 의 `@Pattern` 을 `@Pattern(regexp = CategoryColor.PATTERN, message = CategoryColor.MESSAGE)` 로 바꾼다.
- `Category.updateColor` 는 `CategoryColor.isValid` 로 판정하고, 예외 문구를 `CategoryColor.MESSAGE` 로 바꾼다.
- `Category` 의 `color` 칸을 `@Column(nullable = false, length = 50)` 으로 바꾼다.

### 3. 검증 실패 응답에 문구를 담는다

- `ApiErrorResponse.ErrorDetails` 에 `private String message;` 를 더한다.
- `GlobalExceptionHandler.handleValidationExceptions` 의 빌더에 `.message(errorMessage)` 를 더한다.

### 4. 이 phase 를 검증하는 테스트

`backend/src/test/java/com/bifos/accountbook/category/presentation/controller/CategoryControllerTest.java` 를 새로 만든다. `POST /api/v1/families/{familyUuid}/categories` 로 확인한다.

| 입력 color | 기대 |
| --- | --- |
| `oklch(0.560 0.140 35)` | 201, 응답 `data.color` 가 같은 값 |
| `#10b981` | 201 |
| `red` | 400, `errors[0].field` 가 `color`, `errors[0].message` 가 `CategoryColor.MESSAGE` |

`PUT /api/v1/families/{familyUuid}/categories/{categoryUuid}` 로 color 를 `oklch(0.520 0.120 152)` 로 바꾸면 200 이고 응답 `data.color` 가 같은 값이다.
프론트가 실제로 부르는 경로다. `PUT /api/v1/categories/{categoryUuid}` 는 deprecated 라 쓰지 않는다.

## 검증

```bash
# cwd: <repo root>/backend
test -f gradle/wrapper/gradle-wrapper.jar || mise exec gradle@9.5.0 -- gradle wrapper --gradle-version 9.5.0
./gradlew checkstyleMain checkstyleTest --no-daemon
./gradlew test --tests "com.bifos.accountbook.category.*" --no-daemon
./gradlew test --no-daemon
git status --short gradle/wrapper    # jar 가 추적 대상으로 나오지 않는다
```

모든 명령이 종료 코드 0 이어야 한다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `backend/src/main/java/com/bifos/accountbook/category/domain/value/CategoryColor.java` | 신규 |
| `backend/src/main/java/com/bifos/accountbook/category/application/dto/CreateCategoryRequest.java` | 수정 |
| `backend/src/main/java/com/bifos/accountbook/category/application/dto/UpdateCategoryRequest.java` | 수정 |
| `backend/src/main/java/com/bifos/accountbook/category/domain/entity/Category.java` | 수정 |
| `backend/src/main/java/com/bifos/accountbook/shared/dto/ApiErrorResponse.java` | 수정 |
| `backend/src/main/java/com/bifos/accountbook/shared/exception/GlobalExceptionHandler.java` | 수정 |
| `backend/src/test/java/com/bifos/accountbook/category/presentation/controller/CategoryControllerTest.java` | 신규 |

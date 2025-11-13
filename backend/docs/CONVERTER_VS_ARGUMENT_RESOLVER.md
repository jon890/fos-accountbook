# Converter vs ArgumentResolver 차이점

## 📋 개요

Spring MVC에서 파라미터를 처리하는 두 가지 다른 메커니즘입니다.

---

## 🔄 Converter (addFormatters)

### 역할

**단순한 타입 변환**을 담당합니다.

### 특징

- ✅ **단순한 1:1 변환**: `String` → `CustomUuid`
- ✅ **범용적**: `@PathVariable`, `@RequestParam`, `@RequestHeader` 등 모든 곳에서 사용 가능
- ✅ **자동 적용**: Spring이 자동으로 변환 수행
- ✅ **단방향**: 입력 타입 → 출력 타입

### 사용 예시

```java
// Converter 등록
@Override
public void addFormatters(FormatterRegistry registry) {
    registry.addConverter(stringToCustomUuidConverter);
}

// 사용
@GetMapping("/families/{familyUuid}")
public ResponseEntity<?> getFamily(@PathVariable CustomUuid familyUuid) {
    // String "abc-123" → CustomUuid 객체로 자동 변환
}
```

### 구현 예시

```java
@Component
public class StringToCustomUuidConverter implements Converter<String, CustomUuid> {
    @Override
    public CustomUuid convert(String source) {
        return CustomUuid.from(source);  // 단순 변환
    }
}
```

### 처리 흐름

```
HTTP 요청: GET /families/abc-123-def-456
    ↓
Spring이 @PathVariable 추출: "abc-123-def-456" (String)
    ↓
Converter가 자동으로 변환: CustomUuid 객체
    ↓
컨트롤러 메서드 실행
```

---

## 🎯 ArgumentResolver (addArgumentResolvers)

### 역할

**복잡한 파라미터 해결 로직**을 담당합니다.

### 특징

- ✅ **복잡한 로직**: SecurityContext, HTTP 요청, DB 조회 등 다양한 소스에서 데이터 추출
- ✅ **커스텀 애노테이션**: `@LoginUser` 같은 특정 애노테이션 기반으로 동작
- ✅ **조건부 처리**: `supportsParameter()`로 처리 가능 여부 판단
- ✅ **다양한 소스**: HTTP 요청, SecurityContext, 세션, DB 등

### 사용 예시

```java
// ArgumentResolver 등록
@Override
public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
    resolvers.add(loginUserArgumentResolver);
}

// 사용
@GetMapping("/me/profile")
public ResponseEntity<?> getProfile(@LoginUser LoginUserDto user) {
    // SecurityContext에서 인증 정보를 가져와 LoginUserDto 생성
}
```

### 구현 예시

```java
@Component
public class LoginUserArgumentResolver implements HandlerMethodArgumentResolver {

    // 1. 이 resolver가 처리할 수 있는지 판단
    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        return parameter.hasParameterAnnotation(LoginUser.class)
            && LoginUserDto.class.isAssignableFrom(parameter.getParameterType());
    }

    // 2. 실제로 파라미터 값 생성 (복잡한 로직)
    @Override
    public Object resolveArgument(...) {
        // SecurityContext에서 인증 정보 추출
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userUuid = (String) auth.getPrincipal();

        // LoginUserDto 객체 생성
        return new LoginUserDto(CustomUuid.from(userUuid));
    }
}
```

### 처리 흐름

```
HTTP 요청: GET /me/profile
    ↓
Spring이 @LoginUser 파라미터 발견
    ↓
LoginUserArgumentResolver.supportsParameter() 호출 → true 반환
    ↓
LoginUserArgumentResolver.resolveArgument() 호출
    ↓
SecurityContext에서 인증 정보 추출
    ↓
LoginUserDto 객체 생성
    ↓
컨트롤러 메서드 실행
```

---

## 📊 비교표

| 항목          | Converter                  | ArgumentResolver          |
| ------------- | -------------------------- | ------------------------- |
| **목적**      | 타입 변환                  | 파라미터 해결             |
| **복잡도**    | 단순 (1:1 변환)            | 복잡 (다양한 소스)        |
| **적용 범위** | 모든 파라미터              | 특정 애노테이션           |
| **입력**      | 단일 값 (String)           | HTTP 요청 전체            |
| **출력**      | 변환된 타입                | 완성된 객체               |
| **사용 예시** | `@PathVariable CustomUuid` | `@LoginUser LoginUserDto` |
| **처리 시점** | 타입 변환 단계             | 파라미터 해결 단계        |

---

## 🔍 처리 순서

Spring MVC가 파라미터를 처리하는 순서:

```
1. ArgumentResolver 체크
   ↓ (처리 불가능)
2. Converter 체크
   ↓ (처리 불가능)
3. 기본 타입 변환 (String → int 등)
   ↓ (처리 불가능)
4. 에러 발생
```

### 예시: `@PathVariable CustomUuid familyUuid`

```
1. ArgumentResolver 체크
   → @LoginUser 같은 애노테이션 없음 → 건너뜀

2. Converter 체크
   → StringToCustomUuidConverter가 String → CustomUuid 변환 가능
   → 변환 수행 ✅

3. 컨트롤러 메서드 실행
```

### 예시: `@LoginUser LoginUserDto user`

```
1. ArgumentResolver 체크
   → LoginUserArgumentResolver.supportsParameter() → true
   → resolveArgument() 호출하여 LoginUserDto 생성 ✅

2. 컨트롤러 메서드 실행
```

---

## 💡 언제 무엇을 사용할까?

### Converter를 사용하는 경우

- ✅ 단순한 타입 변환 (String → CustomUuid, String → LocalDate 등)
- ✅ 여러 곳에서 재사용 가능한 변환 로직
- ✅ `@PathVariable`, `@RequestParam` 등에서 사용

### ArgumentResolver를 사용하는 경우

- ✅ 복잡한 파라미터 해결 로직 (SecurityContext, DB 조회 등)
- ✅ 커스텀 애노테이션 기반 파라미터 주입
- ✅ 여러 소스에서 데이터를 조합해야 하는 경우

---

## 🎯 우리 프로젝트에서의 사용

### Converter 사용

```java
// StringToCustomUuidConverter
@GetMapping("/families/{familyUuid}")
public ResponseEntity<?> getFamily(@PathVariable CustomUuid familyUuid) {
    // String → CustomUuid 자동 변환
}
```

### ArgumentResolver 사용

```java
// LoginUserArgumentResolver
@GetMapping("/me/profile")
public ResponseEntity<?> getProfile(@LoginUser LoginUserDto user) {
    // SecurityContext → LoginUserDto 자동 생성
}
```

---

## 📝 요약

- **Converter**: "이 타입을 저 타입으로 바꿔줘" (단순 변환)
- **ArgumentResolver**: "이 애노테이션이 있으면 이렇게 파라미터를 만들어줘" (복잡한 해결)

둘 다 Spring MVC의 파라미터 처리 파이프라인에서 중요한 역할을 하지만, **목적과 복잡도가 다릅니다**.

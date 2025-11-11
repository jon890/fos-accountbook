# CodeEnum 패턴 가이드

## 개요

`CodeEnum` 패턴은 Enum을 데이터베이스에 코드값으로 저장하고, 타입 안전하게 복원하기 위한 표준화된 방식입니다.

## 장점

- ✅ **타입 안전성**: Enum 타입을 유지하면서 DB 매핑
- ✅ **일관성**: 모든 Enum에 동일한 패턴 적용
- ✅ **재사용성**: 추상 Converter로 쉽게 확장 가능
- ✅ **명시적**: 코드값이 명확하게 관리됨

## 구조

```
domain/value/
├── CodeEnum.java              # 인터페이스
├── UserStatus.java            # 구현 예시
└── ...

infra/persistence/converter/
├── AbstractCodeEnumConverter.java  # 추상 Converter
├── UserStatusConverter.java       # 구체 Converter
└── ...
```

## 사용 방법

### 1. Enum 생성

```java
package com.bifos.accountbook.domain.value;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import java.util.Arrays;

@Getter
@RequiredArgsConstructor
public enum UserStatus implements CodeEnum {
    ACTIVE("ACTIVE"),
    DELETED("DELETED");

    private final String code;

    public static UserStatus fromCode(String code) {
        if (code == null) {
            throw new IllegalArgumentException("코드는 null일 수 없습니다");
        }

        return Arrays.stream(values())
                .filter(status -> status.getCode().equals(code))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException(
                    "유효하지 않은 코드: " + code
                ));
    }
}
```

### 2. Converter 생성

```java
package com.bifos.accountbook.infra.persistence.converter;

import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class UserStatusConverter extends AbstractCodeEnumConverter<UserStatus> {
    public UserStatusConverter() {
        super(UserStatus.class);
    }
}
```

**중요**: `autoApply = true`로 설정하면 모든 `UserStatus` 필드에 자동으로 적용됩니다.

### 3. Entity에서 사용

```java
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // UserStatusConverter가 자동으로 적용됨
    @Column(nullable = false, length = 20)
    private UserStatus status;
    
    // @Enumerated 애노테이션 불필요!
}
```

## 새로운 CodeEnum 추가하기

### 예시: OrderStatus 추가

#### 1. Enum 생성

```java
// domain/value/OrderStatus.java
package com.bifos.accountbook.domain.value;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import java.util.Arrays;

@Getter
@RequiredArgsConstructor
public enum OrderStatus implements CodeEnum {
    PENDING("PENDING"),
    PROCESSING("PROCESSING"),
    COMPLETED("COMPLETED"),
    CANCELLED("CANCELLED");

    private final String code;

    public static OrderStatus fromCode(String code) {
        if (code == null) {
            throw new IllegalArgumentException("주문 상태 코드는 null일 수 없습니다");
        }

        return Arrays.stream(values())
                .filter(status -> status.getCode().equals(code))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException(
                    "유효하지 않은 주문 상태 코드: " + code
                ));
    }
}
```

#### 2. Converter 생성

```java
// infra/persistence/converter/OrderStatusConverter.java
package com.bifos.accountbook.infra.persistence.converter;

import com.bifos.accountbook.domain.value.OrderStatus;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class OrderStatusConverter extends AbstractCodeEnumConverter<OrderStatus> {
    public OrderStatusConverter() {
        super(OrderStatus.class);
    }
}
```

#### 3. Entity에서 사용

```java
@Entity
@Table(name = "orders")
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 20)
    private OrderStatus status;  // Converter 자동 적용
}
```

#### 4. 테스트 작성

```java
// test/java/.../domain/value/OrderStatusTest.java
@DisplayName("OrderStatus 단위 테스트")
class OrderStatusTest {
    
    @Test
    @DisplayName("getCode() - 코드값을 반환한다")
    void getCode() {
        assertThat(OrderStatus.PENDING.getCode()).isEqualTo("PENDING");
        assertThat(OrderStatus.COMPLETED.getCode()).isEqualTo("COMPLETED");
    }

    @Test
    @DisplayName("fromCode() - 유효한 코드로 Enum을 찾는다")
    void fromCode_Success() {
        OrderStatus pending = OrderStatus.fromCode("PENDING");
        assertThat(pending).isEqualTo(OrderStatus.PENDING);
    }

    @Test
    @DisplayName("fromCode() - 유효하지 않은 코드는 예외를 발생시킨다")
    void fromCode_InvalidCode() {
        assertThatThrownBy(() -> OrderStatus.fromCode("INVALID"))
                .isInstanceOf(IllegalArgumentException.class);
    }
}

// test/java/.../converter/OrderStatusConverterTest.java
@DisplayName("OrderStatusConverter 단위 테스트")
class OrderStatusConverterTest {
    
    private OrderStatusConverter converter;

    @BeforeEach
    void setUp() {
        converter = new OrderStatusConverter();
    }

    @Test
    @DisplayName("양방향 변환 - Enum → DB → Enum 변환이 일관성을 유지한다")
    void bidirectionalConversion() {
        OrderStatus original = OrderStatus.PENDING;
        String dbValue = converter.convertToDatabaseColumn(original);
        OrderStatus restored = converter.convertToEntityAttribute(dbValue);
        
        assertThat(restored).isEqualTo(original);
    }
}
```

## DB 스키마

### 컬럼 정의

```sql
-- VARCHAR(20)으로 충분 (대부분의 상태 코드는 짧음)
status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
```

### 인덱스 추가 (필요시)

```sql
-- 상태별 조회가 빈번한 경우
CREATE INDEX idx_users_status ON users(status);
```

## 주의사항

### ❌ 하지 말아야 할 것

```java
// 1. @Enumerated 애노테이션 중복 사용 금지
@Enumerated(EnumType.STRING)  // ❌ Converter와 충돌
@Column(nullable = false)
private UserStatus status;

// 2. 코드값 변경 금지 (기존 DB 데이터와 불일치)
ACTIVE("ACT")  // ❌ 기존 "ACTIVE"와 호환 불가

// 3. Converter 없이 사용 금지
// CodeEnum을 구현했으면 반드시 Converter도 생성
```

### ✅ 해야 할 것

```java
// 1. autoApply = true 사용 (편의성)
@Converter(autoApply = true)

// 2. null 체크 추가
public static Status fromCode(String code) {
    if (code == null) {
        throw new IllegalArgumentException("코드는 null일 수 없습니다");
    }
    // ...
}

// 3. 명확한 에러 메시지
throw new IllegalArgumentException("유효하지 않은 상태 코드: " + code);
```

## 마이그레이션

### 기존 Enum을 CodeEnum으로 변환

#### Before

```java
public enum Status {
    ACTIVE, INACTIVE
}

@Entity
public class User {
    @Enumerated(EnumType.STRING)
    private Status status;
}
```

#### After

```java
// 1. CodeEnum 구현
@Getter
@RequiredArgsConstructor
public enum Status implements CodeEnum {
    ACTIVE("ACTIVE"),
    INACTIVE("INACTIVE");

    private final String code;

    public static Status fromCode(String code) {
        // ... fromCode 구현
    }
}

// 2. Converter 생성
@Converter(autoApply = true)
public class StatusConverter extends AbstractCodeEnumConverter<Status> {
    public StatusConverter() {
        super(Status.class);
    }
}

// 3. Entity에서 @Enumerated 제거
@Entity
public class User {
    @Column(nullable = false, length = 20)
    private Status status;  // Converter 자동 적용
}
```

**데이터 마이그레이션 불필요**: 기존 DB 데이터가 `"ACTIVE"`, `"INACTIVE"` 형태라면 그대로 사용 가능합니다.

## 트러블슈팅

### Q1. Converter가 적용되지 않아요

**A**: `autoApply = true`를 확인하고, Entity 클래스를 다시 컴파일하세요.

```java
@Converter(autoApply = true)  // ✅ 반드시 필요
public class UserStatusConverter extends AbstractCodeEnumConverter<UserStatus> {
    // ...
}
```

### Q2. "Cannot invoke fromCode" 오류가 발생해요

**A**: `fromCode()` 메서드가 `public static`인지 확인하세요.

```java
public static UserStatus fromCode(String code) {  // ✅ public static
    // ...
}
```

### Q3. 기존 DB 데이터와 호환이 안 돼요

**A**: 코드값을 기존 DB 값과 동일하게 설정하세요.

```sql
-- 기존 DB 데이터
SELECT DISTINCT status FROM users;
-- 결과: 'ACTIVE', 'DELETED'
```

```java
// Enum 코드값도 동일하게
public enum UserStatus implements CodeEnum {
    ACTIVE("ACTIVE"),      // ✅ DB와 동일
    DELETED("DELETED");    // ✅ DB와 동일
    
    // ❌ 다르게 하면 안 됨
    // ACTIVE("ACT"),
}
```

## 참고

- [JPA AttributeConverter 공식 문서](https://docs.oracle.com/javaee/7/api/javax/persistence/AttributeConverter.html)
- 기존 구현: `UserStatus`, `UserStatusConverter`


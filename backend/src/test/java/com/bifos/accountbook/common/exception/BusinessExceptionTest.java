package com.bifos.accountbook.common.exception;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * BusinessException 단위 테스트
 */
@DisplayName("BusinessException 테스트")
class BusinessExceptionTest {

    @Test
    @DisplayName("기본 생성자로 예외를 생성할 수 있다")
    void createExceptionWithErrorCode() {
        // Given
        ErrorCode errorCode = ErrorCode.USER_NOT_FOUND;

        // When
        BusinessException exception = new BusinessException(errorCode);

        // Then
        assertThat(exception.getErrorCode()).isEqualTo(errorCode);
        assertThat(exception.getMessage()).isEqualTo(errorCode.getMessage());
        assertThat(exception.getParameters()).isEmpty();
        assertThat(exception.getDebugInfo()).isEmpty();
    }

    @Test
    @DisplayName("커스텀 메시지로 예외를 생성할 수 있다")
    void createExceptionWithCustomMessage() {
        // Given
        ErrorCode errorCode = ErrorCode.USER_NOT_FOUND;
        String customMessage = "사용자(ID: 123)를 찾을 수 없습니다";

        // When
        BusinessException exception = new BusinessException(errorCode, customMessage);

        // Then
        assertThat(exception.getErrorCode()).isEqualTo(errorCode);
        assertThat(exception.getMessage()).isEqualTo(customMessage);
    }

    @Test
    @DisplayName("파라미터를 추가할 수 있다")
    void addParameter() {
        // Given
        BusinessException exception = new BusinessException(ErrorCode.USER_NOT_FOUND);

        // When
        exception.addParameter("userId", "123")
                .addParameter("email", "test@example.com");

        // Then
        assertThat(exception.getParameters()).hasSize(2);
        assertThat(exception.getParameters().get("userId")).isEqualTo("123");
        assertThat(exception.getParameters().get("email")).isEqualTo("test@example.com");
    }

    @Test
    @DisplayName("디버그 정보를 추가할 수 있다")
    void addDebugInfo() {
        // Given
        BusinessException exception = new BusinessException(ErrorCode.INTERNAL_SERVER_ERROR);

        // When
        exception.addDebugInfo("query", "SELECT * FROM users")
                .addDebugInfo("timestamp", "2025-01-01T12:00:00");

        // Then
        assertThat(exception.getDebugInfo()).hasSize(2);
        assertThat(exception.getDebugInfo().get("query")).isEqualTo("SELECT * FROM users");
        assertThat(exception.getDebugInfo().get("timestamp")).isEqualTo("2025-01-01T12:00:00");
    }

    @Test
    @DisplayName("빌더 패턴으로 예외를 구성할 수 있다")
    void builderPattern() {
        // When
        BusinessException exception = new BusinessException(ErrorCode.FAMILY_NOT_FOUND)
                .addParameter("familyId", "family-123")
                .addParameter("userId", "user-456")
                .addDebugInfo("requestPath", "/api/families/family-123")
                .addDebugInfo("method", "GET");

        // Then
        assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.FAMILY_NOT_FOUND);
        assertThat(exception.getParameters()).hasSize(2);
        assertThat(exception.getDebugInfo()).hasSize(2);
    }

    @Test
    @DisplayName("편의 메서드: entityNotFound를 사용할 수 있다")
    void entityNotFoundConvenienceMethod() {
        // When
        BusinessException exception = BusinessException.entityNotFound("User", "123");

        // Then
        assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.ENTITY_NOT_FOUND);
        assertThat(exception.getMessage()).isEqualTo("User를 찾을 수 없습니다");
        assertThat(exception.getParameters().get("entityName")).isEqualTo("User");
        assertThat(exception.getParameters().get("id")).isEqualTo("123");
    }

    @Test
    @DisplayName("편의 메서드: accessDenied를 사용할 수 있다")
    void accessDeniedConvenienceMethod() {
        // When
        BusinessException exception = BusinessException.accessDenied("Family", "user-123");

        // Then
        assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.ACCESS_DENIED);
        assertThat(exception.getMessage()).isEqualTo("Family에 접근할 권한이 없습니다");
        assertThat(exception.getParameters().get("resource")).isEqualTo("Family");
        assertThat(exception.getParameters().get("userId")).isEqualTo("user-123");
    }

    @Test
    @DisplayName("편의 메서드: invalidInput을 사용할 수 있다")
    void invalidInputConvenienceMethod() {
        // When
        BusinessException exception = BusinessException.invalidInput(
                "email",
                "invalid-email",
                "이메일 형식이 아닙니다");

        // Then
        assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.INVALID_INPUT_VALUE);
        assertThat(exception.getMessage()).contains("email의 입력값이 올바르지 않습니다");
        assertThat(exception.getParameters().get("fieldName")).isEqualTo("email");
        assertThat(exception.getParameters().get("value")).isEqualTo("invalid-email");
        assertThat(exception.getParameters().get("reason")).isEqualTo("이메일 형식이 아닙니다");
    }

    @Test
    @DisplayName("원인 예외를 포함할 수 있다")
    void withCause() {
        // Given
        Exception cause = new RuntimeException("Database connection failed");

        // When
        BusinessException exception = new BusinessException(ErrorCode.INTERNAL_SERVER_ERROR, cause)
                .withCause();

        // Then
        assertThat(exception.getCause()).isEqualTo(cause);
        assertThat(exception.getDebugInfo().get("cause")).isEqualTo("Database connection failed");
        assertThat(exception.getDebugInfo().get("causeType")).isEqualTo("java.lang.RuntimeException");
    }

    @Test
    @DisplayName("파라미터를 포함한 생성자로 예외를 생성할 수 있다")
    void createExceptionWithParameters() {
        // Given
        ErrorCode errorCode = ErrorCode.EXPENSE_NOT_FOUND;
        String message = "지출 내역을 찾을 수 없습니다";
        Map<String, Object> parameters = Map.of(
                "expenseId", "expense-123",
                "familyId", "family-456");

        // When
        BusinessException exception = new BusinessException(errorCode, message, parameters);

        // Then
        assertThat(exception.getErrorCode()).isEqualTo(errorCode);
        assertThat(exception.getMessage()).isEqualTo(message);
        assertThat(exception.getParameters()).hasSize(2);
        assertThat(exception.getParameters().get("expenseId")).isEqualTo("expense-123");
        assertThat(exception.getParameters().get("familyId")).isEqualTo("family-456");
    }
}

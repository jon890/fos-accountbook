package com.bifos.accountbook.common.exception;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * ErrorResponse 단위 테스트
 */
@DisplayName("ErrorResponse 테스트")
class ErrorResponseTest {

    @Test
    @DisplayName("BusinessException으로부터 ErrorResponse를 생성할 수 있다")
    void createFromBusinessException() {
        // Given
        BusinessException exception = new BusinessException(ErrorCode.FAMILY_NOT_FOUND)
                .addParameter("familyId", "family-123")
                .addDebugInfo("query", "SELECT * FROM families");
        String path = "/api/families/family-123";

        // When
        ErrorResponse response = ErrorResponse.of(exception, path);

        // Then
        assertThat(response.getStatus()).isEqualTo(404);
        assertThat(response.getCode()).isEqualTo("F001");
        assertThat(response.getMessage()).isEqualTo("가족을 찾을 수 없습니다");
        assertThat(response.getPath()).isEqualTo(path);
        assertThat(response.getParameters()).isNotNull();
        assertThat(response.getParameters().get("familyId")).isEqualTo("family-123");
        assertThat(response.getDebugInfo()).isNotNull();
        assertThat(response.getDebugInfo().get("query")).isEqualTo("SELECT * FROM families");
    }

    @Test
    @DisplayName("ErrorCode로부터 ErrorResponse를 생성할 수 있다")
    void createFromErrorCode() {
        // Given
        ErrorCode errorCode = ErrorCode.UNAUTHORIZED;
        String path = "/api/expenses";

        // When
        ErrorResponse response = ErrorResponse.of(errorCode, path);

        // Then
        assertThat(response.getStatus()).isEqualTo(401);
        assertThat(response.getCode()).isEqualTo("A001");
        assertThat(response.getMessage()).isEqualTo("인증이 필요합니다");
        assertThat(response.getPath()).isEqualTo(path);
        assertThat(response.getParameters()).isNull();
        assertThat(response.getDebugInfo()).isNull();
    }

    @Test
    @DisplayName("일반 Exception으로부터 ErrorResponse를 생성할 수 있다")
    void createFromException() {
        // Given
        Exception exception = new RuntimeException("Unexpected error");
        String path = "/api/test";

        // When
        ErrorResponse response = ErrorResponse.of(exception, path);

        // Then
        assertThat(response.getStatus()).isEqualTo(500);
        assertThat(response.getCode()).isEqualTo("C006");
        assertThat(response.getMessage()).isEqualTo("Unexpected error");
        assertThat(response.getPath()).isEqualTo(path);
    }

    @Test
    @DisplayName("Validation 오류로부터 ErrorResponse를 생성할 수 있다")
    void createFromValidationError() {
        // Given
        Map<String, String> fieldErrors = Map.of(
                "email", "이메일 형식이 올바르지 않습니다",
                "age", "나이는 0보다 커야 합니다"
        );
        String path = "/api/users";

        // When
        ErrorResponse response = ErrorResponse.ofValidationError(fieldErrors, path);

        // Then
        assertThat(response.getStatus()).isEqualTo(400);
        assertThat(response.getCode()).isEqualTo("C001");
        assertThat(response.getMessage()).isEqualTo("입력값 검증에 실패했습니다");
        assertThat(response.getPath()).isEqualTo(path);
        assertThat(response.getFieldErrors()).hasSize(2);
        assertThat(response.getFieldErrors().get("email")).isEqualTo("이메일 형식이 올바르지 않습니다");
    }

    @Test
    @DisplayName("파라미터가 없는 BusinessException은 parameters가 null이다")
    void emptyParametersAreNull() {
        // Given
        BusinessException exception = new BusinessException(ErrorCode.USER_NOT_FOUND);
        String path = "/api/users/123";

        // When
        ErrorResponse response = ErrorResponse.of(exception, path);

        // Then
        assertThat(response.getParameters()).isNull(); // empty는 null로 변환
    }

    @Test
    @DisplayName("디버그 정보가 없는 BusinessException은 debugInfo가 null이다")
    void emptyDebugInfoIsNull() {
        // Given
        BusinessException exception = new BusinessException(ErrorCode.USER_NOT_FOUND);
        String path = "/api/users/123";

        // When
        ErrorResponse response = ErrorResponse.of(exception, path);

        // Then
        assertThat(response.getDebugInfo()).isNull(); // empty는 null로 변환
    }

    @Test
    @DisplayName("timestamp가 자동으로 설정된다")
    void timestampIsAutoSet() {
        // Given
        BusinessException exception = new BusinessException(ErrorCode.USER_NOT_FOUND);
        String path = "/api/users/123";

        // When
        ErrorResponse response = ErrorResponse.of(exception, path);

        // Then
        assertThat(response.getTimestamp()).isNotNull();
    }
}


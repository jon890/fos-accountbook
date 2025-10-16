package com.bifos.accountbook.infra.exception;

import com.bifos.accountbook.application.dto.ApiErrorResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Validation 예외 처리
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidationExceptions(
            MethodArgumentNotValidException ex) {
        List<ApiErrorResponse.ErrorDetails> errorDetails = ex.getBindingResult()
                .getAllErrors()
                .stream()
                .map(error -> {
                    String fieldName = ((FieldError) error).getField();
                    String errorMessage = error.getDefaultMessage();
                    Object rejectedValue = ((FieldError) error).getRejectedValue();

                    return ApiErrorResponse.ErrorDetails.builder()
                            .code("VALIDATION_ERROR")
                            .field(fieldName)
                            .rejectedValue(rejectedValue)
                            .build();
                })
                .collect(Collectors.toList());

        log.warn("Validation error: {} errors", errorDetails.size());

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiErrorResponse.of("입력값 검증에 실패했습니다.", errorDetails));
    }

    /**
     * 인증 예외 처리
     */
    @ExceptionHandler({AuthenticationException.class, BadCredentialsException.class})
    public ResponseEntity<ApiErrorResponse> handleAuthenticationException(
            AuthenticationException ex, WebRequest request) {
        log.warn("Authentication error: {}", ex.getMessage());

        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(ApiErrorResponse.of("인증에 실패했습니다.",
                        ApiErrorResponse.ErrorDetails.builder()
                                .code("AUTHENTICATION_FAILED")
                                .build()));
    }

    /**
     * 권한 예외 처리
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiErrorResponse> handleAccessDeniedException(
            AccessDeniedException ex, WebRequest request) {
        log.warn("Access denied: {}", ex.getMessage());

        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(ApiErrorResponse.of("접근 권한이 없습니다.",
                        ApiErrorResponse.ErrorDetails.builder()
                                .code("ACCESS_DENIED")
                                .build()));
    }

    /**
     * IllegalArgumentException 처리
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiErrorResponse> handleIllegalArgumentException(
            IllegalArgumentException ex, WebRequest request) {
        log.error("Illegal argument: {}", ex.getMessage(), ex);

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiErrorResponse.of(ex.getMessage(),
                        ApiErrorResponse.ErrorDetails.builder()
                                .code("INVALID_ARGUMENT")
                                .build()));
    }

    /**
     * IllegalStateException 처리
     */
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ApiErrorResponse> handleIllegalStateException(
            IllegalStateException ex, WebRequest request) {
        log.warn("Illegal state: {}", ex.getMessage());

        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(ApiErrorResponse.of(ex.getMessage(),
                        ApiErrorResponse.ErrorDetails.builder()
                                .code("INVALID_STATE")
                                .build()));
    }

    /**
     * 그 외 모든 예외 처리
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleGlobalException(
            Exception ex, WebRequest request) {
        log.error("Unexpected error occurred", ex);

        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiErrorResponse.of("서버 오류가 발생했습니다.",
                        ApiErrorResponse.ErrorDetails.builder()
                                .code("INTERNAL_SERVER_ERROR")
                                .build()));
    }
}


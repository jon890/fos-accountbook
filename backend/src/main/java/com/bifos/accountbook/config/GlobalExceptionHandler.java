package com.bifos.accountbook.config;

import com.bifos.accountbook.application.exception.BusinessException;
import com.bifos.accountbook.presentation.dto.ApiErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.env.Environment;
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
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 전역 예외 처리 핸들러
 * 
 * Spring MVC의 모든 예외를 통합 처리하는 설정 클래스입니다.
 * @RestControllerAdvice를 통해 모든 컨트롤러의 예외를 가로채어 표준화된 응답을 제공합니다.
 * 
 * 처리 예외 유형:
 * - BusinessException: 비즈니스 로직 예외
 * - Validation 예외: @Valid 검증 실패
 * - 인증/인가 예외: Spring Security
 * - IllegalArgumentException, IllegalStateException
 * - 기타 모든 예외
 */
@Slf4j
@RestControllerAdvice
@RequiredArgsConstructor
public class GlobalExceptionHandler {

    private final Environment environment;

    /**
     * BusinessException 처리
     * 커스텀 비즈니스 예외 처리
     */
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiErrorResponse> handleBusinessException(
            BusinessException e,
            HttpServletRequest request) {

        log.error("BusinessException occurred: code={}, message={}, parameters={}",
                e.getErrorCode().getCode(),
                e.getMessage(),
                e.getParameters(),
                e);

        ApiErrorResponse errorResponse = ApiErrorResponse.builder()
                .success(false)
                .status(e.getErrorCode().getStatusCode())
                .code(e.getErrorCode().getCode())
                .message(e.getMessage())
                .path(request.getRequestURI())
                .timestamp(java.time.LocalDateTime.now())
                .parameters(e.getParameters().isEmpty() ? null : e.getParameters())
                .debugInfo(isDebugMode() && !e.getDebugInfo().isEmpty() ? e.getDebugInfo() : null)
                .build();

        return ResponseEntity
                .status(e.getErrorCode().getHttpStatus())
                .body(errorResponse);
    }

    /**
     * 타입 불일치 예외 처리
     * Request Parameter 타입이 맞지 않을 때 발생
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiErrorResponse> handleMethodArgumentTypeMismatchException(
            MethodArgumentTypeMismatchException ex, WebRequest request) {
        log.error("Type mismatch: parameter={}, requiredType={}, providedValue={}",
                ex.getName(),
                ex.getRequiredType(),
                ex.getValue(),
                ex);

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiErrorResponse.of(
                        String.format("'%s' 파라미터의 타입이 올바르지 않습니다", ex.getName()),
                        ApiErrorResponse.ErrorDetails.builder()
                                .code("INVALID_TYPE")
                                .field(ex.getName())
                                .rejectedValue(ex.getValue())
                                .build()));
    }

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

        log.error("Validation error: {} errors, details: {}", errorDetails.size(), errorDetails, ex);

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
        log.error("Authentication error: {}", ex.getMessage(), ex);

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
        log.error("Access denied: {}", ex.getMessage(), ex);

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
        log.error("Illegal state: {}", ex.getMessage(), ex);

        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(ApiErrorResponse.of(ex.getMessage(),
                        ApiErrorResponse.ErrorDetails.builder()
                                .code("INVALID_STATE")
                                .build()));
    }

    /**
     * NoResourceFoundException 처리
     * 요청한 리소스를 찾을 수 없을 때 발생
     */
    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleNoResourceFoundException(
            NoResourceFoundException ex, HttpServletRequest request) {
        log.error("Resource not found: path={}, method={}",
                request.getRequestURI(),
                request.getMethod(),
                ex);

        String message = String.format("요청한 리소스를 찾을 수 없습니다: %s",
                request.getRequestURI());

        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(ApiErrorResponse.of(message,
                        ApiErrorResponse.ErrorDetails.builder()
                                .code("RESOURCE_NOT_FOUND")
                                .field("path")
                                .rejectedValue(request.getRequestURI())
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

    /**
     * 디버그 모드 확인
     * local, dev 프로파일에서는 디버그 정보 포함
     */
    private boolean isDebugMode() {
        return Arrays.asList(environment.getActiveProfiles()).contains("local") ||
                Arrays.asList(environment.getActiveProfiles()).contains("dev") ||
                Arrays.asList(environment.getActiveProfiles()).contains("test");
    }
}


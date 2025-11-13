package com.bifos.accountbook.presentation.dto;

import com.bifos.accountbook.application.exception.BusinessException;
import com.bifos.accountbook.application.exception.ErrorCode;
import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * API 에러 응답 DTO (통합)
 * 모든 예외 상황에 대한 표준화된 응답 형식
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiErrorResponse {

  /**
   * 성공 여부 (항상 false)
   */
  @Builder.Default
  private boolean success = false;

  /**
   * HTTP 상태 코드
   */
  private Integer status;

  /**
   * 에러 코드 (ErrorCode enum의 code)
   */
  private String code;

  /**
   * 에러 메시지
   */
  private String message;

  /**
   * 요청 경로
   */
  private String path;

  /**
   * 에러 발생 시간
   */
  @Builder.Default
  private LocalDateTime timestamp = LocalDateTime.now();

  /**
   * 전달된 파라미터 정보 (BusinessException용)
   */
  private Map<String, Object> parameters;

  /**
   * 디버그 정보 (개발/테스트 환경에서만 포함)
   */
  private Map<String, Object> debugInfo;

  /**
   * 단일 에러 상세 정보
   */
  private ErrorDetails error;

  /**
   * 여러 에러 상세 정보 (Validation 에러 등)
   */
  private List<ErrorDetails> errors;

  /**
   * 단일 에러 메시지 응답
   */
  public static ApiErrorResponse of(String message) {
    return ApiErrorResponse.builder()
                           .success(false)
                           .message(message)
                           .timestamp(LocalDateTime.now())
                           .build();
  }

  /**
   * 에러 메시지와 상세 정보를 포함한 응답
   */
  public static ApiErrorResponse of(String message, ErrorDetails error) {
    return ApiErrorResponse.builder()
                           .success(false)
                           .message(message)
                           .error(error)
                           .timestamp(LocalDateTime.now())
                           .build();
  }

  /**
   * 에러 메시지와 여러 상세 정보를 포함한 응답 (Validation 에러 등)
   */
  public static ApiErrorResponse of(String message, List<ErrorDetails> errors) {
    return ApiErrorResponse.builder()
                           .success(false)
                           .message(message)
                           .errors(errors)
                           .timestamp(LocalDateTime.now())
                           .build();
  }

  /**
   * BusinessException으로부터 응답 생성
   */
  public static ApiErrorResponse of(BusinessException exception, String path) {
    return ApiErrorResponse.builder()
                           .success(false)
                           .status(exception.getErrorCode().getStatusCode())
                           .code(exception.getErrorCode().getCode())
                           .message(exception.getMessage())
                           .path(path)
                           .timestamp(LocalDateTime.now())
                           .parameters(exception.getParameters().isEmpty() ? null : exception.getParameters())
                           .debugInfo(exception.getDebugInfo().isEmpty() ? null : exception.getDebugInfo())
                           .build();
  }

  /**
   * ErrorCode로부터 응답 생성
   */
  public static ApiErrorResponse of(ErrorCode errorCode, String path) {
    return ApiErrorResponse.builder()
                           .success(false)
                           .status(errorCode.getStatusCode())
                           .code(errorCode.getCode())
                           .message(errorCode.getMessage())
                           .path(path)
                           .timestamp(LocalDateTime.now())
                           .build();
  }

  /**
   * 일반 예외로부터 응답 생성
   */
  public static ApiErrorResponse of(Exception exception, String path) {
    return ApiErrorResponse.builder()
                           .success(false)
                           .status(ErrorCode.INTERNAL_SERVER_ERROR.getStatusCode())
                           .code(ErrorCode.INTERNAL_SERVER_ERROR.getCode())
                           .message(exception.getMessage())
                           .path(path)
                           .timestamp(LocalDateTime.now())
                           .build();
  }

  /**
   * 에러 상세 정보
   */
  @Getter
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class ErrorDetails {
    private String code;
    private String field;
    private Object rejectedValue;
  }
}


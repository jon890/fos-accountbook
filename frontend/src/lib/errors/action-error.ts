/**
 * Server Actions 에러 처리
 * 백엔드의 BusinessException과 유사한 구조
 */

import { ERROR_MESSAGES, ErrorCode } from "./error-code";
import { ServerApiError } from "@/lib/server/api/types";

/**
 * Server Action 에러 정보
 */
export interface ActionErrorInfo {
  code: ErrorCode;
  message: string;
  parameters?: Record<string, unknown>;
  debugInfo?: Record<string, unknown>;
}

/**
 * Server Action 결과 타입
 */
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: ActionErrorInfo };

/**
 * ActionError 클래스
 * Server Actions에서 발생하는 에러를 표준화
 */
export class ActionError extends Error {
  public readonly code: ErrorCode;
  public readonly parameters: Record<string, unknown>;
  public readonly debugInfo: Record<string, unknown>;

  constructor(
    code: ErrorCode,
    message?: string,
    parameters?: Record<string, unknown>
  ) {
    super(message || ERROR_MESSAGES[code]);
    this.name = "ActionError";
    this.code = code;
    this.parameters = parameters || {};
    this.debugInfo = {};

    // TypeScript의 Error 클래스 상속 시 필요
    Object.setPrototypeOf(this, ActionError.prototype);
  }

  /**
   * 파라미터 추가 (빌더 패턴)
   */
  addParameter(key: string, value: unknown): this {
    this.parameters[key] = value;
    return this;
  }

  /**
   * 디버그 정보 추가 (빌더 패턴)
   */
  addDebugInfo(key: string, value: unknown): this {
    this.debugInfo[key] = value;
    return this;
  }

  /**
   * 원인 예외를 디버그 정보에 추가
   */
  withCause(cause: unknown): this {
    if (cause instanceof Error) {
      this.debugInfo.cause = cause.message;
      this.debugInfo.causeType = cause.name;
      if (process.env.NODE_ENV === "development") {
        this.debugInfo.stack = cause.stack;
      }
    }
    return this;
  }

  /**
   * ActionErrorInfo로 변환
   * Server Actions 반환값으로 사용
   */
  toErrorInfo(): ActionErrorInfo {
    return {
      code: this.code,
      message: this.message,
      parameters:
        Object.keys(this.parameters).length > 0 ? this.parameters : undefined,
      debugInfo:
        Object.keys(this.debugInfo).length > 0 ? this.debugInfo : undefined,
    };
  }

  /**
   * 실패 결과로 변환
   */
  toFailureResult(): { success: false; error: ActionErrorInfo } {
    return {
      success: false,
      error: this.toErrorInfo(),
    };
  }

  // ============================================
  // 편의 메서드: 자주 사용하는 에러 패턴
  // ============================================

  /**
   * 인증 실패
   */
  static unauthorized(message?: string): ActionError {
    return new ActionError("A001", message || "로그인이 필요합니다");
  }

  /**
   * 세션 만료
   */
  static sessionExpired(message?: string): ActionError {
    return new ActionError("A002", message || "세션이 만료되었습니다");
  }

  /**
   * 가족 미선택
   */
  static familyNotSelected(): ActionError {
    return new ActionError(
      "F002",
      "가족이 선택되지 않았습니다. 먼저 가족을 선택해주세요."
    );
  }

  /**
   * 엔티티를 찾을 수 없음
   */
  static entityNotFound(entityName: string, id?: string): ActionError {
    return new ActionError("C002", `${entityName}을(를) 찾을 수 없습니다`)
      .addParameter("entityName", entityName)
      .addParameter("id", id || "unknown");
  }

  /**
   * 잘못된 입력값
   */
  static invalidInput(
    fieldName: string,
    value: unknown,
    reason: string
  ): ActionError {
    return new ActionError(
      "C001",
      `${fieldName}의 입력값이 올바르지 않습니다: ${reason}`
    )
      .addParameter("fieldName", fieldName)
      .addParameter("value", value)
      .addParameter("reason", reason);
  }

  /**
   * 내부 서버 오류
   */
  static internalError(message?: string, cause?: unknown): ActionError {
    const error = new ActionError(
      "C003",
      message || "서버 내부 오류가 발생했습니다"
    );

    if (cause) {
      error.withCause(cause);
    }

    return error;
  }

  /**
   * 네트워크 연결 오류
   */
  static networkError(message?: string, cause?: unknown): ActionError {
    const error = new ActionError(
      "C004",
      message || "서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요."
    );

    if (cause) {
      error.withCause(cause);
    }

    return error;
  }
}

/**
 * 성공 결과 생성 헬퍼
 */
export function successResult<T>(data: T): ActionResult<T> {
  return { success: true, data };
}

/**
 * 실패 결과 생성 헬퍼
 */
export function failureResult(error: ActionError): ActionResult<never> {
  return error.toFailureResult();
}

/**
 * 네트워크 에러인지 확인
 */
function isNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const errorMessage = error.message.toLowerCase();

  // fetch API 네트워크 에러 패턴들
  return (
    errorMessage.includes("fetch failed") ||
    errorMessage.includes("failed to fetch") ||
    errorMessage.includes("network request failed") ||
    errorMessage.includes("econnrefused") ||
    errorMessage.includes("enotfound") ||
    errorMessage.includes("etimedout") ||
    (error.name === "TypeError" && errorMessage.includes("fetch"))
  );
}

/**
 * 백엔드 오류 응답의 errors[0] 에서 문구와 필드를 꺼낸다.
 * 형태가 다르거나 문구가 비어 있으면 null.
 */
function firstFieldError(
  errorData: unknown
): { message: string; field: unknown } | null {
  if (typeof errorData !== "object" || errorData === null) return null;
  const { errors } = errorData as { errors?: unknown };
  if (!Array.isArray(errors) || errors.length === 0) return null;
  const first: unknown = errors[0];
  if (typeof first !== "object" || first === null) return null;
  const { message, field } = first as { message?: unknown; field?: unknown };
  if (typeof message !== "string" || message.trim() === "") return null;
  return { message, field };
}

/**
 * 에러 처리 헬퍼
 * try-catch에서 발생한 에러를 ActionError로 변환
 */
export function handleActionError(
  error: unknown,
  defaultMessage: string
): ActionResult<never> {
  // 이미 ActionError인 경우
  if (error instanceof ActionError) {
    return error.toFailureResult();
  }

  // 백엔드 401 = 인증 만료 (ADR-F26)
  if (error instanceof ServerApiError && error.status === 401) {
    return ActionError.sessionExpired().toFailureResult();
  }

  // 백엔드 400 = 필드 검증 실패. 백엔드가 만든 사용자용 문구를 그대로 전달
  if (error instanceof ServerApiError && error.status === 400) {
    const first = firstFieldError(error.errorData);
    if (first) {
      return new ActionError(ErrorCode.INVALID_INPUT, first.message)
        .addParameter("fieldName", first.field)
        .toFailureResult();
    }
  }

  // Error 객체인 경우
  if (error instanceof Error) {
    // 네트워크 연결 오류 확인
    if (isNetworkError(error)) {
      return ActionError.networkError(
        "서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.",
        error
      ).toFailureResult();
    }

    return ActionError.internalError(defaultMessage, error).toFailureResult();
  }

  // 알 수 없는 에러
  return ActionError.internalError(defaultMessage)
    .addDebugInfo("unknownError", String(error))
    .toFailureResult();
}

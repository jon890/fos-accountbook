/**
 * Server Action Result 에러 처리 유틸리티
 * 반복되는 에러 처리 로직을 중앙화
 */

import { redirect } from "next/navigation";
import type { ActionResult } from "@/lib/errors";

/**
 * 에러 처리 옵션
 */
interface ErrorHandlerOptions {
  /**
   * 네트워크 오류 시 커스텀 처리
   * 기본: /auth/signin?error=network
   */
  onNetworkError?: (message: string) => void;

  /**
   * 인증 오류 시 커스텀 처리
   * 기본: /auth/signin?error=auth
   */
  onAuthError?: (message: string) => void;

  /**
   * 기타 오류 시 커스텀 처리 (fallback redirect URL)
   * 기본: /auth/signin?error=unknown
   */
  fallbackRedirect?: string;

  /**
   * 기타 오류 시 error 파라미터
   * 기본: "unknown"
   */
  fallbackErrorType?: string;
}

/**
 * ActionResult의 에러를 처리하고 적절한 페이지로 redirect
 *
 * @param result - 실패한 ActionResult (success: false)
 * @param options - 에러 처리 옵션
 *
 * @example
 * ```typescript
 * // 기본 사용 - 네트워크/인증 오류는 자동 처리, 기타는 로그인으로
 * if (!profileResult.success) {
 *   handleActionError(profileResult);
 * }
 *
 * // 커스텀 fallback
 * if (!familiesResult.success) {
 *   handleActionError(familiesResult, {
 *     fallbackRedirect: "/families/create"
 *   });
 * }
 *
 * // 완전 커스텀
 * if (!result.success) {
 *   handleActionError(result, {
 *     onNetworkError: (msg) => redirect(`/maintenance?reason=${msg}`),
 *     onAuthError: (msg) => redirect(`/auth/expired?msg=${msg}`),
 *     fallbackRedirect: "/dashboard"
 *   });
 * }
 * ```
 */
export function handleActionError<T>(
  result: Extract<ActionResult<T>, { success: false }>,
  options: ErrorHandlerOptions = {}
): never {
  const message = encodeURIComponent(result.error.message);

  // 네트워크 연결 오류 (C004)
  if (result.error.code === "C004") {
    if (options.onNetworkError) {
      options.onNetworkError(result.error.message);
      // onNetworkError가 redirect를 호출하지 않으면 기본 동작
    }
    redirect(`/auth/signin?error=network&message=${message}`);
  }

  // 인증 오류 (A001, A002)
  if (result.error.code === "A001" || result.error.code === "A002") {
    if (options.onAuthError) {
      options.onAuthError(result.error.message);
      // onAuthError가 redirect를 호출하지 않으면 기본 동작
    }
    redirect(`/auth/signin?error=auth&message=${message}`);
  }

  // 기타 오류 - fallback 처리
  if (options.fallbackRedirect) {
    // fallbackRedirect가 쿼리 파라미터를 포함하는지 확인
    const separator = options.fallbackRedirect.includes("?") ? "&" : "?";
    const errorType = options.fallbackErrorType || "unknown";
    redirect(
      `${options.fallbackRedirect}${separator}error=${errorType}&message=${message}`
    );
  }

  // 최종 기본값
  const errorType = options.fallbackErrorType || "unknown";
  redirect(`/auth/signin?error=${errorType}&message=${message}`);
}

/**
 * ActionResult의 성공 여부를 확인하고, 성공 시 데이터를 반환, 실패 시 에러 처리
 *
 * @param result - ActionResult
 * @param options - 에러 처리 옵션
 * @returns 성공 시 데이터, 실패 시 redirect (반환하지 않음)
 *
 * @example
 * ```typescript
 * // 기본 사용 - 자동으로 에러 처리 및 redirect
 * const profile = await requireActionSuccess(profileResult);
 *
 * // 커스텀 fallback
 * const families = await requireActionSuccess(familiesResult, {
 *   fallbackRedirect: "/families/create"
 * });
 *
 * // 여러 액션을 순차적으로 처리
 * const profile = await requireActionSuccess(
 *   await getUserProfileAction(),
 *   { fallbackErrorType: "profile" }
 * );
 * const families = await requireActionSuccess(
 *   await getFamiliesAction(),
 *   { fallbackRedirect: "/families/create" }
 * );
 * ```
 */
export function requireActionSuccess<T>(
  result: ActionResult<T>,
  options: ErrorHandlerOptions = {}
): T {
  if (result.success) {
    return result.data;
  }

  // 실패 시 에러 처리 (redirect, 반환하지 않음)
  handleActionError(result, options);
}

/**
 * ActionResult의 성공 여부를 확인하고, 실패 시 기본값을 반환
 * (에러 발생 시에도 페이지를 계속 렌더링하고 싶을 때 사용)
 *
 * @param result - ActionResult
 * @param defaultValue - 실패 시 반환할 기본값
 * @returns 성공 시 데이터, 실패 시 기본값
 *
 * @example
 * ```typescript
 * // 에러 발생 시에도 기본값으로 페이지 렌더링
 * const stats = getActionDataOrDefault(statsResult, {
 *   monthlyExpense: 0,
 *   monthlyIncome: 0,
 *   remainingBudget: 0,
 * });
 *
 * const recentExpenses = getActionDataOrDefault(recentExpensesResult, []);
 * ```
 */
export function getActionDataOrDefault<T>(
  result: ActionResult<T>,
  defaultValue: T
): T {
  if (result.success) {
    return result.data;
  }

  // 에러 로깅 (선택적)
  console.error("Action failed, using default value:", {
    code: result.error.code,
    message: result.error.message,
  });

  return defaultValue;
}

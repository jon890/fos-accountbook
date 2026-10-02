/**
 * API 요청/응답 로깅 유틸리티
 *
 * ky hooks에서 사용하는 로깅 관련 함수와 설정을 제공합니다.
 *
 * Features:
 * - 요청/응답 포맷팅
 * - 민감 데이터 마스킹
 * - JSON body 로깅 (길이 제한)
 */

/**
 * 로깅 설정
 */
export const LOG_CONFIG = {
  /** 로깅할 최대 body 길이 (자) */
  maxBodyLength: 1000,
  /** 마스킹할 민감한 필드 키워드 */
  sensitiveFields: [
    "password",
    "token",
    "secret",
    "accessToken",
    "refreshToken",
    "authorization",
    "apiKey",
    "api_key",
    "credential",
  ],
  /** 요청 시작 시간 헤더 키 */
  requestStartTimeHeader: "X-Request-Start-Time",
} as const;

/**
 * 요청 소요 시간 포맷팅
 */
export function formatDuration(startTime: number): string {
  const duration = Date.now() - startTime;
  return `${duration}ms`;
}

/**
 * 요청 로그 포맷팅
 * - 인증 여부에 따른 아이콘 표시
 */
export function formatRequestLog(
  method: string,
  url: string,
  hasAuth: boolean
): string {
  const authIcon = hasAuth ? "🔐" : "🔓";
  return `${authIcon} [${method}] ${url}`;
}

/**
 * 응답 로그 포맷팅
 * - 성공/실패에 따른 아이콘 표시
 */
export function formatResponseLog(
  method: string,
  url: string,
  status: number,
  duration: string
): string {
  const statusIcon = status >= 200 && status < 300 ? "✅" : "❌";
  return `${statusIcon} [${method}] ${url} => ${status} (${duration})`;
}

/**
 * 응답이 JSON인지 확인
 */
export function isJsonResponse(response: Response): boolean {
  const contentType = response.headers.get("content-type");
  return contentType?.includes("application/json") ?? false;
}

/**
 * 민감한 데이터 마스킹 처리
 *
 * 재귀적으로 객체를 순회하며 민감한 필드를 마스킹합니다.
 */
export function maskSensitiveData(data: unknown): unknown {
  if (data === null || data === undefined) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => maskSensitiveData(item));
  }

  if (typeof data === "object") {
    const masked: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      const isSensitive = LOG_CONFIG.sensitiveFields.some((field) =>
        key.toLowerCase().includes(field.toLowerCase())
      );
      masked[key] = isSensitive ? "***MASKED***" : maskSensitiveData(value);
    }
    return masked;
  }

  return data;
}

/**
 * JSON body를 로깅 가능한 문자열로 포맷팅
 *
 * - 민감 데이터 마스킹
 * - 길이 제한 적용 (truncate)
 */
export function formatJsonBody(body: unknown): string {
  const masked = maskSensitiveData(body);
  const jsonStr = JSON.stringify(masked, null, 2);

  if (jsonStr.length > LOG_CONFIG.maxBodyLength) {
    return (
      jsonStr.slice(0, LOG_CONFIG.maxBodyLength) +
      `\n... (truncated, total: ${jsonStr.length} chars)`
    );
  }

  return jsonStr;
}

/**
 * 요청 시작 로깅
 */
export function logRequest(
  method: string,
  url: string,
  hasAuth: boolean
): void {
  console.log(`📤 Request: ${formatRequestLog(method, url, hasAuth)}`);
}

/**
 * 응답 로깅
 */
export function logResponse(
  method: string,
  url: string,
  status: number,
  duration: string
): void {
  console.log(
    `📥 Response: ${formatResponseLog(method, url, status, duration)}`
  );
}

/**
 * 상세 응답 로깅 (개발 환경용)
 */
export function logResponseDetails(
  status: number,
  statusText: string,
  duration: string
): void {
  console.log(`   📊 Status: ${status} ${statusText}`);
  console.log(`   ⏱️  Duration: ${duration}`);
}

/**
 * JSON body 로깅 (개발 환경용)
 */
export function logResponseBody(body: unknown): void {
  const formattedBody = formatJsonBody(body);
  console.log(`   📦 Body:\n${formattedBody}`);
}

/**
 * JSON 파싱 실패 로깅
 */
export function logResponseBodyParseError(): void {
  console.log(`   📦 Body: (failed to parse JSON)`);
}

/**
 * API 에러 상세 로깅
 */
export function logApiError(
  url: string,
  status: number,
  statusText: string,
  errorData: unknown
): void {
  console.error("❌ API Error Details:", {
    url,
    status,
    statusText,
    errorData: errorData ? JSON.stringify(errorData, null, 2) : "No error data",
  });
}

/**
 * 네트워크 에러 로깅
 */
export function logNetworkError(endpoint: string, error: unknown): void {
  console.error("❌ Server API Network Error:", {
    endpoint,
    error: error instanceof Error ? error.message : String(error),
    errorStack: error instanceof Error ? error.stack : undefined,
  });
}

/**
 * 응답 계약 오류 로깅 (ADR-F42). 응답 값은 남기지 않고 경로 템플릿과 이슈 경로만 남긴다.
 */
export function logResponseValidationError(
  template: string,
  issues: ReadonlyArray<{ path: string; code: string }>
): void {
  console.error(
    `[ResponseValidation] ${template} ${issues.map((i) => `${i.path || "(root)"}:${i.code}`).join(", ")}`
  );
}

/**
 * 목록 응답에서 계약에 맞지 않아 뺀 항목 수를 남긴다 (ADR-F42).
 */
export function logDroppedResponseItems(listName: string, dropped: number): void {
  console.error(`[ResponseValidation] ${listName}: 계약에 맞지 않는 항목 ${dropped}건을 뺐다`);
}

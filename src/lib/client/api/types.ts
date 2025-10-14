/**
 * 클라이언트 API 타입 정의
 */

/**
 * API 에러 클래스
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public errorData?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * 백엔드 API 응답 타입
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * API 요청 옵션
 */
export interface ApiOptions {
  token?: string;
  headers?: Record<string, string>;
}

/**
 * 서버 API 타입 정의
 */

/**
 * 서버 API 에러 클래스
 */
export class ServerApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public errorData?: unknown
  ) {
    super(message);
    this.name = "ServerApiError";
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
 * 서버 사이드 API 호출 옵션
 */
export interface ServerApiOptions extends RequestInit {
  /** 인증 헤더를 포함하지 않음 (공개 API 호출 시 사용) */
  skipAuth?: boolean;
}

/**
 * 백엔드 JWT 응답 타입
 */
export interface BackendAuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user?: {
    id: string;
    email: string;
    name?: string;
    image?: string;
  };
}

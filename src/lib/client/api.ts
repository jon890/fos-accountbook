/**
 * 백엔드 API 클라이언트
 *
 * NextAuth 세션 토큰을 자동으로 포함하여 백엔드 API를 호출합니다.
 */

import { clientEnv } from "@/lib/env";

const API_URL = clientEnv.NEXT_PUBLIC_API_BASE_URL;

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
 * 백엔드 API 호출 헬퍼 함수
 *
 * NextAuth 세션 쿠키를 자동으로 전송합니다.
 * 백엔드의 NextAuthTokenFilter가 쿠키에서 토큰을 추출하여 검증합니다.
 */
export async function apiClient<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    credentials: "include", // ✅ NextAuth 쿠키 자동 전송 (httpOnly 쿠키 포함)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new ApiError(
      errorData?.message ||
        errorData?.error ||
        `API 오류: ${response.status} ${response.statusText}`,
      response.status,
      errorData
    );
  }

  return response.json();
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

/**
 * GET 요청
 */
export async function apiGet<T>(
  endpoint: string,
  options?: ApiOptions
): Promise<T> {
  const headers: Record<string, string> = { ...options?.headers };
  if (options?.token) {
    headers["Authorization"] = `Bearer ${options.token}`;
  }

  const response = await apiClient<ApiResponse<T>>(endpoint, {
    method: "GET",
    headers,
  });
  return response.data as T;
}

/**
 * POST 요청
 */
export async function apiPost<T>(
  endpoint: string,
  body?: unknown,
  options?: ApiOptions
): Promise<T> {
  const headers: Record<string, string> = { ...options?.headers };
  if (options?.token) {
    headers["Authorization"] = `Bearer ${options.token}`;
  }

  const response = await apiClient<ApiResponse<T>>(endpoint, {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
    headers,
  });
  return response.data as T;
}

/**
 * PUT 요청
 */
export async function apiPut<T>(
  endpoint: string,
  body?: unknown,
  options?: ApiOptions
): Promise<T> {
  const headers: Record<string, string> = { ...options?.headers };
  if (options?.token) {
    headers["Authorization"] = `Bearer ${options.token}`;
  }

  const response = await apiClient<ApiResponse<T>>(endpoint, {
    method: "PUT",
    body: body ? JSON.stringify(body) : undefined,
    headers,
  });
  return response.data as T;
}

/**
 * DELETE 요청
 */
export async function apiDelete<T>(
  endpoint: string,
  options?: ApiOptions
): Promise<T> {
  const headers: Record<string, string> = { ...options?.headers };
  if (options?.token) {
    headers["Authorization"] = `Bearer ${options.token}`;
  }

  const response = await apiClient<ApiResponse<T>>(endpoint, {
    method: "DELETE",
    headers,
  });
  return response.data as T;
}

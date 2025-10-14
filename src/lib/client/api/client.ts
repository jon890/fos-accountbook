/**
 * 클라이언트 API 구현
 *
 * NextAuth 세션 토큰을 자동으로 포함하여 백엔드 API를 호출합니다.
 */

import { clientEnv } from "@/lib/env";
import { ApiError, ApiResponse, ApiOptions } from "./types";

const API_URL = clientEnv.NEXT_PUBLIC_API_BASE_URL;

/**
 * 백엔드 API 호출 헬퍼 함수
 *
 * Authorization 헤더로 JWT 토큰을 전송합니다.
 * Cross-origin 환경에서는 쿠키가 전송되지 않으므로 헤더만 사용합니다.
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

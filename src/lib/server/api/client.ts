/**
 * Server-side API Client
 *
 * Server Components와 Server Actions에서 백엔드 API를 호출할 때 사용합니다.
 * 백엔드 Access Token을 HTTP-only 쿠키에서 추출하여 Authorization 헤더에 포함합니다.
 */

import { serverEnv } from "@/lib/env/server.env";
import { cookies } from "next/headers";
import type { ApiResponse, ServerApiOptions } from "./types";
import { ServerApiError } from "./types";

// ServerApiError를 re-export하여 다른 파일에서 사용 가능하도록 함
export { ServerApiError };

const API_URL = serverEnv.BACKEND_API_URL;

/**
 * 서버 사이드에서 백엔드 Access Token 추출
 *
 * HTTP-only 쿠키에 저장된 백엔드 JWT 토큰을 가져옵니다.
 */
async function getBackendAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("backend_access_token")?.value;
  return token || null;
}

/**
 * 서버 사이드 API 호출 헬퍼 함수
 */
export async function serverApiClient<T = unknown>(
  endpoint: string,
  options: ServerApiOptions = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  const { skipAuth = false, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((fetchOptions.headers as Record<string, string>) || {}),
  };

  // 인증이 필요한 경우 백엔드 Access Token 추가
  if (!skipAuth) {
    const accessToken = await getBackendAccessToken();
    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
    cache: fetchOptions.cache || "no-store", // Server Components는 기본적으로 캐시하지 않음
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new ServerApiError(
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
export async function serverApiGet<T>(endpoint: string): Promise<T> {
  const response = await serverApiClient<ApiResponse<T>>(endpoint, {
    method: "GET",
  });
  return response.data as T;
}

/**
 * POST 요청
 */
export async function serverApiPost<T>(
  endpoint: string,
  body?: unknown
): Promise<T> {
  const response = await serverApiClient<ApiResponse<T>>(endpoint, {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
  });
  return response.data as T;
}

/**
 * PUT 요청
 */
export async function serverApiPut<T>(
  endpoint: string,
  body?: unknown
): Promise<T> {
  const response = await serverApiClient<ApiResponse<T>>(endpoint, {
    method: "PUT",
    body: body ? JSON.stringify(body) : undefined,
  });
  return response.data as T;
}

/**
 * DELETE 요청
 */
export async function serverApiDelete<T>(endpoint: string): Promise<T> {
  const response = await serverApiClient<ApiResponse<T>>(endpoint, {
    method: "DELETE",
  });
  return response.data as T;
}

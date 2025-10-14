/**
 * Server-side API Client
 *
 * Server Components와 Server Actions에서 백엔드 API를 호출할 때 사용합니다.
 * NextAuth 세션 토큰을 쿠키에서 추출하여 Authorization 헤더에 포함합니다.
 */

import { serverEnv } from "@/lib/env/server.env";
import { cookies } from "next/headers";
import { ServerApiError, ApiResponse, ServerApiOptions } from "./types";

const API_URL = serverEnv.BACKEND_API_URL;

/**
 * 서버 사이드에서 NextAuth 세션 토큰 추출
 */
async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();

  // Auth.js v5
  let token = cookieStore.get("authjs.session-token")?.value;
  if (!token) {
    token = cookieStore.get("__Secure-authjs.session-token")?.value;
  }

  // 하위 호환: NextAuth v4
  if (!token) {
    token = cookieStore.get("next-auth.session-token")?.value;
  }
  if (!token) {
    token = cookieStore.get("__Secure-next-auth.session-token")?.value;
  }

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

  // 인증이 필요한 경우에만 세션 토큰 추가
  if (!skipAuth) {
    const sessionToken = await getSessionToken();
    if (sessionToken) {
      headers["Authorization"] = `Bearer ${sessionToken}`;
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

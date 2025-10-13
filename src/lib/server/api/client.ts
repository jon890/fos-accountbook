/**
 * Server-side API Client
 *
 * Server Components와 Server Actions에서 백엔드 API를 호출할 때 사용합니다.
 * NextAuth 세션 토큰을 쿠키에서 추출하여 Authorization 헤더에 포함합니다.
 */

import { cookies } from "next/headers";
import { serverEnv } from "@/lib/env";

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
 * API 에러 클래스
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
 * 서버 사이드 API 호출 헬퍼 함수
 */
export async function serverApiClient<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`;

  // 세션 토큰 가져오기
  const sessionToken = await getSessionToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  // 세션 토큰이 있으면 Authorization 헤더에 추가
  if (sessionToken) {
    headers["Authorization"] = `Bearer ${sessionToken}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
    cache: options.cache || "no-store", // Server Components는 기본적으로 캐시하지 않음
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
 * 백엔드 API 응답 타입
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
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

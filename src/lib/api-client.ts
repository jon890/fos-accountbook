/**
 * 백엔드 API 클라이언트
 * Spring Boot 백엔드와 통신하기 위한 fetch 기반 클라이언트
 */

import { auth } from "./auth";
import { isServer } from "./env";

/**
 * API 베이스 URL
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/v1";

/**
 * API 클라이언트 옵션
 */
interface ApiClientOptions extends RequestInit {
  requireAuth?: boolean; // JWT 토큰이 필요한 요청인지 여부
  token?: string; // 직접 토큰을 전달하는 경우
}

/**
 * API 에러 클래스
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public code?: string,
    public errors?: unknown[]
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * API 클라이언트
 * JWT 토큰을 자동으로 주입하고 에러를 처리합니다.
 */
export async function apiClient<T = unknown>(
  endpoint: string,
  options: ApiClientOptions = {}
): Promise<T> {
  const { requireAuth = true, token, headers = {}, ...fetchOptions } = options;

  const url = `${API_BASE_URL}${endpoint}`;

  // 헤더 설정
  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(headers as Record<string, string>),
  };

  // JWT 토큰 주입
  if (requireAuth) {
    let authToken: string | undefined = token;

    // 서버 사이드에서는 session에서 토큰 가져오기
    if (isServer() && !authToken) {
      const session = await auth();
      authToken = session?.user?.accessToken;
    }

    // 클라이언트 사이드에서는 localStorage에서 토큰 가져오기
    if (!isServer() && !authToken) {
      const storageToken = getTokenFromStorage();
      if (storageToken) {
        authToken = storageToken;
      }
    }

    if (authToken) {
      requestHeaders["Authorization"] = `Bearer ${authToken}`;
    } else if (requireAuth) {
      throw new ApiError(401, "인증 토큰이 없습니다.", "NO_AUTH_TOKEN");
    }
  }

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers: requestHeaders,
    });

    // 응답 파싱
    let data: unknown;
    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // 에러 처리
    if (!response.ok) {
      // 백엔드 ApiErrorResponse 형식 처리
      if (typeof data === "object" && data !== null) {
        const errorData = data as {
          success?: boolean;
          message?: string;
          error?: { code?: string };
          errors?: unknown[];
        };

        throw new ApiError(
          response.status,
          errorData.message || "API 요청에 실패했습니다.",
          errorData.error?.code,
          errorData.errors
        );
      }

      throw new ApiError(response.status, `HTTP ${response.status}: ${response.statusText}`);
    }

    // 백엔드 ApiSuccessResponse 형식에서 data 추출
    if (typeof data === "object" && data !== null && "data" in data) {
      return (data as { data: T }).data;
    }

    return data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    // 네트워크 에러 등
    if (error instanceof Error) {
      throw new ApiError(0, error.message, "NETWORK_ERROR");
    }

    throw new ApiError(0, "알 수 없는 오류가 발생했습니다.", "UNKNOWN_ERROR");
  }
}

/**
 * GET 요청
 */
export async function apiGet<T = unknown>(
  endpoint: string,
  options: Omit<ApiClientOptions, "method" | "body"> = {}
): Promise<T> {
  return apiClient<T>(endpoint, {
    ...options,
    method: "GET",
  });
}

/**
 * POST 요청
 */
export async function apiPost<T = unknown>(
  endpoint: string,
  body?: unknown,
  options: Omit<ApiClientOptions, "method" | "body"> = {}
): Promise<T> {
  return apiClient<T>(endpoint, {
    ...options,
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * PUT 요청
 */
export async function apiPut<T = unknown>(
  endpoint: string,
  body?: unknown,
  options: Omit<ApiClientOptions, "method" | "body"> = {}
): Promise<T> {
  return apiClient<T>(endpoint, {
    ...options,
    method: "PUT",
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * DELETE 요청
 */
export async function apiDelete<T = unknown>(
  endpoint: string,
  options: Omit<ApiClientOptions, "method" | "body"> = {}
): Promise<T> {
  return apiClient<T>(endpoint, {
    ...options,
    method: "DELETE",
  });
}

/**
 * localStorage에서 토큰 가져오기 (클라이언트 사이드 전용)
 */
function getTokenFromStorage(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
}

/**
 * localStorage에 토큰 저장 (클라이언트 사이드 전용)
 */
export function saveTokenToStorage(accessToken: string, refreshToken?: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("accessToken", accessToken);
  if (refreshToken) {
    localStorage.setItem("refreshToken", refreshToken);
  }
}

/**
 * localStorage에서 토큰 제거 (클라이언트 사이드 전용)
 */
export function removeTokenFromStorage(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
}


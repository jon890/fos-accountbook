/**
 * Server-side API Client (ky 기반)
 *
 * Server Components와 Server Actions에서 백엔드 API를 호출할 때 사용합니다.
 * 백엔드 Access Token을 HTTP-only 쿠키에서 추출하여 Authorization 헤더에 포함합니다.
 *
 * Features:
 * - ky hooks를 활용한 요청/응답 로깅
 * - 자동 재시도 (retry)
 * - 타입 안전한 API 호출
 */

import { serverEnv } from "@/lib/env/server.env";
import ky, { type Options as KyOptions, HTTPError } from "ky";
import { cookies } from "next/headers";
import type { ApiResponse, ServerApiOptions } from "./types";
import { ServerApiError } from "./types";
import {
  LOG_CONFIG,
  formatDuration,
  isJsonResponse,
  logRequest,
  logResponse,
  logResponseDetails,
  logResponseBody,
  logResponseBodyParseError,
  logApiError,
  logNetworkError,
} from "./logging";

const API_URL = serverEnv.BACKEND_API_URL;

/**
 * ky 클라이언트 설정
 */
const KY_RETRY_CONFIG = {
  /** 재시도 횟수 */
  limit: 2,
  /** 재시도할 HTTP 메서드 */
  methods: ["get", "post", "put", "delete"],
  /** 재시도할 HTTP 상태 코드 */
  statusCodes: [408, 413, 429, 500, 502, 503, 504],
};

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
 * ky 인스턴스 생성 (hooks 포함)
 *
 * @param skipAuth - 인증 헤더 스킵 여부
 */
async function createKyInstance(skipAuth: boolean = false) {
  const accessToken = skipAuth ? null : await getBackendAccessToken();

  return ky.create({
    prefixUrl: API_URL,
    retry: KY_RETRY_CONFIG,
    hooks: {
      /**
       * beforeRequest Hook
       * - Authorization 헤더 추가
       * - 요청 시작 로깅
       */
      beforeRequest: [
        (request) => {
          // Authorization 헤더 추가
          if (accessToken) {
            request.headers.set("Authorization", `Bearer ${accessToken}`);
          }

          // 요청 로깅
          logRequest(request.method, request.url, !!accessToken);

          // 요청 시작 시간을 헤더에 저장 (응답 로깅에서 사용)
          request.headers.set(
            LOG_CONFIG.requestStartTimeHeader,
            Date.now().toString()
          );
        },
      ],

      /**
       * afterResponse Hook
       * - 응답 로깅 (상태 코드, 소요 시간, JSON body)
       * - 성공/실패 여부에 따른 로깅 스타일 분기
       * - JSON 응답인 경우 body도 로깅 (민감 데이터 마스킹)
       */
      afterResponse: [
        async (_request, _options, response) => {
          const method = _request.method;
          const url = _request.url;
          const status = response.status;

          // 요청 시작 시간 추출
          const startTimeStr = _request.headers.get(
            LOG_CONFIG.requestStartTimeHeader
          );
          const startTime = startTimeStr
            ? parseInt(startTimeStr, 10)
            : Date.now();
          const duration = formatDuration(startTime);

          // 응답 로깅
          logResponse(method, url, status, duration);

          // 상세 로깅 (개발 환경에서만)
          if (serverEnv.NODE_ENV === "development") {
            logResponseDetails(status, response.statusText, duration);

            // JSON 응답인 경우 body도 로깅
            if (isJsonResponse(response)) {
              try {
                // clone()을 사용하여 원본 response body를 보존
                const clonedResponse = response.clone();
                const body = await clonedResponse.json();
                logResponseBody(body);
              } catch {
                logResponseBodyParseError();
              }
            }
          }
        },
      ],

      /**
       * beforeError Hook
       * - HTTPError를 ServerApiError로 변환
       * - 에러 상세 로깅
       */
      beforeError: [
        async (error) => {
          const { response } = error;

          if (response) {
            const errorData = (await response.json().catch(() => null)) as {
              message?: string;
              error?: string;
            } | null;

            // 에러 상세 로깅
            logApiError(
              response.url,
              response.status,
              response.statusText,
              errorData
            );

            // 에러 메시지 개선
            error.message =
              errorData?.message ||
              errorData?.error ||
              `API 오류: ${response.status} ${response.statusText}`;
          }

          return error;
        },
      ],
    },
  });
}

/**
 * 서버 사이드 API 호출 헬퍼 함수
 */
export async function serverApiClient<T = unknown>(
  endpoint: string,
  options: ServerApiOptions = {}
): Promise<T> {
  const { skipAuth = false, ...fetchOptions } = options;
  const method = (fetchOptions.method || "GET").toLowerCase() as
    | "get"
    | "post"
    | "put"
    | "delete"
    | "patch";

  // endpoint에서 선행 슬래시 제거 (ky prefixUrl과 함께 사용 시)
  const normalizedEndpoint = endpoint.startsWith("/")
    ? endpoint.slice(1)
    : endpoint;

  try {
    const kyInstance = await createKyInstance(skipAuth);

    // ky 옵션 구성
    const kyOptions: KyOptions = {};

    // body가 있는 경우 json으로 전송
    if (fetchOptions.body) {
      kyOptions.json =
        typeof fetchOptions.body === "string"
          ? JSON.parse(fetchOptions.body)
          : fetchOptions.body;
    }

    // 추가 헤더 설정
    if (fetchOptions.headers) {
      kyOptions.headers = fetchOptions.headers as Record<string, string>;
    }

    // HTTP 메서드에 따른 호출
    const response = await kyInstance[method](normalizedEndpoint, kyOptions);

    return response.json<T>();
  } catch (error) {
    if (error instanceof HTTPError) {
      const errorData = (await error.response.json().catch(() => null)) as {
        message?: string;
        error?: string;
      } | null;

      throw new ServerApiError(
        errorData?.message ||
          errorData?.error ||
          `API 오류: ${error.response.status} ${error.response.statusText}`,
        error.response.status,
        errorData
      );
    }

    // 네트워크 오류나 기타 예상치 못한 오류
    logNetworkError(endpoint, error);

    throw error;
  }
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

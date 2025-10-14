/**
 * 클라이언트 API 모듈
 *
 * 백엔드 API 호출을 위한 타입과 함수를 제공합니다.
 */

// 타입 export
export type { ApiResponse, ApiOptions } from "./types";
export { ApiError } from "./types";

// 함수 export
export { apiClient, apiGet, apiPost, apiPut, apiDelete } from "./client";

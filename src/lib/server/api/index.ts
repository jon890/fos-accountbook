/**
 * 서버 API 모듈
 *
 * 서버 사이드에서 백엔드 API를 호출하기 위한 타입과 함수를 제공합니다.
 */

// 타입 export
export type {
  ApiResponse,
  ServerApiOptions,
  BackendAuthResponse,
} from "./types";
export { ServerApiError } from "./types";

// API 클라이언트 함수 export
export {
  serverApiClient,
  serverApiGet,
  serverApiPost,
  serverApiPut,
  serverApiDelete,
} from "./client";

// 백엔드 인증 API export
export { getBackendJWT, refreshAccessToken } from "./backend-auth";

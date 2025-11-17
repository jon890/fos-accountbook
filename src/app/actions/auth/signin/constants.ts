/**
 * 로그인 관련 상수 정의
 */

/**
 * 지원하는 OAuth 프로바이더 목록
 */
export const SUPPORTED_PROVIDERS = ["google", "naver"] as const;

/**
 * 지원하는 OAuth 프로바이더 타입
 */
export type SupportedProvider = (typeof SUPPORTED_PROVIDERS)[number];

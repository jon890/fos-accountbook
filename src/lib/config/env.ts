/**
 * 환경 변수 및 환경 구분 유틸리티
 */

/**
 * 현재 실행 환경
 */
export const ENV = {
  NODE_ENV: process.env.NODE_ENV || "development",
  VERCEL_ENV: process.env.VERCEL_ENV,
} as const;

/**
 * 개발 환경 여부
 */
export function isDev(): boolean {
  return ENV.NODE_ENV === "development";
}

/**
 * 프로덕션 환경 여부
 */
export function isProduction(): boolean {
  return ENV.NODE_ENV === "production";
}

/**
 * 테스트 환경 여부
 */
export function isTest(): boolean {
  return ENV.NODE_ENV === "test";
}

/**
 * Vercel Preview 환경 여부
 */
export function isPreview(): boolean {
  return ENV.VERCEL_ENV === "preview";
}

/**
 * 로컬 개발 환경 여부 (Vercel이 아닌 환경)
 */
export function isLocal(): boolean {
  return isDev() && !ENV.VERCEL_ENV;
}

/**
 * 서버 사이드 환경 여부
 */
export function isServer(): boolean {
  return typeof window === "undefined";
}

/**
 * 클라이언트 사이드 환경 여부
 */
export function isClient(): boolean {
  return typeof window !== "undefined";
}

/**
 * 환경 정보 출력 (디버깅용)
 */
export function getEnvInfo(): {
  nodeEnv: string;
  vercelEnv?: string;
  isDev: boolean;
  isProduction: boolean;
  isTest: boolean;
  isPreview: boolean;
  isLocal: boolean;
  isServer: boolean;
} {
  return {
    nodeEnv: ENV.NODE_ENV,
    vercelEnv: ENV.VERCEL_ENV,
    isDev: isDev(),
    isProduction: isProduction(),
    isTest: isTest(),
    isPreview: isPreview(),
    isLocal: isLocal(),
    isServer: isServer(),
  };
}

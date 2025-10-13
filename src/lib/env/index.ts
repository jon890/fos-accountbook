/**
 * 환경변수 통합 export
 *
 * 사용 예시:
 *
 * // 서버 사이드
 * import { serverEnv } from '@/lib/env'
 * console.log(serverEnv.DATABASE_URL)
 *
 * // 클라이언트 사이드
 * import { clientEnv } from '@/lib/env'
 * console.log(clientEnv.NEXT_PUBLIC_API_BASE_URL)
 */

// 서버 환경변수 (서버에서만 import 가능)
export { serverEnv, type ServerEnv } from "./server.env";

// 클라이언트 환경변수 (어디서나 import 가능)
export { clientEnv, type ClientEnv } from "./client.env";

// 환경 유틸리티 함수들
export {
  isDev,
  isProduction,
  isTest,
  isPreview,
  isLocal,
  isServer,
  isClient,
  getEnvInfo,
} from "../server/config/env";

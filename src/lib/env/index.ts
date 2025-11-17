/**
 * 환경변수 통합 export
 *
 * ⚠️ 중요: 서버와 클라이언트 환경변수를 분리하여 import하세요!
 */

// 클라이언트 환경변수만 export (클라이언트 번들에 포함되어도 안전)
export { clientEnv, type ClientEnv } from "./client.env";

// 서버 환경변수는 직접 import하세요:
// import { serverEnv } from '@/lib/env/server.env'
export type { ServerEnv } from "./server.env";

/**
 * 환경변수 통합 export
 *
 * ⚠️ 중요: 서버와 클라이언트 환경변수를 분리하여 import하세요!
 */

// 클라이언트 환경변수만 export (클라이언트 번들에 포함되어도 안전)
// 현재는 사용되지 않지만, 향후 필요 시 client.env.ts와 client.env.schema.ts의 주석을 해제하세요
export { clientEnv } from "./client.env";
export type { ClientEnv } from "./schemas/client.env.schema";

// 서버 환경변수는 직접 import하세요:
// import { serverEnv } from '@/lib/env/server.env'
export type { ServerEnv } from "./schemas/server.env.schema";

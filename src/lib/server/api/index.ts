/**
 * API 관련 모듈
 *
 * 백엔드 API 클라이언트를 제공합니다.
 *
 * ⚠️ 중요: 클라이언트 번들 크기 최적화를 위해 client.ts만 export합니다.
 * - responses.ts, utils.ts는 서버 사이드 전용입니다.
 * - 필요한 경우 직접 import하세요: import { xxx } from '@/lib/api/responses'
 */

// 클라이언트와 서버에서 모두 사용 가능한 API 클라이언트만 export
export * from "./client";

// 서버 전용 모듈들은 직접 import해서 사용
// export * from './responses'  // 서버 전용 - API Routes에서 사용
// export * from './utils'      // 서버 전용 - API Routes에서 사용

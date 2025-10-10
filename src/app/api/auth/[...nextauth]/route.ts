/**
 * Auth.js v5 API Route Handler
 * 
 * Auth.js v5에서는 handlers를 직접 export하는 방식으로 간소화되었습니다.
 * - GET: OAuth 콜백, 세션 체크 등
 * - POST: 로그인, 로그아웃 등
 */

import { handlers } from "@/lib/server/auth"

export const { GET, POST } = handlers

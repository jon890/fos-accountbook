/**
 * 클라이언트 환경변수 스키마 정의
 *
 * 클라이언트 사이드에서 사용되는 환경변수의 Zod 스키마를 정의합니다.
 * NEXT_PUBLIC_ 접두사가 있는 환경변수만 클라이언트에 노출됩니다.
 */

import { z } from "zod";

export const clientEnvSchema = z.object({
  // Public API URL (클라이언트에서 백엔드 API 호출)
  NEXT_PUBLIC_API_BASE_URL: z.url({
    message: "NEXT_PUBLIC_API_BASE_URL must be a valid URL",
  }),
});

// 타입 export
export type ClientEnv = z.infer<typeof clientEnvSchema>;

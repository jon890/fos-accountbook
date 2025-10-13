/**
 * 클라이언트 환경변수 정의 및 검증
 *
 * 이 파일은 클라이언트 사이드에서 사용되는 환경변수를 관리합니다.
 * NEXT_PUBLIC_ 접두사가 있는 환경변수만 클라이언트에 노출됩니다.
 * Zod를 사용하여 런타임에 환경변수를 검증합니다.
 */

import { z } from "zod";

const clientEnvSchema = z.object({
  // Public API URL (클라이언트에서 백엔드 API 호출)
  NEXT_PUBLIC_API_BASE_URL: z
    .string()
    .url("NEXT_PUBLIC_API_BASE_URL must be a valid URL"),
});

// 환경변수 파싱 및 검증
const parseClientEnv = () => {
  const parsed = clientEnvSchema.safeParse({
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  });

  if (!parsed.success) {
    console.error("❌ Invalid client environment variables:");
    console.error(JSON.stringify(parsed.error.format(), null, 2));
    throw new Error("Invalid client environment variables");
  }

  return parsed.data;
};

// 환경변수 export (빌드 시 검증됨)
export const clientEnv = parseClientEnv();

// 타입 export
export type ClientEnv = z.infer<typeof clientEnvSchema>;

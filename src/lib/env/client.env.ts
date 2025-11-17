/**
 * 클라이언트 환경변수 파싱 및 검증
 *
 * 이 파일은 클라이언트 사이드에서 사용되는 환경변수를 파싱하고 검증합니다.
 * NEXT_PUBLIC_ 접두사가 있는 환경변수만 클라이언트에 노출됩니다.
 */

import { clientEnvSchema } from "./schemas/client.env.schema";

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

// 타입 re-export
export type { ClientEnv } from "./schemas/client.env.schema";

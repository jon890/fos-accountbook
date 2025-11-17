/**
 * 서버 환경변수 파싱 및 검증
 *
 * 이 파일은 서버 사이드에서만 사용되는 환경변수를 파싱하고 검증합니다.
 */

import { serverEnvSchema } from "./schemas/server.env.schema";

// 환경변수 파싱 및 검증
const parseServerEnv = () => {
  const parsed = serverEnvSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error("❌ Invalid server environment variables:");
    console.error(JSON.stringify(parsed.error.format(), null, 2));
    throw new Error("Invalid server environment variables");
  }

  return parsed.data;
};

// 환경변수 export (빌드 시 검증됨)
export const serverEnv = parseServerEnv();

// 타입 re-export
export type { ServerEnv } from "./schemas/server.env.schema";

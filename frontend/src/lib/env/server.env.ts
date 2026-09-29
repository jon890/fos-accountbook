/**
 * 서버 환경변수 파싱 및 검증
 *
 * 이 파일은 서버 사이드에서만 사용되는 환경변수를 파싱하고 검증합니다.
 */

import z from "zod";
import { serverEnvSchema } from "./schemas/server.env.schema";

// 환경변수 파싱 및 검증
const parseServerEnv = () => {
  // Docker 빌드 등 CI 환경에서 서버 시크릿 없이 빌드할 때 검증 스킵
  if (process.env.SKIP_ENV_VALIDATION === "true") {
    return process.env as unknown as ReturnType<
      typeof serverEnvSchema.parse
    >;
  }

  const parsed = serverEnvSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error("❌ Invalid server environment variables:");
    console.error(JSON.stringify(z.treeifyError(parsed.error), null, 2));
    throw new Error("Invalid server environment variables");
  }

  return parsed.data;
};

// 환경변수 export (런타임에 검증됨)
export const serverEnv = parseServerEnv();

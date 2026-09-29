/**
 * 로그인 관련 Zod 스키마 정의
 */

import { z } from "zod";
import { SUPPORTED_PROVIDERS } from "./constants";

/**
 * 로그인 요청 스키마
 */
export const signInSchema = z.object({
  provider: z.enum(SUPPORTED_PROVIDERS, {
    message: `지원하지 않는 OAuth 프로바이더입니다. 지원 프로바이더: ${SUPPORTED_PROVIDERS.join(
      ", "
    )}`,
  }),
  callbackUrl: z
    .union([
      z.url("올바른 URL 형식이 아닙니다"),
      z.string().startsWith("/", "상대 경로는 /로 시작해야 합니다"),
    ])
    .default("/"),
});

/**
 * 서버 환경변수 정의 및 검증
 *
 * 이 파일은 서버 사이드에서만 사용되는 환경변수를 관리합니다.
 * Zod를 사용하여 런타임에 환경변수를 검증합니다.
 */

import { z } from "zod";

const serverEnvSchema = z.object({
  // NextAuth
  NEXTAUTH_URL: z.string().url("NEXTAUTH_URL must be a valid URL"),
  NEXTAUTH_SECRET: z
    .string()
    .min(32, "NEXTAUTH_SECRET must be at least 32 characters"),

  // Google OAuth
  GOOGLE_CLIENT_ID: z.string().min(1, "GOOGLE_CLIENT_ID is required"),
  GOOGLE_CLIENT_SECRET: z.string().min(1, "GOOGLE_CLIENT_SECRET is required"),

  // Naver OAuth
  NAVER_CLIENT_ID: z.string().min(1, "NAVER_CLIENT_ID is required"),
  NAVER_CLIENT_SECRET: z.string().min(1, "NAVER_CLIENT_SECRET is required"),

  // Backend API (서버 사이드 전용)
  BACKEND_API_URL: z.string().url("BACKEND_API_URL must be a valid URL"),

  // Node Environment
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

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

// 타입 export
export type ServerEnv = z.infer<typeof serverEnvSchema>;

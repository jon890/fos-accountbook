/**
 * 서버 환경변수 스키마 정의
 *
 * 서버 사이드에서만 사용되는 환경변수의 Zod 스키마를 정의합니다.
 */

import { z } from "zod";

export const serverEnvSchema = z.object({
  // NextAuth
  NEXTAUTH_URL: z.url({
    message: "NEXTAUTH_URL must be a valid URL",
  }),
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
  BACKEND_API_URL: z.url({
    message: "BACKEND_API_URL must be a valid URL",
  }),

  // Node Environment
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

// 타입 export
export type ServerEnv = z.infer<typeof serverEnvSchema>;

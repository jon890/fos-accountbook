/**
 * Lightweight Middleware for Edge Runtime
 *
 * Vercel Edge Function 크기 제한(1MB)을 준수하기 위해
 * Middleware는 최소한의 기능만 수행하고,
 * 인증 체크는 각 페이지의 Server Component에서 수행합니다.
 *
 * 이 Middleware는:
 * - CORS 헤더 설정
 * - Public 경로 허용
 * - 나머지는 각 페이지에서 auth() 체크
 */

import NextAuth from "next-auth";
import { authConfig } from "./lib/server/auth/auth-config";

export default NextAuth(authConfig).auth;

/**
 * Middleware 설정
 *
 * matcher를 사용하여 middleware가 실행될 경로를 지정합니다.
 * 정적 파일(_next/static, _next/image 등)은 제외됩니다.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

import { auth } from "@/lib/server/auth";

/**
 * Proxy 설정 (Next.js 16+)
 *
 * Next.js 16부터 middleware.ts가 proxy.ts로 변경되었습니다.
 * NextAuth의 auth 함수를 proxy로 export하여 인증 미들웨어로 사용합니다.
 *
 * matcher를 사용하여 proxy가 실행될 경로를 지정합니다.
 * 정적 파일(_next/static, _next/image 등)은 제외됩니다.
 */
export const proxy = auth;

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

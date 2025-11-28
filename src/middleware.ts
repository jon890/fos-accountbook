export { auth as middleware } from "@/lib/server/auth";

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

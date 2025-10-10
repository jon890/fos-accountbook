/**
 * Auth.js v5 Middleware
 * 
 * Auth.js v5의 강력한 기능 중 하나로, 
 * 특정 경로에 대한 인증 보호를 간단하게 설정할 수 있습니다.
 * 
 * - 인증이 필요한 경로를 자동으로 보호
 * - 인증되지 않은 사용자는 로그인 페이지로 리디렉트
 * - 공개 경로와 인증 경로를 명확하게 구분
 */

import { auth } from "@/lib/server/auth"
import { NextResponse } from "next/server"

/**
 * 공개 접근 가능한 경로 (인증 불필요)
 */
const publicPaths = [
  "/auth/signin",
  "/auth/error",
  "/api/auth",
  "/_next",
  "/favicon.ico",
]

/**
 * 항상 인증이 필요한 경로
 */
const protectedPaths = [
  "/dashboard",
  "/expenses",
  "/families",
  "/invite",
]

/**
 * 경로가 공개 경로인지 확인
 */
function isPublicPath(pathname: string): boolean {
  return publicPaths.some(path => pathname.startsWith(path))
}

/**
 * 경로가 보호된 경로인지 확인
 */
function isProtectedPath(pathname: string): boolean {
  return protectedPaths.some(path => pathname.startsWith(path))
}

/**
 * Auth.js v5 Middleware
 */
export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth

  // 공개 경로는 항상 허용
  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  // 보호된 경로는 인증 필요
  if (isProtectedPath(pathname) && !isLoggedIn) {
    const signInUrl = new URL("/auth/signin", req.url)
    signInUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(signInUrl)
  }

  // 루트 경로 처리
  if (pathname === "/") {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/auth/signin", req.url))
    }
    return NextResponse.next()
  }

  return NextResponse.next()
})

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
}

